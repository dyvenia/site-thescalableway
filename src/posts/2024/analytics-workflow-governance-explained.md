---
title: Roles in the Context of the Analytics Workflow
date: 2025-03-27T10:47:00
author: Alessio Civitillo
description: Code-based analytics workflows offer a unique advantage - the ability to combine robust collaboration with strict governance. While technically straightforward to implement, this approach only reaches its full potential when aligned with well-adapted business and analytics processes.
tags:
  - governance
  - analytics-workflow
  - roles
internal_notes: No notes
---
An analytics workflow documents the journey from raw data to production-ready data models, encompassing development and testing phases. A critical component is governance, implemented through a Pull Request approval process that facilitates regular code reviews and prevents technical debt accumulation. This structured approach ensures quality and maintainability while supporting collaborative development.

To manage this governance effectively, several roles are typically involved. It's becoming increasingly rare to see a single analyst handle the entire end-to-end process of creating a report or data model. Instead, the trend is moving toward a growing number of specialized roles, each with distinct responsibilities.

![typical code-based analytics workflow](/src/assets/images/blog/analytics_workflow-1.png)

## Key Roles

The analytics workflow involves several key roles, with data analysts playing a particularly key position. Data analysts combine technical skills with deep business domain knowledge, giving them unique insight into business models and challenges.

In contrast, data engineers and data platform engineers typically focus on technical implementation rather than direct business interaction. While aligning the data platform roadmap and investments with business value remains strategically important for leadership, this alignment happens at a higher level and doesn't directly impact the day-to-day analytics workflow operations.

| Role | Tasks |
| --- | --- |
| Data Analyst | - Understand business requirements<br>- Analyze data in intermediate and mart layers<br>- Develop SQL queries and transformations<br>- Create and maintain metadata documentation |
| Data Platform Engineer | - Monitor and support infrastructure resources<br>- Maintain CI/CD pipelines<br>- Manage network infrastructure<br>- Implement cybersecurity measures |
| Data Engineer | - Design and develop data pipelines<br>- Maintain and optimize data flows<br>- Schedule and orchestrate data processing<br>- Implement data ingestion processes |

## Measuring the Impact of Each Role

Because roles usually tackle different problems, it is a good idea to measure performance and impact differently. Measuring how a role is doing is also important for creating rules such as notification rules, issue and incident prioritization rules, and other operational matters to increase the reliability of production.

| Role | Measure |
| --- | --- |
| Data Analyst | - Understanding of business domain<br>- Business Satisfaction<br>- ROI from data initiatives |
| Data Platform Engineer | - Speed of new data platform features<br>- Reliability of the data platform<br>- Data analysts' support and satisfaction |
| Data Engineer | - Speed of new data ingestions<br>- Reliability of data pipelines<br>- Data analysts' support and satisfaction |

## Understanding the Need of Roles

Analytics teams often tend to combine roles or leave them loosely defined. This approach is understandable, and sometimes even beneficial, in the early stages of an analytics initiative. After all, when starting out, the priority is delivering business value quickly, and formal roles and approval processes can slow things down.

However, this lack of clearly defined roles and boundaries typically creates challenges as the analytics function matures. Common issues include:

- Blurred lines between exploratory analytics work and production pipeline operations make it difficult to maintain service levels
- Insufficient knowledge transfer mechanisms, including limited documentation, unclear onboarding processes, and a lack of backup coverage for key roles
- Team friction arising from ambiguous responsibilities and overlapping ownership
- An overemphasis on technical tools and implementation details, rather than addressing the more fundamental needs of role clarity and process alignment

## Working with an external partner

In this workflow, there are already quite a few roles and tasks, and in reality, even more can be involved. For example, handling data privacy in Europe requires a solid understanding of GDPR. Given the range of responsibilities and the breadth of expertise needed to run a data department effectively, many data and analytics teams choose to rely on external partners. However, this isn't always straightforward. External teams often create strong and rigid boundaries between themselves (the extended team) and the customer’s in-house team (the internal team), which can hinder collaboration.

One practical way to navigate the tension between collaboration and rigid boundaries is to establish a clear RACI matrix from the very beginning. This matrix serves as a shared reference to define roles and responsibilities, helping both internal and extended teams understand who is Responsible, Accountable, Consulted, and Informed for each task. It provides structure without creating silos, enabling smoother handovers and aligned expectations.

![RACI Matrix](/src/assets/images/blog/RACI_analytics_workflows.png "Example of RACI Matrix in the Analytics Workflow")

## Conclusions

A well-structured analytics workflow is essential for turning raw data into reliable insights. As analytics initiatives mature, the need for governance, role clarity, and collaboration becomes increasingly important. Specialized roles such as data analysts, data engineers, and platform engineers each contribute unique expertise, and their impact should be measured differently to reflect their responsibilities.

Clearly defined roles and processes—such as code reviews, CI/CD practices, and RACI matrices—not only support governance and maintainability but also foster collaboration across internal and external teams. While early-stage flexibility is useful, long-term success in data and analytics depends on thoughtful structure, cross-functional alignment, and a shared understanding of who does what, and why.

### Resources

- [Example of RACI Matrix](https://docs.google.com/spreadsheets/d/1UFddBx-2mKSE8h-TypmYH4sdM7HN2B6TWr0AgWqzLcU/edit?usp=sharing)
