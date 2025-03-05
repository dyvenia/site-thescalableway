---
title: 'Organizing Networking for Data Platforms: Key Connectivity Options'
date: 2025-03-05T09:50:00
author: Karol Wolski
description: Optimize your data platform by making informed networking decisions. This article explores how networking impacts ELT workflows, covering key connectivity options, security considerations, and best practices. Learn how to design a secure, scalable, and high-performing data platform architecture with the right networking.
tags:
  - networking
  - data platform architecture
  - elt process
  - connectivity
internal_notes: |-
  **Audience:**

  People missing basic networking knowledge:

  - IT Professionals building a data platform
  - D&A Directors
  - Head of Data Engineering

  **Purpose** (What is the purpose of this article?):

  The purpose of this article is how networking in Data Platform can be organised. We want to give confidence to the reader with explaining option by option, to enable them in discussion with us regarding new connections for Data Platform or migration plan to the new one.

  **Outline:**

  - Introduction
  - Data Platform Networking Reference Architecture
      - Extract Phase
      - Load and Transform Phase
      - Data Consumption
  - Application layer security
  - Networking Options
      - Public Access
      - Public Access with Access Control List (ACL)
      - VPC Peering
          - Single project
          - Separate projects
      - Site-to-site VPN
      - Other Networking Possibilities
  - Conclusions
---
A poorly designed network can cripple even the most advanced data platform. Slow queries, failed data transfers, and security vulnerabilities often stem from overlooked networking decisions. Yet, networking remains one of the least understood aspects of data architecture. 

The Extract, Load, and Transform (ELT) process has become the standard for data integration. It enables organizations to move raw data from source systems to destinations like data warehouses, where it can be analyzed using Business Intelligence (BI) tools. While many aspects of this process deserve attention, networking is a critical yet often underestimated component.

Building a data platform that supports ELT processes requires a clear understanding of **how all components communicate**. Whether implementing an on-premise solution with open-source tools, leveraging cloud providers, or utilizing SaaS or PaaS solutions, the common thread is the need for seamless connectivity between all elements. 

In this article, we’ll explore the options of organizing networking in data platforms, covering key connectivity options, security considerations, and best practices. To lay the groundwork for our discussion, let's first examine the optimal organization of a data platform.

## Data Platform Architecture and Networking

The below diagram presents the reference architecture for the ELT process as a whole, outlining the key components and workflows involved. Each stage has its own phases, with Ingest being part of data extraction, Land being the process of loading data, and Prepare with Model being transformation.

![data platform architecture](/src/assets/images/blog/Modular_Data_Platform.png)

To better understand how networking ties into a data platform, let's examine a second diagram, which shifts focus to the networking aspects of the data platform architecture.

![data platform networking](/src/assets/images/blog/data_platform_networking.png)

The diagram illustrates various components of a data platform, each requiring network configuration to ensure smooth and secure data movement. At the core of our setup is **workflow orchestration**, which manages the data integration process. Tools like **Prefect**, **Airflow,** or **Azure Data Factory** can handle this, running data flows across various stages.

#### **Extract**

The initial phase of the **ELT (Extract, Load, Transform)** process is data extraction. Every data platform needs to gather data from external systems, represented as “data sources" in the diagram. To access resources from a private environment, we need to use a gateway that allows us to reach external resources. This could be:

- **Internet Gateway** - For accessing public resources.
- **NAT Gateway** - Allow resources in private subnets to connect to services outside the private network.
- **VPN Gateway** - Establishes a secure tunnel with private resources within a different network of our organization or a partner.

#### **Load**

Once extracted, data needs to be loaded into a central repository—typically a **Data Warehouse**. This can be hosted within the same network as the workflow orchestration tool or exist as an external resource. 

- **Same Network:** Configuration is simpler as the same team is likely responsible for setting up both components along with networking.
- **External Resource**: Requires additional networking considerations, but the same principles apply—ensuring secure, reliable connectivity.

#### **Transform**

The **Transform phase** follows a similar working pattern, as the workflow orchestration tool needs access to the Data Warehouse. The same resources need to communicate with each other, regardless of whether it's the Load or Transform phase.

#### **Data Consumption**

The final stage is **data consumption**, where users and tools query the Data Warehouse. Given that sensitive information such as Client Identifying Data (CID) may be stored, secure connections are essential. BI tools, accessible by data platform consumers, need controlled access to the Data Warehouse. Such tools are often managed by a different team from those responsible for data gathering, loading, and transformation.

