import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

export default function BookSection() {
  return (
    <section className={styles.bookSection}>
      <div className="container">
        <div className={styles.bookContainer}>
          <div className={styles.bookImageWrapper}>
            <a 
              href="https://www.amazon.com/Kubernetes-Generative-Solutions-designing-optimizing/dp/1836209932/" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.bookLink}
            >
              <img 
                src="https://m.media-amazon.com/images/I/81aReicVamL._SY522_.jpg" 
                alt="Kubernetes for Generative AI Solutions Book Cover" 
                className={styles.bookCover}
              />
            </a>
          </div>
          <div className={styles.bookContent}>
            <div className={styles.bookBadge}>📚 NEW BOOK</div>
            <h2 className={styles.bookTitle}>
              Kubernetes for Generative AI Solutions
            </h2>
            <p className={styles.bookSubtitle}>
              A complete guide to designing, optimizing, and deploying Generative AI workloads on Kubernetes
            </p>
            <p className={styles.bookDescription}>
              Master the complete GenAI project lifecycle on Kubernetes from design and optimization to deployment. 
              This practical guide covers everything from setting up K8s clusters to scaling GenAI workloads in production, 
              including model optimization, GPU efficiency, observability, security, and cost management.
            </p>
            <div className={styles.bookFeatures}>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🎯</span>
                <span>Real-world examples and best practices</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🚀</span>
                <span>From concept to production deployment</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>💰</span>
                <span>Cost-effective scaling strategies</span>
              </div>
              <div className={styles.feature}>
                <span className={styles.featureIcon}>🔒</span>
                <span>Security and resilience patterns</span>
              </div>
            </div>
            <div className={styles.bookAuthors}>
              <strong>Co-authored with Sukirti Gupta</strong>
            </div>
            <div className={styles.bookButtons}>
              <a 
                href="https://www.amazon.com/Kubernetes-Generative-Solutions-designing-optimizing/dp/1836209932/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="button button--primary button--lg"
              >
                📖 Get the Book on Amazon
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
