---
title: 'SAP Data Ingestion with Python: A Technical Breakdown of Using the SAP RFC Protocol'
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

**______**

#### **Can you give us a general overview of how SAP RFC works?**

SAP Remote Function Call is a communication mechanism that allows one system to execute functions in another system as if they were local calls. It is primarily used to integrate different SAP modules, connect SAP with external applications, and support distributed processing. RFC works by exposing specific function modules in SAP that are marked as “remote-enabled,” meaning they can be invoked across system boundaries. When an RFC is triggered, the caller system packages the request, sends it over the network, and waits for a response (in synchronous mode) or continues processing without waiting (in asynchronous mode). This approach provides a standardized and reliable way for SAP systems and external programs to exchange data and trigger business logic, making RFC a cornerstone of SAP interoperability.

![sap rfc communication](/src/assets/images/blog/SAP_RFC.png)

#### **What are some of the challenges of using SAP RFC to ingest data with Python?**

One of the main challenges of using SAP RFC for ingesting data with Python is handling the very large data volumes that SAP tables can produce. RFC itself has technical limitations, such as row size restrictions such as: 

- **Row size limitations**
    - The 512-character per-row restriction in RFC_READ_TABLE means wide tables with many columns need to be split across multiple queries.
    - Reconstructing the full row in Python requires careful mapping of column segments.
- **Volume and performance**
    - Extracting millions of rows can be slow and may degrade SAP system performance if not throttled.
    - Network latency and RFC protocol overhead can become bottlenecks for very large datasets.
    - Lack of streaming support means all results are buffered in memory, risking **high RAM usage** in Python.
- **Pagination and batching**
    - Since RFC has no built-in pagination, developers need to implement logic to fetch data in smaller chunks.
    - Requires careful handling of row offsets and consistency to avoid duplicates or missing records.
- **Data type handling**
    - SAP tables contain many proprietary data types (e.g., RAW, DEC, DATS, TIMS) that need explicit conversion to Python types.
    - Inconsistent formatting (e.g., leading zeros, fixed-length fields) can require custom parsing logic.
- **Error handling and robustness**
    - Large queries can lead to timeouts or aborted RFC sessions.
    - Error messages from SAP may be cryptic and require domain knowledge to interpret.
    - Retry logic and fault tolerance are not built in and must be handled in the Python layer.
- **Security and access restrictions**
    - Not all tables are directly accessible due to SAP authorization profiles.
    - RFC users often have limited permissions, which may block some required data.
- **Alternative interfaces**
    - RFC_READ_TABLE is convenient but not officially intended for large-scale data extraction.
    - In some cases, more efficient solutions (e.g., SAP OData services, CDS views, or custom ABAP reports) may be required instead of RFC.
- **Connection/session handling**
    - With Python’s pyrfc, each call often opens a new RFC session, and connections can drop unexpectedly if not managed carefully. This leads to overhead in session initialization and can cause instability in long-running jobs.
    - A custom C++ connector can maintain a **persistent session** without frequent disconnects, providing more stability and efficiency for large-scale or continuous data ingestion.

This means developers must implement batching, efficient memory handling, and sometimes parallelization to make ingestion practical. Without these techniques, performance can degrade quickly, and data may be truncated or lost during transfer, making large-scale SAP-to-Python integration non-trivial.

#### **Can you explain how you interface a C++ library with Python?**

Interfacing a C++ library with Python involves creating a thin wrapper layer that makes the C++ functions and classes look like native Python objects. To achieve that, we use **pybind11,&#32;**which handles this translation by generating a Python extension module that directly calls into the compiled C++ code. Once built, the module can be imported into Python just like any other package, allowing Python code to invoke high-performance C++ logic seamlessly. This approach avoids costly inter-process communication and provides a clean way to combine Python’s flexibility with the speed and efficiency of C++. 

#### **How can ingestion speed be optimized?**

Ingestion speed from SAP via RFC can be optimized by designing smart calls that minimize the number of round-trip calls to the SAP system. Instead of pulling entire tables blindly, it’s often more efficient to filter data at the source, select only the required columns, and batch large queries into manageable but sizable chunks. This reduces overhead and avoids overwhelming the Python client with too many small calls. Another common strategy is to push down as much logic as possible into SAP—using where clauses, ranges, or custom remote-enabled function modules—so that Python only receives the data that is truly needed. By shrinking the number of SAP calls in this way, the integration pipeline becomes more efficient, faster, and less resource-intensive on both ends.

#### **Why do you consider pyRFC “slow” when it comes to data ingestion?**

pyRFC is not inherently “slow” for small to medium RFC calls, but it becomes inefficient when used for large-scale data ingestion from SAP tables. Several factors contribute to this:

