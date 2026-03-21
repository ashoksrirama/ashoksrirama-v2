#!/usr/bin/env python3
"""Generate architecture diagrams for each model loading strategy."""

import os
import sys

# diagrams library renders via graphviz
from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import EKS, EC2
from diagrams.aws.storage import SimpleStorageServiceS3 as S3
from diagrams.aws.storage import ElasticFileSystemEFS as EFS
from diagrams.aws.storage import FsxForLustre as FSx
from diagrams.aws.storage import ElasticBlockStoreEBS as EBS
from diagrams.aws.compute import ECR
from diagrams.aws.network import Endpoint
from diagrams.aws.general import InternetAlt1 as Internet
from diagrams.onprem.compute import Server
from diagrams.custom import Custom

OUT = os.path.dirname(os.path.abspath(__file__))

graph_attr = {
    "fontsize": "14",
    "fontname": "Helvetica",
    "bgcolor": "white",
    "pad": "0.5",
    "ranksep": "1.0",
    "nodesep": "0.8",
}

edge_attr = {
    "fontsize": "11",
    "fontname": "Helvetica",
}

node_attr = {
    "fontsize": "11",
    "fontname": "Helvetica",
}

cluster_attr = {
    "fontsize": "13",
    "fontname": "Helvetica Bold",
    "style": "rounded",
    "bgcolor": "#FAFAFA",
    "pencolor": "#FF9900",
    "penwidth": "2",
}


def strategy_hf_direct():
    with Diagram(
        "Strategy 1: HuggingFace Hub Direct Download",
        filename=os.path.join(OUT, "strategy-hf-direct"),
        outformat="png",
        show=False,
        direction="LR",
        graph_attr=graph_attr,
        edge_attr=edge_attr,
        node_attr=node_attr,
    ):
        hf = Internet("HuggingFace Hub")

        with Cluster("Amazon EKS Cluster", graph_attr=cluster_attr):
            with Cluster("GPU Node (p5.48xlarge)", graph_attr={**cluster_attr, "bgcolor": "#FFF8F0"}):
                with Cluster("vLLM Pod", graph_attr={**cluster_attr, "bgcolor": "#FFFFFF"}):
                    vllm = Server("vLLM\n(hf_transfer)")
                nvme = EC2("Local NVMe\n(28 TB RAID0)")
                gpu = Server("8x H100/H200\nGPU Memory")

        hf >> Edge(label="Download 454 GB\n~500 MB/s", style="bold", color="#232F3E") >> vllm
        vllm >> Edge(label="Write shards", color="#666666") >> nvme
        nvme >> Edge(label="Load weights\nsequentially", style="bold", color="#FF9900") >> gpu


def strategy_fsx_lustre():
    with Diagram(
        "Strategy 2: Amazon FSx for Lustre",
        filename=os.path.join(OUT, "strategy-fsx-lustre"),
        outformat="png",
        show=False,
        direction="LR",
        graph_attr=graph_attr,
        edge_attr=edge_attr,
        node_attr=node_attr,
    ):
        fsx = FSx("FSx for Lustre\n(PERSISTENT_2 SSD)\n4.8 GB/s aggregate")

        with Cluster("Amazon EKS Cluster", graph_attr=cluster_attr):
            with Cluster("GPU Node (p5.48xlarge)", graph_attr={**cluster_attr, "bgcolor": "#FFF8F0"}):
                with Cluster("vLLM Pod", graph_attr={**cluster_attr, "bgcolor": "#FFFFFF"}):
                    vllm = Server("vLLM")
                    vol = EC2("/model-cache\n(FSx CSI mount)")
                gpu = Server("8x H100/H200\nGPU Memory")

        fsx >> Edge(label="Sequential read\n~260 MB/s effective", style="bold", color="#232F3E") >> vol
        vol >> Edge(label="Read shards\n16.2 sec/shard", color="#666666") >> vllm
        vllm >> Edge(label="Load weights", style="bold", color="#FF9900") >> gpu


def strategy_efs():
    with Diagram(
        "Strategy 3: Amazon EFS (Elastic Throughput)",
        filename=os.path.join(OUT, "strategy-efs"),
        outformat="png",
        show=False,
        direction="LR",
        graph_attr=graph_attr,
        edge_attr=edge_attr,
        node_attr=node_attr,
    ):
        efs = EFS("Amazon EFS\n(Elastic Throughput)")

        with Cluster("Amazon EKS Cluster", graph_attr=cluster_attr):
            with Cluster("GPU Node (p5.48xlarge)", graph_attr={**cluster_attr, "bgcolor": "#FFF8F0"}):
                with Cluster("vLLM Pod", graph_attr={**cluster_attr, "bgcolor": "#FFFFFF"}):
                    vllm = Server("vLLM")
                    vol = EC2("/model-cache\n(EFS CSI mount)")
                gpu = Server("8x H100/H200\nGPU Memory")

        efs >> Edge(label="Sequential read\n~1 GB/s", style="bold", color="#232F3E") >> vol
        vol >> Edge(label="Read shards\n4.4 sec/shard", color="#666666") >> vllm
        vllm >> Edge(label="Load weights", style="bold", color="#FF9900") >> gpu


