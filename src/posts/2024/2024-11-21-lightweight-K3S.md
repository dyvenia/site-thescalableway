---
title: The Simplest Way to Set Up Scalable Data Platform on Google Cloud Platform (GCP)
date: 2024-11-20
author: Karol Wolski
description: A pattern to improve observability, monitoring and, ultimately, data operations with Prefect. We show how to find the right trade off between number of deployments and improved operations.
---
## 0. Outline (Internal usage only, to be removed before publishing)

Choosing the right approach to build and maintain a data platform is often a daunting task for organizations. With an overwhelming number of options available, finding a solution that balances simplicity, scalability, and future-proofing while also addressing the challenges of hiring people skilled enough for developing this solution can be a complex endeavor.

In this article, I aim to:   

- Highlight the key challenges organizations face when deciding on data platform architecture, such as simplicity versus scalability, designing a future-proof solution, and acquiring the right talent for maintenance.   
- Focus on a practical solution without opening debate about orchestration tools like Prefect, Airflow, or Dagster. For the sake of clarity, this article assumes the use of Prefect as the orchestration tool and there will be dedicated article for comparison of those orchestrator tools.   
- Present the most viable options for running Prefect flows and discuss why a single VM with K3s is an excellent choice.   
- Provide a high-level overview of the proposed architecture and the required steps for implementation. This is not a step-by-step guide, so specifics like Terraform scripts or GitHub workflow configurations are intentionally omitted.   

By the end, readers should have a clearer understanding of how to approach a straightforward and scalable data platform setup using Prefect and K3s using single Virtual Machine on GCP.

Article starts below.

Choosing the right data platform architecture is a critical decision for any organization. The challenge lies in finding a solution that delivers immediate value while staying flexible enough for future growth—all without sacrificing scalability, simplicity, or efficiency.

This article offers a clear roadmap for building a streamlined, scalable platform using Prefect and lightweight Kubernetes (K3S) on a single Virtual Machine (VM) in Google Cloud Platform (GCP). You’ll learn:

- Why simplicity and adaptability are essential for modern data platforms.   
- How to approach batch and stream processing to meet evolving needs.   
- Practical steps for combining Prefect and K3S into a future-proof architecture.   

To help you put these insights into action, we've also prepared a [free guide](https://share-eu1.hsforms.com/1xWSEuA-aQI6DWKwgmcXNwA2dihx8) packed with detailed instructions. Whether you’re just starting or refining an existing setup, this resource will save you time and effort.

This is not a step-by-step tutorial but a guide to help you confidently design a scalable solution tailored to your organization’s needs. Let’s delve in.

## 1. Challenges With Picking Data Platform Architecture

The options for building a data platform today are endless—but not all are fit for the modern era. With the rise of affordable cloud storage, expectations have changed, leaving many once-revolutionary legacy systems struggling to keep up. At the same time, flashy new solutions often fall short, either missing critical features or bogging organizations down with unnecessary complexity. For smaller companies, the challenge is even greater—maintaining a data platform shouldn’t demand a dedicated team when the real goal is driving business value.

It’s also tempting to start too small. Early shortcuts in data platform design can seem harmless at first but can evolve into major roadblocks as the platform grows in importance. Undoing those decisions—especially ones tied to architecture—can be prohibitively complex once the platform becomes central to operations. That’s why choosing a solution that is both simple and scalable from the outset is essential. Planning for growth and ensuring a smooth path for future upgrades can save significant headaches down the line.

For decision-makers, this journey begins by stepping back and evaluating both the current state of their team and the platform they rely on. The Data Platform Maturity Curve offers a valuable framework for this assessment:

![Data Platform Maturity Curve](/src/assets/images/gcp_a1_data_platform_maturity_curve-1.png "Data Platform Maturity Curve")

Depending on the organization’s data technology maturity, the approach to maintaining a data platform must adapt. This article focuses on those in the middle of the maturity curve—where simple scripts and ad-hoc solutions are no longer enough, but the platform hasn’t yet reached the point of processing terabytes of data or requiring advanced features like autoscaling. At this stage, the platform is delivering tangible business value and is steadily becoming integral to operations. Downtime—whether it lasts hours, a day, or even a week—is growing increasingly expensive.

