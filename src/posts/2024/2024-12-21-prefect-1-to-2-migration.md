---
title: "Prefect 1.0 to 2.0 Migration: Motivation, Process  and Workflow"
date: 2024-12-21
author: Alessio Civitillo
description: This article outlines the motivation and steps for migrating from Prefect 1 to Prefect 2. Additionally, it provides guidance on how to coordinate work between teams to ensure the migration is performed with zero downtime
tags:
  - prefect
---
Prefect 1.x was the original version of Prefect, a data orchestration platform designed to streamline the development, scheduling, and monitoring of workflows. It used a monolithic server that acted as an API layer and a task scheduler.
 
Prefect 2.x brings several architectural changes that offer a more flexible, scalable, and cloud-native solution for orchestrating workflows. With the focus on Kubernetes, containers, and a more modular API, Prefect 2.x aims to be a better fit for modern cloud infrastructure and CI/CD pipelines.
 

## Why Migrate?

- **Scalability**: Prefect 2.x offers better scalability through dynamic task mapping and execution in various environments (Kubernetes, Docker).
- **Scheduling**: Prefect 2.x introduces more powerful scheduling and retry logic.
- **Cloud-Native**: Enhanced integration with cloud-native tools, such as Kubernetes, and an improved deployment model.
- **Flexibility**: Granular control over deployments and orchestration.
 

### Key Differences Between Prefect 1 and Prefect 2

##### Architecture Changes

Prefect 1.x used a single monolithic server and agent system for managing workflows and executions.
Prefect 2.x introduces a new flow/task-level orchestration model that allows to define flows and tasks independently and deploy them in any execution environment.
 
In Prefect 2.x:
Flows are now first-class objects, and they represent the unit of orchestration.
Tasks are now defined using the @task decorator and must be explicitly invoked inside a flow.
 

##### API and SDK Changes

Task and Flow Definitions:
Prefect 1.x:

Prefect 2.x:

The flow and task decorators in Prefect 2.x are now separated and function differently, with flows now being instantiated as objects that can be managed with deployments.
 
State Management: Prefect 2.x has introduced a more granular approach to task states, handling retries, failure states, and task dependencies with greater flexibility.
 

##### Configuration and Deployment

Prefect 1.x: Deployment was managed through Prefect Cloud or a local server instance.
Prefect 2.x: The deployment model has changed, with deployments being independent from the core orchestration engine. It’s possible to define and deploy flows via the prefect deployment CLI commands or programmatically, giving more control over the environment and resources used.
 

##### Scheduler and Triggering

Prefect 1.x used the traditional cron-based scheduler or periodic triggers.
Prefect 2.x uses more sophisticated scheduling tools, such as IntervalSchedule and CronSchedule, which are easier to configure and integrate with cloud services.
 

### Migrating to Prefect 2.x

 
The following tasks must be completed as part of the migration process to ensure a smooth and successful transition.
 
3.1 Task 1: Refactor Existing flows
Update Decorators: Transition from @prefect.task to @task, and from @prefect.flow to @flow.
 
Refactor Flows and Tasks: Replace the previous flow/task construction with Prefect 2.x’s object-oriented API. For example, the following code will be modified:
 
Prefect 1.x:

```python
from prefect import task, Flow

@task
def my_task():
	return "Hello Prefect!"

with Flow("my_flow") as flow:
	my_task()
```

 
Prefect 2.x:
 
 
 
3.2 Task 2: Introduce mechanisms to Monitor, Logging, Error Handling and Debugging
Monitoring and Logging
Prefect 2.x has integrated support for enhanced logging and monitoring with built-in UI features, including task logs, flow run details, and system health reports.
 
 
Error Handling and Debugging
Prefect 2.x has more fine-grained control over retries and error handling, specifying retry logic for tasks:
 
 
Performance Optimization
Prefect 2.x allows for dynamic task mapping, which helps speed up workflows by running tasks in parallel:
 
 
 
 
3.3 Task 3: Create the New Deployment Model
Prefect 2.x introduces a deployment-first model. After refactoring the flows, deploy them using the new deployment commands or coding syntax:
 
Deployment considerations:
Identify the infrastructure across the work pools and locate the code that executes on that infrastructure within the block storage. Specify the appropriate repository where the flow code is located.
Do not include logic in the deployment, as it will only take effect at the time of deployment. All logic must be contained within the flow itself (e.g., date management).
If changes are made to the flow without altering the interface, there is no need to redeploy.
 
3.4 Task 4:  Create Scripts to automatize argument changes and update deployments.
To manage hundreds of deployments, scripts are required to automate the following tasks:
Deploying based on project or flow.
Modifying arguments used to select the environment.
Activating or deactivating deployments by project.
 
