---
title: Deploying Prefect on any Cloud Using a Single VM
date: 2025-01-15T09:29:00
author: Karol Wolski
description: A pattern to improve observability, monitoring and, ultimately, data operations with Prefect. We show how to find the right trade off between number of deployments and improved operations.
tags:
  - prefect
internal_notes: |-
  ### The Simplest Way to Set Up Scalable Data Platform on Google Cloud Platform (GCP)

  ### 0. Outline (Internal usage only, to be removed before publishing)

  Choosing the right approach to build and maintain a data platform is often a daunting task for organizations. With an overwhelming number of options available, finding a solution that balances simplicity, scalability, and future-proofing while also addressing the challenges of hiring people skilled enough for developing this solution can be a complex endeavor.

  In this article, I aim to:   

  - Highlight the key challenges organizations face when deciding on data platform architecture, such as simplicity versus scalability, designing a future-proof solution, and acquiring the right talent for maintenance.   
  - Focus on a practical solution without opening debate about orchestration tools like Prefect, Airflow, or Dagster. For the sake of clarity, this article assumes the use of Prefect as the orchestration tool and there will be dedicated article for comparison of those orchestrator tools.   
  - Present the most viable options for running Prefect flows and discuss why a single VM with K3s is an excellent choice.   
  - Provide a high-level overview of the proposed architecture and the required steps for implementation. This is not a step-by-step guide, so specifics like Terraform scripts or GitHub workflow configurations are intentionally omitted.   

  By the end, readers should have a clearer understanding of how to approach a straightforward and scalable data platform setup using Prefect and K3s using single Virtual Machine on GCP.

  ## Comments from AC (Dec 31st 2024)

  - I think a better title would be: Deploying Prefect on any Cloud using a simple VM
  - This article is about deploying Prefect at this point, so better you own it, it also makes SEO easier, since you would be targeting people struggling to deploy prefect
  - You  can remove the streaming paragraph, we can address this topic in another article
  - You need to address serverless in more detail, maybe even a separate paragraph, this is because serverless is the main counter argument to VM + K3S
  - Trim unnecessary words, here the word "powerful" adds no value: Example: Simple and Powerful Setup for GCP
  - Remove 3 completely, it's not providing a full guide, I understand you want to hide some information to get their email address, but this is now half baked and it will annoy people. Let's focus this article on the following outline:

  Outline:

  - Introduction
  - Challenges with Deploying Prefect
  - Why Serveless might not be the best choice
  - Prefect Deployment Options
  - Lightweight Prefect Deployment Solution
  - Conclusion
---
Choosing the right data platform architecture is quite a challenge for any organization. It’s a balancing act: you need something that delivers immediate value while staying flexible enough for future growth—all without sacrificing scalability, simplicity, or efficiency.

This article offers a thoughtful guide to the decision-making process behind choosing Prefect with lightweight Kubernetes (K3S) on a single Virtual Machine (VM) with any cloud provider. You’ll explore:

- Why simplicity and flexibility are essential for modern data platforms.
- Key considerations for selecting the right data orchestration tool.
- Insights into serverless vs server-based execution of Prefect flows.
- Approaches to run a server-based Prefect worker

Rather than a step-by-step tutorial, this guide is designed to help you make solid platform architecture decisions and design a solution tailored to your organization’s unique needs. Let’s dive in.

### Challenges With Picking Data Platform Architecture

The options for building a data platform are endless—but many fall short. With the rise of affordable cloud storage, expectations have changed, leaving many once-revolutionary legacy systems struggling to keep up. At the same time, new solutions making big claims often fail, either missing critical features or bogging organizations down with unnecessary complexity. For smaller companies, the challenge is even greater—a data platform should drive business value, not require a dedicated team just to maintain it. 

Starting small may seem practical, but early shortcuts can turn into major obstacles as the platform grows. Undoing poor architectural choices later is often costly and disruptive. That’s why **choosing a solution that is both simple and scalable from the outset is essential**. 

For decision-makers, this journey begins by stepping back and evaluating both the current state of their team and the platform they rely on. The **Data Platform Maturity Curve** is a helpful framework for this:

