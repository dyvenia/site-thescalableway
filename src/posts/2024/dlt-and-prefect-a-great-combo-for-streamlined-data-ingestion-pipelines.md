---
title: dlt and Prefect, a Great Combo for Streamlined Data Ingestion Pipelines
date: 2025-01-27T12:54:00
author: Michał Zawadzki
description: Streamline your data ingestion pipelines with dlt and Prefect. This article explores how combining these powerful open-source tools enables scalable, efficient, and production-ready data workflows. Learn best practices, key features, and real-world insights to simplify data engineering.
tags:
  - dlt
  - prefect
  - data ingestion
  - data orchestration
  - data pipelines
internal_notes: |-
  **Audience:** 

  - Prefect users looking into improving their data ingestion workflow, technology and process
  - dlt users looking into improving their scheduling, orchestration and monitoring

  **Purpose:**

  Show that dyvenia knows both technologies as well as how to do data ingestion professionally and thus can help clients which struggle with it or with one of those tools.

  **Outline:**

  - Introduction - doing data ingestion right is hard
      - Open-source vs managed
      - Open-source vs in-house
  - A short introduction to dlt and Prefect
  - Creating data connectors and pipelines with dlt
      - Modularity
      - Extensibility
      - Reliability
      - Security
      - Privacy
      - Efficiency
  - Orchestrating data pipelines with Prefect
      - Orchestration job features
  - Production workflow
      - Configuration
      - Creating dlt pipelines
      - Creating Prefect flows
      - Deploying to production
  - Summary
      - Explain how this solution solves the problems from intro paragraph
          - Features
          - Readiness for AI era
---
**Doing data ingestion right is hard…**

