---
title: 'The Rescue dbt_rerun Deployment: Rebuilding Changed and Broken Models Without Disrupting Production'
date: 2026-03-23 13:45:00
author: Andrii Kachan
description: Keeping production data correct after a dbt change is harder than it looks. Learn how we introduced a dedicated rescue deployment to rebuild exactly what’s needed and when it’s needed, bringing consistency back to production data without costly full reruns or pipeline disruptions.
tags:
  - dbt
  - data reliability
  - pipeline recovery
internal_notes: blog post on the rescue dbt_rerun deployment by Andrii Kachan
---

Keeping production data correct after a model change is harder than it looks.

A Data Analyst merges a new dbt model (or a hotfix) to the main branch. The code is now live. But the table in the production database still reflects the old logic. Scheduled downstream runs will start referencing the new code within minutes, yet the upstream table hasn't been rebuilt. The result is either a silent data mismatch or a cascade of failures across the pipeline.

That scenario plays out more often than it should, because the standard options for recovery are blunt instruments:

- Waiting for the next scheduled run assumes the failure will resolve itself, which it often won't.
- Rerunning the entire pipeline is expensive, risky during peak hours, and almost always more than is needed.
- Rerunning the wrong subset is fast but leaves downstream models in an inconsistent state.

A targeted, production-safe rescue mechanism solves all three problems at once.

In this article, we describe how our team uses a dedicated Prefect deployment ‒ **`dbt_rerun`** ‒ to handle exactly this: rebuilding changed, broken, or historically stale models with the right scope and at the right time, without disrupting the main pipeline schedules.

Our insights are grounded in daily operational experience running this deployment as a core part of our data service.

## What We Are Solving For

Production dbt pipelines are rarely static. Models get updated, source schemas drift, upstream data arrives late or corrupt, and historical backfills are periodically requested. Each of these situations requires rebuilding some portion of the model graph ‒ but rebuilding the wrong scope, at the wrong time, or with the wrong materialization strategy can cause as much damage as the original failure.

The core challenge is surgical precision: rebuild exactly what needs to be rebuilt, in the right dependency order, without blocking scheduled runs or saturating warehouse resources.

Three recurring failure modes motivated us to formalize the rescue approach:

- **Merge without immediate rebuild.** A Data Analyst merges an updated model into the main. Scheduled downstream runs start pulling from it before it's been rebuilt, producing incorrect or failed outputs.
- **Outage recovery at scale.** A weekend failure takes out dozens of intermediate models and their marts. Recovering each one individually is impractical; recovering everything blindly through the main pipeline is too risky.
- **Heavy full-refresh at peak hours.** An incremental model is rebuilt with `--full-refresh` at rush hour, saturating SQL queues and degrading warehouse performance across unrelated pipelines.

The **`dbt_rerun`** deployment addresses all three by giving us a dedicated, controlled channel for on-demand model rebuilds.

## The Solution: A Dedicated Rescue Deployment

Let’s start from the beginning: What do we mean by a “Rescue Deployment”?

By “rescue deployment", we mean an on-demand dbt execution path that is deliberately separated from scheduled production pipelines. The **`dbt_rerun`** deployment is not tied to a specific model, environment, or schedule. It exists solely to rebuild production tables when something has changed or broken, using an explicitly chosen dbt selection and timing. Unlike scheduled runs, it is triggered manually, scoped deliberately, and monitored closely from start to finish.

This separation is intentional: it allows us to fix production state without modifying schedules, redeploying code, or taking unnecessary risks during peak hours.

We run **`dbt_rerun`** as a Prefect deployment built on a shared template:

```python
from templates import transform_and_catalog



transform_and_catalog(

    dbt_selects={"run": ""},  # Filled at runtime via Prefect custom run

    work_queue="dbt",         # Routes to the shared dbt work queue

)
```

The deployment is intentionally minimal. The `dbt_selects["run"]` parameter is left empty at definition time and filled in when a custom run is triggered in Prefect, allowing any valid dbt selection string to be passed without modifying code or creating new deployments. In most cases, this is simply the name of the model that needs to be rebuilt (e.g., `int_orders or mart_revenue`), though more complex selection strings can be used when the rescue scope requires it.

This means a single deployment covers the full range of rescue scenarios: post-merge rebuilds, hotfix recoveries, historical backfills, and outage remediation.