![data maturity](/src/assets/images/data_maturity_curve.png)

Depending on the organization’s data technology maturity level, your platform must adapt. This article focuses on those in the middle of the curve—where simple scripts and ad-hoc solutions are no longer enough, but advanced features like autoscaling aren’t yet necessary. At this stage, the platform delivers tangible business value and is steadily becoming integral to operations. Downtime—whether it lasts hours, a day, or even a week—is growing increasingly expensive.

The goal? A platform that’s lightweight, scalable, and future-ready without overcomplicating things.

### Data Platform Orchestration: the Key to Seamless Integration 

Even the best-designed data platform is useless if it’s not integrated. No matter how carefully you choose your architecture, your platform’s success hinges on how well its core components—ingestion, transformation, and serving—work together. These phases can only operate efficiently when they are tightly aligned.

![](/src/assets/images/data_engineering_lifecycle.png)

Early-stage platforms often rely on manual orchestration, which works at first but quickly becomes a bottleneck as data grows and workflows become more complex. Managing, ensuring accuracy, and reducing downtime requires a more structured approach. 

A few basic improvements can help push the boundaries further. For instance:

- Instead of running all scripts locally, they can be executed on a virtual machine.
- Setting up a database helps centralize data
- Basic automation of workflows can be managed with cron jobs in Linux.

While these incremental improvements help in the short term, significant challenges remain:

- **Manual code execution** becomes increasingly error-prone as the scale of operations grows.
- **Cron jobs** become difficult to manage as workflows become more complex and interdependent. Debugging failures can quickly turn into a nightmare, especially with cascading issues across multiple flows.

This is where automated data orchestration becomes the key to streamlining workflows across the entire lifecycle. It allows teams to automate, monitor, and scale operations by transforming disconnected processes into a cohesive system, minimizing manual intervention and reducing errors. 

Let’s review the most popular options available in the market. 

### Data Orchestration Tools 

The three leading orchestration tools in the market are:

- **Apache Airflow:** An open-source and community-driven tool with robust features but a steep learning curve. Managed versions like Google Cloud Composer and Amazon MWAA simplify deployment but tie users to specific cloud providers.
- **Prefect:** A modern, cloud-agnostic, and easy-to-configure solution emphasizing scalability, portability, and developer-friendly features that allow for flexible orchestration. Prefect’s architecture also supports running workflows in hybrid environments, seamlessly bridging on-premises and cloud solutions.
- **Dagster:** Designed for data-aware orchestration, Dagster prioritizes validation, lineage, and developer productivity, making it ideal for teams handling complex pipelines.

At The Scalable Way we have worked with both Airflow and Prefect in a few projects, we advise Prefect for lightweight setup with less deployment things to worry about.

### What is Prefect Cloud?

Prefect Cloud is a fully managed orchestration platform that simplifies running and monitoring Python-based workflows without the overhead of managing infrastructure. It’s well-suited for teams looking to automate data workflows, from ingestion and transformation to serving.

Its strengths include:

- **Scalability**: Handles thousands of workflows with ease.
- **Monitoring and alerting**: Built-in features simplify issue detection and resolution.
- **Cloud-agnostic architecture**: Runs seamlessly across environments, avoiding vendor lock-in.

By automating the orchestration layer, Prefect Cloud allows teams to focus on building robust pipelines without the overhead of managing infrastructure.

### Common Struggle for Prefect Users: Deployment

Adopting Prefect as an orchestrator unlocks many possibilities but like any powerful tool, it comes with a learning curve. Prefect flexibility and a developer-first approach can initially feel daunting for teams unfamiliar with building solid deployment solutions. 

Prefect’s philosophy emphasizes providing tools rather than prescribing solutions, allowing users to adapt its features to their specific needs. While this approach offers flexibility and scalability, it can leave data engineers uncertain about where to start with scalable deployment practices like CI/CD pipelines and autoscaling. 

### Eternal Dilemma: Server-based or Serverless  

Another consideration is choosing the right setup for running Prefect flows. There are two primary approaches, each designed to cater to different needs: 

