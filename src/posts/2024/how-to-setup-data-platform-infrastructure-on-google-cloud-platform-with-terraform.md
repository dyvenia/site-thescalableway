---
title: How to Setup Data Platform Infrastructure on Google Cloud Platform with Terraform
date: 2025-03-05T13:31:00
author: Karol Wolski
description: Learn how to set up a secure, scalable data platform infrastructure on Google Cloud Platform (GCP) using Terraform. This step-by-step guide covers VPC configuration, Compute Engine setup, firewall rules, Identity-Aware Proxy (IAP), Cloud NAT, and more, ensuring a cost-effective, flexible, and secure foundation for your data platform.
tags:
  - google cloud platform
  - terraform
  - data platform architecture
  - prefect
internal_notes: |-
  **Audience:** Data Engineer / DevOps Engineer trying to setup data platform

  **Purpose:** (Internal usage only):

  How-to document that explains all necessary steps to prepare basic infrastructure for running data platform with Terraform on Google Cloud Platform.

  **Outline:** 

  **1. Introduction**

  - What are we trying to achieve? // Data platform on GCP, without setting up any source system or target data warehouse.
  - Reference to the previous article that covers the architectural decision-making process.
  - Why a server-based approach with a single VM?

  **2. Infrastructure Overview**

  - **Explanation of key components:**
      - VPC & Subnet
      - Compute Engine
      - Firewall rules
      - IAP SSH Permissions
      - Cloud Router & Cloud NAT
      - Cloud Storage
  - **Understanding GCP IAP** (Deep dive into how Identity-Aware Proxy works and why it's important for security of data platform)

  **3. Technical Prerequisites (Before you start)**

  - Installing necessary tools:
      - Terraform
      - gcloud CLI
  - Setting up GCP Service Account
      - Downloading the JSON Key for the Service Account
      - Activating service account
      - Service account HMAC
  - Setting up GCP access:
      - Enabling required APIs
  - Setting Up a Remote State for Terraform
      - Exporting Credentials and Setting up New Bucket

  **4. Installing & Deploying infrastructure with Terraform** 

  - Terraform Files
  - Terraform commands
  - Setup Verification

  **5. Conclusion**
---
Setting up a solid, scalable data platform is crucial for organizations looking to get the most out of their data. Building upon our previous discussion on architectural considerations for [deploying Prefect on various cloud platforms](https://thescalableway.com/insights/deploying-prefect-on-any-cloud-using-a-single-virtual-machine/), this article will walk you through building your data platform infrastructure on Google Cloud Platform (GCP) using Terraform.

Our focus is on creating a server-based approach utilizing a single Virtual Machine (VM)—a simple yet powerful starting point for organizations that don’t need to dive into complex source systems or full-blown data warehouses just yet. This approach offers an easy entry point with plenty of room to grow as your data needs evolve.

As this article will use a substantial amount of code, you can find all the relevant code samples in our[ dedicated repository.](https://github.com/thescalableway/dataplatform-gcp-terraform)

## Why Choose a Server-Based Approach with a Single VM?

Choosing a server-based approach with a single VM comes with several advantages:

1. Cost-effectiveness: A single VM setup is often a more budget-friendly option for initial deployments or smaller-scale projects.
2. Simplified management: Fewer components mean easier maintenance and troubleshooting.
3. Flexibility: This approach offers the ability to easily expand or modify your infrastructure as requirements change.
4. Learning curve: For teams new to cloud infrastructure, starting with a single VM can be less overwhelming and serve as a stepping stone to more complex architectures.

This guide will walk you through the process of setting up key components of our data platform infrastructure on GCP. You’ll learn how to configure the VPC and subnets, set up Compute Engine instances, configure firewall rules, secure SSH access with Identity-Aware Proxy (IAP), establish internet connectivity with Cloud Router and NAT, and store the state files in Cloud Storage. We'll also dive into the specifics of GCP's Identity-Aware Proxy, exploring its crucial role in enhancing the security of our data platform.

By using Terraform to manage infrastructure as code, we ensure that our setup is reproducible, version-controlled, and easy to manage. This not only streamlines the initial deployment but also makes scaling and future updates much more efficient. 

Let's get started on building a solid, scalable data platform infrastructure on GCP—one that will grow with your organization’s data needs. 

## Infrastructure overview 

Before we dive into the step-by-step process of setting up your data platform on GCP, let’s take a first look at the key components that make up the environment we’ll be building: 

- **Virtual Private Cloud (VPC)**: A private network that will serve as the foundation of your environment, providing isolation and security.
- **Subnet**: A private subnet where the virtual machine will reside.
- **Compute Engine Virtual Machine**: The instance where both the GitHub Runner and Prefect Worker will be set up.
- **Firewall**: Configured with rules to allow inbound access exclusively through Google Cloud Identity-Aware Proxy (IAP), blocking all other traffic.
- **IAP SSH Permissions**: Enables secure access to the virtual machine.
- **Cloud Router**: Provides internet connectivity for the virtual machine.
- **Cloud NAT**: Configures a NAT gateway that directs the virtual machine to the Cloud Router for outbound internet access. It also ensures that the public IP is fixed as long as the Cloud NAT object is not destroyed and configured for the same zone.
- **Cloud Storage**: Sets up a Google Cloud Storage bucket to store ingested data as Parquet files before transforming and loading it into the database as tables.

![google cloud platform infrastructure](/src/assets/images/blog/infrastructure_GCP.png)

### Understanding Google Cloud Identity-Aware Proxy (IAP)

To ensure a secure environment, all public access should be completely blocked. With this configuration, resources within the environment can be accessed using two main options:

- **VPN Connection**: In this setup, at least one resource within the VPC must be exposed to the internet to host a VPN endpoint. Alternatively, a separate VPC can be configured solely for VPN purposes, with VPC Network Peering into the main environment. This way, only the VPN-hosting VPC is exposed to the internet, while the main environment remains accessible only internally. Although effective, this configuration is more complex and falls outside the scope of this documentation.
- **Google Cloud Identity-Aware Proxy (IAP)**: This option offers a similar secure access model to a VPN but with simplified management through Google Cloud. As outlined in the [official documentation](https://cloud.google.com/iap/docs/concepts-overview#how_iap_works):

_“When an application or resource is protected by IAP, it can only be accessed through the proxy by principals, also known as users, who have the correct Identity and Access Management (IAM) role. When you grant a user access to an application or resource by IAP, they're subject to the fine-grained access controls implemented by the product in use without requiring a VPN. When a user tries to access an IAP-secured resource, IAP performs authentication and authorization checks.”_

This [diagram from Google](https://cloud.google.com/iap/images/iap-load-balancer.png) further illustrates the components required to implement this configuration:

![google configuration diagram](/src/assets/images/blog/Google_Diagram.png)

With a solid understanding of Google Cloud Identity and its role in managing users and access, let's now dive into the practical steps for setting it up and implementing it effectively.

## Phase 1: Securing the Essentials

Before starting the Terraform configuration, make sure you have the following tools and setups in place:

- **Terraform**: You'll need Terraform installed on your local machine. This will be your main tool for provisioning infrastructure.
- **gcloud CLI**: The gcloud CLI tool should be installed and configured to interact with your Google Cloud account.
- **GCP Service Account**: A Google Cloud Platform service account needs to be created.
- **Enabled APIs**: Make sure the Compute Engine API and Cloud Resource Manager API are enabled on your GCP account.

Let's take a detailed look at these prerequisites:

### Step 1: Installing Terraform

Terraform can be installed in various ways, which are outlined [by Hashicorp here](https://developer.hashicorp.com/terraform/install). For Ubuntu, installation can be done with the following commands:

```bash
wget -O - https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list

sudo apt update && sudo apt install terraform
```

### Step 2: gcloud CLI installation

Similarly to Terraform, the gcloud CLI can be installed as per the [official instructions](https://cloud.google.com/sdk/docs/install). For Ubuntu, run:

```bash
sudo apt-get update

sudo apt-get install apt-transport-https ca-certificates gnupg curl

curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg

echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt cloud-sdk main" | sudo tee -a /etc/apt/sources.list.d/google-cloud-sdk.list

sudo apt-get update && sudo apt-get install google-cloud-cli
```

After installation, initialize the gcloud CLI by providing the “gcloud init” command and setting up a new account by opening the provided URL.

```bash
gcloud init

# gcloud init

Welcome! This command will take you through the configuration of gcloud.

Your current configuration has been set to: [default]

You can skip diagnostics next time by using the following flag:

  gcloud init --skip-diagnostics

Network diagnostic detects and fixes local network connection issues.

Checking network connection...done.                                                                                                                                                      

Reachability Check passed.

Network diagnostic passed (1/1 checks passed).

You must sign in to continue. Would you like to sign in (Y/n)?  Y

Go to the following link in your browser and complete the sign-in prompts:

    https://accounts.google.com/o/oauth2/auth<URL_TO_OPEN_IN_BROWSER>

Once finished, enter the verification code provided in your browser: <PROVIDE_VERIFICATION_CODE>
```

Subsequently, configure the desired Cloud project, default Compute Region, and Zone for your environment.

### Step 3: Setting up GCP Service Account

To create a GCP Service Account, navigate to the [Google Cloud Console](https://console.cloud.google.com/), select the correct project, and go to `Navigation Menu (3 lines) > IAM & Admin > Service Accounts.`

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXc1TgHsR3qEuG9bcgopOx6uBYHrSzX2oPt_TQCbkSUNf7AjyYRsBTWeXSkQfpgftfqDVVqoauRXopL3x2hkI00zSf31WV389Ct6UEhKrSTZ-uOEGT0Q8YkviWlhH4baVqeMmr4WyA?key=ayESoQytAoVyFyBIrtLBvJIi)

Click `Create Service Account` and provide the required information.

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXetaXEX-qcU99pfZQsqy7nzdHfp3XZeBw8htHvksfdCaInoFUjhab-b7vdlsEnPMfPKnTnR-R4wkFRLr2bh-_yLeLCdCtj8z1RucsLTuXQJ76cvO8NOQR--jyxu9vl0-vv20H87Gg?key=ayESoQytAoVyFyBIrtLBvJIi)

When prompted to **Grant this service account access to a project**, select the appropriate role. In this guide, we use the **Owner** role for simplicity, but it’s advisable to limit permissions to only what's necessary.

Finally, in the **Grant users access to this service account** step, assign access to the users who will need to interact with the Kubernetes cluster (not part of this article) or VM. Once done, verify that the service account is correctly set up. Its email should follow this pattern:

`{service_account_name}@{project}.iam.gserviceaccount.com`

### Step 4: Downloading the JSON Key for the Service Account

In the service account interface, go to `Actions (3 dots) > Manage keys`.

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXcoer8AkQbGSwjkEaGIVee6_bWlLZVPW4inEJZf7R3iizVjj8kuGtbVvK-_4yh-0b7H8JIiz3D24bacv9pe5TQtJNzUQn7m-MRvsy6YiTY34inPpJGDSBwcUKKJdD37h1VEJeFewQ?key=ayESoQytAoVyFyBIrtLBvJIi)

Select `Add Key > Create new key > JSON` to download the JSON key file. Keep this file secure, as it will be required for Terraform configuration.

### Step 5: Activating the service account

After downloading the JSON key, activate the service account locally with the following command:

```bash
gcloud auth activate-service-account 
{service_account_name}@{project}.iam.gserviceaccount.com
--key-file={json_file}.json
```

This step enables the service account for use in the local environment, ensuring access to necessary GCP resources with IAP tunnel functionality.

### Step 6: Generating HMAC key to buckets

To enable file uploads to Cloud Storage, some libraries require an HMAC token in addition to a JSON key. To generate an HMAC token:

- Go to `Cloud Storage > Settings > Interoperability`.
- Under `Service account HMAC`, click `Create a key for service account`.
- Once created, the token will be marked as 'Active'.

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXcOs9OkC4jMW4sVqX7HcAshQCW5uQxDGhRpK9BnKLJCrnrikDYs6pZJShJf7KypE73asBaVn5R0cnb9nug_z-ztVB2KjNE1h_k-3Mz1fjKQLLzCfTqZF9fF7B2UFEHTkj-y7aUcUA?key=ayESoQytAoVyFyBIrtLBvJIi)

For basic configuration, this step is not required. However, for ingestion, the key must be added to Google Secret Manager to ensure it's accessible for flow runs.

### Step 7: Enabling Compute Engine API and Cloud Resource Manager API

Before Terraform can interact with GCP, make sure these APIs are enabled for your project:

- [Compute Engine API](https://console.cloud.google.com/marketplace/product/google/compute.googleapis.com)
- [Cloud Resource Manager API](https://console.cloud.google.com/marketplace/product/google/cloudresourcemanager.googleapis.com)
- [Cloud Storage](https://console.cloud.google.com/marketplace/product/google-cloud-platform/cloud-storage)

If they’re not enabled, head to the Google Cloud Console and enable them.

### Step 8: Setting Up a Remote State for Terraform

By default, Terraform stores its state locally in .tfstate files. While this works for development, for any persistent environment, even if you’re the only one working on the project, it’s crucial to store this state in a centralized and reliable location. A common best practice is to use a Google Cloud Storage (GCS) bucket to keep the state safe and accessible, avoiding potential issues with local file loss or conflicts.

However, Terraform itself cannot create the bucket required for storing its state, leading to what’s called a "chicken-and-egg" problem. The bucket must be created manually before running any Terraform code. Tools like Terragrunt can solve this by simplifying environment management and reducing code duplication [(example setup)](https://blog.alterway.fr/en/manage-multiple-kubernetes-clusters-on-gke-with-terragrunt.html). However, for the sake of simplicity, we are not introducing such tools in this context.

To create a new bucket using the `gcloud CLI`, export the necessary credentials and then proceed with the bucket creation process.

### Step 9: Exporting Credentials and Setting up New Bucket

Once we have our service account JSON prepared, export of credentials is necessary to provide Application Default Credentials (ADC):

`export GOOGLE_APPLICATION_CREDENTIALS=test-project-32206692d146.json`

Then, with the usage of gcloud CLI, a new bucket with the applied policy should be created:

```bash
gcloud storage buckets create gs://test-project-tfstate --location=us-central1 --uniform-bucket-level-access

gcloud storage buckets add-iam-policy-binding gs://test-project-tfstate \

--member="serviceAccount:test-service-account@test-project.iam.gserviceaccount.com" \

  --role="roles/storage.objectAdmin"
```

Once completed, it should be available in the GCP Console. To check it, go to `Navigation Menu > Cloud Storage > Buckets`:

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXd5iYcgIiWgSpHzi95K7EwaQ_zXivweAmA24MlD3XGJz5s_0CSTf26eU4mbMBexPv9vvlOuWGV5XD_3tzLOSKxv_jB1R190Fp4Eh_d07dh9HSLKeYXBBF_Ta0pEBCSeKznPuKII?key=ayESoQytAoVyFyBIrtLBvJIi)

## Phase 2: Installing & Deploying Infrastructure with Terraform

To set up the environment, Terraform will handle provisioning all the required GCP resources. By the end of this process, your directory structure will look like this: 

```bash
$ tree

|-- backend.tf

|-- main.tf

|-- provider.tf

|-- test-project-32206692d146.json

|-- variable.tf
```

For managing both DEV and PROD environments, you can duplicate the files as shown:

```bash
$ tree

├── dev

    ├── backend.tf

│   ├── main.tf

│   ├── test-project-32206692d146.json

│   ├── provider.tf

│   └── variable.tf

└── prod

    ├── backend.tf

    ├── main.tf

    ├── test-project-32206692d146.json

    ├── provider.tf

    └── variable.tf
```

#### Terraform Files

The main difference between environments lies in the `backend.tf` and `variables.tf` files. In larger projects, using Terraform modules or tools like Terragrunt is recommended for reusable configurations. However, for simplicity, this example uses code duplication, which is also a valid approach.

The content of `provider.tf` should look like this:

```bash
provider "google" {

  region      = var.region

  project     = var.project_name

  credentials = file(var.credentials_file)

  zone        = var.zone

}
```

`backend.tf` should point to a bucket with a shared `tfstate` file created in [Step 9](#Step%20 9:%20 Exporting%20Credentials%20and%20Setting%20up%20New%20Bucket) of the first phase. It needs to be manually configured because it is the first block loaded when running terraform init, and variables from variables.tf cannot be referenced here:

```bash
terraform {

  backend "gcs" {

    bucket  = "test-project-tfstate"

    prefix  = "terraform/state/prod"

  }

}
```

All variables used in `provider.tf` and `main.tf` are defined in `variable.tf`, as shown below:

```bash
variable "credentials_file" {

  default = "test-project-32206692d146.json"

}

variable "environment" {

  default = "prod"

}

variable "filesystem" {

  default = "ext4"

}

variable "image" {

  default = "projects/ubuntu-os-cloud/global/images/ubuntu-2404-noble-amd64-v20241115"

}

variable "ip_cidr_range" {

  default = "10.202.0.0/24"

}

variable "machine_type" {

  default = "c3d-standard-8-lssd"

}

variable "project_name" {

  default = "test-project"

}

variable "region" {

  default = "us-central1"

}

variable "service_account" {

  default = "serviceAccount:test-service-account@test-project.iam.gserviceaccount.com"

}

variable "zone" {

  default = "us-central1-c"

}
```

`main.tf` defines and initializes all infrastructure components outlined in the [Infrastructure overview section](#Infrastructure%20 overview).

```bash
resource "google_compute_network" "vpc_edp" {

 name                    = "vpc-${var.project_name}-${var.environment}"

 auto_create_subnetworks = "false"

}

resource "google_compute_subnetwork" "subnet_edp" {

 name          = "subnet-${var.project_name}-${var.environment}"

 ip_cidr_range = var.ip_cidr_range

 network       = google_compute_network.vpc_edp.name

 region        = var.region

 depends_on    = [google_compute_network.vpc_edp]

}

resource "google_compute_instance" "vm_edp" {

 project      = var.project_name

 zone         = var.zone

 name         = "${var.project_name}-${var.environment}-01"

 machine_type = var.machine_type

 boot_disk {

   auto_delete = true

   initialize_params {

     image = var.image

     size  = 50

     type  = "pd-ssd"

   }

   mode = "READ_WRITE"

 }

 scratch_disk {

   interface = "NVME"

 }

 network_interface {

   network    = "vpc-${var.project_name}-${var.environment}"

   subnetwork = google_compute_subnetwork.subnet_edp.name

 }

 metadata_startup_script = <<-EOT

   #!/bin/bash

   set -e

   sudo mkfs.ext4 -F /dev/disk/by-id/google-local-nvme-ssd-0

   sudo mkdir -p /mnt/disks/local-nvme-ssd

   sudo mount /dev/disk/by-id/google-local-nvme-ssd-0 /mnt/disks/local-nvme-ssd

   sudo chmod a+w /mnt/disks/local-nvme-ssd

   echo UUID=sudo blkid -s UUID -o value /dev/disk/by-id/google-local-nvme-ssd-0 /mnt/disks/local-nvme-ssd ext4 discard,defaults,nofail 0 2 | sudo tee -a /etc/fstab

 EOT

 depends_on              = [google_compute_network.vpc_edp]

}

resource "google_compute_firewall" "rules" {

 project = var.project_name

 name    = "allow-ssh-${var.environment}"

 network = "vpc-${var.project_name}-${var.environment}"

 allow {

   protocol = "tcp"

   ports    = ["22", "6443"]

 }

 source_ranges = ["35.235.240.0/20"]

 depends_on    = [google_compute_network.vpc_edp]

}

resource "google_project_iam_member" "project" {

 project = var.project_name

 role    = "roles/iap.tunnelResourceAccessor"

 member  = var.service_account

}

resource "google_compute_router" "router" {

 project    = var.project_name

 name       = "nat-router-${var.environment}"

 network    = "vpc-${var.project_name}-${var.environment}"

 region     = var.region

 depends_on = [google_compute_network.vpc_edp]

}

resource "google_compute_router_nat" "nat" {

 name                               = "router-nat-${var.project_name}-${var.environment}"

 router                             = google_compute_router.router.name

 region                             = var.region

 nat_ip_allocate_option             = "AUTO_ONLY"

 source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

 log_config {

   enable = true

   filter = "ERRORS_ONLY"

 }

}

resource "google_storage_bucket" "private_bucket" {

 name          = "${var.project_name}-${var.environment}"

 location      = var.region

 storage_class = "STANDARD"

 uniform_bucket_level_access = true

}

resource "google_storage_bucket_iam_binding" "bucket_writer" {

 bucket = google_storage_bucket.private_bucket.name

 role = "roles/storage.objectCreator"

 members = [

   "${var.service_account}"

 ]

}

resource "google_storage_bucket_iam_binding" "bucket_admin" {

 bucket = google_storage_bucket.private_bucket.name

 role = "roles/storage.admin"

 members = [

   "${var.service_account}"

 ]

}
```

With the environment outlined, let’s provision the infrastructure by validating, formatting, and applying the configuration.

### Step 1: Infrastructure provisioning with Terraform

Once the necessary files are prepared, validate and format the configuration:

```bash
$ terraform validate

Success! The configuration is valid.

$ terraform fmt

main.tf

provider.tf
```

Before applying changes, inspect them with the plan command:

```bash
terraform plan

Check if it's all good

terraform apply

Enter a value: yes
```

After a few minutes, the environment will be ready. To list the created resources, run:

```bash
$ terraform state list

google_compute_firewall.rules

google_compute_instance.vm_edp

google_compute_network.vpc_edp

google_compute_router.router

google_compute_router_nat.nat

google_compute_subnetwork.subnet_edp

google_project_iam_member.project
```

### Step 2: Setup Verification

Verify the resources by logging into the GCP Console. Confirm the creation of **VPC and Subnet, Virtual Machine, Firewall Rule, IAP SSH Permission, Cloud Router, and NAT Gateway**. Navigate to the following sections:

- **VPC and Subnet**

Go to `Navigation Menu > VPC Network > VPC Networks`:

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXf-4dP5sXZQjQDusA1Wnv_57tTmj2voRyVDeZ1QT5BvWkvxgdqM3m2kmb1vcrzGvtmJSA9wX9_Hxn4xn63NchO8Wk2O3NxuCSVHmMFfRuJhPLvXBygwCh8bme8KA6rVVNweXm-r?key=ayESoQytAoVyFyBIrtLBvJIi)

Click on the VPC and check the `Subnets` tab:

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXedDhX5_rjSe2ybLhzVWd0xy0ooGnzLhkmJcTgparyX2sR-yMO7eGOt9r0heXdkFRnziLx5xLd--vVukuQSErv5IhtBw5wiSuvk3FUbz9jSSq5l_W9pVoQ9XweBHQeHvBDBfSmWCA?key=ayESoQytAoVyFyBIrtLBvJIi)

- **Virtual Machine**

Navigate to `Navigation Menu > Compute Engine > VM instances`:

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXcFYXAnORh2zXt_XNlihkU60T6qqznyvu47RGd39-xp9kXQPuz85pw7oHKmX2_p55zj6JktxGDDOWM7jqrv9yJobB9BG_6E40N9hUdnLU2LDd1udmkF5MPTzvLbQjyda3jpgDvAEA?key=ayESoQytAoVyFyBIrtLBvJIi)

- **Firewall Rule**

Go to `Navigation Menu > VPC Network > Firewall`:

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXePVLH6Fr5ZqwvSpc_-m3lj6lcRJJ3tDdgI3IhtEMePBV1RMoXMFKDj-OI7cvBW7xy9kBvwqYVdWhtK4S5hmxPMfrznuQfe0UFLXzLkO1q5a9DTFW-i-7mW8AyUxw-mCBCkFHa8?key=ayESoQytAoVyFyBIrtLBvJIi)

- **IAM Role**

Navigate to `Navigation Menu > IAM & Admin > IAM`, and `View by roles`:

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXeGtbfPmtcZv9c_od0nKFlGIaPUQZOyjO5LGsLx7O8yy1XxbMOLsjGdf2rCZb1nhfZkN3MLWR3gjIwh6aNjMrF8jTgme3txtdCfovKFb3yWe5Av2GQTWLzIZpXsG4SJ3uHuVPEJTg?key=ayESoQytAoVyFyBIrtLBvJIi)

- **Cloud NAT gateway**

Go to `Navigation Menu > Network Connectivity > Cloud Routers > Open Cloud Router`:

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXcc62u5rIRFqK3V5flEzv_1yOK9I1MVcpVi3JM0l2GLnxHIf-9wROXQ7YUp0xb2HeVp6M6nt5FAcPX-Y8cV7OlbNYSjNzLN4tru4-VLSfi2TItLAcxBi13EiA50HnckDFpXu5A_PQ?key=ayESoQytAoVyFyBIrtLBvJIi)

- **Cloud NAT**

Navigate to `Navigation Menu > Network Services > Cloud NAT`:

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXf-GORRqmSpPTUJJ66SpQzXt1Xb2TNY333FnJVhL2gcm4SYsRCPnHZt2QIH5P8XuZJmXCr4QIUQRZL4WlfKIsginyI-RlE9N3DCjKYKwi0usD5EG3Yu3-2TzxyaFP3mGuNQUzCFqg?key=ayESoQytAoVyFyBIrtLBvJIi)

- **SSH Access to Virtual Machine using GCP Console**

To test SSH connectivity to the Virtual Machine, go to `Navigation Menu > Compute Engine > VM instances` and click on the SSH option for the created VM. Approve the connection when prompted, and you should be logged in.

This verification ensures all components are correctly configured and accessible. The next steps in setting up the data platform should be setting up a self-hosted GitHub runner and then a Prefect worker.

- **SSH Access to Virtual Machine Using the gcloud CLI**

You can access a Virtual Vachine securely using only a service account token and gcloud CLI. Follow these steps to set up and establish SSH access:

- Ensure you have the service account JSON key stored locally.
- Log in to your Google Cloud account using the following command:

```bash
gcloud auth activate-service-account 

test-service-account@test-project.iam.gserviceaccount.com --key-file

 ~/.config/gcloud.json

gcloud config set project test-project
```

Once authenticated, execute the following command to initiate the SSH connection:

```bash
gcloud compute ssh ${project_name}-${environment}-01
```

On the first execution, the gcloud CLI will prompt you to generate a private and public SSH key pair. Follow the instructions to create the key pair.

Once the keys are created, access to the virtual machine will be automatically established. Subsequent logins will reuse the existing key pair, simplifying future access.

## Conclusion

Setting up a data platform infrastructure on Google Cloud Platform using Terraform provides a solid foundation for organizations looking to leverage the power of their data. This approach offers several key benefits:

- Scalability and Flexibility: The server-based approach with a single VM provides an excellent starting point that can easily be expanded as your data needs grow.
- Security: By leveraging Google Cloud's Identity-Aware roxy (IAP), we've ensured that access to our resources is tightly controlled and secure.
- Infrastructure as Code: Using Terraform allows for version-controlled, reproducible infrastructure deployments, making it easier to manage and update your environment over time.
- Cost-Effectiveness: Starting with a single VM setup is often more budget-friendly for initial deployments or smaller-scale projects.
- Simplified Management: With fewer components to manage initially, maintenance and troubleshooting become more straightforward.

By following the steps outlined in this guide, you've created a robust infrastructure that includes a VPC, subnet, Compute Engine instance, firewall rules, IAP SSH permissions, Cloud Router, Cloud NAT, and Cloud Storage. This setup provides a solid base for running a data platform, including components like a GitHub Runner and Prefect Worker. The process of setting up these additional components will be covered in the next article of this series, building upon the foundation we've established here.

Our [dedicated repository](https://github.com/thescalableway/dataplatform-gcp-terraform) contains all code examples and implementations discussed in this article, which can be accessed for reference and further exploration. We encourage you to review the repository for a comprehensive understanding of the concepts presented.

Remember, while this guide provides a strong starting point, it's crucial to continually assess and adjust your infrastructure to meet your organization's changing needs and to stay aligned with best practices in cloud computing and data management.
