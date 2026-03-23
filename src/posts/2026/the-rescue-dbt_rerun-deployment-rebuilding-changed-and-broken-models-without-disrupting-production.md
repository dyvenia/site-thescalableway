---
title: 'The Rescue dbt_rerun Deployment: Rebuilding Changed and Broken Models Without Disrupting Production'
date: 2026-03-24 11:30:00
author: Andrii Kachan
description: Keeping production data correct after a dbt change is harder than it looks. Learn how we introduced a dedicated rescue deployment to rebuild exactly what’s needed and when it’s needed, bringing consistency back to production data without costly full reruns or pipeline disruptions.
tags:
  - dbt
  - data engineering
  - data reliability
  - pipeline recovery
internal_notes: blog post on a rescue dbt_rerun deployment by Adnrii Kachan
---

Keeping production data correct after a model change is harder than it looks.


A Data Analyst merges a new dbt model (or a hotfix) to the main branch. The code is now live. But the table in the production database still reflects the old logic. Scheduled downstream runs will start referencing the new code within minutes, yet the upstream table hasn't been rebuilt. The result is either a silent data mismatch or a cascade of failures across the pipeline.


That scenario plays out more often than it should, because the standard options for recovery are blunt instruments:

- Waiting for the next scheduled run assumes the failure will resolve itself, which it often won't.
- Rerunning the entire pipeline is expensive, risky during peak hours, and almost always more than is needed.
- Rerunning the wrong subset is fast but leaves downstream models in an inconsistent state.

A targeted, production-safe rescue mechanism solves all three problems at once.


In this article, we describe how our team uses a dedicated Prefect deployment ‒ `dbt_rerun` ‒ to handle exactly this: rebuilding changed, broken, or historically stale models with the right scope and at the right time, without disrupting the main pipeline schedules.


Our insights are grounded in daily operational experience running this deployment as a core part of our data service.
