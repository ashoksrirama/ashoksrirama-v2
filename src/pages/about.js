import React from 'react';
import Layout from '@theme/Layout';
import styles from './about.module.css';

const socialLinks = [
  {label: 'Twitter', href: 'https://twitter.com/ashoksrirama', icon: '𝕏'},
  {label: 'LinkedIn', href: 'https://www.linkedin.com/in/ashok-srirama/', icon: 'in'},
  {label: 'GitHub', href: 'https://github.com/ashoksrirama', icon: '</>'},
];

const highlights = [
  {icon: '🎯', text: 'Helping customers design and build scalable container platforms'},
  {icon: '📝', text: 'Writing blog posts and creating content to share what I\'ve learned'},
  {icon: '🎤', text: 'Speaking at conferences and meetups'},
  {icon: '📚', text: 'Co-authored "Kubernetes for Generative AI Solutions"'},
];

const interests = [
  {icon: '☕', text: 'Drinking coffee (probably too much)'},
  {icon: '📚', text: 'Reading tech blogs and documentation'},
  {icon: '✍️', text: 'Writing books and blog posts'},
  {icon: '🐛', text: 'Debugging things that shouldn\'t be broken'},
];

export default function About() {
  return (
    <Layout title="About" description="About Ashok Srirama — Principal Specialist Solutions Architect at AWS">
      <main className={styles.aboutPage}>
        <div className="container">
          <section className={styles.heroSection}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>About Me</h1>
              <p className={styles.heroSubtitle}>
                Principal Specialist Solutions Architect at AWS
              </p>
              <p className={styles.heroDescription}>
                I help organizations navigate the exciting (and sometimes chaotic) world of containers,
                Kubernetes, and Generative AI on AWS. I've been working with AWS and containers for several
                years now, and I've seen the ecosystem evolve from "Docker is cool" to "we're running
                thousands of microservices in production and need help."
              </p>
              <div className={styles.socialLinks}>
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    aria-label={link.label}
                  >
                    <span className={styles.socialIcon}>{link.icon}</span>
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </section>

          <div className={styles.grid}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>What I Do</h2>
              <div className={styles.highlightList}>
                {highlights.map((item) => (
                  <div key={item.text} className={styles.highlightItem}>
                    <span className={styles.highlightIcon}>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Philosophy</h2>
              <blockquote className={styles.quote}>
                "The whole problem with the world is that fools and fanatics are always so certain
                of themselves, but wiser people so full of doubts."
              </blockquote>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Author</h2>
              <p className={styles.cardText}>
                I co-authored <a href="https://www.amazon.com/Kubernetes-Generative-Solutions-designing-optimizing/dp/1836209932/" target="_blank" rel="noopener noreferrer"><strong>Kubernetes for Generative AI Solutions</strong></a> with
                Sukirti Gupta. This comprehensive guide covers everything from designing and optimizing
                to deploying GenAI workloads on Kubernetes — including model optimization, GPU efficiency,
                observability, security, and cost management.
              </p>
              <a
                href="https://www.amazon.com/Kubernetes-Generative-Solutions-designing-optimizing/dp/1836209932/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.bookLink}
              >
                Get the book on Amazon
              </a>
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>When I'm Not Working</h2>
              <div className={styles.highlightList}>
                {interests.map((item) => (
                  <div key={item.text} className={styles.highlightItem}>
                    <span className={styles.highlightIcon}>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </Layout>
  );
}
