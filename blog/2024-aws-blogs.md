---
slug: aws-blog-post-2024
title: AWS Blog Posts - 2024
authors:
  name: Ashok Srirama
  title: Sr. Specialist Solutions Architect
  url: https://github.com/ashoksrirama
  image_url: https://github.com/ashoksrirama.png
tags: [aws, blogs]
---

### How Perry Street Software Implemented Resilient Deployment Strategies with Amazon ECS

Perry Street Software (PSS) is home to SCRUFF and Jack’d, two of the world’s largest gay, bi, trans, and queer social dating apps on iOS and Android. They have a lean ops team that supports an active user base 24 hours a day, 365 days a year. Due to the global nature of the dating app business, downtime is not an option. In this blog, we emphasize the importance of safe deployment strategies to rollout the changes effectively to the end users minimizing the application downtime. These strategies apply to both user facing applications and backend queue processing workers. We dive into how PSS simplified the code deployment process while maintaining their deployment workflow and not slowing down deployment times. PSS have better security controls in place that reduce access to running instances and have enabled themselves to containerize their production environment, which simplified the migration to more efficient and cost effective AWS Graviton instance types.

[Read more](https://aws.amazon.com/blogs/containers/how-perry-street-software-implemented-resilient-deployment-strategies-with-amazon-ecs/)
