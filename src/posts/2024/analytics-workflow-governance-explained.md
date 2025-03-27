---
title: Analytics Workflow Governance Explained
date: 2025-03-27T10:47:00
author: Alessio Civitillo
description: Code-based analytics workflows offer a unique advantage - the ability to combine robust collaboration with strict governance. While technically straightforward to implement, this approach only reaches its full potential when aligned with well-adapted business and analytics processes.
tags:
  - post
internal_notes: No notes
---
Intro

![](/src/assets/images/blog/mermaid-diagram-2025-03-27-102930.png)

## Roles

The analytics workflow involves several key roles, with data analysts playing a particularly key position. Data analysts combine technical skills with deep business domain knowledge, giving them unique insight into business models and challenges.

In contrast, data engineers and data platform engineers typically focus on technical implementation rather than direct business interaction. While aligning the data platform roadmap and investments with business value remains strategically important for leadership, this alignment happens at a higher level and doesn't directly impact the day-to-day analytics workflow operations.

| Role | Tasks |
|:-----|:------|
| Data Analyst | - Understand business requirements<br>- Analyze data in intermediate and mart layers<br>- Develop SQL queries and transformations<br>- Create and maintain metadata documentation |
| Data Platform Engineer | - Monitor and support infrastructure resources<br>- Maintain CI/CD pipelines<br>- Manage network infrastructure<br>- Implement cybersecurity measures |
| Data Engineer | - Design and develop data pipelines<br>- Maintain and optimize data flows<br>- Schedule and orchestrate data processing<br>- Implement data ingestion processes |
