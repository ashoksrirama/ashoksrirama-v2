---
sidebar_position: 2
---

# Update an EKS Cluster

### Prerequisites
- Review the k8s/EKS release notes for deprecated APIs/features
- Utilize the tools like **[kubent](https://github.com/doitintl/kube-no-trouble)** (kube-no-trouble) to check your clusters for use of deprecated APIs

:::tip
Use **[kubectl convert](https://kubernetes.io/docs/tasks/tools/install-kubectl-linux/#install-kubectl-convert-plugin)** to convert the manifest files between different API versions. Both YAML and JSON formats are accepted
:::


### Update Strategies
- [In-place updates](#inplace-update)
- [Blue/Green updates](#bluegreen-update)


### Inplace Update
Updating an EKS Cluster involves 3 high level steps:

- Update the EKS Control plane
- Update the EKS Data plane (Includes Managed Nodegroups, Self-managed worker nodes and Fargate)
- Update the Addon software (Both Managed and Self-managed)

### Blue/Green Update

- Create a new EKS cluster
- Launch the EKS Worker nodes
    - Managed Nodegroups
    - Self-managed worker nodes
    - Fargate Profiles
- Install the necessary Addon software
- Use the GitOps Agent or CD pipelines to deploy the application manifests
- Validate the setup
- Cutover the traffic using Route53

