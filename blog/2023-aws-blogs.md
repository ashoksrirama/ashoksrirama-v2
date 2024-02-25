---
slug: aws-blog-post-2023
title: AWS Blog Posts - 2023
authors:
  name: Ashok Srirama
  title: Sr. Specialist Solutions Architect
  url: https://github.com/ashoksrirama
  image_url: https://github.com/ashoksrirama.png
tags: [aws, blogs]
---

### Amazon EKS Pod Identity: a new way for applications on EKS to obtain IAM credentials

Amazon EKS Pod Identity is a new approach for managing IAM credentials for your Amazon EKS workloads. We discuss the challenges faced by Amazon EKS customers in setting up AWS IAM permissions using existing approaches. Especially limitations around scalability and reusability of the IAM roles in an AWS account, and lengthy and difficult process of automating the OIDC and IAM role creation in IRSA setup. To address these challenges, Amazon EKS Pod Identity was launched at AWS reInvent 2023. It offers a more streamlined experience for obtaining IAM permissions and is designed to coexist with IRSA. While IRSA works across different Kubernetes deployment options, Amazon EKS Pod Identity is specifically designed for Amazon EKS in the cloud. The post also includes a walkthrough of the high-level flow of using Amazon EKS Pod Identity for configuring an AWS IAM role to grant IAM permissions for applications running in your cluster and how you can use Attribute based access control (ABAC) with EKS workloads.

