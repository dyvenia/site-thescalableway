---
title: How to Setup Data Platform Infrastructure on GCP with Terraform
date: 2025-02-28T15:22:00
author: Karol Wolski
description: description
tags:
  - Data Platform
internal_notes: |-
  **Audience:** Data Engineer / DevOps Engineer trying to setup data platform

  **Purpose:** (Internal usage only):

  How-to document that explains all necessary steps to prepare basic infrastructure for running data platform with Terraform on Google Cloud Platform.

  **Outline:** 

  1. **Introduction**

  - What are we trying to achieve? // Data platform on GCP, without setting up any source system or target data warehouse.
  - Why a server-based approach with a single VM?
  - Reference to the previous article that covers the architectural decision-making process.

  ### **2. Infrastructure Overview**

  - **Explanation of key components:**
      - VPC & Subnet
      - Compute Engine
      - Firewall rules
      - IAP SSH Permissions
      - Cloud Router & Cloud NAT
      - Cloud Storage
  - **Understanding GCP IAP** (Deep dive into how Identity-Aware Proxy works and why it's important for security of data platform)

  ### **3. Technical Prerequisites**

  - Installing necessary tools:
      - Terraform
      - gcloud CLI
      - kubectl or Lens (for Kubernetes cluster management)
  - Setting up GCP access:
      - Creating a GCP Service Account
      - Enabling required APIs

  ### **4. Installing & Deploying infrastructure with Terraform**

  - Initializing and applying Terraform configurations to provision resources
  - Details about setting up K3S during Terraform initialization

  ### **5. Connecting to the Kubernetes Cluster**

  - Authenticating with GKE
  - Verifying the setup using kubectl or Lens
---
Headline

absfjkh