- **Server-based**: This requires setting up infrastructure such as virtual machines, lightweight Kubernetes (e.g., K3S), or managed Kubernetes clusters. While these setups provide maximum control, scalability, and adaptability, they demand a higher level of expertise and upfront effort.
- **Serverless**: Managed solutions like Prefect Cloud’s service or serverless compute options from cloud providers (AWS Fargate, Google Cloud Run, Azure Container Instances) eliminate the need for infrastructure management, making them appealing for simpler workflows.

Serverless solutions, though convenient, are best suited for simpler workflows, as they come with three notable challenges:

1. **Startup Overhead**: Prefect Worker images often have heavy dependencies, increasing flow initialization time. This leads to latency, as serverless platforms can introduce delays between task executions due to event-driven triggers. A long-running server with a persistent Prefect Worker is usually much quicker.
2. **Vendor Lock-In**: Serverless solutions are often tightly integrated with specific cloud providers, making it difficult to migrate workflows across platforms. Even Prefect Work Pools, though useful, have limited functionality at the Pro tier.
3. **Cost Management**: Serverless can be cost-effective for intermittent workloads but can become expensive with unpredictable usage patterns. Managing costs is trickier compared to traditional server-based setups.

Ultimately, the choice between server-based and serverless depends on the teams’ needs and stage of data maturity. However, for most organizations aiming to scale, a Prefect Work Pool running on a long-running server is a more optimal and reliable solution. 

### Deployment Options for a Server-based Data Platform

- **Local Prefect Worker Process**

Connects directly to Prefect Cloud and serves as an introductory setup to understand Prefect Cloud’s functionality. However, this is not suitable for production scenarios due to limited scalability and resilience.

- **Systemd Process on Single or Multiple VMs**

Runs Prefect flows in Docker containers, providing a lightweight setup that is relatively easy to configure. This approach is well-suited to small projects and teams, as Docker limits unnecessary complexity.

- **Single VM with Lightweight Kubernetes (K3S)**

It's not as simple as a Systemd setup because of the introduction of Kubernetes and Helm. Thanks to these tools, it's more scalable and adaptable for future growth. This setup offers flexibility for migration to more robust configurations as project demands increase.

- **Managed Kubernetes Cluster**

The most feature-rich solution-managed Kubernetes supports autoscaling, spot instances, and integrations with tools like Active Directory. It is ideal for comprehensive data platforms. However, this approach adds operational complexity and may be excessive for smaller projects.

### Recommended Setup for getting started: Lightweight Kubernetes on a Single Virtual Machine

The lightweight Kubernetes on a single Virtual Machine (VM) setup strikes an ideal balance between cost efficiency and operational flexibility. By leveraging lightweight Kubernetes (K3S), you gain the core benefits of Kubernetes with significantly reduced overhead, making it perfect for smaller environments or projects with constrained resources. Its streamlined architecture ensures smooth operations without the complexity of managing a full Kubernetes cluster. The diagram illustrates a basic architecture that effectively meets most requirements for running Prefect flows in a scalable manner.

![](/src/assets/images/prefect_flow_architecture.png)

Using Helm charts to deploy the Prefect Worker simplifies orchestration, ensuring seamless integration with existing systems while minimizing manual configurations. Helm also makes updates easier, promotes standardization, and reduces deployment errors. 

Running everything on a single virtual machine keeps the infrastructure simple yet scalable. If project demands grow, you can easily upgrade the VM or expand to a multi-node cluster without major changes to your architecture. Additionally, this setup simplifies maintenance, provides clear monitoring and debugging paths, and avoids vendor lock-in, preserving flexibility for future enhancements.

### Conclusion

Building a modern data platform is no easy task. Success lies in keeping it simple while ensuring flexibility and scalability. With the right tools and setup, like Prefect and lightweight Kubernetes on a single virtual machine, you can create a platform that delivers immediate value and adapts as your needs grow. 

By focusing on scalable, modular solutions, you’re not just solving today’s problems—you’re building a platform ready for whatever comes next.