[Read more](https://aws.amazon.com/blogs/containers/amazon-eks-pod-identity-a-new-way-for-applications-on-eks-to-obtain-iam-credentials/)


### Cognitive Systems Corp.’s Amazon EKS journey: Wi-Fi Sensing technology

Cognitive Systems Corp., which provides pioneering Wi-Fi sensing technology, WiFi Motion, has redefined how people interact with wireless networks by using existing Wi-Fi signals to transform connected devices into motion sensors. In this blog post, we discussed how Cognitive Systems Corp. leveraged Amazon EKS to bring their innovative Wi-Fi Sensing technology, WiFi Motion, to reality. It outlined the evolution of Cognitive’s technology, challenges faced in latency when expanding globally, and how Amazon EKS addressed these issues. The post emphasized the benefits of using AWS for scalability, efficient management, and global reach, ultimately enabling Cognitive Systems to revolutionize Wi-Fi innovation and make motion sensing accessible worldwide.

Adopting a standard, like Amazon EKS and other services, allowed Cognitive Systems to seamlessly integrate with large customers already on the AWS cloud, significantly reducing the once-present barriers of networking, authentication, and authorization. The establishment of a secure, private link between Cognitive and its customers via AWS effectively manages typical security requirements, rendering compliance and privacy considerations more manageable and cost-effective. Cognitive conducts prototypes and trials using the public internet due to its expediency and accessibility. However, when transitioning to production, they use shared Amazon Virtual Private Clouds (Amazon VPC) and PrivateLink, as these options offer enhanced security measures and cost-effectiveness.

The partnership between Cognitive Systems and AWS, with a robust, globally accessible infrastructure, facilitated efficient scalability, intricate problem-solving, and the delivery of exceptional services. As Cognitive’s global reach expands and its customer relationships deepen, AWS and Amazon EKS continues to empower them to achieve more with fewer resources while upholding unparalleled quality and reliability.

[Read more](https://aws.amazon.com/blogs/containers/cognitive-systems-corp-s-amazon-eks-journey-wi-fi-sensing-technology/)


### Use shared VPC subnets in Amazon EKS

In the ever-changing landscape of cloud computing, organizations continue to face the challenge of effectively managing their virtual network environments. To address this challenge, many organizations have embraced shared Amazon virtual private clouds (VPCs) as a means to streamline network administration, and reduce costs. Shared VPCs not only provide these advantages but also enable organizations to seamlessly align with their existing organizational structures. Ultimately, this allows networking teams to take ownership of network topologies through the creation of centrally managed VPCs.

Within the shared VPC model, the account responsible for the centralized VPC (i.e., owner) can share one or more subnets with other accounts (i.e., participants) under the same organization via AWS Organizations. Once a subnet is shared, then participants gain the ability to view, create, modify, and delete their application resources, such as Amazon Elastic Compute Cloud (Amazon EC2) instances, Amazon Relational Database Service (Amazon RDS) databases, AWS Lambda, and Amazon Elastic Kubernetes Service (Amazon EKS) clusters, within the shared subnets.

In this post, we’ll illustrate an enterprise IT scenario in which VPCs are overseen by a central network team, including configuration of VPC resources such as IP allocation, route policies, internet gateways, NAT gateways, security groups, peering, and on-premises connectivity. The network account, which serves as the owner of the centralized VPC, shares subnets with a participant application account managed by a platform team, both of which are part of the same organization. In this use case, the platform team owns the management of Amazon EKS cluster. We’ll also cover the key considerations of using shared subnets in Amazon EKS.

[Read more](https://aws.amazon.com/blogs/containers/use-shared-vpcs-in-amazon-eks/)


### Build secure application networks with VPC Lattice, Amazon ECS, and AWS Lambda

In this post, we’ll explore how to publish and consume services running on Amazon Elastic Container Service (Amazon ECS) and AWS Lambda, as Amazon VPC Lattice services. One main reason customers experience a lower velocity of innovation, is the complexity they deal with while trying to ensure that their applications can communicate in a simple and secure way. Amazon VPC Lattice is a powerful application networking service that removes this complexity, and gives developers a simpler user experience to share their application and connect with dependencies without having to setup any of the underlying network connectivity across Amazon Virtual Private Clouds (Amazon VPCs), AWS accounts, and even overlapping IP addressing. It handles both application layer load balancing and network connectivity, so that developers can focus on their applications, instead of infrastructure.

[Read more](https://aws.amazon.com/blogs/containers/build-secure-application-networks-with-vpc-lattice-amazon-ecs-and-aws-lambda/)


### Life360’s journey to a multi-cluster Amazon EKS architecture to improve resiliency

Life360 offers advanced driving, digital, and location safety features and location sharing for the entire family. Since its launch in 2008, it has become an essential solution for modern life around the world, with families in 195 countries relying on the platform’s range of features, benefits, and services. The world’s leading membership for safety and location is now used by 1 in 9 U.S. families and is among the top 50 most downloaded apps daily on iOS and Android and with a strong community of 50 million monthly active users (MAU) globally. 

In this post, we discussed how Life360 improved their resiliency by implementing a multi-cluster Amazon EKS architecture. Their new approach adopted a bulkhead architecture that used cells to ensure a failure in one cell didn’t affect others. This approach allowed Life360 to reduce inter-AZ data transfer costs, improve EKS scaling and workload management, and create a statically stable infrastructure for AZ-wide failures. With the supercell architecture, Life360 provided uninterrupted service and continued to simplify safety for families globally.

[Read more](https://aws.amazon.com/blogs/containers/life360s-journey-to-a-multi-cluster-amazon-eks-architecture-to-improve-resiliency/)


### Simplify Amazon EKS Multi-Cluster Authentication with Open Source Pinniped

Amazon EKS has native support for AWS Identity and Access Management (AWS IAM) users and roles as entities that can authenticate against a cluster. However, some of our customers use enterprise identity providers (IdP) like Active Directory, Okta, Google Workspace, and others, to manage identities in their organizations. Setting up and managing these authentication mechanisms across multiple Amazon EKS clusters for their workloads and integrating them with an IdP service is time consuming and operationally inefficient. To simplify this process, this blog describes how customers can use Pinniped across their Amazon EKS clusters

[Read more](https://aws.amazon.com/blogs/opensource/simplify-amazon-eks-multi-cluster-authentication-with-open-source-pinniped/)


### How to use AWS App2Container to automate the setup of Azure DevOps CI/CD pipelines

In this blog post, we will walk through how to automate the creation of an Azure DevOps release pipeline that deploys containerized applications to AWS. This solution will save you time and effort if you’re using Azure DevOps for version control or CI/CD and if you’re modernizing your applications using containers. We will use AWS App2Container (A2C) to modernize a sample .NET application into a container and then automate the creation of an Azure DevOps release pipeline. With A2C, you can transform existing applications running in virtual machines into containers without changing any code.

[Read more](https://aws.amazon.com/blogs/modernizing-with-aws/how-to-use-aws-app2container-to-automate-the-setup-of-azure-devops-ci-cd-pipelines/)


### Authenticate to Amazon EKS clusters using Google Workspace

Amazon Elastic Kubernetes Service (Amazon EKS) makes it easy to deploy, manage, and scale containerized applications using Kubernetes. It has native support for AWS Identity and Access Management (AWS IAM) users and roles as entities that can authenticate against a cluster. Many of our customers use enterprise identity providers (IdP) like Active Directory, OKTA, Google workspace, etc., to manage identities in their organization. We often see our customers integrate the Amazon EKS cluster authentication with their enterprise IdP to use existing identities. In this post, we’ll walk through the approach to integrate Amazon EKS authentication with Google Workspace  (formerly called G-suite). Amazon EKS continues to use AWS IAM for authentication for components, like the kubelet running on Amazon EKS worker nodes when using Google workspace integration as well.

Today, group claims information is not available in Google OIDC ID Token. To overcome this limitation, we use Dex to pull the group information from Google workspace. Dex is an OpenID Connect (OIDC) provider that provides connectors for external OAuth providers to obtain an identity. In this case, a Google Workspace connector will be used.

[Read more](https://aws.amazon.com/blogs/containers/authenticate-to-amazon-eks-using-google-workspace/)