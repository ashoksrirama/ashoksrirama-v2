import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import BookSection from '@site/src/components/BookSection';
import LatestPosts from '@site/src/components/LatestPosts';
import selfie from "/static/img/selfie2.jpg";
import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <img className={styles.circular_image} src={selfie} alt="Ashok Srirama" />
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/blog">
            Read My Blog
          </Link>
          <Link
            className="button button--secondary button--lg"
            to="/about">
            About Me
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Principal Specialist Solutions Architect at AWS | Cloud Native Enthusiast | Thought Leader | Author of Kubernetes for Generative AI Solutions">
      <HomepageHeader />
      <main>
        <BookSection />
        <LatestPosts />
      </main>
    </Layout>
  );
}
