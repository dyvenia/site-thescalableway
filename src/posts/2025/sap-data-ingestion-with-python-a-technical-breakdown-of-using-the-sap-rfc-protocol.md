---
title: 'Sap Data Ingestion with Python: A Technical Breakdown of Using the SAP RFC Protocol'
date: 2025-09-15 08:00:00
author: Mateusz Paździor
description: Streamline SAP data integration with Python by leveraging the RFC protocol. This interview with the lead engineer of a new SAP RFC Connector explores the challenges of large-scale data extraction and explains how a C++ integration improves stability, speed, and reliability for modern data workflows.
tags:
  - SAP
  - Python
  - Data Integration
  - RFC Protocol
  - Data Engineering
internal_notes: Interview with Dominik Tyrała
---
If you’ve ever tried to get data out of SAP, you know it’s often easier said than done. Manual exports take up a lot of time, standard tools don’t always fit real needs, and moving data into modern analytics or machine learning pipelines can feel like forcing two worlds together.
For years, many teams relied on pyRFC, the official Python library for SAP Remote Function Calls. But with pyRFC being decommissioned, there’s now a real gap for anyone who wants to keep integrating SAP data into Python workflows.
That’s why we’re working on a new Python library to replace pyRFC, focused on making SAP data ingestion easier, more reliable, and better suited for modern data workflows. A connector like this can directly call SAP functions, pull large tables in manageable chunks, and plug that data into Python pipelines. For data engineers, analysts, and developers, this isn’t about high-end tech for its own sake; it’s about saving time, reducing errors, and finally being able to use SAP data in the tools we already work with every day.
To dig into how this actually works, I’ve talked with Dominik ‒ a senior software engineer with more than ten years of experience, a computer science lecturer, and the tech lead of this project. In this conversation, he shares his knowledge, best practices, and lessons learned while building an SAP connector in Python using the RFC protocol.

____________________________________________