3.5 Task 5:  Flows and Deployments Tests
Debug a flow:
From flow_name.py, make a call to the flow with the arguments to be tested, and run it locally from a local container. Consider the data volume—use a sample if the dataset is too large—and adjust the container's RAM size to optimize it for deployment in the cloud later.
 
Test a deployment:
o   From the local container, log in to the Prefect environment (prod/dev).
o   Within the deployment code:
§  Update the work queue and work pool names.
§  Update the ADLS credentials secret.
o   In the Prefect UI, navigate to the storage block and set the correct production branch (main).

 
Set Notifications:

1.  	Define Trigger Events:
Use Prefect's event triggers or monitor task/flow state transitions. Specifically:
o   Failed state for deployments (e.g., using a StateHandler or flow/task callbacks).
o   Infrastructure health issues can be detected by external monitoring integrated into Prefect flows or by inspecting execution logs.
 
2.  	Specify Notification Channels:
Use Prefect's Notification Blocks (e.g., Slack, email):
o   Configure these in the Prefect UI under Blocks.
o   Example: Slack Notification Block to send messages on failures.
 
 
3. Common Migration Issues and How to Resolve Them
4.1 Task State Issues
In Prefect 1.x, task states were relatively simple. In Prefect 2.x, the task state model is more granular, including states like Pending, Running, Failed, Success, and custom states.
 
Solution:
Ensure that all state transitions are handled by explicitly managing the state attribute or utilizing retry logic in the tasks.
 
4.2 API Incompatibilities
In Prefect 2.x, some features from Prefect 1.x may have been deprecated or replaced with newer approaches. For example, the Prefect Cloud API for task state is different in Prefect 2.x.
 
Solution:
Check the Prefect 2.x Migration Guide for detailed instructions on replacing deprecated API calls.
 
4.3 Kubernetes Integration
When moving to Kubernetes, issues related to configuring the Kubernetes pods for Prefect 2.x’s new agent system.
 
Solution:
Ensure that the Prefect Kubernetes agent is properly set up in the Kubernetes cluster. This can be done by running the prefect-agent in a Kubernetes environment, which listens to Prefect server and schedules work accordingly.
 
4.4 Scheduler Configurations
The transition from the old scheduler to the new scheduling system in Prefect 2.x can lead to errors in cron jobs or task schedules.
 
Solution:
Double-check the cron syntax, and ensure that the IntervalSchedule and CronSchedule are configured correctly.
 
4. Conclusion
Migrating from Prefect 1.x to Prefect 2.x can be an involved process, but the flexibility, scalability, and performance improvements offered by Prefect 2.x are well worth the effort. With better integration into cloud-native tools, an object-oriented approach to flows and tasks, and improved scheduling and retry logic, Prefect 2.x provides a future-proof solution for orchestrating modern data flows.
 

2       Zero-Downtime Migration Workflow Between Teams
 

1. Planning Phase
1.1 Define the Migration Scope
Identify the flows to be migrated, including their dependencies and critical components.
If the migration impacts only a specific part of the data architecture, ensure that the data is delivered in the same format and with the same artifacts as the old version to guarantee a seamless transition. If the refactored flows include new connectors, it may be necessary to implement glue code to maintain this seamless transition.
Understand the system architecture of the flows in both the old and new environments.
Define team responsibilities: Identify which teams are accountable for each stage of the migration process.
 
1.2 Set Clear Milestones
Migration phases: Divide the migration into multiple phases—small increments of changes, where each phase can be tested and validated.
Monitor checkpoints: Define key checkpoints to ensure that each migration stage completes successfully without affecting operations.
 Set timelines: Define expected timelines for each phase of the migration.
 
1.3 Design for Backward Compatibility
Dual Environment Setup: Implement a dual-environment setup where the old and new systems can run in parallel. This ensures that if there’s any issue during the migration, the old system can continue functioning while troubleshooting occurs.
Example:
If the migration affects flows responsible for ingesting data into ADLS, Prefect 1 and Prefect 2 flows can run in parallel, loading data into different ADLS environments. Prefect 1 flows will load data into the Production ADLS, while Prefect 2 flows will load data into the Development ADLS. The switch to the Production ADLS will only occur after all validation mechanisms have been successfully completed.
 
When transitioning to the Production ADLS, Prefect 1 flows must be unscheduled, allowing Prefect 2 flows to take full control of data ingestion. However, if a failure is detected, it is possible to switch back to Prefect 1, rerun the flow there, and recover the missing data until the issue is resolved.
 
