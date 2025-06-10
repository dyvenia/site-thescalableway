---
title: 'Getting to Your First Flow Run: Prefect Worker & Deployment Setup'
date: 2025-06-10 11:00:00
author: Karol Wolski
description: Run your first data ingestion workflow with Prefect, Docker, and Kubernetes. This guide walks through containerized flow execution, Prefect worker deployment, and clean deployment configs, laying the foundation for a scalable, maintainable orchestration layer.
tags:
  - prefect
  - data platform architecture
  - workflow orchestration
  - Kubernetes
internal_notes: |-
  **Audience:** Data Engineer / DevOps Engineer trying to set up a data platform

  **Purpose:** (Internal usage only):

  How-to document that explains all necessary steps to prepare the basic configuration for Prefect worker to run the first deployment
---
You’ve laid the groundwork: the infrastructure is in place. The next logical step is turning that foundation into something functional, running your first data ingestion workflow. That moment when everything connects for the first time can feel like crossing an invisible line: from setup to real-world execution.
This article picks up where we left off. It’s the third part in a series designed to guide data engineers through the complete journey of building a modern data platform. 

In [Part 1](https://thescalableway.com/blog/deploying-prefect-on-any-cloud-using-a-single-virtual-machine/), I explored architectural approaches and proposed a lightweight Kubernetes setup running on a single VM. While it doesn’t offer full high availability, this setup has proven to be a practical starting point, especially for teams with limited cloud-native experience. It allows organizations to grow along the data maturity curve without the overhead of more complex solutions.

[Part 2](https://thescalableway.com/blog/how-to-setup-data-platform-infrastructure-on-google-cloud-platform-with-terraform/) focused on provisioning the infrastructure using Terraform on Google Cloud Platform (GCP). We used GCP as an example, but the underlying architectural principles are cloud-agnostic and applicable across providers.

Now that the infrastructure is ready, this article walks through the next milestone: configuring all the components required to execute your first data ingestion workflow.

## Data Platform Components Overview

Here’s a high-level overview of a generic data platform architecture (as discussed in previous articles).

![data platform architecture](/src/assets/images/blog/data_platform_architecture.png)

While this article won’t cover the data warehouse or data lake, we will zoom in on the other key components that power workflow orchestration:

- **GitHub** as the version control system
- **Prefect Cloud** as the orchestration environment
- **Prefect worker** as the workflow orchestration system

To prepare these, we’ll walk through these essential elements that serve as the backbone of a modern data platform:

- **Docker Image for Flows Execution**

Every Prefect flow needs a controlled and consistent environment to run. Using a Docker container is an ideal solution for this purpose, as it provides isolation and ensures that all dependencies and runtime configurations are reproducible. Containerization is a standard practice in modern data platforms to guarantee reliable flow execution across different environments.

- **Prefect Worker**

Prefect Cloud handles all deployment schedules, but a process within our infrastructure is required to pull and execute these scheduled tasks. This is the responsibility of the Prefect worker. Before diving into more advanced topics, it’s important to understand how to configure and manage the Prefect worker. Later, I will explain further how to set up a base job template that will be used to execute all deployments, ensuring consistent and scalable workflow orchestration.

- **Prefect Configuration Files**

A well-structured repository is essential for managing deployments and flows efficiently. Ideally, adding a new deployment should require only a few lines of code, making it easy for any team member to contribute. The `prefect.yaml` file plays a key role in this process by organizing and codifying deployment configurations, clearly connecting flows, deployments, and infrastructure in a maintainable way.

By focusing on containerized execution, robust workflow orchestration, and clear configuration management, we lay the groundwork for a scalable and maintainable data platform that ensures reliable data ingestion and processing.

## Docker Image for Flows Execution

Having each Prefect flow executed in its own isolated environment is essential. Without isolation, two flows running side-by-side could conflict—think mismatched library versions, breaking changes, or dependency clashes. Suddenly, what worked yesterday doesn’t work today. Containerization solves this problem elegantly.

Building a dedicated Docker image ensures that flow runs are reproducible and decoupled from the host system. You can test new dependencies in dev, tag the image, and confidently promote it to prod. No more “it worked on my machine” surprises.

For most data teams, starting with the official Prefect image is the way to go. It includes all the Prefect orchestration tools out of the box, so you don’t have to reinvent the wheel. Manage dependencies via `uv` and a `pyproject.toml`: 

```TOML
dependencies = [
    "prefect[docker,github,gcp]>=3.3.7",
    "dlt[mssql,parquet]>=1.8.1",
    "pymssql>=2.3.2",
]
```

Once dependencies are set, run `uv sync`. This generates a `uv.lock` file, locking all versions for reproducibility. This file, along with your `pyproject.toml`, is all you need for the build process.

The Dockerfile itself is rather straightforward, assuming we need to prepare the `uv` to install system dependencies to be used inside the container without an additional virtual environment:

```Docker
FROM prefecthq/prefect:3.3.7-python3.12

RUN pip install uv --no-cache

COPY pyproject.toml uv.lock README.md ./

RUN uv export --frozen --no-dev --no-editable > requirements.txt

RUN uv pip install --no-cache --system --pre -r requirements.txt
```

Notice we don’t copy the entire repo, only dependency files. The flow code lives outside the image, so we only rebuild the image when dependencies change. To push the image to the GitHub Container Registry, you can use:

```bash
docker build -t ghcr.io/<your_github_organisation>/edp-flows:<tag> .

docker push ghcr.io/<your_github_organisation>/edp-flows:<tag>
```

This is a manual step for now, but don’t worry—we’ll automate it with GitHub Actions soon. For now, you’ve got a solid, reliable foundation for running flows in a clean, isolated environment every single time.

## Prefect Worker

Once the Docker image is ready, the next step is orchestrating flows execution. That’s where the Prefect worker comes in. Workers are long-running processes that poll work pools for scheduled flow runs and execute them. If you want to dive deeper into the range of possibilities, [Prefect’s documentation](https://docs.prefect.io/v3/deploy/infrastructure-concepts/workers) is a great resource.

For our setup, we’ll use the Kubernetes worker type and deploy it with the official [Prefect Helm Chart](https://github.com/PrefectHQ/prefect-helm/tree/main/charts/prefect-worker).

### How Prefect Executes Flow Runs

Prefect workers are responsible for:

- **Polling work pools** for scheduled flow runs
- **Spinning up job-specific infrastructure** using base templates
- **Enabling environment-specific configurations** via Helm charts
- **Supporting zero-downtime updates** when modifying worker settings

This dynamic approach means you can flexibly scale, update, and manage your workflow execution environments.

### Prefect Worker Configuration

Here’s a minimal `values.yaml` example, sufficient to get a Prefect worker running via Helm:

```YAML
worker:
  image:
    repository: prefecthq/prefect
    prefectTag: 3.3.7-python3.12-kubernetes
    pullPolicy: IfNotPresent

  config:
    workPool: "edp-work-pool"
    workQueues: ["default"]
    name: "edp-worker"
    baseJobTemplate:
      configuration: << BASE JOB TEMPLATE WILL BE PROVIDED IN THE NEXT SECTION >>

  cloudApiConfig:
    accountId: "7e3c367b-143a-86e2-b92f-6i414816c39b"
    workspaceId: "c506815f-qe83-42dc-b905-re6bcfb68c52"
    apiKeySecret:
      name: prefect-api-key-secret
      key: PREFECT_API_KEY
```

**Each of the three key sections plays a vital role:&#32;&#32;**

- **Image:** Specifies the Prefect image used to run the worker. This is not the flow's image that runs your business logic; that will be defined in the `baseJobTemplate`.
- **Config:** Defines work pool, queues, worker name, and most importantly, the `baseJobTemplate`. An example of a working base job template is shown in the next section.
- **cloudApiConfig:** Provides the cloud workspace details, such as account and workspace IDs. You’ll also need to configure a service account in Prefect Cloud and store its API token as a Kubernetes secret (`prefect-api-key-secret` with the key `PREFECT_API_KEY`).

### Example Base Job Template

In a Kubernetes environment, the base job template defines how Prefect spins up infrastructure for each flow run. The minimal job template for a single-pod job below will allow you to set:

- The job name (helpful for distinguishing jobs and pods in Kubernetes)
- The image tag used in the pod
- The namespace for job creation
- Other Kubernetes settings include image pull secrets, retry limits, and job cleanup.

```JSON
{
  "variables": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "title": "Name given to job created by a worker (key: name)",
        "default": "edp-k8s-job"
      },
      "image": {
        "type": "string",
        "title": "Image name and tag that will execute flows, to be provided from deployment (key: image)",
        "default": "ghcr.io/<your_github_organisation>/edp-flows:<tag>"
      },
      "namespace": {
        "type": "string",
        "title": "Namespace name where jobs will be scheduled (key: namespace)",
        "default": "prefect"
      }
    }
  },
  "job_configuration": {
    "env": {},
    "name": "{{ name }}",
    "labels": {},
    "command": "",
    "namespace": "{{ namespace }}",
    "job_manifest": {
      "kind": "Job",
      "spec": {
        "template": {
          "spec": {
            "volumes": [],
            "containers": [
              {
                "env": [],
                "name": "prefect-job",
                "image": "{{ image }}",
                "imagePullPolicy": "Always",
                "envFrom": [],
                "volumeMounts": []
              }
            ],
            "completions": 1,
            "parallelism": 1,
            "tolerations": [],
            "restartPolicy": "Never",
            "imagePullSecrets": [
              {
                "name": "reg-creds"
              }
            ]
          }
        },
        "backoffLimit": 0,
        "ttlSecondsAfterFinished": 7200
      },
      "metadata": {
        "namespace": "{{ namespace }}"
      },
      "apiVersion": "batch/v1"
    },
    "stream_output": true
  }
}
```

You can customize this further as needed, and include the template in your Prefect worker configuration. Once deployed, your worker should appear in the Work Pool section in Prefect Cloud. 

![prefect work pool](https://lh7-rt.googleusercontent.com/docsz/AD_4nXdNG7lL33CZfcuZrl8NH6szeJAjeH7VqQ0MT64dwn0isKBBcSgQLTH9wtSPiYW1YnShPgXFYrknsDZ0yxdeUx-n3GlTax38R2zAzveuBzC2TOLdpe_EtaKwAr4YUbC0XXOqdsvmaQ?key=ayESoQytAoVyFyBIrtLBvJIi)

The `baseJobTemplate` is also exposed as a config map in your Kubernetes cluster. To follow best practices, manage all worker configuration changes as infrastructure-as-code. Use GitHub workflows to apply updates automatically, reducing the risk of human error from manual changes in Prefect Cloud.

For more security, assign the service account used to register the worker the “Developer” role, and limit regular developers to read-only access within the Work Pool. These permission settings can be configured in your Prefect Cloud account settings:  

![prefect cloud workers permission](https://lh7-rt.googleusercontent.com/docsz/AD_4nXecRO67bMhQLrHQZ7j2f22Lkd61YBJvd_BlqcguLkRBb086YCCxZVlRi7UyCAD9R5i6w7nOfPhpb3eOgxdiAlaSFJODWbWEVXSMmm6UITpS_946XGhQK-lFcfvnVmROKdjLm4nl?key=ayESoQytAoVyFyBIrtLBvJIi)

Once your Prefect worker is up and running, you’re ready to register your first deployment.

## Prefect Configuration Files

The `prefect.yaml` file describes base settings for all deployments, with additional instructions for preparing the execution environment for a deployment run. It can be initialized with the `prefect init` command, and after filling in the data, you might end up with a file like this:

```YAML
name: prefect-deployments
prefect-version: 3.3.7

definitions:
  schedules:
    cron\_default: &cron\_default
      cron: "0 0 \* \* \*"
      timezone: "UTC"
      active: false

build: null
push: null

pull:
  - prefect.deployments.steps.set\_working\_directory:
      directory: /opt/prefect
  - prefect.deployments.steps.git\_clone:
      repository: https://github.com/<your\_github\_organisation>/edp-flows.git
      access\_token: "{{ prefect.blocks.github-credentials.edp-github-credentials.token }}"
  - prefect.deployments.steps.run\_shell\_script:
      directory: "/opt/prefect/edp-flows"
      script: |
        uv pip install --no-cache --system .

deployments:
  - name: hello\_world
    description: "Test hello-world deployment."
    schedules:
      - <<: \*cron\_default
        cron: "5 0 \* \* \*"
    entrypoint: src/edp\_flows/flows/hello\_world.py:hello\_world\_flow
    parameters:
      text: "Hello, world!"
```

**The most notable sections are:**

- **Definitions:** Shared properties such as schedules.
- **build/push:** Relevant only if you need to build a fresh image with each deployment; not applicable in our case (Docker images are maintained separately from prefect.yaml.)
- **Pull:** Clones the repository to ensure each deployment uses the latest code. During development, it can be configured to target specific branches. Finally, it installs all Python modules so they're available during execution.
- **Deployments**: A structured list of deployments, each with customizable parameters, allowing the same flow to be reused across multiple scenarios.

### Example Prefect Flow

As Prefect flows aren't covered in detail here, we’ll use a simple "Hello, World!" example for illustration. In your actual use case, this is where you would implement the logic for your first ingestion workflow, tailored to your specific data source and target (such as a data warehouse or lake). Here is `hello_world.py`:

```Python
"""A flow to demonstrate how to log messages in Prefect flows."""

from prefect import flow, get_run_logger, task

@task(log_prints=True)
def print_log_prints(text: str) -> None:
    """Attempt to print text, world using regular Python print() function.

    This time, use the `log_prints` task parameter.
    """
    print(f"log_prints=True: {text}")  # noqa: T201

@task
def log_prefect_run_logger(text: str) -> None:
    """Attempt to log text, world using Prefect's runtime logger."""
    logger = get_run_logger()
    logger.info(f"Prefect runtime logger: {text}")


@flow
def hello_world_flow(text: str) -> None:
    """Demonstrate how to log messages in Prefect flows."""
    print_log_prints(text)
    log_prefect_run_logger(text)
```

Register the flow with:

```bash
prefect --no-prompt deploy \
        --name "$deployment_name" \
        --tag $tag \
        --pool $work_pool \
        --job-variable name=$deployment_name
```

The registered deployment includes a schedule, but it’s disabled by default. To enable it, either do so manually in Prefect Cloud or use the following commands:

```bash
prefect deployment schedule ls <flow_name>/<deployment_name>
prefect deployment schedule resume <flow_name>/<deployment_name>
```

After running the first command, you should see a view like this:

![prefect deployment schedule](https://lh7-rt.googleusercontent.com/docsz/AD_4nXeeaNEb_VRLwG8H4RPJzeIzEPJs_EoOn2OGtbFhtpNRZOZ2RFbxa8FlrlY4S8hZjX2kZYqa8-JiMhMq5flCGBsQ-_TUkyeUg3jL_S6guRAfVhqW1IRUvPjQuRGunbp4sZO_9VZcjw?key=ayESoQytAoVyFyBIrtLBvJIi)

After enabling the schedule, it should appear as Active, and the Prefect worker will trigger it every day at noon. To test a new deployment, you can manually trigger it from Prefect Cloud. Once your deployment runs successfully, you will see logs from it like the following:

![deployment run prefect](https://lh7-rt.googleusercontent.com/docsz/AD_4nXebvLJttt8mjH98_GBTkgaw5hYQDG72djQtvSfh7ueM3soiIVXsF6rWmZcUfw2-XgVCXWs6wBZW0rxpbPsxw3-TN_OQyAMYnk6hW_WIL2jHMu-ih-XZ3FYGCUZyyoGi75y0NnsM?key=ayESoQytAoVyFyBIrtLBvJIi)

## Conclusion

With this setup, you now have everything in place to execute your first data ingestion flow. You’ve:

- Built a containerized flow execution environment
- Deployed a scalable Prefect worker
- Defined clean, reusable deployment configurations.

This architecture gives you flexibility and control across environments and sets the stage for more advanced workflows. 

While the example used here is a simple “Hello World!” flow, the same deployment structure can be applied to your real data ingestion workflows. To run your first actual ingestion pipeline, all you need to do is replace the flow logic with code that connects to your data source and writes to your destination (like a data warehouse or lake). The orchestration, environment, and deployment pieces remain the same.

#### What’s next?

In the next article, I’ll show you how to automate this entire process using GitHub Actions, turning this manual setup into a streamlined CI/CD pipeline your whole team can rely on.
