---
title: 'CI/CD for Data Workflows: Automating Prefect Deployments with GitHub Actions'
date: 2025-07-03 11:00:00
author: Karol Wolski
description: The final part of the Data Platform Infrastructure on GCP series covers CI/CD for Prefect deployments using GitHub Actions and Docker. Automate flow builds, worker updates, and streamline orchestration across environments.
tags:
  - prefect
  - prefect worker
  - github actions
  - CI/CD
  - data workflows
  - data platform architecture
internal_notes: |-
  **Audience:** Data Engineer / DevOps Engineer trying to setup data platform

  **Purpose:** (Internal usage only):

  How-to document that explains all necessary steps to prepare basic CI/CD workflow for deploying prefect worker and deployments.

  **Outline:&#160;**

  1. **Introduction & series recap**

  - Brief summary of Part 1 (Prefect architecture decisions) and Part 2 (GCP infrastructure with Terraform) and Part 3 (First flow run)
  - Now that we have first flow up and running, let's prepare automation around it.

  **2. CI/CD Foundations for Data Platforms**

  - **Why CI/CD matters for data workflows**
  - **Unique challenges in data pipeline CI/CD vs traditional software**

  **3. GitHub CI/CD Workflows for a Data Platform**

  - **Repository structure**
  - **Workflows overview**
      - **Workflow 1: Flows Docker Image Builder**
  - **Workflow 2: Prefect Worker Updates**
  - **Workflow 3: Prefect Deployment Orchestration**

  **6. Conclusion & series summary**
---
You’ve built a Prefect flow that runs, but wondering what’s next? 

If deploying it means copying files, running CLI commands, or manually registering deployments, you’re doing too much. In this guide, we’ll walk through how to automate Prefect deployments using GitHub Actions and Docker, so your flows move from dev to prod with zero manual steps. Cleaner workflows, fewer errors, and no more “did I forget to deploy that?" moments. 

Welcome to Part 4 of our data platform series, where we bring automation and resilience to the forefront by introducing CI/CD for your data workflows. If you’ve followed along, you’ve seen how each layer builds on the last: from architecture through infrastructure to operational readiness. But just to be sure we’re on the same page…

## Let’s recap…