def strategy_s3_mountpoint():
    with Diagram(
        "Strategy 4: Mountpoint for Amazon S3",
        filename=os.path.join(OUT, "strategy-s3-mountpoint"),
        outformat="png",
        show=False,
        direction="LR",
        graph_attr=graph_attr,
        edge_attr=edge_attr,
        node_attr=node_attr,
    ):
        s3 = S3("Amazon S3\n(Model Bucket)")
        vpce = Endpoint("S3 VPC\nGateway Endpoint")

        with Cluster("Amazon EKS Cluster", graph_attr=cluster_attr):
            with Cluster("GPU Node (p5.48xlarge)", graph_attr={**cluster_attr, "bgcolor": "#FFF8F0"}):
                with Cluster("vLLM Pod", graph_attr={**cluster_attr, "bgcolor": "#FFFFFF"}):
                    vllm = Server("vLLM")
                    vol = EC2("/model-cache\n(Mountpoint CSI)")
                gpu = Server("8x H100/H200\nGPU Memory")

        s3 >> Edge(label="", color="#232F3E") >> vpce
        vpce >> Edge(label="FUSE read\n~340 MB/s", style="bold", color="#232F3E") >> vol
        vol >> Edge(label="Read shards\n12.4 sec/shard", color="#666666") >> vllm
        vllm >> Edge(label="Load weights", style="bold", color="#FF9900") >> gpu


def strategy_s5cmd():
    with Diagram(
        "Strategy 5: Amazon S3 + s5cmd Init Container",
        filename=os.path.join(OUT, "strategy-s5cmd"),
        outformat="png",
        show=False,
        direction="LR",
        graph_attr=graph_attr,
        edge_attr=edge_attr,
        node_attr=node_attr,
    ):
        s3 = S3("Amazon S3\n(Model Bucket)")
        vpce = Endpoint("S3 VPC\nGateway Endpoint")

        with Cluster("Amazon EKS Cluster", graph_attr=cluster_attr):
            with Cluster("GPU Node (p5.48xlarge)", graph_attr={**cluster_attr, "bgcolor": "#FFF8F0"}):
                with Cluster("App Pod", graph_attr={**cluster_attr, "bgcolor": "#FFFFFF"}):
                    init = Server("Init Container\n(s5cmd)")
                    vllm = Server("vLLM Container")
                nvme = EC2("Local NVMe\n(28 TB RAID0)")
                gpu = Server("8x H100/H200\nGPU Memory")

        s3 >> Edge(label="", color="#232F3E") >> vpce
        vpce >> Edge(label="Parallel download\n109 shards @ ~3.2 GB/s", style="bold", color="#146EB4") >> init
        init >> Edge(label="Write 454 GB\n(2 min 17 sec)", color="#666666") >> nvme
        nvme >> Edge(label="Sequential read\n~5 GB/s from NVMe", style="bold", color="#FF9900") >> vllm
        vllm >> Edge(label="Load weights\n0.85 sec/shard", style="bold", color="#FF9900") >> gpu


def strategy_ecr_image():
    with Diagram(
        "Strategy 6: Amazon ECR Container Image",
        filename=os.path.join(OUT, "strategy-ecr-image"),
        outformat="png",
        show=False,
        direction="LR",
        graph_attr=graph_attr,
        edge_attr=edge_attr,
        node_attr=node_attr,
    ):
        ecr = ECR("Amazon ECR\n(460 GB image)\n11 layers")

        with Cluster("Amazon EKS Cluster", graph_attr=cluster_attr):
            with Cluster("GPU Node (p5.48xlarge)\nBottlerocket", graph_attr={**cluster_attr, "bgcolor": "#FFF8F0"}):
                containerd = Server("containerd\n(parallel pull)")
                nvme = EC2("Local NVMe\n(overlay fs)")
                with Cluster("vLLM Pod", graph_attr={**cluster_attr, "bgcolor": "#FFFFFF"}):
                    vllm = Server("vLLM\n(model baked in)")
                gpu = Server("8x H100/H200\nGPU Memory")

        ecr >> Edge(label="Pull 11 layers\nin parallel\n(8 min 4 sec)", style="bold", color="#146EB4") >> containerd
        containerd >> Edge(label="Unpack to\noverlay fs", color="#666666") >> nvme
        nvme >> Edge(label="Read weights\n0.67 sec/shard", style="bold", color="#FF9900") >> vllm
        vllm >> Edge(label="Load weights", style="bold", color="#FF9900") >> gpu