The schedules for flows in Prefect 2 must differ from those in Prefect 1 to avoid multiple flows accessing the same API simultaneously, which could overwhelm the API. This approach is necessary while both systems run in parallel. Once Prefect 2 transitions to Production and Prefect 1 is unscheduled, the schedule for Prefect 2 can either be updated to the correct one or continue with the existing schedule if it remains suitable.
 
2 Execution Phase
2.1 Incremental Migration Approach
·       Implement versioned deployments: In each phase of migration, deploy incremental changes rather than complete overhauls. This could mean migrating one flow at a time, so the other ones remain unaffected.
·       Deploy new code in stages: When migrating flows, deploy new flows incrementally so the previous flow continues to run as normal: pointing to dev infra, dev adls, sandbox tables, versioned container.
 
2.2 Monitoring and Real-time Feedback
·       Active monitoring: Monitor both systems (old and new) to ensure that each migration phase is successful. This includes system metrics, logs, and task success/failure statuses.
o   Use tools such as Prometheus, Grafana, or Datadog to track metrics.
·       Real-time feedback: Have a dedicated team or set of tools for real-time monitoring and feedback on the new system's performance.
 
2.3 Error Handling and Rollbacks
·       Error detection: If the new system encounters an issue, automatically switch traffic back to the old system to ensure no impact on operations.
·       Graceful rollbacks: Ensure that it’s possible to roll back to the previous version (old flow) if an error occurs without affecting the overall system.
 
 
3 Post-Migration Phase
3.1 Continuous Validation and Monitoring
·       Run Validation Tests (samples, cols name): After migrating, validate that all flows and services are functioning as expected. This includes end-to-end tests for data pipelines, integrations, and error handling.
For example, within the ingestion layer, where data flows from the data source to ADLS, a parallel architecture can be implemented: Prefect 1 pointing to the Production ADLS, and Prefect 2 pointing to the Development ADLS. There are two levels of validation:
2.      Path Validation
o   The paths where data is loaded into the Production and Development ADLS must be identical.
o   Note: If the file name includes a timestamp, remove the date portion before performing the comparison.
3.      Data Frame Validation
o   Ensure that the number of rows in the Development ADLS matches the order of the values extracted from the Production ADLS.
o   Verify that all columns in the Production data are present in the Development data. Any differences can be attributed to new columns added in the updated flow version.
 
·       Post-migration health checks: monitor the systems for any unexpected behaviour, such as degraded performance or task failures.
 
3.2 Feedback Loop
·       Gather feedback from stakeholders and teams to ensure that the migration process is smooth and that all concerns are addressed.
·       Document any issues that arise and update the migration plan accordingly for future phases.
 
3.3 Deprecate Old System
·       Once the new system has been fully validated, and all the flows are running without issues, decommission the old environment.
·       Post-migration cleanup: Clean up resources (servers, databases, configurations) used by the old system to avoid unnecessary costs and complexity.
 
4 Best Practices for Zero-Downtime Migration
4.1 Ensure Strong Communication Between Teams
·       Regular meetings: Hold regular coordination meetings with the teams involved in the migration to keep everyone aligned on progress, challenges, and expectations.
·       Documentation: Maintain clear documentation of the migration process, any changes, and team responsibilities.
 
4.2 Automate Rollbacks
·       Implement automated rollback mechanisms in case the new system experiences issues. This can reduce the time it takes to revert to the old system, ensuring minimal downtime.
 
5 Example: Zero-Downtime Migration Between Teams in Prefect
In the context of migrating data pipelines from Prefect 1 to Prefect 2 with zero downtime:        	
Dual-Environment Setup:
Run Prefect 1 and Prefect 2 agents concurrently. This allows the new flows to be tested and deployed in Prefect 2 while the old flows continue to execute in Prefect 1.
Incremental flow Migration:
Start by migrating a small set of flows (e.g., non-critical data pipelines) to Prefect 2.
Gradually increase the number of migrated flows after validating the new environment (new container/connector).
Monitoring and Failover:
Continuously monitor the status of flows in both Prefect 1 and Prefect 2.
Implement automated failover to the old system if workflows in Prefect 2 encounter issues.
Communication and Rollback:
Keep all stakeholders informed and have a rollback plan to Prefect 1 if migration steps fail.
 
Final Cutover:
Once Prefect 2 is fully operational, stop Prefect 1 workflows and switch to Prefect 2 for all future runs.

6 Conclusion
Zero-downtime migration requires meticulous planning, careful execution, and proactive monitoring. By adopting strategies such as incremental migration, dual-environment deployment, real-time monitoring, and automated rollback mechanisms, teams can successfully migrate workflows without impacting day-to-day operations.
As recap, the chart shown below represents a state-flow of the migration process:
