---
title: Unifying 10+ ERPs into One Reusable Data Platform
date: 2026-02-24 14:39:00
description: Learn how we transformed a fragmented ERP landscape into a centralized, reusable data platform delivering reliable daily insights at enterprise scale.
internal_notes: LAPP Case study
---

A global manufacturer like [LAPP](http://www.lapp.com) runs on data. Orders, backlog, billing, treasury, production planning. Each entity had access to its own operational numbers. The problem was that leadership never had the full picture in one place.

More than 40 subsidiaries were operating across different ERP systems. Some used SAP, others relied on EPICOR, SAP HANA, SAP ECC, Sage, Prelude, SAP Business One, C1. Each system had its own structure, business logic, and reporting approach. Locally, things worked. At the group level, visibility required consolidation.

At the beginning of our collaboration, leadership had a company-wide financial overview, but detailed company-level data was only reliably accessible monthly. Daily visibility across entities did not exist in a structured, automated form.

When we started working together, the challenge was not just to connect systems. It was to build a foundation that could scale across entities without turning into a maintenance nightmare.

## When Growth Outpaces Architecture

Over time, complexity had quietly accumulated. Reporting worked, but it required coordination, manual consolidation, and reconciliation of inconsistent definitions.

Several structural challenges stood in the way:

- Multiple ERP systems with different data structures and business logic
- No centralized data lake (data was semi-manually uploaded into a financial consolidation system)
- Limited cross-entity operational visibility on a daily level
- Manual reporting workflows
- No structured orchestration layer
- No standardized repository governing data pipelines

At that time, the platform operated on a single on-premises server.

Each new integration required custom logic. Each reporting adjustment increased fragility. SAP added its own constraints, including extraction limits and concurrency restrictions.

The system worked, but it did not scale cleanly. Every new requirement increased complexity.

Leadership needed a consistent daily view of performance. The data team needed an architecture that wouldn’t fight them at every step.

## Building the Foundation: Infrastructure, Ingestion, and Orchestration

The first milestone came quickly. Within 2 hours, we delivered a working SAP extraction prototype that loaded data into a centralized data lake. This validated feasibility and created internal momentum.

From there, the focus shifted to building durable foundations across three core layers.

### Infrastructure: Centralized, Version-Controlled, Environment-Aware

We started with a single on-premises server. Over time, the infrastructure evolved into four dedicated virtual machines, enabling clearer separation of workloads and environments.

The platform remained on-premises by design. This decision was aligned with:

- Cost control considerations
- Adapting to the client’s internal IT strategy and constraints

Development and production environments also remained separate, but now run on different dedicated servers, increasing operational stability and isolation.

A centralized data lake was introduced as a core architectural component, replacing semi-manual uploads to the financial consolidation system with automated ingestion pipelines.

At the center of the setup sits a structured GitLab repository ‒ data-platform-infra. It governs infrastructure definitions, ingestion logic, orchestration flows, and transformation code. More than just storage, it serves as the platform's operational control plane.

Version control, environment separation, and reproducibility became a standard.

### Ingestion Layer: A Reusable ERP Connector Framework

Rather than building one-off scripts, we designed a modular ingestion framework that could scale across systems.

The SAP connector was structured into three clear components:

1. A **source layer** handling connection management and query execution.
2. A **task layer** responsible for dataframe processing, cleanup, and normalization.
3. A **flow layer** integrating the logic into Prefect deployments with parameterized execution.

This separation allowed us to manage SAP’s particular constraints, such as timeouts, concurrency limits, and structural inconsistencies, without duplicating logic.

As additional ERP systems were integrated, the same architectural pattern was reused. Parameters changed. Credentials changed. The structure remained stable.

### Orchestration Layer: Controlled, Observable, Recoverable

As ingestion expanded, orchestration became central. Prefect was already in place when we began. A major milestone was the migration and restructuring toward Prefect 2, which significantly improved deployment control and flow management. We are currently migrating to Prefect 3 to further strengthen orchestration capabilities.

During the migration to Prefect 2, dbt was introduced to the platform, bringing structured transformation logic where previously there was none.

Given SAP’s concurrency constraints, we implemented structured multi-flows to regulate parallelism and prevent overload.

Operational resilience improved significantly through:

- Slack-based failure notifications
- Automated validation checks on reporting tables
- Controlled reload mechanisms that prevent cascading failures

Instead of manually debugging broken pipelines, the team gained structured recovery and visibility, enabling the system to become more predictable.

### Transformations: Transparent Business Logic with dbt

With ingestion stabilized and dbt introduced, we implemented staging, intermediate, and mart layers aligned with finance reporting requirements.

Staging, intermediate, and mart layers were aligned with finance reporting needs. Instead of forcing artificial metric harmonization, we made logic explicit and version-controlled.

Definitions for backlog, bookings, and billing have been documented in code. Automated validations ensure the integrity of the tables that feed the Daily Book & Bill and Daily Treasury reports (in beta version).

Business logic is no longer tribal knowledge ‒ it is traceable and reproducible.

## The Impact: From Fragmented Reporting to Daily Visibility

Today, LAPP has daily access to company-level operational data with approximately 97% coverage of company revenue. What was previously consolidated monthly is now visible daily.

Automated ingestion runs across more than ten ERP systems into the centralized data lake. Executive reports are generated and distributed each morning automatically.

Beyond reporting frequency, structural improvements include:

- New data sources can be added without redesigning the system. 
- Connectors follow a shared architecture. 
- Orchestration is centralized. 
- Failures trigger notifications. 
- Isolated development and production servers.
- Code and deployments are version-controlled in a unified repository.

When something breaks, the team is notified immediately. When data behaves unexpectedly, validations flag it. Reloading a failed component no longer means rebuilding the entire chain.

## What This Project Really Delivered

The visible outcome was consolidated daily reporting across 40+ entities with near-complete revenue coverage.

> _"dyvenia (the parent company of The Scalable Way) has transformed how we handle data governance and collaboration at our organization. The robust governance features have given us peace of mind, knowing that our data access and ownership controls are in place and secure. The solutions that dyvenia provides have allowed us to make better business decisions, knowing that we can depend on high-quality and real-time data.”_ \~Michael, SR FP&A Manager at\~LAPP

The deeper outcome was architectural. LAPP now operates on a structured, reusable ingestion framework with controlled orchestration, reproducible transformations, and centralized infrastructure.

The SAP connector may have been the starting point. The real outcome was a reusable, scalable multi-ERP data platform designed to support growth rather than constrain it. Instead of adding complexity with each new source, the platform absorbs it.

That is the difference between connecting systems and engineering a data platform.