## Application Layer Security

When discussing the networking aspects of data platforms, it's essential to understand the context within the **OSI (Open Systems Interconnection)** model. This article primarily focuses on the **Network Layer (Layer 3) and Transport Layer (Layer 4)**—the backbone of data connectivity. These layers handle IP addressing, routing, and basic connection establishment, forming the foundation for gateways and other networking components.

However, security doesn’t stop at the network level. The **Application Layer (Layer 7)** plays a critical role in securing data and applications. While this article centers on network infrastructure, robust Layer 7 security is just as important. Common security measures include:

- **OAuth** for secure authorization
- **Mutual TLS (mTLS)** for encrypted, authenticated communication
- **Basic authentication** for simple access control
- **API gateways** for managing and securing API access
- **Web Application Firewalls (WAF)** for protecting against application-level attacks

Regardless of network configuration, Application Layer security should always be implemented. A key principle to remember is that the weaker the Layer 7 security measures, the stronger the network-level controls must be to compensate. This inverse relationship between application-level and network-level security is key to maintaining overall system integrity.

That's why, while our focus remains on network infrastructure, a holistic approach to data platform security should consider all relevant OSI layers, especially when dealing with sensitive data and critical business intelligence tools.

With this foundation in place, let's dive into the specific networking options available for securing your data platform.

## Connectivity Options

While there are many possible approaches to networking configurations, we'll focus on the most common scenarios applicable to the majority of data platform use cases:

- **Public access**
- **Public access with Access Control List (ACL)**
- **VPC peering** (within a single project and multiple ones)
- **Site-to-site VPN**

We'll explore each in detail, followed by a brief discussion of additional networking possibilities.

### Public Access

Public Access is the **least secure** networking option, as it does not restrict access at the network level. Resources residing in a private network are configured to access the internet, while the target resource has no network security applied. This doesn't necessarily mean the resource is available to anyone, as Application Layer security may still be in place. However, from a networking perspective, access is unrestricted.

This configuration exposes resources to potential attacks, as malicious actors can easily reach them and attempt to bypass application security. Whenever possible, such unrestricted access should be avoided.![public access network](/src/assets/images/blog/public_access.png)

That said, Public Access remains the best option for **specific, low-risk data sources**, such as:

- Exchange rates for currencies
- Stock market prices
- Other publicly accessible data needed in ELT pipelines

To mitigate risks associated with Public Access, organizations can implement additional security measures within their private networks. For instance, they can configure a **firewall** to block access to all public resources except those explicitly whitelisted. This approach adheres to the principle of least privilege, ensuring only necessary connections are allowed.

By implementing such measures, organizations can balance the need for access to public data sources with maintaining a secure network environment.

### Public Access with Access Control List (ACL)

When a system is publicly available, in addition to securing access through Application Layer security controls, we can implement networking mechanisms to expose the system only to a limited group of servers or users. An **Access Control List**, often referred to as a whitelist, is a security mechanism implemented on the publicly available target system. While the simplest scenario involves allowing access for specific IP addresses, ACLs offer more sophisticated options, including:

- Source and destination IP addresses
- Port numbers
- Network protocols (e.g., TCP, UDP, ICMP)
- Time ranges for when the ACL is active

![Public Access with Access Control List network](/src/assets/images/blog/public_access_with_acl.png)

For ACLs to be effective, the system must have **a fixed IP address**. If this cannot be guaranteed, **more secure alternatives like Site-to-Site VPN** should be considered.

ACLs can be implemented at multiple levels, including routers, firewalls, or other network devices, providing a layered approach to security. Additionally, ACLs can be used for both inbound and outbound traffic, allowing for fine-grained control over data flow in both directions.

However, while they enhance security, they should not be relied upon as the sole protection mechanism—they work best alongside other security measures, such as authentication, encryption, and regular security audits. 

### VPC Peering

For cloud environments, **VPC (Virtual Private Cloud) Peering** allows direct, private network connections between different cloud resources without exposing traffic to the public internet

Since cloud providers use different naming conventions (AWS: accounts, Azure: subscriptions, GCP: projects), we’ll use the term "project" to refer to these organizational units.

**VPC peering** should be considered the default network configuration for resources within the same cloud provider, regardless of the specific implementation option.

