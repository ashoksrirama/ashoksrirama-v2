---
sidebar_position: 1
---

# Create an EKS Cluster

### Prerequisites

- Install the `eksctl`

Create a basic cluster with default configuration

```bash
eksctl create cluster --name eksdemo
.......
[✔]  EKS cluster "eksdemo" in "us-west-2" region is ready
```

Wait for the cluster message as shown above and export the following `env` variables.

```bash
export AWS_REGION=us-west-2
export EKS_CLUSTER=eksdemo
```

