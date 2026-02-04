import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: '☁️ Cloud Native Enthusiast',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        I make containers go brrr on AWS. EKS, ECS, Fargate - if it runs in a box, 
        I've probably broken it at 3 AM and fixed it by 3:05 AM. ☕
      </>
    ),
  },
  {
    title: '💡 Thought Leader',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Author of "Kubernetes for Generative AI Solutions" and contributor to the AWS Containers Blog. 
        Sharing insights, best practices, and lessons learned from real-world implementations. 
        Because knowledge grows when shared! 🚀
      </>
    ),
  },
  {
    title: '🎯 Problem Solver',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Principal Specialist Solutions Architect at AWS. I help customers avoid the mistakes I made, 
        so they can make entirely new and creative mistakes instead. 🚀
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
