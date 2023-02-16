---
slug: aws-blog-post
title: AWS Blog Posts
authors:
  name: Ashok Srirama
  title: Sr. Specialist Solutions Architect
  url: https://github.com/ashoksrirama
  image_url: https://github.com/ashoksrirama.png
tags: [aws, blogs]
---

### Creating Custom Analytics Dashboards with FireEye Helix and Amazon QuickSight

In this blog post, we will discuss an architecture that allows you to create custom analytics dashboards with Amazon QuickSight. These dashboards are based on the threat detection logs collected by FireEye Helix. We automate this process so that data can be pulled and ingested based on a provided schedule. This approach uses AWS Lambda, and Amazon Simple Storage Service (Amazon S3) in addition to QuickSight.

[Read more](https://aws.amazon.com/blogs/architecture/field-notes-creating-custom-analytics-dashboards-with-fireeye-helix-and-amazon-quicksight/)


### Migrate Resources Between AWS Accounts

In this blog, we will discuss various approaches to migrating resources based on type, configuration, and workload needs. Usually, the first consideration is infrastructure. What’s in your environment? What are the interdependencies? How will you migrate each resource?

Using this information, you can outline a plan on how you will approach migrating each of the resources in your portfolio, and in what order.

[Read more](https://aws.amazon.com/blogs/architecture/migrate-resources-between-aws-accounts/)


### Apply CI/CD DevOps principles to Amazon Redshift development

CI/CD in the context of application development is a well-understood topic, and developers can choose from numerous patterns and tools to build their pipelines to handle the build, test, and deploy cycle when a new commit gets into version control. For stored procedures or even schema changes that are directly related to the application, this is typically part of the code base and is included in the code repository of the application. These changes are then applied when the application gets deployed to the test or prod environment.

This post demonstrates how you can apply the same set of approaches to stored procedures, and even schema changes to data warehouses like Amazon Redshift.

[Read more](https://aws.amazon.com/blogs/big-data/apply-ci-cd-devops-principles-to-amazon-redshift-development/)


### Analyze Active Directory Event logs using Amazon OpenSearch

In this blog post, we will discuss a high-level design on how to stream event logs from ActiveDirectory domain controllers and domain joined Amazon Elastic Compute Cloud (Amazon EC2) instances using Amazon CloudWatch Logs and AWS Lambda into Amazon OpenSearch. After consolidating the logs, we will create custom dashboards using Kibana. For additional security, we can integrate AWS Managed Microsoft AD with AWS Single Sign-On (AWS SSO) to authenticate and authorize AD users/groups to Kibana dashboards.

[Read more](https://aws.amazon.com/blogs/modernizing-with-aws/analyze-active-directory-event-logs-using-amazon-opensearch/)


### Authenticate to Amazon EKS clusters using Google Workspace

Amazon Elastic Kubernetes Service (Amazon EKS) makes it easy to deploy, manage, and scale containerized applications using Kubernetes. It has native support for AWS Identity and Access Management (AWS IAM) users and roles as entities that can authenticate against a cluster. Many of our customers use enterprise identity providers (IdP) like Active Directory, OKTA, Google workspace, etc., to manage identities in their organization. We often see our customers integrate the Amazon EKS cluster authentication with their enterprise IdP to use existing identities. In this post, we’ll walk through the approach to integrate Amazon EKS authentication with Google Workspace  (formerly called G-suite). Amazon EKS continues to use AWS IAM for authentication for components, like the kubelet running on Amazon EKS worker nodes when using Google workspace integration as well.

Today, group claims information is not available in Google OIDC ID Token. To overcome this limitation, we use Dex to pull the group information from Google workspace. Dex is an OpenID Connect (OIDC) provider that provides connectors for external OAuth providers to obtain an identity. In this case, a Google Workspace connector will be used.

[Read more](https://aws.amazon.com/blogs/containers/authenticate-to-amazon-eks-using-google-workspace/)

