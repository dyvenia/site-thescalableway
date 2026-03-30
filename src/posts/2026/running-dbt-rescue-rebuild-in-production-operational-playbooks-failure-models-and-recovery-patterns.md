---
title: 'Running dbt Rescue Rebuild in Production: Operational Playbooks, Failure Models, and Recovery Patterns'
date: 2026-03-27 16:55:00
author: Andrii Kachan
description: 'Go beyond the setup and into real-world execution. Learn how we run dbt rescue rebuilds in production: scoping dependencies, managing warehouse contention, handling incremental models, and recovering from outages with precision, without introducing new risks to pipeline stability.'
tags:
  - dbt
  - data reliability
  - pipeline recovery
internal_notes: part 2 of a dbt rescue pipeline series by Andrii Kachan
---

In a [previous blog post](https://thescalableway.com/blog/the-rescue-dbt_rerun-deployment-rebuilding-changed-and-broken-models-without-disrupting-production/), we introduced **`dbt_rerun`**, a dedicated Prefect deployment we use as a rescue mechanism for production dbt pipelines. We discussed the problem it solves, why standard recovery options fall short, how the deployment is wired, and where it fits into our day-to-day development workflow.

Now, let’s focus on what happens after you click “run”. We’ll walk through how we actually use dbt_rerun in production: choosing the right dependency scope, managing queue and warehouse contention, recovering from outages, handling incremental models safely, and validating that the rescue truly fixed the issue. These are the patterns and guardrails we rely on during real incidents, where speed matters but correctness matters more.

## Outage Recovery

When an upstream failure or source outage takes down a large number of models at once, the rescue deployment becomes the primary recovery channel. Attempting to recover through the normal scheduled pipelines risks re-triggering failures before the source is stable, and provides less visibility into what has and hasn't been rebuilt.

The recommended approach is to batch all affected models into a single, well-scoped rescue run:

`dbt run --select int_model_1+ int_model_2+ +mart_model_1+ +mart_model_2+`

This pattern has several advantages:

- It is isolated from the main pipeline schedules, so a failure in the rescue run does not interfere with ongoing production work.
- It runs the full lineage for each affected model, ensuring that intermediates and their dependent marts are rebuilt in the correct order.
- It makes recovery explicit and auditable - we know exactly which models were confirmed rebuilt, rather than assuming the scheduler will handle it.

For very large outages (e.g., 50 or more staging models failing overnight), we group models by lineage affinity rather than triggering a single enormous run. This keeps individual runs fast, minimizes the blast radius of any secondary failure, and makes it easier to identify which chains have been recovered.

## Resources Degradation

Warehouse resources are shared across all running pipelines. A rescue run that overlaps with a scheduled run that touches the same large models will introduce concurrency at the database level, leading to competing read and write operations on the same tables, which can cause both runs to slow significantly or time out.

Two situations are particularly risky:

1. **Concurrent writes to the same table:** If a rescue run and a scheduled run attempt to write to the same model at the same time, they will contend for table locks. The likely outcome is that both runs become slow or stall, requiring manual intervention.
2. **Merging an updated model while it is actively running:** When a Data Analyst merges a model change to main while a scheduled pipeline is mid-run and still executing that model, the downstream runs in that same pipeline may pick up the new code before the model has been rebuilt against it. This is a common source of unexpected failures. Our practice is to either merge after the current scheduled run cycle has completed or merge immediately after a cycle ends and trigger the rescue rebuild before the next cycle begins.

Warehouse resource contention is easiest to avoid by checking the Prefect run timeline before triggering a rescue: if a heavy scheduled deployment is running or about to run, we wait for it to clear.

## Downstream and Upstream Reloads

Choosing the right dependency scope is one of the most consequential decisions in a rescue run. Running too narrow leaves downstream models stale; running too wide wastes resources and increases the risk of contention.

Here is a compact guide to the selection patterns we use:

- `+model`  -  the model plus all upstream parents (everything it reads from)
- `model+`  -  the model plus all downstream children (everything that reads from it)
- `+model+`  -  both directions simultaneously

**Intermediate models**

![](/src/assets/images/blog/intermediate_models.png)

**Mart models**

![](/src/assets/images/blog/mart_models.png)

## Using `--exclude` for partial progress recovery

When a large run times out mid-way, some models in the selection will have already been built. Re-running the full selection would rebuild them unnecessarily. The `--exclude` flag lets us resume from where we left off:

```plain
# Initial run: times out after building int_model, dep_1, dep_2 of 10 models
dbt run --select int_model+ --full-refresh

# Resume run: exclude the three already-built models
dbt run --select int_model+ --exclude int_model dep_1 dep_2 --full-refresh
```

This pattern is especially important for full-refresh runs on large incremental chains, where rebuilding from scratch would waste significant time and resources.

## Incremental Models and Full-Refresh Strategy

Incremental models are where most rescue mistakes happen, because the wrong refresh strategy can silently lock in bad history or overload the warehouse.

Incremental models represent the most complex rescue scenario, because the decision of whether to use `--full-refresh` has lasting consequences for both data correctness and warehouse load. Our incremental models typically use a `unique_key` for deduplication and an is_incremental() filter to restrict which data is loaded on each run, often tied to a date cursor or a calendar condition, such as a monthly refresh window. Understanding both of those constraints is a prerequisite for choosing the right rescue approach.

**When to use \`\`--full-refresh\`\`**

Use `--full-refresh` when the change invalidates the historical state of the table:

- The join logic, business rules, or transformations affecting existing rows have changed.
- The unique_key definition has changed.
- A bug produced an incorrect history that must be corrected.
- A new column is being backfilled from source data that already exists in staging.

**When not to use \`\`--full-refresh\`\`**

- Only future data will differ (for example, adding a new column with NULL values for historical rows is acceptable).
- The model runs on a monthly cadence, and a normal incremental run will naturally pick up the change on its next scheduled execution.
- The model is very large, and a targeted historical window backfill would be more efficient than a full rebuild.

When `--full-refresh` is genuinely necessary on a large incremental model, treat it as a scheduled operation: run it during a low-traffic window, ensure queues are free, and monitor warehouse resource usage throughout.

### Write disposition and dbt materialization alignment

The choice of write disposition is tightly coupled to how the source generates data:

- If source records are append-only and never modified, the incremental pattern with a date cursor is safe and efficient.
- If source records can be updated, a `unique_key` merge strategy is required to avoid duplicate or stale rows in the target.
- If correctness requires reconstructing the full table from scratch on a change, `--full-refresh` is the only reliable option, but it should be the last resort, not the default.

## Cross-Model Dependencies: the Heavy Lineage Trap

Most rescue incidents do not involve a single model in isolation. They involve a model that sits in the middle of a deep lineage graph, with multiple upstream sources and multiple downstream consumers. When such a model is rescued carelessly, the blast radius extends well beyond its intended scope.

Before triggering a rescue run, we always inspect the lineage of the target model:

- How many upstream models does it depend on, and how heavy are they?
- How many downstream models reference it directly or transitively?
- Are any of those downstream models incremental or particularly large?

If the lineage is deep and the models are heavy, we split the rescue into multiple runs, ordered by layer:

1. Rebuild the upstream models first to ensure stable inputs.
2. Rebuild the target model against the refreshed upstream.
3. Rebuild the downstream models once the target is confirmed correct.

This layered approach reduces the risk of a single timeout taking down the entire lineage recovery and makes it easier to identify failures at each stage.

## Scheduling Heavy Reloads

For rescue operations that involve large incremental models, deep lineages, or full-refresh requirements, ad hoc triggering is rarely the right approach. Instead, we treat these as scheduled operations with the same care we apply to any production job.

**Identifying a reload as "heavy"** is the first step. A useful heuristic: if a model typically takes more than a few minutes in its normal incremental run, its full-refresh will be significantly longer - potentially by an order of magnitude. Dependency chains multiply this further.

Scheduling considerations:

- Run heavy rescues outside peak hours, when scheduled pipelines have cleared their queues and warehouse load is low.
- If multiple heavy models need to be rescued, stagger them across separate windows rather than running them in parallel, unless queues and warehouse headroom are confirmed sufficient.
- Monitor the run actively - heavy full-refresh operations are the most common source of rescue-induced timeouts.

When a rescue run times out partway through, the --exclude pattern described in the downstream/upstream section allows the run to resume without duplicating already-completed work.

## Recovery Practices

Consistent recovery practices reduce the operational costs of incidents and make rescue deployments easier to reason about.

**Post-merge rebuild discipline.** Every model merge should be followed immediately by a rescue rebuild, completed before the next scheduled run cycle begins. This eliminates the most common source of "new code, old table" mismatches. If there is insufficient time before the next cycle, the merge should wait for a better window.

**Batching by lineage for outage recovery.** When many models fail simultaneously, resist the temptation to address each one individually. Group them by shared lineage: models that share upstream sources or downstream consumers should be recovered together in a single selection string. This is faster, more reliable, and produces a cleaner audit trail.

**Validating recovery before declaring success.** A successful dbt run is necessary but not sufficient. After each rescue run, we verify:

- dbt tests triggered by the deployment have passed.
- Row counts and max dates in the rebuilt tables match expectations.
- Downstream consumers are producing correct outputs in their next run.

**Using the sandbox for validation before prod.** For complex lineage changes, the sandbox schema - which mirrors the structure of all production schemas inside the production cluster - can be used to validate the rebuild logic before triggering it against production tables.

## Pre-Run Checklist

Before triggering any rescue run, we work through the following:

1. Are SQL queues currently saturated, or is a heavy scheduled run about to start?
2. Is the target model heavy (large row volume, complex joins, or deep lineage)?
3. Have I mapped the upstream and downstream scope? Am I using the right selection (`+model`, `model+`, or `+model+`)?
4. Is the model incremental? If so, will a normal incremental run load any data today, or will the monthly filter make it a no-op?
5. Does the change require `--full-refresh`, or can a targeted backfill or normal incremental run achieve correctness?
6. Am I about to overlap with a scheduled run that touches the same lineage?
7. If the run times out, do I have a plan for resuming with `--exclude`?
8. After the run: did tests pass, and have I sanity-checked the output tables?

## Summary

The `dbt_rerun` rescue deployment is one of the highest-leverage tools in our daily data service operations. It provides a controlled, production-safe channel for rebuilding changed or broken models without affecting the main pipeline schedules, which is essential for maintaining data trust in a production environment where models change continuously.

Used well, it functions as a scalpel: we rebuild the smallest correct scope, at the right time, with the right materialization strategy. Used carelessly ‒ triggering heavy full-refreshes at peak hours, overlapping with scheduled runs, or rebuilding too wide a lineage all at once ‒ it becomes a source of incidents rather than a remedy for them.

The practices described in this article ‒ queue awareness, lineage inspection, incremental strategy, and post-run validation ‒ reflect lessons learned from daily operational use. The principles, however, generalize: any on-demand dbt execution in a production environment benefits from the same discipline.
