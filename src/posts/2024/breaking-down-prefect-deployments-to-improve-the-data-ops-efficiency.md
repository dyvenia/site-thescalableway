---
title: Breaking Down Prefect Deployments To Improve The Data Ops Efficiency
date: 2025-01-28T09:45:00
author: Mateusz Paździor
description: Discover how breaking down monolithic ETL flows into modular deployments enhances observability, streamlines troubleshooting, and boosts scalability. Learn to design data pipelines that evolve with your needs while maintaining performance and reliability.
tags:
  - prefect
  - dataops
internal_notes: |-
  **Audience:** Prefect users looking to optimize their orchestration flow.

  **Purpose:** To position TSW as a credible resource for Prefect best practices. To make the potential customer think about potential problems they might be having and trigger them to consider having a professional code review done.
---
When building data platforms, it’s tempting to focus entirely on the technology stack—choosing shiny tools, debating between bulk loads or streaming, and designing storage and infrastructure to meet current needs. Yet, the rush to get data flowing often overshadows a crucial question: **How will we monitor and operate all of this effectively?**       

In the early stages, data projects typically start small: an MVP, one or two data sources, and a couple of flow runs per day. At this scale, operations often feel secondary— issues can be solved on the spot, and data engineering teams are under pressure to deliver data to the end users. But as the platform scales, this oversight catches up. Within months, many teams find themselves struggling to manage DataOps, with operational gaps threatening their progress. 

Observability and day-to-day functionality are the bedrock of robust, scalable, and maintainable data pipelines. Modern orchestration tools like Prefect excel at breaking down pipelines into smaller, more manageable pieces, making it easier to monitor, troubleshoot, and deploy smoothly. By designing pipelines with intention and visibility in mind, teams can ensure their data platform remains reliable—even as it evolves.  

## Why Observability Matters in ETL Processes

Observability is a cornerstone of modern data engineering and operations. As ETL pipelines become critical for decision-making, data teams need deep visibility into pipeline performance and meaningful, actionable logs. The stakes are high—when something goes wrong, time is lost (and as we all know, time is money, or at least that is what they say), and teams are left scrambling to identify issues. At best, this means tedious log analysis and guesswork; at worst—handling complaints from frustrated end-users. 

To avoid these pitfalls, observability is a must. It not only ensures transparency with stakeholders but also equips teams to diagnose and address problems efficiently. Effective observability hinges on four dimensions: 

1. **Transparency:** Understand what each step in the pipeline does, including inputs and outputs.
2. **Traceability:** Track data as it flows through the pipeline, making it possible to pinpoint where issues arise.
3. **Granularity:** Drill down to isolate performance bottlenecks, failed tasks, or long-running tasks. 
4. **Scalability:** Expand monitoring and alerting systems to keep pace as the ETL process grows in complexity. 

## The Pitfalls of a Single Monolithic Flow

When starting an ELT project, it’s common to build one or two monolithic flows. These flows often contain dozens of tasks, which can inevitably grow as the solution scales.

The code usually looks then more or less like this: 

##### 1. Task to fetch a list of tables from MS SQL

```sql
@task
def get_table_names(conn_str: str) -> List[str]:
    """
    Connect to an MS SQL database and return a list of tables.
    """
    query = """
    SELECT TABLE_NAME
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
      AND TABLE_CATALOG = DB_NAME()
    """
    with pyodbc.connect(conn_str) as conn:
        cursor = conn.cursor()
        cursor.execute(query)
        results = cursor.fetchall()

    table_names = [row[0] for row in results]
    return table_names
```

##### 2. Task to extract data from a specific table into a DataFrame

```sql
@task
def extract_table_to_df(conn_str: str, table_name: str) -> pd.DataFrame:
    """
    Run SELECT * on the given table and return a Pandas DataFrame.
    """
    query = f"SELECT * FROM {table_name}"
    with pyodbc.connect(conn_str) as conn:
        df = pd.read_sql(query, conn)
    return df
```

##### 3.  Task to write a DataFrame to S3 as a Parquet file

```sql
@task
def write_parquet_to_s3(df: pd.DataFrame, bucket: str, table_name: str):
    """
    Write the given DataFrame as a Parquet file to the specified S3 bucket.
    """

    s3_path = f"s3://{bucket}/{table_name}.parquet"

    df.to_parquet(
        path=s3_path,
        engine="pyarrow",
        index=False,
        storage_options={
            "key": get_secret_from_gcsm("AWS_ACCESS_KEY_ID"),     
            "secret": get_secret_from_gcsm("AWS_SECRET_ACCESS_KEY")},
    )

    return s3_path
```

##### 4. Main Flow orchestrating the above tasks

