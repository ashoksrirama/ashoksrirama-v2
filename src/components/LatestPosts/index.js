import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const recentPosts = [
  {
    title: 'Reducing LLM Cold-Start Times on Amazon EKS: A Benchmark of Eight Model Loading Strategies',
    date: 'March 18, 2026',
    slug: '/blog/reducing-llm-cold-start-times-eks',
    description: 'Benchmarks eight strategies for loading LLM weights on EKS, comparing cold-start time, throughput, and cost.',
  },
  {
    title: 'Cross EKS Cluster Execution of Argo Workflows',
    date: 'January 15, 2024',
    slug: '/blog/cross-cluster-argo-workflows-eks',
    description: 'Run argo-workflow-controller in a hub EKS cluster and execute workflows in a spoke cluster across AWS accounts.',
  },
  {
    title: 'Configure MostAllocated Scheduler Strategy in Amazon EKS',
    date: 'January 10, 2024',
    slug: '/blog/custom-scheduler-mostallocated-eks',
    description: 'Create a custom kube-scheduler with MostAllocated strategy for efficient node binpacking.',
  },
];

export default function LatestPosts() {
  return (
    <section className={styles.latestPosts}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Latest Posts</h2>
          <Link to="/blog" className={styles.viewAll}>
            View all posts
          </Link>
        </div>
        <div className={styles.postsGrid}>
          {recentPosts.map((post) => (
            <Link key={post.slug} to={post.slug} className={styles.postCard}>
              <span className={styles.postDate}>{post.date}</span>
              <h3 className={styles.postTitle}>{post.title}</h3>
              <p className={styles.postDescription}>{post.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