Despite advances in data engineering, data ingestion—the Extract and Load (EL) steps of the [ELT](https://dyvenia.com/resources/data-glossary/#E-glossary) process—remains a persistent challenge for many data teams.

This complexity is often due to the real-world limitations of open-source tools, leading teams to opt for UI-based solutions. While these tools are great for getting started quickly, they often lack the flexibility and scalability required for production-grade data platforms.
In the era of AI, UI-based tools face one more limitation: they miss out on most of the benefits of the advanced code generation capacity of modern LLMs (Large Language Models)[[1]](#footnotes).

Even if teams do decide to use open-source solutions, they often end up creating volumes of low-quality glue code. This in-house software, typically written in a rush by non-professional engineers, often fails to meet essential requirements for modern data platforms, such as EaC (Everything as Code), security, monitoring & alerting, reliability, or extensibility. Moreover, since it’s written by non-professional engineers, such code is far more brittle and much harder to maintain and modify. Consequently, all modifications to the code (such as adding new features or fixing bugs) take much more time and are far riskier than they should be.

**…but there is light at the end of the tunnel**

Luckily, in recent years, with the growing adoption of software engineering practices, we’ve seen a professionalization of the data engineering field. This has resulted in the creation of a number of high-quality, open-source tools that simplify and improve the quality of data engineering work, such as [dlt](https://dlthub.com/) and [Prefect](https://www.prefect.io/).

In this article, we explore how dlt and Prefect can be seamlessly integrated to implement a best-practice data ingestion component of a modern data platform. Our insights are grounded in real-world experience designing and implementing scalable, code-based data platforms with these open-source tools.

## A short introduction to dlt and Prefect

### dlt

[dlt](https://dlthub.com/) is a Python data ingestion framework enabling data engineers to define connectors and pipelines as code. It offers a rich set of features for building best-practice pipelines and supports both built-in and custom connectors built with regular Python code.

dlt ingests data in [three stages](https://dlthub.com/docs/reference/explainers/how-dlt-works): extract, normalize, and load. The **extract** stage downloads source data to disk. The **normalize** stage applies light transformations to the data, such as column renaming or datetime parsing. The **load** stage loads the data into the destination system.

Here’s a compact guide to key dlt concepts:

- **dlt config**: dlt can be configured in three ways: through files (`config.toml and secrets.toml`), environment variables, and Python code.
Using `config.toml` for default settings is recommended, as it’s easy to store the file together with pipeline code on git. While it can contain some pipeline-level settings as well, its main purpose is to configure global behavior such as logging, parallelization, execution settings, and source or destination configuration common to all pipelines.
- **Resource** and **Source**:
A resource is a representation of a single item in a dataset. It can be a file, a database table, a REST API endpoint, etc.
A source is a collection of resources, such as a filesystem (eg. s3), a database, or a REST API.
By applying hints to the resource with `resource.apply_hints()`, we can configure extraction settings specific to the resource, a pipeline, or a pipeline run, such as primary key, cursor column, column typing, partitioning, etc. We can also apply some light transformations to the data (eg. data masking) before it’s loaded to the destination with the `resource.add_map()` method.
dlt is flexible when it comes to working with sources and resources, and it’s easy to use either, depending on the need.
- **Pipeline:** In dlt, pipeline describes the flow of data from a source (or resource) to a destination. Each pipeline handles a single source<->destination pair and takes a source or resource as input.
Pipelines can be reused to ingest different resources each run. For example, we can have one “Postgres to S3” pipeline, but ingest each Postgres table separately due to different scheduling or configuration needs.
A pipeline definition contains pipeline- or pipeline run-specific destination configuration, as well as settings for the load phase of the ingestion. Under the hood, a pipeline run (`pipeline.run()`) executes each pipeline step: extract (`pipeline.extract()`), normalize (`pipeline.normalize()`), and load (`pipeline.load()`).

### Prefect

[Prefect](https://www.prefect.io/) is a Python data orchestration library that allows data and machine learning engineers to define data workflows (data ingestion, transformation, model training, etc.) as code. It provides a rich set of features to help engineers implement best-practice data orchestration workflows.

Its cloud offering eliminates the historically stressful and labor-intensive maintenance of data orchestration systems.

Let’s unpack the core concepts of Prefect:

- **Task:** A task is a single unit of work in a Prefect flow. It describes a single step to be executed in the workflow.
While it’s possible to implement the logic of the step directly in the task, in most cases, we recommend keeping tasks as thin wrappers around regular Python functions.
- **Flow:** A flow is a collection of tasks that define a data workflow. You can think of it as a graph of tasks, describing their relationship (eg. this task should always run after this one, and this other task should run after that one, but only if it fails).
Similar to a dlt pipeline, the same flow can be reused with different sets of parameters. An instance of a flow with specific parameter values is called a [deployment](https://docs.prefect.io/v3/deploy/index).
In this article, we utilize this fact by utilizing a single `extract_and_load()` flow capable of executing any dlt pipeline, depending on the parameters passed to it. As a result, each ingestion becomes a new Prefect deployment rather than a new flow, which has a major consequence: deployments can be defined with YAML, which means that they don’t require any Python code to be written, which means users don’t need to set up a local Python development environment just to eg. ingest a new table with an existing pipeline. Instead, we can, for example, expose a simple application that allows non-technical users to create new deployments with a few clicks.
- **Deployment:** A deployment is a way to run a flow with a specific set of parameters and environment configuration. While most environment configurations in Prefect would typically be defined at the workspace level, deployments allow for overriding some of these settings, including on a per-run basis, which simplifies testing and debugging.

## Creating data connectors and pipelines with dlt

Now that we’ve covered the theoretical underpinnings of dlt and Prefect, it’s time to see these concepts in action. We’ll explore how to implement best-practice dlt pipelines and bring these tools to life.

### Data pipeline features

Alright, before we dive into the technical part, let’s start with the basics. A production-grade data pipeline needs to have several key features:

1. Modularity: The pipeline should be designed to allow the reuse of components across multiple pipelines.
2. Extensibility: The pipeline must be upgradeable without disrupting ongoing production jobs.
3. Reliability: The ability to inspect pipeline execution and quickly identify and resolve issues is crucial.
4. Security: Proper mechanisms must be in place to securely store and access secrets.
5. Privacy: Data storage should adhere to privacy regulations, ensuring compliance.
6. Efficiency: Pipelines must be optimized for cost-effective execution.

Data pipelines aren’t one-size-fits-all, and achieving a production-grade pipeline involves ensuring those key features. But how to get there?

#### Modularity

To achieve modularity, it’s best to split the dlt pipeline code into the following structure:

```bash
├── pipelines
│   ├── a_to_c.py
│   ├── b_to_c.py
│   └── utils.py
```

In this structure, `a_to_c.py` and `b_to_c.py` represent two example pipelines, each handling data from a source system (a and b) to a destination system ©.

The `utils.py` file contains common utilities such as data masking implementation, default configuration for source and destination systems, or default pipeline configuration (except configuration specified in dlt’s `config.toml`; for more information, see the dlt config paragraph in [the dlt section](#dlt)).

#### Extensibility

Implementing extensibility goes beyond modularity. The code should also be testable, and ideally, automated testing should be integrated into the CI/CD process.

Since dlt pipelines are implemented using Python, they can be tested with common tools like `pytest`. Unit tests should focus on custom utility functions, while integration tests verify the entire pipeline’s behavior.

For integration testing, use a local database or disk drive instead of the target database. [DuckDB](https://duckdb.org/) is a great choice for this purpose, as it’s a lightweight, in-memory database that can be used to inspect the loaded data quickly.

#### Reliability

To maintain trust with data platform users, make sure that when production pipelines fail, you are informed immediately and can recover quickly. While we recommend [implementing alerting in the orchestration layer](#alerting), pipeline recoverability depends on having access to detailed logs.

Luckily, dlt provides rich built-in logging and error-handling mechanisms. It’s a good idea to also enable [progress monitoring](https://dlthub.com/docs/general-usage/pipeline#display-the-loading-progress) for additional useful information, such as CPU and memory usage.

#### Security

dlt supports various ways of storing credentials. For local use, secrets can be stored in a .`dlt/secrets.toml` file, while production environments may benefit from an external credential store, such as [Google Cloud Secret Manager](https://cloud.google.com/security/products/secret-manager?hl=en). To accomplish this, you can store the [secret retrieval utility function](https://dlthub.com/docs/walkthroughs/add_credentials#retrieving-credentials-from-google-cloud-secret-manager) in `utils.py` and reuse it within your pipelines.

However, since we’re using Prefect for orchestration, it’s also possible to follow a different path and [use Prefect Secrets to store the credentials](#secret-management).

#### Privacy

Data anonymization and/or pseudonymization are crucial to ensure compliance with privacy regulations. Data can be erased/anonymized either:

1. During the ingestion phase (in which case the original data never enters the destination system)

![](/src/assets/images/data_masking_ingestion_phase.png)

2. During the transformation phase (in which case private data is stored in one or more layers in the destination system but hidden from the eyes of end users)

![](/src/assets/images/data_masking_transformation_phase.png)

While dlt doesn’t provide built-in anonymization features, it provides the necessary tools to implement the first option effectively.

For more information, see the [example](https://dlthub.com/docs/general-usage/customising-pipelines/pseudonymizing_columns) in the official documentation.

#### Efficiency

To ensure pipelines are both cost-effective and high-performing, several optimization techniques can be applied:

- **Incremental extraction**
Loading data incrementally allows for reducing the amount of data that needs to be **extracted**. Currently, dlt supports incremental extraction for its [core sources](https://dlthub.com/docs/dlt-ecosystem/verified-sources/#core-sources): [REST API](https://dlthub.com/docs/general-usage/incremental-loading#incremental-loading-with-a-cursor-field), [SQL database](https://dlthub.com/docs/walkthroughs/sql-incremental-configuration), and [filesystem](https://dlthub.com/docs/dlt-ecosystem/verified-sources/filesystem/basic#5-incremental-loading).
Incremental extraction allows us to download only new or modified data.
- **Write dispositions**
[Write dispositions](https://dlthub.com/docs/general-usage/incremental-loading#choosing-a-write-disposition) work in tandem with the two extraction methods to reduce the amount of data that needs to be **loaded**. For example, if you only extracted new and modified data, you don’t want to overwrite existing data, as that would result in data loss. In such a case, insert the new records and update the existing ones instead.
- [Parallelization
](https://dlthub.com/docs/reference/performance#parallelism)dlt allows parallelizing each stage of the pipeline utilizing multithreading and multiprocessing (depending on the stage).
In cases where further parallelization is needed (i.e., the workload exceeds the capacity of a single machine), utilizing orchestrator-layer parallelization may be required. However, this scenario is now rare, as large virtual machines capable of processing petabytes of data are widely available, and dlt can leverage the machine’s resources more efficiently than older tools or typical in-house Python code.
- [**Various other optimizations**](https://dlthub.com/docs/reference/performance)

As the topic of incremental loading can be complex even for seasoned data engineers, we’ve prepared a diagram of all the viable ELT patterns:

![](/assets/images/elt_patterns.png)

**NOTE:** dlt also provides sub-types of the “merge” disposition, including [SCD type 2](https://dlthub.com/blog/scd2-and-incremental-loading); however, for clarity, we did not include these in the diagram. For more information on these subtypes, see [relevant documentation](https://dlthub.com/docs/general-usage/incremental-loading#merge-incremental-loading).

The choice of a specific implementation depends on what is supported by the source and destination systems as well as on how the source data is generated. Ideally, incremental extract should be used whenever possible. Then, whether you choose the “append” or “merge” write disposition depends on how the data is generated: if you can guarantee that only new records are produced and no existing data is ever modified, you can safely use the “append” disposition. Next, you need to check if the destination system handles the disposition you intend to use (eg. some systems don’t support the “merge” disposition).

The following diagram from [dlt’s official documentation](https://dlthub.com/docs/general-usage/incremental-loading#two-simple-questions-determine-the-write-disposition-you-use) also provides a good overview of when to choose which write disposition:

![](/assets/images/dlt_choosing_write_disposition.png)

## Orchestrating data pipelines with Prefect

Orchestrating data pipelines with Prefect can streamline your workflow and significantly improve efficiency. Let’s dive into the best practices for implementing Prefect flows and how they integrate smoothly with your data pipelines.

### Orchestration job features

Ideally, the orchestration layer is a thin wrapper over the underlying data pipeline logic. Whenever a feature can be implemented at the pipeline level, it should be implemented there in order to prevent excessive coupling with the orchestration layer and minimize complexity, which simplifies self-service data ingestion.

Here are a few key features that are best handled at the orchestration layer:

- alerting
- additional reliability measures
- security (specifically, secret management)
- distributed processing

#### Alerting

With Prefect, you can set up [alerts](https://docs.prefect.io/v3/automate/events/automations-triggers#manage-automations), ensuring you’re notified via Slack, Teams, or email whenever jobs or infrastructure components enter an unexpected state.

#### Reliability

While we can (and, where possible, should) implement retries and [timeouts](https://dlthub.com/docs/general-usage/http/requests#customizing-retry-settings) at the pipeline level, Prefect provides these features at the task and flow level. Think of this as a last-resort, catch-all mechanism that allows data engineers to ensure timeouts and retries are enforced regardless of how well the dlt pipeline or helper code is written, again lowering the bar for self-service data ingestion.

#### Secret management

Security is always a top concern, and Prefect’s secret management integrations make it easier than ever to store and handle secrets. Whether it’s Google Cloud Secret Manager or AWS Secret Manager, Prefect allows you to securely retrieve credentials and pass them to the dlt pipeline. This approach ensures that no credentials are stored locally, and administrators have fine-grained control over access by utilizing Prefect’s Role-Based Access Control (RBAC).

#### Distributed processing

While any code-based orchestration tool allows for distributed processing, this feature is rarely required at the pipeline level in recent times. Firstly, data ingestion tools such as dlt are capable of efficiently utilizing machine resources, including parallelization and efficient and safe use of memory. Secondly, virtual machines have grown bigger—we can now easily rent VMs with hundreds of cores and hundreds of gigabytes of RAM. Therefore, typically, distributed processing is only required in case we need to run multiple resource-hungry pipelines in parallel.

## Production workflow

Now that we’ve outlined the essential features of a production-grade dlt pipeline and Prefect flow, let’s break down the steps of creating and orchestrating data ingestion pipelines in production.

### Overview

The diagram below illustrates the key steps in this production workflow.

![](/assets/images/ingestion_pipeline_workflow_overview.png)

1. **Create a dlt pipeline:** We start by creating a dlt pipeline (if the one we need doesn’t exist yet). Once the pipeline is finished and tests pass, we can move on to the next step.
2. **Create Prefect deployment**: We create a Prefect deployment for the pipeline. Notice we utilize Prefect’s `prefect.yaml` file together with a single `extract_and_load()` flow capable of executing any dlt pipeline to drastically simplify this process.
3. **Create a Pull Request:** We create a pull request with the new deployment. This triggers the CI/CD process.
4. **DEV environment:** The deployment is created in the DEV Prefect workspace, and a DEV Docker image is built. We can now manually run the deployment in Prefect UI, which will execute our pipeline in the DEV environment.
5. **PROD environment:** Once we’re happy with the results, we merge the pull request. This triggers a CI/CD job, which creates the deployment in the PROD Prefect workspace and builds a PROD Docker image. The deployment schedule is also only enabled at this stage.

If the pipeline already exists and only a new table is being ingested, the user needs only add a few lines of `YAML toprefect.yaml` and create a PR.

### Configuring dlt

While dlt is highly configurable and allows for a lot of customization and optimization, we recommend starting with three highly useful configurations:

- `runtime.log_level` to enable more logging
- `normalize.parquet_normalizer.add_dlt_load_id` to add a dlt load ID to the loaded data
- `normalize.parquet_normalizer.add_dlt_id` to add a unique id to each row.

The ID settings will make our data easier to work with for downstream users, as well as make our loads (especially incremental ones) easier to debug.

### Creating a dlt pipeline

#### Pipeline design

We start by creating a dlt pipeline, following the best practices detailed in the [Creating data connectors and pipelines with dlt](#creating-data-connectors-and-pipelines-with-dlt) section above.

For testability and modularity, we recommend splitting the pipeline into a resource (source data) and pipeline (journey and destination) parts. This way, you can easily test each part separately.

#### Inspecting the data manually

At any stage of pipeline development, you can manually inspect the loaded data, e.g., by printing it to the console or by checking the database directly.

#### Testing the pipeline

For integration testing, you can use DuckDB as a destination system. It’s lightweight and allows you to quickly check ingested data, so you can iterate faster.

### Creating a Prefect flow and deployment

#### Flow design

After the dlt pipeline is working, it’s time to wrap it in a Prefect task and flow. Keep the orchestration layer simple—use a single `extract_and_load()` flow for all data ingestion tasks. With Prefect deployments handling the pipeline name and arguments, you can set everything up with just a few lines of YAML.

#### Handling pipeline secrets

Secrets should be passed through a special dictionary parameter, such as secrets. These secrets should then extracted from Prefect blocks and forwarded to the dlt pipeline, ensuring they are securely handled.

### Deploying to production

A pull request with the new deployment should automatically trigger the CI/CD process in our project repository’s CI/CD pipelines. We will soon dive deeper into how to implement this process using GitHub Actions in a separate article, so stay tuned!

## Summary

Building a modern, scalable data platform starts with mastering data ingestion, which requires tools that are as powerful as they are flexible. By combining dlt for efficient, open-source data pipelines with Prefect for orchestration, you can create workflows that are not only production-ready but also streamlined for both developers and data teams.

This approach ensures flexibility, scalability, and cost-effectiveness, making it ideal for modern data platforms while also strategically positioning your platform to excel in the upcoming AI age.

## Next steps

### Data transformation

dlt and Prefect (with the help of [dbt](https://www.getdbt.com/)) are just as good at data transformation as they are at data ingestion. Stay tuned as we explore how to integrate these tools for data transformation in a future article!

### Ready to dive deeper?

If you’re ready to build a cutting-edge data platform with dlt and Prefect, [get in touch](https://meetings-eu1.hubspot.com/alessio-civitillo/the-scalable-way?uuid=c632809d-d480-4e70-97d3-e9705516be86). We offer expert guidance to help you set up every component and provide a fully equipped template Git repository with production-grade code. No fluff—just practical, scalable solutions designed to handle real-world challenges and set your data workflows up for long-term success.

## Footnotes

[1] While more and more UI-based tools add copilot capabilities, they face several fundamental limitations:

- Copilots, while text-based, are limited by the UI tools they are built upon.

Imagine instructing someone to build a complex LEGO castle with only a basic set of blocks. No matter how clearly you explain, the result will always be limited, forcing you to find workarounds.

- These UI tools often use a custom language to define data pipelines, which adds another layer of complexity.

As the quality of LLMs is highly reliant on the size and quality of the dataset they’re learning from, it means these assistants cannot reach the same level of fluency as LLMs trained on much more popular languages, such as Python.

Imagine the person you’re instructing to build your LEGO castle has very little experience with LEGO or construction in general. They would struggle to understand basic jargon and construction trade practices, and they would often make mistakes requiring your intervention.
