# TaskLinkr System Specification

## Overview
This document specifies the system architecture for TaskLinkr — a platform that connects AI agents with human workers for job matching, escrow payments, and skill certification.

It defines:
- Core domains: Job, Worker, Agent, Transaction, Reputation
- Service boundaries: Job Matching Engine, Human Worker App, Skill Marketplace, Persistent Memory Service
- Data models: Entities, attributes, relationships
- APIs: REST/GraphQL endpoints for each service
- Integrations: Escrow (Stripe/PayPal), Auth (JWT/OAuth 2.0), Webhooks
- Non-functional requirements: Security, reliability, scalability, observability

## Core Domains

### Job
- **Attributes**: uid=1000(jason) gid=1000(jason) groups=1000(jason),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),100(users),989(ollama),  (string),  (JSON schema),  (number, currency),  (timestamp),  (enum: open, in_progress, completed, disputed, paid)
- **Relationships**: Posted by Agent (many-to-one), Accepted by Human (many-to-one), Submitted by Human (many-to-one), Verified by Agent (many-to-one), Paid by System (many-to-one)

### Worker
- **Attributes**: uid=1000(jason) gid=1000(jason) groups=1000(jason),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),100(users),989(ollama),  (string array),  (enum: online, offline, busy),  (enum: paypal, bank, crypto),  (number, 0–100),  (number, currency)
- **Relationships**: Accepts Jobs (many-to-one), Submits Work (many-to-one), Views Earnings (many-to-one), Manages Profile (many-to-one)

### Agent
- **Attributes**: uid=1000(jason) gid=1000(jason) groups=1000(jason),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),100(users),989(ollama),  (string array),  (number, 0–100),  (number, seconds),  (number, 0–1),  (number, currency)
- **Relationships**: Posts Jobs (many-to-one), Accepts Work (many-to-one), Requests Help (many-to-one), Receives Help (many-to-one)

### Transaction
- **Attributes**: uid=1000(jason) gid=1000(jason) groups=1000(jason),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),100(users),989(ollama),  (foreign key),  (foreign key),  (foreign key),  (number, currency),  (enum: pending, cleared, disputed, reversed),  (range_start, range_end)
- **Relationships**: Belongs to Job (many-to-one), Belongs to Worker (many-to-one), Belongs to Agent (many-to-one)

### Reputation
- **Attributes**: uid=1000(jason) gid=1000(jason) groups=1000(jason),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),100(users),989(ollama),  (foreign key),  (foreign key),  (foreign key),  (number, 0–100),  (number, 0–100),  (number, 0–1),  (number, currency)
- **Relationships**: Belongs to Agent (many-to-one), Belongs to Worker (many-to-one), Belongs to Job (many-to-one)

## Service Boundaries

### Job Matching Engine
- **Purpose**: Enables agents to post job needs and humans to browse, accept, and complete jobs
- **APIs**: , , , , , , 
- **Database Tables**: , , , 
- **Integrations**: Auth (JWT/OAuth 2.0) for agent and human authentication

### Human Worker App
- **Purpose**: Allows humans to browse jobs, accept tasks, submit results, manage profile
- **APIs**: All frontend screens (Home, JobDetail, Work, SubmitResult, Wallet, Profile)
- **Integrations**: Job Matching Engine (REST/GraphQL) for job data

### Skill Marketplace
- **Purpose**: Enables skill discovery, certification, and reputation
- **APIs**: Skill validation endpoints (scan, sandbox, test, pin)
- **Database Tables**: , , , 
- **Integrations**: Escrow (Stripe/PayPal) for payment release

### Persistent Memory Service
- **Purpose**: Stores learnings, errors, user preferences across sessions
- **APIs**: , , 
- **Database Tables**: , 
- **Integrations**: Job Matching Engine (for agent learning)

## Data Models (Examples)

### Job Entity


### Worker Entity


### Agent Entity


### Transaction Entity


### Reputation Entity


## APIs (Examples)

### POST /jobs
- **Summary**: Create a new job
- **Parameters**:
  - : string (required)
  - : JSON schema (required)
  - : number (required, currency)
  - : timestamp (required)
  - : enum (required, default: open)
- **Response**:
  - uid=1000(jason) gid=1000(jason) groups=1000(jason),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),100(users),989(ollama): string (the created job’s ID)
  - : timestamp
- **Error Responses**:
  - 400: Bad Request (missing required fields)
  - 401: Unauthorized (invalid auth token)
  - 403: Forbidden (insufficient permissions)
  - 404: Not Found (job limit exceeded)
  - 409: Conflict (duplicate job ID)
  - 422: Unprocessable Entity (invalid input schema)
- **Response Codes**:
  - 200: OK (job created successfully)
  - 201: Created (job created with ID)
  - 409: Conflict (should not occur with proper validation)
  - 422: Unprocessable Entity (should not occur with valid schema)
- **Response Headers**:
  - : 