## How the Deployment Is Wired

The `transform_and_catalog` template handles the orchestration plumbing. Here is an annotated version of the relevant configuration:

```python
def transform_and_catalog(
    flow_branch: str | None = None,        # Branch where the Prefect flow code lives
    dbt_repo_branch: str = "main",       # dbt repo branch to run against
    schedules: list[str] = [],             # Optional cron schedules (empty for rescue)
    work_queue: str | None = None,         # Which Prefect queue executes this deployment
    version: int = 1,
    tags: list[str] = [],
    **kwargs,
) -> None:
    params = {
        "dbt_repo_url": "",
        "dbt_repo_token_secret": "",
        "dbt_repo_branch": dbt_repo_branch,
        "dbt_project_path": "dbt/lakehouse",
        "run_results_storage_path": "s3:///dbt/runs",
        "run_results_storage_credentials_secret": "",
    }
    params.update(**kwargs)


    deploy(
        name="",
        flow_name="transform_and_catalog",
        flow_branch=flow_branch,
        params=params,
        schedules=schedules,
        work_queue=work_queue,
        version=version,
        tags=tags,
    )
```

Two operational details are worth highlighting:

- **`work_queue="dbt"`** routes the rescue run through the same queue pool as regular dbt deployments, making queue saturation visible and manageable.
- **`dbt_selects` passed at runtime means the deployment never needs to be redeployed to handle a new scenario. At trigger time, the engineer fills in the selection string in the Prefect UI custom run dialog.

The deployment also runs dbt's built-in tests after each execution, so model correctness is validated automatically without a separate step.

## Where Rescue Fits in Our Daily Workflow

Before diving into individual scenarios, here is how **`dbt_rerun`** fits into our standard development lifecycle:

1. **Local development:** A Data Analyst builds or updates a dbt model locally against the sandbox schema ‒ a schema inside the production cluster that mirrors the structure of all production schemas.
2. **Pull request and merge:** The Data Analyst opens a PR to main. Once approved and merged, the new or updated model code is live in the repository.
3. **Rescue rebuild:** We trigger **`dbt_rerun`** to rebuild the changed model along with the appropriate upstream and downstream dependencies. This is the step that makes the production table reflect the new code.
4. **Scheduled runs proceed normally:** Once the rebuild is confirmed, the regular pipeline schedules pick up cleanly without encountering a code/table mismatch.

This sequence applies equally to post-merge refreshes, hotfix recoveries, and outage remediations ‒ only the selection string and the urgency window change.

## Lateness and Queue Contention

Triggering a rescue run at the wrong moment can cause more lateness than the original problem it is meant to solve.

Our production environment typically runs five SQL queues in parallel. When four of those are occupied by scheduled deployments, taking the fifth with a heavy rescue run means that any new scheduled run that needs a queue will be blocked until the rescue completes. 

If the rescue model is large or triggers a long chain of dependencies, this blockage can cause data latency across multiple downstream consumers.

Before triggering any rescue run, we assess the following:

- How many SQL queues are currently in use?
- Is the target model light or heavy (in terms of compute and row volume)?
- Does the lineage include other heavy models?
- Are any scheduled runs likely to start in the next 15–30 minutes that would need a free queue?

If queues are near capacity and the model is heavy, we do not trigger immediately. Instead, we either wait for a quiet window or split the reload into smaller, sequential runs that each finish quickly and release the queue.

> **NOTE:** A heavy `--full-refresh` on a large incremental model is particularly risky in this context. Not only does it occupy a queue for an extended period, but it also recreates the full table from scratch, generating significant warehouse load. We treat any full refresh of a large incremental model as a scheduled operation, not an ad hoc one.

The mitigation pattern for large reloads is to split by lineage: instead of one run covering ten dependent models, run three batches of three or four models each, in low-traffic windows with enough time between them for queue recovery.

## What’s next

The `dbt_rerun` deployment gives us a safe, controlled way to correct production state when models change or break, without touching schedules or resorting to heavy-handed reruns. But the deployment itself is only part of the solution. How and when it is used matters just as much as how it is wired. 

Watch out for part two of this post, where we’ll go deeper into the operational side: how we scope rescue runs in real incidents, how we recover from outages, how we handle incremental models and full-refresh decisions, and how we avoid turning a rescue into a second production issue. If you’re the one on call when data breaks, stay tuned.