### 1.1 The Reality of Stream Processing

There has been a lot of hype recently about stream processing, with many organizations eager to benefit from real-time data. While this acceleration offers exciting possibilities, the market for stream processing is still evolving, and the tools available today may change drastically in the coming years.

Focusing on batch processing is typically more beneficial for companies early in the data maturity curve. In many cases, real-time needs can be addressed through micro-batch processing, which allows new data to be received and processed every few minutes. While not a perfect substitute for true streaming, this approach is an excellent way to validate the business value of real-time data. Stream processing should only be implemented when a skilled team with experience in collecting and processing data encounters clear limits in meeting business requirements.

### 1.2 Simplifying the Data Engineering Lifecycle

Another critical consideration is improving processes across the data engineering lifecycle by selecting tools that work together seamlessly to deliver value to the organization.

![Data Engineering Lifecycle](blob:https://thescalableway-admin.netlify.app/a42ea5aa-4c7c-4dd7-8d0a-37f66bd6b926 "Data Engineering Lifecycle")

While data generation is an external process for a data platform, its main purpose is to consolidate valuable data from multiple sources and serve them in a more readable way. Technically, it’s possible to build a platform where different applications are used for each phase of the ELT process (e.g., ingestion, transformation, and serving). However, this approach quickly becomes overly complex and fails to deliver significant value.

Ideally, a data platform should be as simple as possible. Ingestion, transformation, and serving should integrate seamlessly, sharing the same storage solution and functioning as a unified system. Achieving this simplicity often requires careful attention to underlying dependencies, as Joe Reis and Matt Housley outline in their book [Fundamentals of Data Engineering](https://www.oreilly.com/library/view/fundamentals-of-data/9781098108298/).

They highlight several critical concepts that must be considered throughout the lifecycle and call them "undercurrents". They include:   

- Security   
- Data Management   
- DataOps   
- Data Architecture   
- Orchestration   
- Software Engineering   

While this article focuses on a few of these areas, it’s important to consider all of them when planning the architecture for your data engineering lifecycle.

## 2. Data Platform Orchestration

In the early phases of a data platform, its use within the business is often limited, and availability is not yet a critical concern. Reports can be prepared manually and sent via email to management. Instead of exposing a database with valuable data to the ML team, it may suffice to share raw data files.

However, this approach quickly becomes a bottleneck. A few basic improvements can help push the boundaries further. For instance:   

- Instead of running all scripts locally, they can be executed on a virtual machine.   
- Setting up a database helps centralize data and reduces reliance on the availability of the data engineering team.   
- Basic automation of workflows can be managed with cron jobs in Linux.   

While these incremental improvements help in the short term, significant challenges remain:

- **Manual code execution** becomes increasingly error-prone as the scale of operations grows.   
- **Cron jobs** become difficult to manage as workflows become more complex and interdependent. Debugging failures can quickly turn into a nightmare, especially with cascading issues across multiple flows.

### 2.1 Addressing Complexity With Workflow Management Tools

These challenges can be resolved by implementing a workflow management platform for data engineering pipelines. Such tools allow teams to orchestrate, schedule, and monitor complex workflows while reducing manual effort and improving reliability.

The three leading orchestration tools in the market are:

- **Apache Airflow** is an open-source orchestrator with the largest community and ecosystem. However, it comes with a steep learning curve. Airflow requires configuring the server component, which can be overly complex for teams just starting with ELT processes. Managed cloud options for Airflow—such as Google Cloud Composer (tied to GCP) and Amazon Managed Workflows for Apache Airflow (AWS) — reduce this burden but are typically locked into a specific cloud provider.
- **Prefect** offers a compelling alternative to Airflow. Prefect Cloud is a cloud-agnostic, easy-to-configure solution that enables teams to get started quickly. Its biggest advantages include scalability, portability, and developer-friendly features that allow for flexible orchestration. Prefect’s architecture also supports running workflows in hybrid environments, seamlessly bridging on-premises and cloud solutions.  
- **Dagster** focuses on data-aware orchestration, with strong capabilities for testing and validating pipelines. It’s particularly appealing for teams that value robust data lineage and higher developer productivity.   

### 2.2 Why Prefect Cloud?

Prefect Cloud is a fully managed orchestration platform that simplifies running and monitoring Python-based workflows without the overhead of managing infrastructure. It’s well-suited for teams looking to automate data workflows, from ingestion and transformation to serving.

Compared to other tools, Prefect Cloud stands out for its flexibility and ease of use:

- It scales easily to handle thousands of scheduled workflows.   
- Built-in monitoring and alerting make it straightforward to identify and address failures.   
- Its cloud-agnostic design ensures workflows can run across different environments, avoiding vendor lock-in.   

Prefect Cloud reduces the operational complexity of orchestration, allowing teams to focus on building and improving their pipelines instead of managing infrastructure.

### 2.3 Options for Running Prefect Flows

There are several ways to run Prefect flows, each with distinct trade-offs. Choosing the right setup is critical, as not all options offer easy migration paths. These approaches can be divided into two main categories:

- **Server-Based**: Requires an underlying server infrastructure, such as:   
    - A Prefect Worker running as a Systemd process on one or multiple virtual machines (VMs)   
    - A single VM with lightweight Kubernetes (e.g., K3S)   
    - A managed Kubernetes environment with autoscaling and advanced configuration   
- **Serverless**: Managed options that don’t require server maintenance, such as:   
    - Prefect Cloud’s managed service   
    - Serverless compute options from major cloud providers, such as AWS Fargate, Google Cloud Run, and Azure Container Instances   

While the serverless approach can be appealing, particularly for simpler workflows, it introduces significant startup overhead. The Prefect Worker images, typically heavy with dependencies, can lengthen flow initialization times. Although some optimizations are possible, a more efficient and versatile setup generally involves a long-running server with a persistent Prefect Worker process.

#### 2.3.1 Available Deployment Options

- **Local Prefect Worker Process**   

Connects directly to Prefect Cloud and serves as an introductory setup to understand Prefect Cloud’s functionality. However, this is not suitable for production scenarios due to limited scalability and resilience.

- **Systemd Process on Single or Multiple VMs**   

Runs Prefect flows in Docker containers, providing a lightweight setup that is relatively easy to configure. This approach is well-suited to small projects and teams, as Docker limits unnecessary complexity.

- **Single VM with Lightweight Kubernetes (K3S)**   

Not as simple as Systemd setup because of introduction of Kubernetes and Helm. Thanks to these tools it's more scalable and adaptable for future growth. This setup offers flexibility for migration to more robust configurations as project demands increase.

- **Managed Kubernetes Cluster**   

The most feature-rich solution-managed Kubernetes supports autoscaling, spot instances, and integrations with tools like Active Directory. Ideal for comprehensive data platforms. This approach, however, adds operational complexity and may be excessive for smaller projects.

#### 2.3.2 Recommended Setup: Lightweight Kubernetes on a Single VM

This article explores an optimal setup for small-to-medium projects looking to balance simplicity with scalability. We will highlight the configuration of a single VM with lightweight Kubernetes (K3S) and the deployment of a Prefect Worker using a Helm chart. This approach lays a solid foundation for scaling without requiring a complete architectural overhaul in the future. While there are additional steps involved in fully implementing the Data Engineering Lifecycle with Prefect Cloud, this guide focuses specifically on the infrastructure setup. Although we use GCP as an example, a similar strategy can be applied with AWS, Azure, or other cloud providers.

## 3. Example: Simple and Powerful Setup for GCP

The components of a data platform can be combined in countless ways. For medium-sized companies still early in their data journey, this example provides a solid foundation. For more complex scenarios, engaging a data platform consultancy may be a wise step.

Here’s a practical, streamlined setup for orchestrating workflows with Prefect on Google Cloud Platform (GCP):

- **Virtual Private Cloud (VPC)**: A private network that will serve as the foundational environment.   
- **Subnet**: A private subnet where the virtual machine will reside.   
- **Compute Engine Virtual Machine**: The instance where both the GitHub Runner and Prefect Worker will be set up.   
- **Firewall**: Configured with rules to allow inbound access exclusively through Google Cloud Identity-Aware Proxy (IAP), blocking all other traffic.   
- **IAP SSH Permissions**: Enables secure access to the virtual machine.   
- **Cloud Router**: Provides internet connectivity for the virtual machine.   
- **Cloud NAT**: Configures a NAT gateway that directs the virtual machine to the Cloud Router for outbound internet access. It also makes sure that public IP is fixed, as long as the Cloud NAT object is not destroyed and configured for the same zone.   
- **Cloud Storage**: Sets up a Google Cloud Storage bucket to store ingested data as Parquet files before transforming and loading it into the database as tables.   

![Infrastructure](blob:https://thescalableway-admin.netlify.app/57bd9cc1-517b-4a67-bbbd-62023c0ee0a4 "Infrastructure")

### 3.1 Security

Security is non-negotiable. Without proper safeguards, the platform can be vulnerable to unauthorized access. Below are the key measures to ensure a secure and manageable environment:

- **No public access to any of the resources**   
The entire infrastructure is designed to operate within a private network, eliminating any public exposure. Access to the Compute Engine virtual machine is managed through Google Cloud Identity-Aware Proxy (IAP), which handles authentication and authorization. IAP creates a secure tunnel for SSH connections without requiring public IPs, eliminating the complexity of setting up a VPN. This streamlines operations, especially for organizations without dedicated networking teams, while improving operational velocity. 
- **GitHub runner for automation**   
Automation is critical to maintaining this environment efficiently. Since shared GitHub-hosted runners cannot access private infrastructure, a self-hosted GitHub runner is deployed directly on the virtual machine. This enables secure automation for configuring the environment, deploying Prefect flows, and managing updates, all within the private network. By keeping the runner internal, security is maintained without sacrificing automation capabilities.
- **Controlled outbound traffic**   
While incoming access is tightly restricted, the virtual machine still requires outbound connectivity to services like Prefect Cloud, GitHub, or external systems for data ingestion and serving. To minimize risk, all outbound traffic is routed through a fixed Cloud NAT IP. This ensures predictable and secure communication without unnecessary exposure. When dealing with private or non-public services, a VPN is required. Solutions like GCP Cloud VPN or software-based tools such as strongSwan enable secure and encrypted connections, ensuring data integrity and protection.

#### 3.1.1 Understanding Google Cloud Identity-Aware Proxy (IAP)

With the environment completely blocked from the internet, it’s necessary to establish a secure way to connect to it. There are two viable options to achieve this:   

- **VPN Connection**: In this setup, at least one resource within the VPC must be exposed to the internet to host a VPN endpoint. Alternatively, a separate VPC can be configured solely for VPN purposes, with VPC Network Peering into the main environment. This way, only the VPN-hosting VPC is exposed to the internet, while the main environment remains accessible only internally. Although effective, this configuration is more complex and falls outside the scope of this documentation.   
- **Google Cloud Identity-Aware Proxy (IAP)**: This option offers a similar secure access model to a VPN but with simplified management through Google Cloud. As outlined in the [official documentation](https://cloud.google.com/iap/docs/concepts-overview#how_iap_works):   

> When an application or resource is protected by IAP, it can only be accessed through the proxy by principals, also known as users, who have the correct Identity and Access Management (IAM) role. When you grant a user access to an application or resource by IAP, they're subject to the fine-grained access controls implemented by the product in use without requiring a VPN. When a user tries to access an IAP-secured resource, IAP performs authentication and authorization checks.

This [diagram from Google](https://cloud.google.com/iap/images/iap-load-balancer.png) further illustrates the components required to implement this configuration:

![GCP IAP](blob:https://thescalableway-admin.netlify.app/8252e835-a9cc-4fbe-86e5-3e7f0a7279ba "GCP IAP")

### 3.2 Configuration Steps

Setting up the platform involves a few key phases that ensure a smooth and scalable foundation. From installing essential tools and configuring prerequisites to provisioning infrastructure with Terraform and automating workflows through GitHub, each step plays a crucial role in building a reliable and efficient system. Let's take a closer look at the key phases of the process.

#### 3.2.1 Prerequisites

**Terraform**: For a basic setup, Terraform can be installed on a local machine. For a more advanced configuration, it’s better to run Terraform on a dedicated environment, such as a virtual machine or as part of a GitHub Workflow. Detailed installation instructions are available [on the official Hashicorp page](https://developer.hashicorp.com/terraform/install).

**Gcloud CLI**: The gcloud CLI is a command-line tool for interacting with GCP services. It must be installed following the [official instructions](https://cloud.google.com/sdk/docs/install).

**GCP Service Account**: To avoid reliance on personal accounts, it’s highly recommended to create a GCP Service Account. Unlike personal credentials, a service account remains unaffected when individual employees leave the company, ensuring continuity for the data platform. Once the account is created, two types of credentials should be generated:   

- **JSON Key**: Used by both Terraform and Prefect Flows to authenticate with GCP.   
- **HMAC Key**: Required for libraries like [DLT](https://dlthub.com/) to upload files to Google Cloud Storage.   

**Enabling Essential GCP APIs**: On a fresh GCP project, some APIs may be disabled by default. To ensure the platform runs smoothly, enable the following:   

- [Compute Engine API](https://console.cloud.google.com/marketplace/product/google/compute.googleapis.com)   
- [Cloud Resource Manager API](https://console.cloud.google.com/marketplace/product/google/cloudresourcemanager.googleapis.com)   
- [Cloud Storage](https://console.cloud.google.com/marketplace/product/google-cloud-platform/cloud-storage)   

**Remote State for Terraform**: By default, Terraform saves its state locally in `tfstate` files. While this approach works for development, production environments require a centralized and reliable state storage solution. Storing the Terraform state in a Google Cloud Storage (GCS) bucket ensures it is secure, accessible, and protected from conflicts or accidental loss.

However, this creates a common “chicken-and-egg” problem: Terraform cannot provision the bucket where its state will reside because it needs a state to execute. To resolve this, the GCS bucket must be created manually before running any Terraform code.

#### 3.2.2 Terraform Installation

The installation process uses Terraform to provision essential infrastructure components, including the VPC, subnets, Compute Engine VM, Cloud Storage bucket, and Cloud NAT. To simplify your journey, we've created a [comprehensive resource](https://share-eu1.hsforms.com/1xWSEuA-aQI6DWKwgmcXNwA2dihx8) that includes everything you need to get started:

- A step-by-step instructions for meeting all prerequisites
- Terraform file structures designed for both DEV and PROD environments   
- Ready-to-use Terraform templates for infrastructure provisioning   
- A complete list of Terraform commands for setup execution    
- Instructions for verifying the setup within GCP   
- Guidance on accessing the created clusters   

#### 3.2.3 Automating Infrastructure Setup with CI/CD

Once the infrastructure is in place, the next step is to configure a GitHub CI/CD workflow. This involves setting up a self-hosted GitHub Runner on the Compute Engine VM to securely orchestrate Prefect flows and other workflows without exposing your environment to the public internet.

To help you implement this with ease, our **resource** also covers:   

- Everything you’ll need to set up Prefect and the self-hosted GitHub Runner  
- How to configure GitHub workflows for K3S and Helm installation   
- Detailed guidance on deploying a Prefect Worker using GitHub Workflows   

By following this setup, you can ensure seamless and secure orchestration for your workflows.

### 3.3 Ready to Dive Deeper?

If you’re ready to streamline your infrastructure setup and automate workflows, our free guide has you covered. It includes detailed steps for Terraform provisioning and CI/CD workflows and bonus insights into how our consulting services can help you optimize your setup.

Click [here](https://share-eu1.hsforms.com/1xWSEuA-aQI6DWKwgmcXNwA2dihx8) to receive access to the guide and take the first step toward building a secure, scalable, and automated data platform on Google Cloud Platform.