- **Session management overhead**
    - pyRFC often opens and tears down RFC sessions per call, rather than maintaining a long-lived persistent session. This adds noticeable latency when thousands of calls are required for wide or paginated tables.
- **Row size and query splitting**
    - Because of the 512-character row size limitation in RFC_READ_TABLE, wide tables must be split into multiple queries. In pyRFC, reconstructing results requires extra calls and significant Python-side processing, slowing ingestion.
- **Serialization and conversion costs**
    - SAP data types (e.g., packed decimals, dates, times, raw fields) must be converted into Python objects. This conversion layer, implemented in Python, adds overhead compared to a native C++ implementation.
- **Global Interpreter Lock (GIL)**
    - Python’s GIL prevents true multithreaded parallel RFC calls within the same process. This limits scalability for high-throughput extraction workloads unless you resort to multiprocessing (which adds its own overhead). We are trying to jump over this problem using C++ library.
- **Error recovery and retries**
    - pyRFC connections may drop unexpectedly under load, requiring reconnections and retries. This increases latency compared to a C++ connector that maintains stable sessions.

In contrast, a native C++ RFC client avoids much of this overhead by:

- Keeping a persistent connection/session.
- Handling large data more efficiently with lower-level memory management.
- Offering faster type conversions without Python’s object allocation overhead.

#### **Can incremental ingestions be done using SAP RFC? If yes, how?**

Incremental ingestions with SAP RFC are not straightforward, because RFC itself is just a transport mechanism and doesn’t provide built-in change tracking. In most cases, you cannot simply ask RFC for “only new or updated records” unless the underlying SAP function module or table has fields that can support this, such as timestamps or change indicators. If those exist, you can design your RFC queries in Python to fetch only rows newer than the last ingestion run, effectively simulating incremental loading. Otherwise, true incremental ingestion is better handled through SAP’s dedicated frameworks like ODP (Operational Data Provisioning) or CDS views, which are specifically designed for delta handling. So while basic RFC on its own doesn’t guarantee incremental ingestions, with careful design and the right SAP data sources, it can sometimes be approximated.

#### **Can you give us a couple of code examples in Python on ingesting the data?**

**Connection:**

```python
def con(self) -> sap_rfc_connector.SapRfcConnector:
    """The C+++ connection to SAP."""
    if self._con is not None:
        return self._con
    con = sap_rfc_connector.SapRfcConnector(**self.credentials)
    self._con = con
    return con
```

**Call:**

```python
def call(self, func: str, *args, **kwargs) -> dict[str, Any]:
    """Call a SAP RFC function."""
    func_caller = sap_rfc_connector.SapFunctionCaller(self.con)   
    result = func_caller.smart_call(func, *args, **kwargs)

    return result
```

**One of the approaches to avoid pandas for the data ingestion (POC):**

```python
# Check and skip if there is no data returned.
try:
    if response["DATA"]:
        logger.debug("checking data")
        if print_regular:
            print_regular("checking data")
        record_key = "WA"
        data_raw = np.array(response["DATA"])
        
        # Save raw data to CSV file immediately
        logger.debug(f"Saving {len(data_raw)} rows to CSV file...")
        if print_regular:
            print_regular(f"Saving {len(data_raw)} rows to CSV file...")
        with open(temp_csv_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.writer(csvfile)
            # Write header
            writer.writerow(fields)
            # Write data rows
            for row_data in data_raw:
                try:
                    split_data = row_data[record_key].split(sep)
                    if len(split_data) == len(fields):
                        writer.writerow(split_data)
                    else:
                        logger.warning(f"Row data length mismatch: expected {len(fields)}, got {len(split_data)}")
                except Exception as e:
                    logger.error(f"Error processing row: {e}")
                    continue
        
        logger.debug(f"Saved data to {temp_csv_path}")
        if print_regular:
            print_regular(f"Saved data to {temp_csv_path}")
        del response
        del data_raw
except Exception as e:
    logger.error(f"Error: {e}")
    if print_regular:
        print_regular(f"Error: {e}")
    break
```

**_________**

#### **Conclusion**

Dominik’s perspective makes it clear that working with SAP data through RFC is full of opportunities, but far from straightforward. From row size limits and type conversions to performance tuning and incremental loading, every step has its own challenges. His approach ‒ combining Python with a C++ connector, careful batching, and smart query design ‒ shows what it takes to make ingestion both reliable and efficient.

With pyRFC being decommissioned, these insights feel especially timely. They point to what’s needed in the next generation of connectors: tools that handle scale gracefully, integrate naturally into Python workflows, and make SAP data easier to work with daily.