```sql
@flow
def ms_sql_to_s3_flow(
    conn_str: str,
    bucket: str,
):
    """
    A Prefect flow that loads all tables from MS SQL into S3 as Parquet files.
    """
    # Fetch all table names
    tables = get_table_names(conn_str)

    # For each table, extract and load
    for table_name in tables:
        df = extract_table_to_df(conn_str, table_name)
        write_parquet_to_s3(df, bucket, table_name)
```

At first, this approach might seem efficient. A single flow can ingest all objects from a database in one run—straightforward and convenient, right?

Initially, with just 10 objects in the database, it works well enough. But as the source database grows to 100 or more items, the cracks begin to show. Usually, this approach introduces several significant challenges: 

1. **Difficult Monitoring:** A single failure makes the entire flow as failed, forcing data engineers to dig through logs to identify the problematic element.

![Single Monolithic Flow_difficult monitorig](/src/assets/images/difficult_monitoring.png)

2. **Limited Reusability:** It’s hard to run deployments for one table or only failed objects without re-running the entire flow. 
3. **Reduced Scheduling Flexibility:** Monoflow might require running all tasks together, even when only a subset of tasks needs frequent execution.
4. **SLA Reporting:** Measuring success rates becomes much harder. Reporting on flow run states is unreliable since the failure on one table out of 1,000 causes the whole flow to be marked as failed. Again, this requires digging into logs to measure performance accurately.
5. **Execution Time**: Monolith flows are time-consuming and don’t allow parallel execution, hindering efficiency. 

In essence, a monolithic approach limits observability, reduces performance, and complicates operations. 

## The Case for Granulated, Focused Flows

When it comes to sizing your ELT flows, trust me—you’d rather fight 100 duck-sized horses than one horse-sized duck. In other words, breaking down monolithic flows into smaller, focused units is the key to scaling effectively. 

The first step is modularizing the monolithic flow. Ideally, each deployment flow should represent a single data object. For example, if you’re ingesting data from an SQL database, think about organizing your process to allow for per-table scalability—it might require more time investment but will divide the complexity. 

With the right tools, this approach is not as complex as it sounds. Prefect allows defining deployments with YAML, leveraging project-level default configurations stored under the definitions: key in the prefect.yml file. There are two main ways of using them: 

- using the entire value as-is,
- using part of the pre-defined values (eg. overriding only a single parameter). 

![predefined values for granulated, focused flows](/src/assets/images/predefined_values.png)

This way, you can stick with the pre-defined daily schedule as it is, which makes the deployment creation way easier than it initially seemed. 

Here’s why granular flow deployments are worth the effort: 

1. **Parallelism:** Each table flow can run independently in parallel with others. If one table experiences performance degradation, it does not immediately affect the rest. And yes, it can be included in the monoflow, but why spend time reinventing the wheel? Orchestrator can take care of that.
2. **Monitoring and Error Handling**: If a single table fails, its flow run alone fails. This allows one to quickly identify the failed table, debug it, and restart only that deployment. Also, it helps with monitoring the execution time of a particular table or with tracking data quality issues.
3. **Improved Data Quality Testing:** It’s much easier to enable data quality tests per data object instead of having universal rules. Is it better to have customized tests per column in the data set or check if the set is not null only? 
4. **Incremental Maintenance and Scalability:** Modular flows create clear boundaries. Adding or updating flows for new or modified tables doesn’t necessarily affect existing deployments. Each table’s logic is easier to maintain and evolve in isolation. 
5. **Version Control:** Each deployment can be versioned independently. This makes testing changes for one table more straightforward and also makes the CI/CD implementation easier. 
6. **Team Collaboration:** Different engineers can own specific deployments, making it easier to distribute responsibility and keep changes localized. It’s good to use tags to identify project-related deployments—e.g., it’s possible to have a sales tag in Prefect for sales data-related processes. 
7. **Granular Scheduling**: Some tables need to be refreshed three times daily, but some should be reloaded monthly only. The granular approach allows for more playing with the schedule. 
8. **SLA Reporting:** It’s simpler, as the real situation is shown on the run level, and failure means real failure. 

![granular flow deployments_SLA reporting](/src/assets/images/sla_reporting.png)

## Conclusion

In conclusion, a granular approach to orchestrated deployments is more than just a technical choice—it’s a strategic advantage. By breaking large, monolithic pipelines into focused, modular flows, data teams gain clearer observability, easier troubleshooting, and the flexibility to handle diverse scheduling needs

Focusing on key concerns—performance, reliability, and maintainability—can help you build a better data solution using a granular approach. Over time, this approach will lead to more predictable, scalable, and maintainable ETL processes.
