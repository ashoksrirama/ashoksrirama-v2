---
slug: reducing-llm-cold-start-times-eks
title: "Reducing LLM Cold-Start Times on Amazon EKS: A Benchmark of Six Model Loading Strategies"
sidebar_label: Reducing LLM Cold-Start Times on EKS
authors: ashok
tags: [aws, blogs]
---

Large language models (LLMs) are reshaping how organizations build intelligent applications, from conversational agents to code generation to enterprise search. But deploying these models in production introduces a challenge that doesn't get enough attention: **cold-start time**. When a new pod starts on a fresh GPU node, how long does it take before it can serve its first inference request?

For a model like Meta's Llama 3.1 405B-Instruct-FP8 — weighing in at **454 GB across 109 safetensor shards**, the answer can range from 5 minutes to over 30 minutes, depending entirely on how you deliver the model weights to the GPU. In autoscaling scenarios, this cold-start time directly impacts how quickly your infrastructure responds to demand spikes.

In this post, we benchmark six different strategies for loading LLM weights on [Amazon Elastic Kubernetes Service (Amazon EKS)](https://aws.amazon.com/eks/) and share our findings on performance, cost, and operational trade-offs.

<!-- truncate -->

## The Cold-Start Problem

When [vLLM](https://docs.vllm.ai/en/stable/) (or any model serving framework) starts up on a GPU node, it goes through several phases:

1. **Node provisioning** — [Karpenter](https://karpenter.sh/) provisions a GPU instance and the node joins the cluster
2. **Container image pull** — The container runtime pulls the serving framework image from a registry
3. **Model weight loading** — The framework reads model shards from storage and loads them into GPU memory
4. **KV cache initialization** — The framework allocates GPU memory for inference caching and runs warmup

For large models, **step 3 dominates the cold-start time**. A 454 GB model must be read from storage and transferred to GPU memory, and the serving framework (vLLM in our case) reads shards **sequentially**, one at a time. This means the storage throughput for a single sequential read stream directly determines how long the model takes to load.

The question becomes: what's the fastest, most cost-effective way to get 454 GB of model weights into GPU memory?

![Cold-start timeline showing that model weight loading dominates at 90% of total time](/img/genai-model-loading/cold-start-timeline.png)

## Benchmark Environment

We ran all benchmarks on an Amazon EKS cluster using [EKS Auto Mode](https://docs.aws.amazon.com/eks/latest/userguide/automode.html), which automates node provisioning, scaling, and lifecycle management using Karpenter.

| Component | Details |
|-----------|---------|
| **Cluster** | Amazon EKS Auto Mode (us-west-2) |
| **Model** | Meta Llama 3.1 405B-Instruct-FP8 (~454 GB, 109 safetensor shards) |
| **Inference Framework** | vLLM v0.17.1 with 8-way [tensor parallelism](https://docs.vllm.ai/en/stable/serving/parallelism_scaling/) |
| **Instance Types** | p5.48xlarge (8x NVIDIA H100 80 GB) and p5en.48xlarge (8x NVIDIA H200 141 GB) |
| **Instance Specs** | 192 vCPUs, 2 TB RAM, 8x 3.5 TB NVMe SSDs (28 TB RAID0), 3200 Gbps EFA |
| **Node Management** | Karpenter with Bottlerocket NVIDIA AMI |
| **VPC Endpoints** | S3 Gateway Endpoint, ECR Private Endpoints (ECR API, ECR DKR, S3 Gateway) |

Each strategy was tested with a true cold start — a fresh GPU node with no prior image or data cache — unless otherwise noted. We measured **cold-start time** as the interval from pod scheduled to pod ready (serving inference).

## The Six Strategies

### Strategy 1: HuggingFace Hub Direct Download

**How it works:** vLLM downloads model weights directly from the [HuggingFace Hub](https://huggingface.co/) during startup. The `hf_transfer` library accelerates the download by using multiple concurrent connections. Files are written to the node's local NVMe storage, and vLLM loads shards into GPU memory from there.

This is the simplest approach — no pre-staging, no external storage to manage. Just point vLLM at a model ID and let it pull the weights at startup.

![Strategy 1: vLLM downloads model from HuggingFace Hub to local NVMe, then loads to GPU](/img/genai-model-loading/strategy-hf-direct.png)

**Results:**

| Metric | Value |
|--------|:-----:|
| Image Pull | 1 min 1 sec |
| Model Download + Weight Loading | ~18 min |
| **Total Cold Start** | **19 min 33 sec** |
| Reliability | 1 of 3 runs failed (download hung) |

**What we observed:** The download phase ran at approximately 500 MB/s, which is reasonable for a cross-internet download. However, in one of our three runs, the download hung indefinitely on the final shard at 418 GB — requiring a full pod restart. This reliability concern makes HuggingFace direct download risky for production workloads at this model scale.

---

### Strategy 2: Amazon FSx for Lustre

**How it works:** We pre-cached the model weights on an [Amazon FSx for Lustre](https://aws.amazon.com/fsx/lustre/) filesystem — a high-performance parallel filesystem commonly used for HPC and machine learning workloads. The Lustre volume was mounted into the vLLM pod using the FSx CSI driver. vLLM reads shards directly from the mounted filesystem.

We provisioned the filesystem with the PERSISTENT_2 deployment type on SSD storage at the 1000 MB/s/TiB throughput tier — a 4,800 GiB filesystem providing a theoretical aggregate throughput of 4.8 GB/s.

![Strategy 2: FSx for Lustre filesystem mounted into vLLM pod via CSI driver](/img/genai-model-loading/strategy-fsx-lustre.png)

**Results:**

| Metric | Value |
|--------|:-----:|
| Image Pull | 57 sec |
| Weight Loading (109 shards) | 29 min 27 sec |
| Per-Shard Average | 16.2 sec |
| Effective Read Throughput | ~260 MB/s |
| **Total Cold Start** | **32 min 34 sec** |

**What we observed:** Despite provisioning a filesystem capable of 4.8 GB/s aggregate throughput, we observed only ~260 MB/s during weight loading. This is because FSx for Lustre is architected for **parallel, multi-stream I/O across many clients** — the kind of workload you see in distributed training. Our workload is fundamentally different: a single client reading shards sequentially. The 1000 MB/s/TiB throughput tier represents aggregate capacity across multiple concurrent streams, not single-stream performance.

At $1,440/month for the filesystem alone, this was also the most expensive strategy we tested.

---

### Strategy 3: Amazon EFS (Elastic Throughput)

**How it works:** We pre-cached the model weights on [Amazon Elastic File System (Amazon EFS)](https://aws.amazon.com/efs/) using the Elastic throughput mode. The EFS volume was mounted into the vLLM pod via the EFS CSI driver. Like the Lustre strategy, vLLM reads shards sequentially from the mounted filesystem.

EFS Elastic throughput automatically scales read and write throughput based on demand — no need to pre-provision capacity or throughput. We pre-loaded the model onto EFS using [s5cmd](https://github.com/peak/s5cmd) to copy from an [Amazon Simple Storage Service (Amazon S3)](https://aws.amazon.com/s3/) staging bucket.

![Strategy 3: Amazon EFS mounted into vLLM pod via CSI driver with Elastic throughput](/img/genai-model-loading/strategy-efs.png)

**Results:**

| Metric | Value |
|--------|:-----:|
| Image Pull | 59 sec |
| Weight Loading (109 shards) | 8 min 2 sec |
| Per-Shard Average | 4.43 sec |
| Effective Read Throughput | ~1 GB/s |
| **Total Cold Start** | **10 min 50 sec** |

**What we observed:** EFS delivered ~1 GB/s sequential read throughput — nearly 4x faster than FSx for Lustre for this workload. EFS Elastic throughput automatically scaled to meet our read demand without any configuration. This was a surprising result: a general-purpose managed file system outperformed a purpose-built HPC filesystem for our specific access pattern.

The trade-off is cost: EFS Elastic throughput charges $0.03 per GB of data read. At 454 GB per cold start, that's approximately $14 per startup event — which adds up at scale.

---

### Strategy 4: Mountpoint for Amazon S3

**How it works:** We mounted the Amazon S3 bucket containing the model as a POSIX filesystem using [Mountpoint for Amazon S3](https://aws.amazon.com/s3/features/mountpoint/), accessed through the Mountpoint for Amazon S3 CSI driver. vLLM reads shards through the FUSE mount layer as if they were local files. No data is staged locally — reads go directly to S3.

![Strategy 4: S3 bucket mounted via Mountpoint for Amazon S3 with VPC Gateway Endpoint](/img/genai-model-loading/strategy-s3-mountpoint.png)

**Results:**

| Metric | Value |
|--------|:-----:|
| Image Pull | 56 sec |
| Weight Loading (109 shards) | 22 min 27 sec |
| Per-Shard Average | 12.4 sec |
| Effective Read Throughput | ~340 MB/s |
| **Total Cold Start** | **27 min 38 sec** |

**What we observed:** Mountpoint for Amazon S3 provides a convenient POSIX interface to S3, but the FUSE layer adds overhead for sequential reads. Per-shard latency was a consistent ~12.4 seconds, resulting in over 22 minutes of sequential weight loading for 109 shards.

The key advantage here is cost: S3 Standard storage for 454 GB costs just ~$10/month, making this the cheapest storage option. But the slow sequential read speed means expensive GPU time is wasted waiting for data.

---

### Strategy 5: Amazon S3 + s5cmd Init Container

**How it works:** This strategy takes a fundamentally different approach. Instead of reading model weights from network storage during vLLM's sequential loading phase, we use a Kubernetes init container to **download all model shards from S3 in parallel** to the node's local NVMe storage *before* vLLM starts.

The init container runs [s5cmd](https://github.com/peak/s5cmd), a high-performance S3 client, with `--concurrency 50` to download all 109 shards simultaneously. Once the download completes, vLLM starts and loads shards from local NVMe — which provides ~5 GB/s sequential read throughput.

```yaml
initContainers:
  - name: s3-download
    image: peakcom/s5cmd:v2.2.2
    command: ["/s5cmd", "--log", "error", "cp",
              "--concurrency", "50", "--part-size", "100",
              "s3://llm-model-cache-usw2/meta-llama/Llama-3.1-405B-Instruct-FP8/*",
              "/scratch/model/"]
```

This approach decouples the **parallel download** from vLLM's **sequential loading**, leveraging S3's massive aggregate bandwidth and the node's high-speed local NVMe storage.

![Strategy 5: Init container uses s5cmd to download shards from S3 in parallel to NVMe, then vLLM loads locally](/img/genai-model-loading/strategy-s5cmd.png)

**Results:**

| Metric | Value |
|--------|:-----:|
| s5cmd S3 Download | 2 min 17 sec (454 GB at ~3.2 GB/s) |
| Weight Loading (109 shards) | 1 min 32 sec (~0.85 sec/shard from NVMe) |
| KV Cache Init | ~12.6 sec |
| **Total Cold Start** | **5 min 31 sec** |

**What we observed:** This was the fastest strategy by a significant margin. The p5.48xlarge's 3200 Gbps EFA networking enabled s5cmd to pull 454 GB from S3 at ~3.2 GB/s. Once on local NVMe, vLLM loaded all 109 shards in just 92 seconds at ~5 GB/s.

The insight is simple but powerful: **downloading in parallel and reading locally is much faster than reading sequentially from network storage**. By using an init container, we exploit S3's massive aggregate bandwidth without being constrained by vLLM's single-stream sequential read pattern.

> **Note:** This benchmark used a warm container image cache (the base vLLM image was already on the node from a prior strategy test). Add approximately 1 minute for a cold image pull of the 9.3 GB base image, bringing the estimated true cold start to ~6 min 30 sec.

---

### Strategy 6: Amazon ECR Container Image

**How it works:** We baked the model weights directly into the container image and stored it in [Amazon Elastic Container Registry (Amazon ECR)](https://aws.amazon.com/ecr/). The 454 GB model was split across 11 OCI image layers (~44 GB each) to comply with Amazon ECR's 49 GB per-layer limit. When the pod starts, containerd pulls all layers in parallel from ECR. vLLM then reads model weights from the local overlay filesystem, which is backed by the node's NVMe storage.

```dockerfile
# Each batch downloads 10 shards as a separate layer (~44 GB)
RUN for i in $(seq -w 1 10); do \
      echo "cp ${S3}/model-000${i}-of-00109.safetensors ${D}/"; \
    done | s5cmd --log error run
# ... repeated for batches 2-11
```

This approach treats the model as an immutable part of the container image — no runtime downloads, no external storage mounts.

![Strategy 6: Containerd pulls 11 image layers in parallel from ECR, vLLM reads model from overlay filesystem](/img/genai-model-loading/strategy-ecr-image.png)

**Results:**

| Metric | Value |
|--------|:-----:|
| Image Pull (parallel layer pull) | 8 min 4 sec (369 GB compressed) |
| Weight Loading (100 shards) | 1 min 7 sec (~0.67 sec/shard from overlay) |
| KV Cache Init | ~12.7 sec |
| **Total Cold Start** | **10 min 41 sec** |

**What we observed:** Containerd on EKS Auto Mode (Bottlerocket) pulled all 11 model layers in parallel from ECR, downloading 369 GB (compressed) in just over 8 minutes. Once unpacked to the local overlay filesystem, weight loading completed in 67 seconds — the fastest weight loading of any strategy.

The trade-off is operational complexity: you need to build and maintain a ~460 GB container image, the build process requires a machine with 600+ GB of disk, and the ECR layer size limit necessitates splitting the model across multiple Dockerfile `RUN` commands. Any model update requires rebuilding and re-pushing the entire image.

---

## Results at a Glance

| Rank | Strategy | Cold Start | Weight Loading | Effective Throughput |
|:----:|----------|:----------:|:--------------:|:--------------------:|
| 1 | **Amazon S3 + s5cmd Init Container** | **5 min 31 sec** | 1 min 32 sec | ~5.0 GB/s (NVMe) |
| 2 | **Amazon ECR Container Image** | **10 min 41 sec** | 1 min 7 sec | ~5.0 GB/s (NVMe overlay) |
| 3 | **Amazon EFS (Elastic Throughput)** | **10 min 50 sec** | 8 min 2 sec | ~1.0 GB/s |
| 4 | **HuggingFace Hub Direct Download** | **19 min 33 sec** | ~18 min | ~500 MB/s |
| 5 | **Mountpoint for Amazon S3** | **27 min 38 sec** | 22 min 27 sec | ~340 MB/s |
| 6 | **Amazon FSx for Lustre** | **32 min 34 sec** | 29 min 27 sec | ~260 MB/s |

![Bar chart comparing cold-start times across all six strategies](/img/genai-model-loading/comparison-chart.png)

## Why the s5cmd Approach Wins

The results highlight a fundamental architectural insight: **the bottleneck isn't storage throughput — it's the sequential access pattern**.

vLLM loads safetensor shards one at a time. When reading from network-attached storage (EFS, Lustre, S3 Mountpoint), each shard becomes a blocking I/O operation. The per-shard latency ranges from 4.4 seconds on EFS to 16.2 seconds on Lustre — and with 109 shards to load, these delays compound to 8–30 minutes of GPU idle time.

The s5cmd init container breaks this bottleneck by separating two phases:

1. **Parallel download** — s5cmd downloads all 109 shards from S3 simultaneously, saturating the node's network bandwidth (~3.2 GB/s)
2. **Local sequential read** — vLLM reads shards from NVMe at ~5 GB/s, where per-shard latency drops to under 1 second

This two-phase approach turns a 30-minute network I/O problem into a 2-minute download plus a 90-second local read.

![Comparison of sequential network read vs parallel download plus local read approaches](/img/genai-model-loading/sequential-vs-parallel.png)

## Cost Analysis

Faster cold starts aren't just about user experience — they directly reduce costs. Every minute a GPU instance spends loading a model is a minute it's not serving inference. On a p5.48xlarge Spot Instance at ~$32/hour, that's $0.53 per minute of wasted compute.

### Monthly Cost Comparison (1 cold start/day, Spot pricing)

| Strategy | Storage | GPU Idle | Other | **Total** |
|----------|:-------:|:--------:|:-----:|:------------:|
| **Amazon S3 + s5cmd** | $10 | $88 | — | **$98** |
| **Amazon ECR Image** | $46 | $170 | — | **$216** |
| HuggingFace Direct | $0 | $311 | — | **$311** |
| Mountpoint for Amazon S3 | $10 | $440 | — | **$450** |
| Amazon EFS (Elastic) | $136 | $173 | $409 read fees | **$718** |
| FSx for Lustre | $1,440 | $518 | — | **$1,958** |

The s5cmd strategy delivers the lowest total cost at **$98** — combining the cheapest storage option (S3 at $10/month) with the least GPU idle time ($88). FSx for Lustre, despite being the most expensive storage at $1,440/month, also incurs the highest GPU idle cost due to its slow sequential read performance.

A notable observation: Amazon EFS appears cost-competitive at first glance ($136/month storage + $173 GPU idle), but the Elastic throughput read charges of $0.03/GB add approximately $14 per cold start — totaling $409/month in read fees alone at one cold start per day.

## Choosing the Right Strategy

There is no one-size-fits-all answer. The best strategy depends on your operational priorities:

**Optimize for cold-start speed and cost → Amazon S3 + s5cmd Init Container**

This came out as top strategy balancing both speed and cost. It delivers the fastest cold start (5 min 31 sec), the lowest monthly cost ($98), and relies only on Amazon S3 — a service you're likely already using. The init container pattern is straightforward to implement and doesn't require any specialized storage infrastructure.

Best practices for this approach:
- Use s5cmd's `--concurrency 50 --part-size 100` flags to maximize parallelism
- Ensure your pod's [service account has IAM permissions](https://docs.aws.amazon.com/eks/latest/userguide/associate-service-account-role.html) to read from the S3 bucket

**Optimize for deployment immutability → Amazon ECR Container Image**

If you value the container-as-deployment-unit model — where the container image is the single artifact that contains everything needed to run — baking the model into the image is compelling. There are no runtime dependencies on external storage, and rollbacks are as simple as reverting to a prior image tag.

Consider this when:
- You need strict reproducibility across environments
- Your CI/CD pipeline can handle building and pushing ~460 GB images
- Model updates are infrequent

**Optimize for shared access across pods → Amazon EFS**

When multiple pods or services need to read the same model weights — for example, running different model versions side by side, or sharing a model across development and staging environments — EFS provides a familiar ReadWriteMany filesystem that simplifies the architecture. Just be aware of the Elastic throughput read charges at scale.

## Conclusion

Cold-start time is a critical but often overlooked factor in LLM serving architectures. Our benchmarks show a **6x difference** between the fastest and slowest strategies — from 5 minutes with the s5cmd init container approach to 32 minutes with FSx for Lustre.

The key insight is that **how** you deliver model weights matters more than the raw throughput of your storage system. A high-throughput parallel filesystem like FSx for Lustre can underperform a simple S3 download when the access pattern is single-client sequential reads. By rethinking the loading architecture — downloading in parallel to fast local storage, then reading locally — we achieved cold-start times that make GPU autoscaling practical for even the largest open-source models.

All Kubernetes manifests, Dockerfiles, and detailed benchmark data from this post are available in our [GitHub repository](https://github.com/ashoksrirama/genai-model-loading-strategies-eks).

---

*Ashok Srirama is a Principal Solutions Architect at Amazon Web Services, based in Washington Crossing, PA. He specializes in serverless applications, containers, and architecting distributed systems. When he's not spending time with his family, he enjoys watching cricket, and driving his bimmer.*