def strategy_ebs_snapshot():
    with Diagram(
        "Strategy 8: Amazon EBS Snapshot",
        filename=os.path.join(OUT, "strategy-ebs-snapshot"),
        outformat="png",
        show=False,
        direction="LR",
        graph_attr=graph_attr,
        edge_attr=edge_attr,
        node_attr=node_attr,
    ):
        ebs = EBS("EBS Snapshot\n(gp3, 750 GiB)\n1000 MB/s, 16K IOPS")

        with Cluster("Amazon EKS Cluster", graph_attr=cluster_attr):
            with Cluster("GPU Node (p5en.48xlarge)\nAL2023 + Karpenter", graph_attr={**cluster_attr, "bgcolor": "#FFF8F0"}):
                userdata = Server("userData\n(mount snapshot)")
                hostpath = EC2("/mnt/model-data\n(hostPath mount)")
                with Cluster("vLLM Pod", graph_attr={**cluster_attr, "bgcolor": "#FFFFFF"}):
                    vllm = Server("vLLM + Run:ai\nModel Streamer")
                gpu = Server("8x H100/H200\nGPU Memory")

        ebs >> Edge(label="Attached via\nblockDeviceMappings\n(FSR enabled)", style="bold", color="#232F3E") >> userdata
        userdata >> Edge(label="mount -o ro", color="#666666") >> hostpath
        hostpath >> Edge(label="Concurrent read\n~1003 MiB/s", style="bold", color="#146EB4") >> vllm
        vllm >> Edge(label="Load weights\n7 min 43 sec", style="bold", color="#FF9900") >> gpu


def sequential_vs_parallel():
    with Diagram(
        "Sequential Network Read vs Parallel Download + Local Read",
        filename=os.path.join(OUT, "sequential-vs-parallel"),
        outformat="png",
        show=False,
        direction="LR",
        graph_attr={**graph_attr, "ranksep": "1.2"},
        edge_attr=edge_attr,
        node_attr=node_attr,
    ):
        with Cluster("Traditional: Sequential from Network Storage", graph_attr={**cluster_attr, "bgcolor": "#FFF0F0", "pencolor": "#CC3333"}):
            storage1 = EFS("Network\nStorage")
            vllm1 = Server("vLLM")
            gpu1 = Server("GPU")
            storage1 >> Edge(label="Read shard 1... shard 109\nOne at a time\n~260 MB/s - 1 GB/s", style="bold", color="#CC3333") >> vllm1
            vllm1 >> Edge(label="8-30 min\nweight loading", color="#CC3333") >> gpu1

        with Cluster("Optimized: Parallel Download + Local Read", graph_attr={**cluster_attr, "bgcolor": "#F0FFF0", "pencolor": "#339933"}):
            s3_2 = S3("Amazon S3")
            init2 = Server("s5cmd\n(init container)")
            nvme2 = EC2("Local NVMe")
            vllm2 = Server("vLLM")
            gpu2 = Server("GPU")
            s3_2 >> Edge(label="109 shards\nin parallel\n@ 3.2 GB/s", style="bold", color="#339933") >> init2
            init2 >> Edge(label="2 min 17 sec", color="#339933") >> nvme2
            nvme2 >> Edge(label="Sequential read\n@ 5 GB/s", style="bold", color="#339933") >> vllm2
            vllm2 >> Edge(label="1 min 32 sec\nweight loading", color="#339933") >> gpu2


if __name__ == "__main__":
    print("Generating strategy diagrams...")
    strategy_hf_direct()
    print("  - strategy-hf-direct.png")
    strategy_fsx_lustre()
    print("  - strategy-fsx-lustre.png")
    strategy_efs()
    print("  - strategy-efs.png")
    strategy_s3_mountpoint()
    print("  - strategy-s3-mountpoint.png")
    strategy_s5cmd()
    print("  - strategy-s5cmd.png")
    strategy_ecr_image()
    print("  - strategy-ecr-image.png")
    strategy_ebs_snapshot()
    print("  - strategy-ebs-snapshot.png")
    sequential_vs_parallel()
    print("  - sequential-vs-parallel.png")
    print("Done! Architecture diagrams saved to:", OUT)