In **Part 1** ([Deploying Prefect on any Cloud Using a Single Virtual Machine](https://thescalableway.com/blog/deploying-prefect-on-any-cloud-using-a-single-virtual-machine/)), we explored the architectural foundations of a modern data platform. We discussed why simplicity, flexibility, and scalability matter, and how a lightweight Kubernetes setup on a single VM can deliver immediate value while laying the groundwork for future growth. 

**Part 2** ([How to Setup Data Platform Infrastructure on Google Cloud Platform with Terraform](https://thescalableway.com/blog/how-to-setup-data-platform-infrastructure-on-google-cloud-platform-with-terraform/)) moved us from theory to practice, automating cloud infrastructure using Terraform. It emphasized cloud-agnostic design while preserving the architectural principles from the first article. 

We operationalized the platform in **Part 3** ([Getting to Your First Flow Run: Prefect Worker and Deployment Setup](https://thescalableway.com/blog/getting-to-your-first-flow-run-prefect-worker-and-deployment-setup/)). You learned how to build a containerized execution environment, configure Prefect workers, and organize deployment code, culminating in your first successful data ingestion flow.

Now, in **Part 4**, we turn our attention to automation. You’ll learn how to implement a robust CI/CD pipeline using GitHub Actions, tailored for data platforms. We'll break down three essential types of workflows (covering container management, infrastructure updates, and workflow orchestration) that form a scalable, resilient, and low-maintenance deployment system together.

Whether your goal is to reduce manual intervention, boost reliability, or accelerate delivery, this final part will equip you with patterns and real-world guidance to make your data platform production-ready. Let’s delve in!

## CI/CD Foundations for Data Platforms

### Why is CI/CD so important?

CI/CD (Continuous Integration and Continuous Deployment) is key to building reliable, scalable, and collaborative data platforms. Manual processes, such as registering deployments by hand or managing configurations outside of version control, can easily slow things down and lead to mistakes. Here’s how automation makes a big difference in modern data workflows:

- **Manual deployment steps are easy to mess up.**

When people manually update deployments or configurations, there’s a higher chance of errors, inconsistencies, or missed steps. Automation ensures each deployment follows the same steps every time, cutting down on mistakes and keeping things running smoothly.

- **Without a shared codebase, it's hard to stay aligned.**

If local development isn’t tied closely to a shared, version-controlled code repository, keeping track of changes, rolling back mistakes, or working well as a team is tough. CI/CD pipelines enforce the use of a central repository, making the entire platform transparent and auditable.

- **Testing only locally hides problems.**

Without automated workflows to provision and test in staging or development environments, teams often default to running tests locally. This limits visibility into how changes will behave in real-world conditions and increases the risk of production issues.

- **Manual processes don’t scale well.**

As your data platform and team grow, manual processes quickly become bottlenecks. Automated CI/CD pipelines make it easier to bring on new team members, keep deployments consistent, and move faster, without losing quality or stability.

Setting up a strong CI/CD foundation creates a more stable, transparent, and scalable environment. It lets your data engineers spend more time delivering value and less time fixing avoidable problems.

### What makes data pipeline CI/CD different from traditional software?

CI/CD for data platforms comes with its own set of challenges, especially compared to traditional software development. This is mainly because tools like Prefect act as orchestrators, running workflows inside separate, containerized environments. This setup introduces a few extra layers to manage:

1. **Different Workflows for Different Parts**

- **Docker Image Pipeline:** Dedicated workflow for building, testing, and deploying container images, including all the flow dependencies.
- **Prefect Worker Management:** The only long-living process requiring separate CI/CD for updates of the application itself and the base job template used in flow runs.
- **Deployment Configuration:** Independent workflow for managing Prefect deployment definitions and versioning.

2. **More Moving Parts to Coordinate**

- Each part of the system might have its own release schedule, so updates must be carefully timed to avoid breaking things.
- The container environments used for development, testing, and production must match, or you risk inconsistencies and surprises.

Unlike in traditional software, where a single build moves through environments, data platforms rely on multiple components that each need to be managed separately. Because of this, automation has to be thoughtfully designed to keep everything in sync. Done right, it helps teams move faster without sacrificing reliability.

## GitHub CI/CD Workflows for a Data Platform

### Repository structure

Before diving into the workflows, here’s a quick look at the repository structure established so far. While this isn’t the complete repository, the following directories and files are the main ones that trigger CI/CD processes:

```bash
📦 repository
 ┣ 📂 .github
 ┃ ┣ 📂 workflows
 ┃ ┃ ┣ 📜 workflow-x.yml
 ┃ ┃ ┣ 📜 template-x.yml
 ┣ 📂 etc
 ┃ ┣ 📂 docker
 ┃ ┃ ┣ 📜 Dockerfile
 ┃ ┣ 📂 helm_values
 ┃ ┣ ┣ 📂 prefect-worker
 ┃ ┃ ┃ ┣ 📜 values-dev.yaml
 ┃ ┃ ┃ ┣ 📜 values-prod.yaml
 ┣ 📂 src
 ┃ ┣ 📂 edp_flows
 ┃ ┣ ┣ 📂 flows
 ┃ ┃ ┃ ┣ 📜 flow-x.yml
 ┣ 📜 pyproject.toml
 ┗ 📜 prefect.yml
```

### CI/CD Workflows overview

With the structure in place, let’s walk through the **three main workflows** that drive CI/CD for this data platform. This setup is designed to be portable and not tied specifically to GitHub Actions, and its goal is to automate flow deployment with Prefect, avoid unnecessary Docker builds, and use Prefect’s GitHub Repository Block to manage flows cleanly. The three key workflows are:

- **Flows Image Workflow:** Triggered when updates to flow image dependencies are needed.
- **Prefect Worker Workflow:** Runs when changes are made to the base job template or worker configuration.
- **Prefect Deployments CI/CD:**  Used for developing and managing new deployments and flows; this is the main workflow during development.

Let’s take a closer look at all of them.

#### Workflow 1: Flows Image Builder

![flows image builder](/src/assets/images/blog/flows_image_workflow-1.png)

This workflow is triggered by changes to any of the following files:

- `etc/docker/Dockerfile`
- `pyproject.toml`

##### Pull request steps

1. **Check version increase:** Validates that the version number was bumped correctly (e.g., 1.2.3 → 1.2.4, 1.3.0, or 2.0.0). To calculate acceptable versions after an increase, there is the `christian-draeger/increment-semantic-version@1.2.3` action for GitHub that can calculate the next patch, minor, and major version, which can later be compared with the actual version that was manually increased by the developer.
2. **Build DEV Image:** Builds a unique, versioned DEV image for the edp-flows. It can be tagged using the pattern:

`${VERSION}-pr-${{ '{{' }} github.event.number {{ '}}' }}-run-${{ '{{' }} github.run_number {{ '}}' }}`

The image is then pushed to the GitHub Container Registry. In the [previous blog post](https://thescalableway.com/blog/getting-to-your-first-flow-run-prefect-worker-and-deployment-setup/), we prepared an example Dockerfile. Here's what a GitHub workflow to handle it might look like:

```yaml
jobs:
  build-and-push:
    name: Build and push docker image
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Create a multi-platform builder
        run: |
          docker buildx create --name builder --driver docker-container --use
          docker buildx inspect --bootstrap

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ inputs.registry }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: "Build and Push Docker Image"
        uses: docker/build-push-action@v6
        with:
          context: ./
          file: ${{ inputs.dockerfile }}
          platforms: ${{ inputs.platforms }}
          push: ${{ inputs.push }}
          tags: ${{ inputs.registry }}/${{ inputs.organization}}/${{ inputs.image_name }}:${{ inputs.image_tag }}

      - name: Cleanup the builder
        run: docker buildx rm builder
```

3. **Update DEV Prefect work pool:** Updates the base job template on the DEV environment to reference the newly built Docker image. During this step, it is essential to update the image inside the `baseJobTemplate` definition to the newly created one, which can be handled even with a simple replacement:

```yaml
jobs:
  prefect-worker-helm:
    name: Prepare prefect worker
    runs-on: ${{ inputs.runs_on }}
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Add necessary dependencies
        run: |
          helm repo add prefect https://prefecthq.github.io/prefect-helm
          helm repo update prefect

      - name: Create prefect namespace
        run: |
          cat <<EOF | kubectl apply -f -
          apiVersion: v1
          kind: Namespace
          metadata:
            name: ${{ inputs.namespace }}
          EOF

      - name: Replace default flow image
        run: |
          sed -i "s|DEFAULT_FLOW_IMAGE|${{ inputs.default_flow_image }}|g" ${{ inputs.helm_values_path }}

      - name: Run Helm upgrade commands
        run: |
          helm upgrade prefect-worker --install prefect/prefect-worker \
            -n ${{ inputs.namespace }} \
            --version ${{ inputs.prefect_chart_version }} \
            -f ${{ inputs.helm_values_path }}
```

Just like with creating a namespace, any missing resources can also be created. Usually, this includes a secret with the `PREFECT_API_KEY` and `registry credentials` secret for downloading private flow images, but additional secrets or configurations may also be needed.

##### After PR Marge

1. **Tag and Release:** A new GitHub tag and release are created for the updated version. Many ready-made actions are available online. For example, we can define a job like this:

```yaml
jobs:
  prepare:
    if: ${{ github.event.pull_request.merged }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Get version from pyproject.toml
        id: get-version
        run: echo "version=$(grep -Po '(?<=^version = ")[^"]*' pyproject.toml)" | tee -a $GITHUB_OUTPUT

    outputs:
      VERSION: ${{ steps.get-version.outputs.version }}

  tag-and-release:
    if: ${{ github.event.pull_request.merged }}
    needs: [prepare]
    name: Tag and release new version (if applicable)
    runs-on: ubuntu-latest
    permissions:
      contents: write
    outputs:
      TAG_CREATED: ${{ steps.check-tag.outputs.exists != 'true' }}

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check if a tag for this version already exists in the repo
        uses: mukunku/tag-exists-action@v1.6.0
        id: check-tag
        with:
          tag: v${{ needs.prepare.outputs.VERSION }}

      - uses: fregante/setup-git-user@v2
        if: steps.check-tag.outputs.exists != 'true'

      - name: Publish the new tag
        if: steps.check-tag.outputs.exists != 'true'
        run: |
          git tag -a v${{ needs.prepare.outputs.VERSION }} -m "Release v${{ needs.prepare.outputs.VERSION }}"
          git push origin v${{ needs.prepare.outputs.VERSION }}

      - name: Create a release
        if: steps.check-tag.outputs.exists != 'true'
        uses: ncipollo/release-action@v1
        with:
          generateReleaseNotes: true
          tag: v${{ needs.prepare.outputs.VERSION }}
```

We can utilize an additional `prepare` job that will pre-define values used later in our workflow, simplifying its logic.

1. **Build PROD Image:** Builds PROD image for the edp-flows, tagging it with `${VERSION}` and pushing it to the GitHub container registry. The same template used for building the DEV image can be reused, but only the image tag can be changed.
2. **Update DEV Prefect work pool:** Updates the base job template in the DEV environment to use the new Docker image.
3. **Update PROD Prefect work pool:** Updates the base job template in the PROD environment to use the new Docker image.

#### Workflow 2: Prefect Worker Updates

![prefect worker updates](/src/assets/images/blog/prefect_worker_workflow-1.png)

This workflow is triggered by changes to any of the following files:

- `etc/helm_values/prefect-worker/values-dev.yaml`
- `etc/helm_values/prefect-worker/values-prod.yaml`

##### Pull Request Steps

1. **Binary packages check/install**: Installs any required binaries (like K3s and Helm) on the DEV virtual machine.
2. **Update DEV Prefect work pool:** Updates the Prefect worker's base job template on DEV environment to apply any required configuration changes.

##### After PR Merge

1. **Binary packages check/install**: During the first execution, the necessary binaries (K3s and Helm) are installed on the PROD virtual machine.
2. **Update DEV Prefect work pool:** Updates the Prefect worker's base job template on DEV environment to apply any required configuration changes.
3. **Update PROD Prefect work pool:** Updates the Prefect worker's base job template on PROD environment to apply any required configuration changes.

**_Note:_**_&#32;These first two workflows affect infrastructure only; they don’t touch actual Prefect deployments. The next workflow handles that._

#### Workflow 3: Prefect Deployment Orchestration

![prefect deployment orchestration](/src/assets/images/blog/data_ingestion_pipeline_workflow-1.png)

Triggered by changes to `prefect.yaml` or any source code within src directory.

##### Pull Request Steps

**1. Identify Modified Deployments:** In a simplified version, we can register all existing deployments. It can be handled with a helper script with such logic:

```yaml
jobs:
  apply-deployments:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: actions/setup-python@v5
        with:
          python-version-file: ".python-version"

      - name: Install dependencies
        run: pip install -q PyYAML prefect

      - name: Get all deployments from prefect.yaml
        if: ${{ inputs.deployments == 'all' }}
        run: echo "DEPLOYMENT_NAMES=$(cat prefect.yaml | yq '.deployments[].name' | paste -sd ",")" | tee -a $GITHUB_ENV
```

As a target solution, we want a script that detects changes to deployments in the `prefect.yaml` by comparing the main branch with the pull request branch. This way, `DEPLOYMENT_NAMES` will include only the modified deployments. The script can also detect removed deployments, helping with housekeeping in Prefect Cloud.

**2. Apply to DEV:** Applies the modified deployments to the DEV Prefect workspace, referencing the pull request branch. Assuming that we have only modified deployments provided in `DEPLOYMENT_NAMES`, the registration script can look like this:

```yaml
      - name: Set branch '${GITHUB_HEAD_REF}' in prefect.yaml
        run: |
          yq -i '.pull[] |= (select(has("prefect.deployments.steps.git_clone")) 
            | .["prefect.deployments.steps.git_clone"].branch = "${GITHUB_HEAD_REF}" | .) // .' prefect.yaml

      - name: Register all deployments
        run: |
              for deployment_name in $(echo ${{ env.DEPLOYMENT_NAMES }} | tr ',' '\n'); do

        prefect --no-prompt deploy \
            -n "$deployment_name"
            --tag ${GITHUB_HEAD_REF}
    done
```

Deployments are created with scheduling disabled to allow manual testing in the DEV environment. The preparation step sets `GITHUB_HEAD_REF` as a branch reference for the `git_clone` step at runtime.

**3. Testing & Merge:** Modified deployments and flows are tested. As there is no schedule enabled on the deployment on DEV workspace, it needs to be triggered and tested manually. Upon approval, changes are merged into the main branch.

##### After PR Merge

**1. Identify Modified Deployments:** Detects all updated deployments in the prefect.yaml, just like in step 1.

**2. Apply to PROD:** Apply the deployments to the PROD Prefect workspace, using the main branch. Scheduling is enabled with this command:

```bash
get_flow_name_for_deployment_from_prefect_yaml() {
    # Fetch flow name for a deployment from prefect.yaml.

    deployment_name=$1

    echo "Retrieving flow name for deployment '$deployment_name'..." >&2

    deployment_entrypoint=$(cat prefect.yaml | yq '.deployments[] | select(.name == "'$deployment_name'") | .entrypoint')
    flow_name=$(echo $deployment_entrypoint | cut -d':' -f2)
    flow_name_kebab_case=$(echo $flow_name | sed 's/_/-/g')

    # Return the flow name converted to kebab case, as this is what prefect CLI commands expect.
    echo $flow_name_kebab_case
}

flow_name=$(get_flow_name_for_deployment_from_prefect_yaml "$deployment_name")
schedule_id=$(prefect deployment schedule ls $flow_name/$deployment_name | grep '│' | awk -F '│' '{print $2}' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
prefect deployment schedule resume $flow_name/$deployment_name $schedule_id
```

This script can be added to the workflow to automate schedule enabling.

**3. Synv DEV:** After deleting the pull request branch, reapply deployments to the DEV Prefect workspace, now referencing the `main` branch. Scheduling remains disabled for DEV.

You can verify the **branch references** used in deployments by checking the assigned tag or the Configuration tab in Prefect Cloud. For example, in the screenshot below, the deployment runs on branch `feature_branch_1`.

![verify branch references](/src/assets/images/blog/feature_branch.png)

## Conclusion & series summary

This article wraps up our four-part journey to building a modern, automated data platform—from high-level architecture to fully hands-off, production-ready operations. Along the way, we’ve shown how each layer, including architecture, infrastructure, orchestration, and automation, works together to create a resilient, scalable foundation for data engineering.

Let’s quickly recap:

[**Part 1**](https://thescalableway.com/blog/deploying-prefect-on-any-cloud-using-a-single-virtual-machine/) focused on architectural decisions, demonstrating how a lightweight Kubernetes setup on a single VM can enable rapid adoption and growth, even for teams just starting with cloud-native data platforms.

[**Part 2**](https://thescalableway.com/blog/how-to-setup-data-platform-infrastructure-on-google-cloud-platform-with-terraform/) moved from design to implementation, automating cloud infrastructure provisioning with Terraform to ensure consistency, reproducibility, and cloud-agnostic flexibility.

[**Part 3**](https://thescalableway.com/blog/getting-to-your-first-flow-run-prefect-worker-and-deployment-setup/) took us deeper into operations, guiding you through containerized flow execution, Prefect worker configuration, and deployment management—helping you run your first data ingestion flows confidently.

And here in **Part 4**, we brought everything together by introducing CI/CD automation. We showed how three specialized workflows for Docker images, Prefect workers, and deployment orchestration help reduce manual errors, maintain a single source of truth, and scale both your platform and your team. This kind of automation makes development smoother, testing more reliable, and production releases faster and safer.

The main takeaway is that adopting CI/CD for data platforms is not just about tools but about changing how your team works. Automation connects development and production, reduces risk, and frees your engineers to focus on data rather than infrastructure.

Thanks so much for following along. For more tips and updates, check out my [**other articles**](https://thescalableway.com/author/karol-wolski/), subscribe to our **newsletter**, and connect with me on [**LinkedIn**](https://www.linkedin.com/in/wolski-karol/). Let’s keep the conversation about smarter data platforms going.
