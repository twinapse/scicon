# SCP protocol specification

<!-- toc -->

- [Abstract](#abstract)
- [Introduction](#introduction)
- [Requirements notation](#requirements-notation)
- [Terminology](#terminology)
- [Scope](#scope)
- [Protocol model](#protocol-model)
- [Package model](#package-model)
- [Serialization and transport](#serialization-and-transport)
- [Protocol stages](#protocol-stages)
- [Requirements](#requirements)
- [Conformance](#conformance)
- [Security considerations](#security-considerations)
- [References](#references)

## Abstract

*Informative.*

The Scientific Context Protocol (SCP) defines an SCP package for a scientific output and requirements for agent interfaces that inspect the SCP package.
An SCP package organizes claims, figures, data, code, methods, assumptions, provenance, and related work so agent interfaces can produce agent-facing answers with preserved evidence statuses and package citations.

## Introduction

*Informative.*

SCP represents a scientific output as a queryable SCP package that agents can use to help experts understand, verify, and reuse that scientific output.
The protocol layers source artifacts beneath an SCP package, then exposes the SCP package through an agent interface.
Evidence statuses remain attached to package objects and package links so an agent interface can return a not-enough-information result instead of inventing unsupported package objects or package links.
This document is the authoritative source for SCP-specific terminology, definitions, and conformance requirements.
Implementation documentation can describe concrete encodings and behavior, but it does not redefine the protocol.

## Requirements notation

*Normative.*

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [BCP 14](https://www.rfc-editor.org/info/bcp14/) ([RFC 2119](https://www.rfc-editor.org/rfc/rfc2119), [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)) when, and only when, they appear in all capitals, as shown here.
Sections marked *Normative* define requirements for conformance.
Sections marked *Informative* provide context and do not define requirements for conformance.

## Terminology

*Normative.*

**SCP** expands to Scientific Context Protocol and names the protocol specified by this document.

**Scientific output** comprises a paper and its supplements, code, data, figures, methods, assumptions, documentation, and related work.

**Package object** identifies and describes one part of a scientific output in structured form.

**Study** is the package object that represents the scientific output described by an SCP package.

**Paper section** is a package object that identifies and describes one section of a scientific output's paper.

**Claim** is a package object that records a scientific claim made by a scientific output.

**Figure** is a package object that identifies and describes a figure or figure panel in a scientific output.

**Dataset** is a package object that identifies and describes data used or produced by a scientific output.

**Code artifact** is a package object that identifies and describes code used or produced by a scientific output.

**Method step** is a package object that describes one step in a method used by a scientific output.

**Assumption** is a package object that records an assumption, limitation, or caveat that qualifies a scientific output.

**Related work** is a package object that identifies another scientific output needed to understand a method step or assumption.

**Package link** identifies how package objects relate.

**SCP package** is a structured collection of package objects and package links that represents a scientific output.

**Source artifact** is a paper, supplement, code file, dataset, figure, document, or publication about related work from which package objects and package links derive.

**Package citation** identifies a location in an SCP package or a source artifact and can also identify a location within that source artifact.

**Source evidence** is content in a source artifact that directly supports a package object or package link and is identifiable through a package citation.

**Mined evidence** consists of candidate package objects and package links produced from source artifacts by extraction or inference.

**Evidence status** records the evidentiary basis or unresolved state of a package object or package link.
The [Evidence](#evidence) requirements define the complete evidence status vocabulary and the meaning of each value.

**Author confirmation** records an author or maintainer's determination that specified package objects or package links are accurate.

**Agent interface** allows an agent to inspect an SCP package and, when supported, request controlled operations.

**Agent-facing answer** conveys, in structured form or prose, information that an agent interface produces from an SCP package.

**Read-only inspection layer** is the part of an agent interface that reads an SCP package without executing commands, downloading data, or modifying files or other persistent state.

**Operation recipe** is a package object that describes, in human-reviewable form, the intended commands or inputs for a common task.

**Controlled operation** is exposed through an agent interface and can execute a command, download data, or modify files or other persistent state.

**Explicit user approval** occurs when a user deliberately authorizes one described controlled operation after its intended inputs and effects have been disclosed.

**Not-enough-information result** is an agent-facing answer that states that an SCP package cannot support the requested information and does not supply unsupported content.

## Scope

*Informative.*

SCP enables agents and expert users to inspect a scientific output through a queryable SCP package.
Package objects and package links represent information about the scientific output's source artifacts, provenance, assumptions, and operation recipes.

### Non-goals

SCP does not establish that a scientific output is scientifically correct.

## Protocol model

*Informative.*

SCP separates source artifacts, the SCP package, and the agent interface that presents the SCP package.
Package objects describe the scientific output, and package links connect package objects to express support, provenance, and other semantics.
Evidence statuses qualify package objects and package links, while package citations identify either locations in the SCP package or source artifacts used to produce agent-facing answers.

## Package model

*Informative.*

An SCP package is a graph of typed package objects connected by typed package links.
The package object categories are Study, Paper section, Claim, Figure, Dataset, Code artifact, Method step, Assumption, Related work, and Operation recipe.
Each package link is typed by a predicate drawn from a closed vocabulary.
The closed vocabulary constrains which package object categories a package link may connect and gives package links support, provenance, dependency, and reference semantics.

## Serialization and transport

*Informative.*

SCP does not prescribe a serialization for an SCP package, a remote-procedure-call framework, or a transport for an agent interface.
Conformance of an SCP package or agent interface depends on satisfying the applicable requirements, not on using a particular serialization or transport.
An implementation of an agent interface can impose additional serialization and transport requirements.

## Protocol stages

*Informative.*

The protocol comprises these stages:

1. Production of mined evidence from source artifacts.
2. Conversion and normalization of mined evidence into an SCP package.
3. Author confirmation of inferred package objects and package links whose interpretation could materially affect agent-facing answers.
4. Validation of the SCP package and agent interface against their applicable requirements.
5. Inspection of the SCP package through a read-only inspection layer provided by a command-line interface (CLI), application programming interface (API), Model Context Protocol (MCP) server, or other agent interface.
6. Controlled operations after the read-only inspection layer is trustworthy and with explicit user approval.

## Requirements

*Normative.*

### Evidence

Every package object and package link that makes a factual assertion MUST carry exactly one of these evidence statuses:

Source-backed statuses are:

- `explicit`: Directly stated in a source artifact.
- `imported`: Imported from existing machine-readable metadata.

Derived (mined) statuses are:

- `extracted`: Produced by deterministic or rule-based extraction.
- `inferred`: Proposed by rules, a language model, or agent reasoning.

The confirmed status is:

- `author_confirmed`: Supported by author confirmation.

Open states are:

- `missing`: Expected information is absent.
- `ambiguous`: Multiple interpretations remain.
- `unresolved`: A known follow-up item remains unresolved.

Mined evidence MUST retain an evidence status of `extracted` or `inferred`, as applicable, until source evidence or author confirmation justifies a different evidence status.

### Agent-facing answers

Every agent-facing answer MUST include one or more package citations that identify either locations in the SCP package or source artifacts used to produce it.
An agent-facing answer MUST preserve the evidence status of each package object and package link that it returns.
An agent-facing answer MUST explicitly identify each returned package object or package link whose evidence status is `missing`, `ambiguous`, or `inferred`.
When an SCP package cannot support the requested information, the agent interface MUST return a not-enough-information result rather than unsupported package objects or package links.

### Controlled operations

A read-only inspection layer is trustworthy under this specification only when it satisfies the [Agent-facing answers](#agent-facing-answers) requirements and cannot execute commands, download data, or modify files or other persistent state.
Controlled operations MUST NOT be exposed until that read-only inspection layer is trustworthy.
Each controlled operation MUST obtain explicit user approval before it begins.
Explicit user approval MUST be limited to the described controlled operation and MUST be obtained again for a materially different controlled operation, input, or effect.
Operation recipes MAY describe intended commands or inputs, but they MUST NOT grant or imply execution authority and MUST NOT count as explicit user approval.

## Conformance

*Normative.*

An SCP package conforms to this specification only if all package objects and package links within the scope of the [Evidence](#evidence) requirements satisfy those requirements.
An agent interface conforms to this specification only if every agent-facing answer it produces satisfies the [Agent-facing answers](#agent-facing-answers) requirements.
An agent interface that exposes controlled operations conforms only if it also satisfies the [Controlled operations](#controlled-operations) requirements.
SCP package conformance and agent interface conformance are independent claims.

## Security considerations

*Informative.*

Preserving evidence statuses and satisfying the [Agent-facing answers](#agent-facing-answers) requirements reduce the risk that an agent presents package objects or package links without preserving their `inferred` or `missing` evidence statuses.
A read-only inspection layer establishes a safer basis for reviewing an SCP package before a controlled operation can execute commands, download data, or modify files or other persistent state.
Explicit user approval keeps execution authority with the user rather than with an operation recipe.

## References

### Normative references

- [BCP 14: Requirement levels for standards specifications](https://www.rfc-editor.org/info/bcp14/).
- [RFC 2119: Key words for use in RFCs to Indicate Requirement Levels](https://www.rfc-editor.org/rfc/rfc2119).
- [RFC 8174: Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words](https://www.rfc-editor.org/rfc/rfc8174).
