---
slug: reducing-llm-cold-start-times-eks
title: "Reducing LLM Cold-Start Times on Amazon EKS: A Benchmark of Eight Model Loading Strategies"
sidebar_label: Reducing LLM Cold-Start Times on EKS
authors: ashok
tags: [aws, blogs]
---

Large language models (LLMs) are reshaping how organizations build intelligent applications, from conversational agents to code generation to enterprise search. But deploying these models in production introduces a challenge that doesn't get enough attention: **cold-start time**. When a new pod starts on a fresh GPU node, how long does it take before it can serve its first inference request?

For a model like Meta's Llama 3.1 405B-Instruct-FP8 weighing in at **454 GB across 109 safetensor shards**, the answer can range from 5 minutes to over 30 minutes, depending entirely on how you deliver the model weights to the GPU. In autoscaling scenarios, this cold-start time directly impacts how quickly your infrastructure responds to demand spikes.

In this post, we benchmark eight different strategies for loading LLM weights on [Amazon Elastic Kubernetes Service (Amazon EKS)](https://aws.amazon.com/eks/) and share our findings on performance, cost, and operational trade-offs.

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

Each strategy was tested with a true cold start, a fresh GPU node with no prior image or data cache, unless otherwise noted. We measured **cold-start time** as the interval from pod scheduled to pod ready (serving inference).

## The Eight Strategies

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

**With Run:ai Model Streamer:** We also tested FSx for Lustre with the [Run:ai Model Streamer](https://github.com/run-ai/runai-model-streamer) (`--load-format runai_streamer`, concurrency=32) to see if concurrent tensor streaming could overcome the sequential read bottleneck. The results were dramatic:

| Metric | Default Loader | Run:ai Streamer |
|--------|:--------------:|:---------------:|
| Weight Loading | 29 min 27 sec | **6 min 38 sec** |
| Effective Read Throughput | ~260 MB/s | **~1.1 GiB/s** |

The Run:ai streamer improved Lustre throughput by **4.4x** — using 32 concurrent I/O threads per GPU worker (256 total across 8 TP workers) to saturate the filesystem's parallel bandwidth. This confirms that Lustre's low default throughput was caused by the sequential access pattern, not a limitation of the filesystem itself. However, even with this improvement, the $1,440/month storage cost makes this a less compelling option compared to S3-based strategies.

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

### Strategy 6: Amazon S3 + Run:ai Model Streamer

**How it works:** This strategy uses the [Run:ai Model Streamer](https://github.com/run-ai/runai-model-streamer), an open-source library that replaces vLLM's default sequential weight loader with a **concurrent tensor streaming** engine. Instead of reading safetensor shards one at a time, the streamer uses multiple C++ threads to read tensors from S3 in parallel, overlapping I/O (S3 → CPU memory) with GPU transfer (CPU → GPU).

The key difference from the s5cmd approach: there is no init container and no local copy step. vLLM reads directly from the S3 path using the `--load-format runai_streamer` flag. The streamer handles all the parallelism internally.

```yaml
command:
  - python3
  - -m
  - vllm.entrypoints.openai.api_server
  - --model
  - s3://llm-model-cache-usw2/meta-llama/Llama-3.1-405B-Instruct-FP8
  - --load-format
  - runai_streamer
```

We built a minimal custom container image that adds `runai-model-streamer` and `runai-model-streamer-s3` packages on top of the base vLLM image.

**Results:**

| Metric | Value |
|--------|:-----:|
| Image Pull | 38 sec (9.3 GB custom image) |
| Weight Loading (1509 tensors from S3) | 6 min 13 sec |
| S3 Streaming Throughput | ~1.2 GB/s |
| KV Cache Init | ~29 sec |
| **Total Cold Start** | **8 min 28 sec** |

**What we observed:** The Run:ai streamer achieved **1.2 GB/s** streaming directly from S3 — nearly 4x faster than Mountpoint for Amazon S3 (340 MB/s) for the same S3 bucket. It works at the tensor level (1509 individual tensors across 109 shards), reading and transferring them concurrently rather than waiting for each shard to complete before starting the next.

This approach is the **simplest S3-based strategy** — no init container, no local NVMe storage, no volume mounts. Just point vLLM at an S3 path. The trade-off is that it's ~3 minutes slower than s5cmd because S3 streaming at 1.2 GB/s can't match the NVMe local read speed of 5 GB/s after a parallel download.

---

### Strategy 7: Amazon ECR Container Image

**How it works:** We baked the model weights directly into the container image and stored it in [Amazon Elastic Container Registry (Amazon ECR)](https://aws.amazon.com/ecr/). The 454 GB model was split across 11 OCI image layers (~44 GB each) to comply with Amazon ECR's 49 GB per-layer limit. When the pod starts, containerd pulls all layers in parallel from ECR. vLLM then reads model weights from the local overlay filesystem, which is backed by the node's NVMe storage.

```dockerfile
# Each batch downloads 10 shards as a separate layer (~44 GB)
RUN for i in $(seq -w 1 10); do \
      echo "cp ${S3}/model-000${i}-of-00109.safetensors ${D}/"; \
    done | s5cmd --log error run
# ... repeated for batches 2-11
```

This approach treats the model as an immutable part of the container image — no runtime downloads, no external storage mounts.

![Strategy 7: Containerd pulls 11 image layers in parallel from ECR, vLLM reads model from overlay filesystem](/img/genai-model-loading/strategy-ecr-image.png)

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

### Strategy 8: Amazon EBS Snapshot

**How it works:** We pre-loaded the model weights onto an [Amazon EBS](https://aws.amazon.com/ebs/) volume, created a snapshot, and used [Karpenter's `blockDeviceMappings`](https://karpenter.sh/docs/concepts/nodeclasses/#specblockdevicemappings) to attach the snapshot as a secondary volume on every GPU node at launch. The node's userData script mounts the snapshot volume at `/mnt/model-data`, and vLLM reads model weights from the host-mounted path via a `hostPath` volume.

We enabled [EBS Fast Snapshot Restore (FSR)](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-fast-snapshot-restore.html) on the snapshot in the target Availability Zone to eliminate the lazy-loading penalty that EBS snapshots incur on first read. Without FSR, the first read of each block must be fetched from S3, adding over 100 seconds per shard — making cold starts impractical.

The volume was provisioned as gp3 with 1000 MB/s throughput and 16,000 IOPS — the maximum for gp3. We used the [Run:ai Model Streamer](https://github.com/run-ai/runai-model-streamer) (`--load-format runai_streamer`, concurrency=32) to read tensors concurrently from the mounted volume.

```yaml
blockDeviceMappings:
  - deviceName: /dev/xvdb
    ebs:
      snapshotID: snap-0db355e5da8895b94
      volumeSize: 750Gi
      volumeType: gp3
      throughput: 1000
      iops: 16000
      encrypted: true
      deleteOnTermination: true
```

![Strategy 8: EBS snapshot attached via Karpenter, mounted by userData, vLLM reads via hostPath](/img/genai-model-loading/strategy-ebs-snapshot.png)

**Results:**

| Metric | Value |
|--------|:-----:|
| Image Pull | ~2 min |
| Weight Loading (1509 tensors) | 7 min 43 sec |
| Streaming Throughput | ~1003 MiB/s |
| **Total Cold Start** | **~11 min** |

**What we observed:** The Run:ai streamer fully saturated the gp3 throughput ceiling at **1003 MiB/s** — reading 453.8 GiB across all 8 tensor-parallel workers in 462.9 seconds. For comparison, the default sequential loader on the same gp3 volume achieved only ~367 MB/s (20 min 36 sec), meaning the concurrent streamer delivered a **2.7x speedup** by better utilizing the available bandwidth.

Without the Run:ai streamer, vLLM's default sequential loader on the same gp3 volume took **20 min 36 sec** at only ~367 MB/s — leaving over 60% of the gp3 bandwidth unused. Without FSR enabled, the first read of each snapshot block triggers a lazy fetch from S3, inflating per-shard load times to over 130 seconds and making cold starts completely impractical.

The key advantage of EBS snapshots is **zero download time** — model data is available the moment the node boots, with no init container or network transfer required. The trade-off is operational: you need to manage snapshots, enable FSR in each target AZ ($0.75/hr per AZ), and pin your NodePool to snapshot-enabled zones.

To go faster with EBS, you could use io2 Block Express volumes (up to 4000 MB/s throughput), though at significantly higher cost. The gp3 throughput ceiling is the bottleneck here, not the loader.

---

## Results at a Glance

| Rank | Strategy | Cold Start | Weight Loading | Effective Throughput |
|:----:|----------|:----------:|:--------------:|:--------------------:|
| 1 | **Amazon S3 + s5cmd Init Container** | **5 min 31 sec** | 1 min 32 sec | ~5.0 GB/s (NVMe) |
| 2 | **Amazon S3 + Run:ai Model Streamer** | **8 min 28 sec** | 6 min 13 sec | ~1.2 GB/s (S3 direct) |
| 3 | **Amazon ECR Container Image** | **10 min 41 sec** | 1 min 7 sec | ~5.0 GB/s (NVMe overlay) |
| 4 | **Amazon EFS (Elastic Throughput)** | **10 min 50 sec** | 8 min 2 sec | ~1.0 GB/s |
| 5 | **Amazon EBS Snapshot + Run:ai Streamer** | **~11 min** | 7 min 43 sec | ~1003 MiB/s |
| 6 | **HuggingFace Hub Direct Download** | **19 min 33 sec** | ~18 min | ~500 MB/s |
| 7 | **Mountpoint for Amazon S3** | **27 min 38 sec** | 22 min 27 sec | ~340 MB/s |
| 8 | **Amazon FSx for Lustre** | **32 min 34 sec** | 29 min 27 sec | ~260 MB/s |
| — | *FSx for Lustre + Run:ai Streamer* | *~9 min 30 sec** | *6 min 38 sec* | *~1.1 GiB/s* |

\* *Estimated cold start based on warm Lustre cache with Run:ai Model Streamer (concurrency=32). See Strategy 2 for details.*

![Bar chart comparing cold-start times across all eight strategies](/img/genai-model-loading/comparison-chart.png)

## Why the s5cmd Approach Wins

The results highlight a fundamental architectural insight: **the bottleneck isn't storage throughput — it's the sequential access pattern**.

vLLM's default loader reads safetensor shards one at a time. When reading from network-attached storage (EFS, Lustre, S3 Mountpoint), each shard becomes a blocking I/O operation. The per-shard latency ranges from 4.4 seconds on EFS to 16.2 seconds on Lustre — and with 109 shards to load, these delays compound to 8–30 minutes of GPU idle time.

The s5cmd, Run:ai streamer, and concurrent loading approaches break this bottleneck in different ways:

**s5cmd init container (fastest — 5 min 31 sec):** Separates the problem into two phases — parallel download all 109 shards from S3 at ~3.2 GB/s, then vLLM reads sequentially from local NVMe at ~5 GB/s. This two-phase approach turns a 30-minute network I/O problem into a 2-minute download plus a 90-second local read.

**Run:ai Model Streamer (simplest — 8 min 28 sec):** Replaces vLLM's sequential loader with a concurrent tensor streaming engine that reads directly from S3 at ~1.2 GB/s. No init container, no local storage — just a single flag change. It's 3 minutes slower because S3 streaming can't match NVMe local read speeds, but the operational simplicity is compelling.

**Run:ai streamer on filesystems:** The concurrent streaming approach also dramatically improved FSx for Lustre — from 260 MB/s to 1.1 GiB/s (4.4x faster). Lustre's parallel architecture was being underutilized by vLLM's sequential reader, and the Run:ai streamer's 256 concurrent threads (32 per GPU worker × 8 workers) were able to saturate the filesystem bandwidth. However, we found that Run:ai streamer did *not* improve EFS performance (~859 MiB/s vs ~1 GB/s with the default loader), likely because EFS Elastic throughput already delivers optimal single-client bandwidth for sequential reads.

![Comparison of sequential network read vs parallel download plus local read approaches](/img/genai-model-loading/sequential-vs-parallel.png)

## Cost Analysis

Faster cold starts aren't just about user experience — they directly reduce costs. Every minute a GPU instance spends loading a model is a minute it's not serving inference. On a p5.48xlarge Spot Instance at ~$32/hour, that's $0.53 per minute of wasted compute.

### Monthly Cost Comparison (1 cold start/day, Spot pricing)

| Strategy | Storage | GPU Idle | Other | **Total** |
|----------|:-------:|:--------:|:-----:|:------------:|
| **Amazon S3 + s5cmd** | $10 | $88 | — | **$98** |
| **Amazon S3 + Run:ai Streamer** | $10 | $135 | — | **$145** |
| **Amazon ECR Image** | $46 | $170 | — | **$216** |
| **Amazon EBS Snapshot** | $38 | $175 | $540 FSR | **$753** |
| HuggingFace Direct | $0 | $311 | — | **$311** |
| Mountpoint for Amazon S3 | $10 | $440 | — | **$450** |
| Amazon EFS (Elastic) | $136 | $173 | $409 read fees | **$718** |
| FSx for Lustre | $1,440 | $518 | — | **$1,958** |

The s5cmd strategy delivers the lowest total cost at **$98** — combining the cheapest storage option (S3 at $10/month) with the least GPU idle time ($88). FSx for Lustre, despite being the most expensive storage at $1,440/month, also incurs the highest GPU idle cost due to its slow sequential read performance.

A notable observation: Amazon EFS appears cost-competitive at first glance ($136/month storage + $173 GPU idle), but the Elastic throughput read charges of $0.03/GB add approximately $14 per cold start — totaling $409/month in read fees alone at one cold start per day.

Amazon EBS Snapshot storage itself is cheap ($0.05/GB/month = ~$38 for 750 GiB), but the **Fast Snapshot Restore (FSR)** charge of $0.75/hr per AZ adds $540/month if left enabled continuously. Without FSR, lazy-loading penalties make cold starts impractical — so you must either keep FSR enabled or implement automation to enable it only before scaling events and disable it afterward.

## Choosing the Right Strategy

There is no one-size-fits-all answer. The best strategy depends on your operational priorities:

**Optimize for cold-start speed and cost → Amazon S3 + s5cmd Init Container**

This came out as top strategy balancing both speed and cost. It delivers the fastest cold start (5 min 31 sec), the lowest monthly cost ($98), and relies only on Amazon S3 — a service you're likely already using. The init container pattern is straightforward to implement and doesn't require any specialized storage infrastructure.

Best practices for this approach:
- Use s5cmd's `--concurrency 50 --part-size 100` flags to maximize parallelism
- Ensure your pod's [service account has IAM permissions](https://docs.aws.amazon.com/eks/latest/userguide/associate-service-account-role.html) to read from the S3 bucket

**Optimize for simplicity → Amazon S3 + Run:ai Model Streamer**

If you want the simplest possible setup with no init containers, no volume mounts, and no local storage management, the Run:ai Model Streamer is an excellent choice. At 8 min 28 sec, it's faster than EFS and ECR while requiring nothing beyond a custom vLLM image with the streamer packages installed. Just point `--model` at an S3 path and set `--load-format runai_streamer`.

**Optimize for zero-download startup → Amazon EBS Snapshot**

If eliminating the download phase entirely is a priority, EBS snapshots deliver model data at node boot time — no init container, no network transfer. Combined with the Run:ai Model Streamer, the snapshot volume saturates gp3 bandwidth at ~1003 MiB/s for an 11-minute cold start. However, this approach carries the most operational overhead of any strategy:

- **Snapshot lifecycle management:** You must create and maintain EBS snapshots for each model version. Updating a model means creating a new snapshot and updating the Karpenter EC2NodeClass with the new snapshot ID.
- **Fast Snapshot Restore (FSR):** FSR must be enabled in every target Availability Zone before nodes launch. At $0.75/hr per AZ, this costs $540/month if left on continuously. Consider automating FSR enable/disable around scaling events to reduce cost.
- **AZ pinning:** Since FSR is per-AZ, your NodePool must be pinned to specific zones where FSR is enabled, reducing scheduling flexibility and Spot availability.
- **Non-standard AMI requirements:** EBS snapshots require userData scripting to mount the volume, which means using AL2023 (not Bottlerocket) and managing NVIDIA device plugin installation separately.
- **NVMe device detection:** On Nitro instances, NVMe device ordering is non-deterministic. The userData script must detect the snapshot volume by filesystem type (e.g., `blkid` for ext4) rather than hardcoding device names.

This strategy is best suited for environments where download-free startup is a hard requirement and you have the operational maturity to manage snapshot lifecycles and FSR automation.

**Optimize for deployment immutability → Amazon ECR Container Image**

If you value the container-as-deployment-unit model — where the container image is the single artifact that contains everything needed to run — baking the model into the image is compelling. There are no runtime dependencies on external storage, and rollbacks are as simple as reverting to a prior image tag.

Consider this when:
- You need strict reproducibility across environments
- Your CI/CD pipeline can handle building and pushing ~460 GB images
- Model updates are infrequent

**Optimize for shared access across pods → Amazon EFS**

When multiple pods or services need to read the same model weights — for example, running different model versions side by side, or sharing a model across development and staging environments — EFS provides a familiar ReadWriteMany filesystem that simplifies the architecture. Just be aware of the Elastic throughput read charges at scale.

## Conclusion

Cold-start time is a critical but often overlooked factor in LLM serving architectures. Our benchmarks show a **6x difference** between the fastest and slowest strategies — from 5 minutes with the s5cmd init container approach to 32 minutes with FSx for Lustre. The Run:ai Model Streamer emerged as a compelling middle ground, delivering 8-minute cold starts with the simplest possible configuration.

The key insight is that **how** you deliver model weights matters more than the raw throughput of your storage system. A high-throughput parallel filesystem like FSx for Lustre can underperform a simple S3 download when the access pattern is single-client sequential reads — but applying concurrent loading (via the Run:ai Model Streamer) to that same Lustre filesystem improved throughput by 4.4x. EBS snapshots with the Run:ai streamer similarly saturated the gp3 bandwidth ceiling (1003 MiB/s) where the default loader achieved only 367 MB/s — a 2.7x improvement. By rethinking the loading architecture — whether downloading in parallel to fast local storage or using concurrent tensor streaming — we achieved cold-start times that make GPU autoscaling practical for even the largest open-source models.

All Kubernetes manifests, Dockerfiles, and detailed benchmark data from this post are available in our [GitHub repository](https://github.com/ashoksrirama/genai-model-loading-strategies-eks).

---

*Ashok Srirama is a Principal Solutions Architect at Amazon Web Services, based in Washington Crossing, PA. He specializes in serverless applications, containers, and architecting distributed systems. When he's not spending time with his family, he enjoys watching cricket, and driving his bimmer.*