The implementation process varies depending on whether the VPCs are located within the same project or separate ones. Therefore, we will discuss these scenarios separately to highlight their unique characteristics and requirements.

#### VPC Peering within a single project

Connecting two networks within the same project is a streamlined process. It requires no additional permissions and can be configured entirely from a single account. This peering effectively extends the network, making all resources in the peered network accessible from the first network.

As with other networking options, additional firewall rules or ACLs can be implemented to restrict access directionality or limit connectivity to specific services.

![VPC Peering within a single project](/src/assets/images/blog/vpc_peering_single.png)

#### VPC Peering across separate projects

When peering VPCs between different projects, additional security and administrative steps are required:

- Cross-project peering permissions must be explicitly granted.
- Approval is needed from administrators in both projects. 
- Firewall rules must be configured in each project to enable cross-project traffic. 

Despite these additional requirements, VPC Peering remains the most secure and efficient method for connecting resources within the same cloud provider, offering greater control and reduced exposure compared to internet-based connections. 

![VPC Peering across separate projects](/src/assets/images/blog/vpc_peering_seperate.png)

### Site-to-site (S2S) VPN

Site-to-Site VPN is a secure networking solution that connects two or more separate networks, typically in different physical locations, enabling them to communicate as if they were directly connected. This technology creates an encrypted tunnel over the public internet, allowing organizations to securely link their geographically dispersed offices, data centers, or cloud resources.

![site to site vpn](/src/assets/images/blog/site_to_site_vpn.png)

Key aspects of Site-to-Site VPN:

- **VPN Gateways:** Specialized devices or software applications are deployed at each network endpoint to act as tunnel terminators.
- **Encryption:** Data is encrypted before entering the VPN tunnel and decrypted upon reaching its destination, ensuring confidentiality during transit.
- **Tunneling Protocols:** Protocols like IPsec establish the secure tunnel and manage encryption/decryption processes.
- **Routing Configuration:** Network administrators configure routing to direct traffic through the VPN tunnel instead of the public internet.

A Site-to-Site VPN is one of the most secure ways to connect resources across different locations. While the tunnel relies on public internet infrastructure, all traffic is encrypted, ensuring that data cannot be decrypted without the secret key used to establish the connection.  Because of this, securely sharing the secret key is crucial and should never be transmitted through unencrypted channels. With strong encryption and secure key management, Site-to-Site VPN provides an excellent solution for organizations requiring high levels of data protection and privacy across geographically dispersed networks.

### Other Networking Possibilities

There are more advanced options available for securing network traffic and isolating it from the public internet. Two notable solutions worth mentioning are:

#### MPLS (Multiprotocol Label Switching)

MPLS is a packet forwarding technology that operates between Layer 2 and Layer 3 of the OSI model. It typically utilizes a dedicated network infrastructure, ensuring no public connection is involved. Implementing MPLS requires finding a vendor capable of leasing physical cables for exclusive use. While more expensive and complex to implement than previously mentioned options, MPLS offers enhanced security and guaranteed connection speeds.

#### Dedicated Link

Cloud providers offer solutions like Google Cloud's Dedicated Interconnect or AWS Direct Connect, which are faster to implement than MPLS, as the cloud provider handles much of the infrastructure. These options are ideal for establishing physical, private connections between on-premises networks and cloud provider networks. However, they may be excessive for connecting to a single data source on a data platform.

While these options provide additional layers of security and performance, they should be carefully considered based on specific organizational needs and resources.

## Conclusion

Selecting the right networking strategy for your data platform is critical to ensuring security, performance, and scalability. From public access to VPC peering and site-to-site VPNs, the choice of networking strategy significantly impacts your data platform's security, performance, and flexibility. Each option comes with trade-offs that need to be considered. 

- Security should be a primary concern. Public access is the least secure option, while site-to-site VPN offers robust protection.
- VPC peering provides an excellent balance of performance and security for resources within the same cloud provider.
- Access Control Lists (ACLs) offer an additional layer of security for public access scenarios, allowing for fine-grained control.
- Application layer security remains crucial regardless of the chosen networking option, complementing network-level protections.

When designing your data platform's networking architecture, consider your specific use case, security needs, and scalability requirements. Remember that a comprehensive approach, combining appropriate networking strategies with robust application-level security measures, will provide the most effective protection for your valuable data assets.

As technology evolves, staying updated on **best practices and emerging solutions** will help ensure your platform remains secure and efficient in the long run.
