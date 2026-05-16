import React from 'react';
import Layout from '@theme/Layout';
import styles from './publications.module.css';

const publications = [
  {
    category: 'GenAI & ML',
    items: [
      {
        title: 'Reducing LLM Cold-Start Times on Amazon EKS: A Benchmark of Eight Model Loading Strategies',
        url: '/blog/reducing-llm-cold-start-times-eks',
        year: 2026,
        description: 'Benchmarks eight strategies for loading LLM weights on EKS using Llama 3.1 405B as the test model.',
      },
      {
        title: 'Maximizing GPU Utilization using NVIDIA Run:ai in Amazon EKS',
        url: 'https://aws.amazon.com/blogs/containers/maximizing-gpu-utilization-using-nvidia-runai-in-amazon-eks/',
        year: 2025,
        description: 'Dynamic GPU resource allocation with NVIDIA Run:ai fractional GPU technology on EKS.',
      },
    ],
  },
  {
    category: 'EKS & Kubernetes',
    items: [
      {
        title: 'Amazon EKS Pod Identity streamlines cross account access',
        url: 'https://aws.amazon.com/blogs/containers/amazon-eks-pod-identity-streamlines-cross-account-access/',
        year: 2025,
        description: 'Simplifies cross-account access using IAM role chaining behind the scenes.',
      },
      {
        title: 'Amazon EKS enhances Kubernetes control plane observability',
        url: 'https://aws.amazon.com/blogs/containers/amazon-eks-enhances-kubernetes-control-plane-observability/',
        year: 2024,
        description: 'Curated dashboards and Prometheus metrics for control plane performance visibility.',
      },
      {
        title: 'Amazon VPC CNI introduces Enhanced Subnet Discovery',
        url: 'https://aws.amazon.com/blogs/containers/amazon-vpc-cni-introduces-enhanced-subnet-discovery/',
        year: 2024,
        description: 'Streamlines network configuration and scales IPv4 clusters without operational complexity.',
      },
      {
        title: "Rippling's journey migrating to the new VPC CNI Network Policy Engine",
        url: 'https://aws.amazon.com/blogs/containers/ripplings-journey-migrating-to-the-new-vpc-cni-network-policy-engine/',
        year: 2024,
        description: 'Blue-green migration strategy for adopting VPC CNI Network Policy Engine.',
      },
      {
        title: 'Monitoring network performance on Amazon EKS using AWS Managed Open-Source Services',
        url: 'https://aws.amazon.com/blogs/containers/monitoring-network-performance-on-amazon-eks-using-aws-managed-open-source-services/',
        year: 2025,
        description: 'Kubernetes-enriched network metrics exported to Prometheus and Grafana.',
      },
      {
        title: 'Amazon EKS Pod Identity: a new way for applications on EKS to obtain IAM credentials',
        url: 'https://aws.amazon.com/blogs/containers/amazon-eks-pod-identity-a-new-way-for-applications-on-eks-to-obtain-iam-credentials/',
        year: 2023,
        description: 'Streamlined IAM permissions for EKS workloads with ABAC support.',
      },
      {
        title: 'Use shared VPC subnets in Amazon EKS',
        url: 'https://aws.amazon.com/blogs/containers/use-shared-vpcs-in-amazon-eks/',
        year: 2023,
        description: 'Centrally managed VPCs with shared subnets for EKS clusters across accounts.',
      },
      {
        title: "Life360's journey to a multi-cluster Amazon EKS architecture to improve resiliency",
        url: 'https://aws.amazon.com/blogs/containers/life360s-journey-to-a-multi-cluster-amazon-eks-architecture-to-improve-resiliency/',
        year: 2023,
        description: 'Bulkhead architecture with cells for AZ-wide failure isolation.',
      },
      {
        title: "Cognitive Systems Corp.'s Amazon EKS journey: Wi-Fi Sensing technology",
        url: 'https://aws.amazon.com/blogs/containers/cognitive-systems-corp-s-amazon-eks-journey-wi-fi-sensing-technology/',
        year: 2023,
        description: 'Global Wi-Fi sensing platform powered by EKS for scalability and low latency.',
      },
      {
        title: 'Simplify Amazon EKS Multi-Cluster Authentication with Open Source Pinniped',
        url: 'https://aws.amazon.com/blogs/opensource/simplify-amazon-eks-multi-cluster-authentication-with-open-source-pinniped/',
        year: 2023,
        description: 'Enterprise IdP integration across multiple EKS clusters using Pinniped.',
      },
      {
        title: 'Authenticate to Amazon EKS clusters using Google Workspace',
        url: 'https://aws.amazon.com/blogs/containers/authenticate-to-amazon-eks-using-google-workspace/',
        year: 2023,
        description: 'EKS authentication integration with Google Workspace via Dex OIDC provider.',
      },
    ],
  },
  {
    category: 'Containers & Developer Tools',
    items: [
      {
        title: "Enhancing Developer Productivity: Finch's Support for Development Containers and the Finch Daemon",
        url: 'https://aws.amazon.com/blogs/opensource/enhancing-developer-productivity-finchs-support-for-development-containers-and-the-finch-daemon/',
        year: 2024,
        description: 'VS Code Dev Containers support and Finch Daemon for container development.',
      },
      {
        title: 'Announcing Finch on Linux for Container Development',
        url: 'https://aws.amazon.com/blogs/opensource/announcing-finch-on-linux-for-container-development',
        year: 2024,
        description: 'Consistent container development across all major operating systems.',
      },
      {
        title: 'How Perry Street Software Implemented Resilient Deployment Strategies with Amazon ECS',
        url: 'https://aws.amazon.com/blogs/containers/how-perry-street-software-implemented-resilient-deployment-strategies-with-amazon-ecs/',
        year: 2024,
        description: 'Safe deployment strategies for 24/7 dating apps on ECS with Graviton migration.',
      },
      {
        title: 'Build secure application networks with VPC Lattice, Amazon ECS, and AWS Lambda',
        url: 'https://aws.amazon.com/blogs/containers/build-secure-application-networks-with-vpc-lattice-amazon-ecs-and-aws-lambda/',
        year: 2023,
        description: 'Application networking without VPC peering or complex connectivity setup.',
      },
      {
        title: 'How to use AWS App2Container to automate the setup of Azure DevOps CI/CD pipelines',
        url: 'https://aws.amazon.com/blogs/modernizing-with-aws/how-to-use-aws-app2container-to-automate-the-setup-of-azure-devops-ci-cd-pipelines/',
        year: 2023,
        description: 'Containerize .NET apps and automate Azure DevOps release pipelines to AWS.',
      },
    ],
  },
  {
    category: 'Networking & Security',
    items: [
      {
        title: 'Securing .NET Microservices with Entra ID on AWS',
        url: 'https://aws.amazon.com/blogs/dotnet/securing-net-microservices-with-entra-id-on-aws/',
        year: 2026,
        description: 'Service-to-service authentication using Microsoft Entra ID with OAuth 2.0 client credentials.',
      },
      {
        title: 'Monitoring network performance on Amazon EKS using AWS Managed Open-Source Services',
        url: 'https://aws.amazon.com/blogs/containers/monitoring-network-performance-on-amazon-eks-using-aws-managed-open-source-services/',
        year: 2025,
        description: 'Real-time visibility into service communication and latency bottlenecks.',
      },
      {
        title: 'Amazon VPC CNI introduces Enhanced Subnet Discovery',
        url: 'https://aws.amazon.com/blogs/containers/amazon-vpc-cni-introduces-enhanced-subnet-discovery/',
        year: 2024,
        description: 'Streamlines network configuration for IPv4 EKS clusters at scale.',
      },
      {
        title: 'Use shared VPC subnets in Amazon EKS',
        url: 'https://aws.amazon.com/blogs/containers/use-shared-vpcs-in-amazon-eks/',
        year: 2023,
        description: 'Centrally managed VPCs shared across accounts via AWS Organizations.',
      },
    ],
  },
  {
    category: 'Data & Analytics',
    items: [
      {
        title: 'Apply CI/CD DevOps principles to Amazon Redshift development',
        url: 'https://aws.amazon.com/blogs/big-data/apply-ci-cd-devops-principles-to-amazon-redshift-development/',
        year: 2021,
        description: 'CI/CD pipelines for stored procedures and schema changes in Amazon Redshift.',
      },
      {
        title: 'Analyze Active Directory Event logs using Amazon OpenSearch',
        url: 'https://aws.amazon.com/blogs/modernizing-with-aws/analyze-active-directory-event-logs-using-amazon-opensearch/',
        year: 2022,
        description: 'Stream AD event logs to OpenSearch with custom Kibana dashboards.',
      },
      {
        title: 'Creating Custom Analytics Dashboards with FireEye Helix and Amazon QuickSight',
        url: 'https://aws.amazon.com/blogs/architecture/field-notes-creating-custom-analytics-dashboards-with-fireeye-helix-and-amazon-quicksight/',
        year: 2021,
        description: 'Automated threat detection analytics from FireEye Helix to QuickSight.',
      },
      {
        title: 'Migrate Resources Between AWS Accounts',
        url: 'https://aws.amazon.com/blogs/architecture/migrate-resources-between-aws-accounts/',
        year: 2021,
        description: 'Approaches to migrating resources based on type, configuration, and workload needs.',
      },
    ],
  },
];

function PublicationItem({title, url, year, description}) {
  const isExternal = url.startsWith('http');
  return (
    <a
      href={url}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className={styles.publicationItem}
    >
      <div className={styles.publicationContent}>
        <h4 className={styles.publicationTitle}>{title}</h4>
        <p className={styles.publicationDescription}>{description}</p>
      </div>
      <span className={styles.yearBadge}>{year}</span>
    </a>
  );
}

export default function Publications() {
  return (
    <Layout
      title="Publications"
      description="AWS blog posts and publications by Ashok Srirama, organized by topic"
    >
      <main className={styles.publicationsPage}>
        <div className="container">
          <div className={styles.header}>
            <h1 className={styles.pageTitle}>Publications</h1>
            <p className={styles.pageSubtitle}>
              AWS blog posts and technical articles I've authored or co-authored, organized by topic.
            </p>
          </div>
          {publications.map((section) => (
            <section key={section.category} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>{section.category}</h2>
              <div className={styles.publicationList}>
                {section.items.map((item) => (
                  <PublicationItem key={`${item.title}-${section.category}`} {...item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </Layout>
  );
}