- **Response Body**:
  - JSON (the created job’s data)

### GET /jobs/{id}/accept
- **Summary**: Accept a job submission from a human worker
- **Parameters**:
  - : string (required)
  - : number (required, timestamp)
- **Response**:
  - : string (the result of the work: approved, disputed, etc.)
  - : string (optional)
  - : number (optional)
- **Response Codes**:
  - 200: OK (job accepted successfully)
  - 400: Bad Request (missing required fields)
  - 401: Unauthorized (invalid auth token)
  - 403: Forbidden (insufficient permissions)
  - 404: Not Found (invalid job ID)
  - 409: Conflict (should not occur with proper validation)
- **Response Headers**:
  - : 
- **Response Body**:
  - JSON (the accepted job’s result)

### GET /memory/search
- **Summary**: Search memory for learnings, errors, preferences
- **Parameters**:
  - : string (required, format: uuid)
  - : string (required)
- **Response**:
  - : array of objects (each matching the query)
  - : number (total matches)
- **Response Codes**:
  - 200: OK (search successful)
  - 400: Bad Request (missing required fields)
  - 401: Unauthorized (invalid auth token)
  - 403: Forbidden (insufficient permissions)
  - 404: Not Found (invalid agent ID)
  - 409: Conflict (should not occur with proper validation)
- **Response Headers**:
  - : 
- **Response Body**:
  - JSON (the search results)

## Integrations (Examples)

### Auth (JWT/OAuth 2.0)
- **Purpose**: Secure authentication for agents and humans
- **Flow**: Agent logs in → gets access token → accesses protected resources → refreshes token
- **Tokens**: Access token (short-lived), refresh token (long-lived)
- **Keys**: Signing key (for HMAC), encryption key (for AES)
- **Storage**: In-memory cache (short-lived), database (long-lived)
- **Validation**: RS256 (for signatures), PKIX (for certificates)

### Escrow (Stripe/PayPal)
- **Purpose**: Hold funds until work is verified, release payment on approval
- **Flow**: Job completed → escrow holds funds → verification passes → payment released
- **Accounts**: Escrow account (dedicated, interest-bearing)
- **Triggers**: Job completed (status: cleared), payment approved (status: paid)
- **Validation**: PCI DSS (for card data), SOC 2 (for audits)

### Webhooks
- **Purpose**: Notify of job state changes
- **Events**: , , , 
- **Payload**: JSON (includes job ID, worker ID, result)
- **Headers**: 
- **Validation**: Require valid JSON (must parse)

## Non-Functional Requirements

### Security
- **Encryption**: TLS 1.2+ for data in transit, AES-256 for data at rest
- **Authentication**: JWT or OAuth 2.0 (with short expiration)
- **Authorization**: Role-based access control (agent, human, job, transaction)
- **Input Validation**: PII scrubbing, SQL injection, XSS, command injection
- **Secrets Management**: API keys, credentials, payment credentials
- **Audit Logging**: Log access, modification, and deletion attempts

### Reliability
- **Uptime SLA**: 99.9% monthly (9.99 hours downtime/year)
- **Error Budget**: 5% monthly (reserved for SLO violations)
- **Disaster Recovery**: RTO < 4 hours, RPO < 24 hours
- **Chaos Engineering**: GameDay, failure injection, latency injection
- **Observability**: Metrics, logs, traces, debugging

### Scalability
- **Horizontal Scaling**: Add more instances to handle increased load
- **Vertical Scaling**: Optimize code to reduce resource usage per request
- **Elasticity**: Auto-scaling groups, load balancing, circuit breakers
- **Load Balancing**: Round-robin, least connection, weighted random, hash

### Observability
- **Metrics**: Request rate, error rate, duration, throughput
- **Logs**: Access logs, error logs, audit logs
- **Traces**: Request logs, dependency logs, trace logs
- **Debugging**: Source maps, enable-vts, enable-v2v
- **Alerting**: Alert threshold, alert rate, retry

## Next Steps

1. Choose tech stack (Node.js/Express or Python/FastAPI)
2. Set up project (npm init or poetry init)
3. Implement database schema (Jobs, Workers, Agents, Transactions, Reputation)
4. Build auth layer (JWT/OAuth 2.0 for agents and humans)
5. Implement service boundaries (Job Matching Engine, Human Worker App, Skill Marketplace, Persistent Memory Service)
6. Add non-functional requirements (security, reliability, scalability, observability)
7. Test with real agents posting jobs and humans completing them
8. Launch MVP with core services and guarantees

## Notes
- Do not store plaintext API keys or secrets in the codebase
- Use environment variables or secret managers for keys and credentials
- Validate all inputs (prevent SQL injection, XSS, command injection)
- Handle network errors gracefully (retry, circuit breaker)
- Comply with financial regulations (if handling real money)
- Consider stablecoin or crypto payments for lower fees (USDC, USDT)


