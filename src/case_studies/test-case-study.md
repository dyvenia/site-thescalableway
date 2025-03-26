---
title: A case study
date: 2025-02-24T10:58:00
author: Alessio Civitillo
description: Learn why modularity is crucial for building scalable, efficient data architectures. This article covers the core components of modern data platforms, from ingestion to governance, and shares best practices for flexibility, interoperability, and security.
tags:
  - case-study
internal_notes: |-
  **Audience:**

  - Data Analysts looking to improve their analytics workflows
  - IT Professionals building a data platform
  - D&A Directors
  - Head of Data Engineering

  **Purpose** (What is the purpose of this article?):

  The purpose of this article is to explain what a data platform is. We want to give confidence to the reader in our reference architecture by explaining a bit of the history of data platforms and then giving some thoughts around modularity. Some readers might come from a more classic IT background, and they might have different terminologies, such as OLAP cubes, data warehouse, and cubes. We want the reader to not only understand the typical modern data platform reference architecture, which is everywhere now but also to understand the importance of modularity and good design decisions. 

  **Outline:**

  - Introduction
  - History of data platforms: from OLAP cubes, to Hadoop, to Lakehouses
  - Reference architecture of a modern and modular data platform
      - Data Sources
      - Ingestion
      - Landing
      - Preparation
      - Modelling
      - Consumption
  - Understanding modularity in the context of data platforms
      - Components and Interfaces before tools
      - Workflows and Developer Experience
      - Data governance and security
  - Conclusions
---
Modern data analytics can get complicated. With an abundance of tools, conflicting methodologies, and ever-evolving technologies, mistakes can be costly. However, at its core, data analytics remains grounded in a few fundamental principles. Understanding these fundamentals while leveraging modular and well-designed data platforms can significantly improve operational efficiency and decision-making.

## **History of Data Platforms: From OLAP Cubes to Hadoop to Lakehouses**

The evolution of data platforms has been driven by two primary goals.
