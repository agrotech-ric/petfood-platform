# Service Network Boundary Specification

## Purpose

Ensures browser and external traffic crosses the gateway so authentication, rate limiting, routing, and policy enforcement cannot be bypassed through service ports.

## Requirements

### Requirement: Internal services are not host-published
Account, authentication, pets, notification, and recommender services SHALL be reachable by peer services on the private application network but SHALL NOT publish their application ports on external host interfaces.

#### Scenario: External direct-service request
- **WHEN** a client outside the application network connects to an internal service port on the host
- **THEN** no service endpoint is reachable on that port

#### Scenario: Internal service communication
- **WHEN** an authorized application service calls another service by its private network identity
- **THEN** the intended internal operation remains available

### Requirement: Recommender traffic crosses the gateway
Browser-facing recommender operations SHALL be available through the gateway and SHALL be subject to the same session exchange and request policies as other protected APIs.

#### Scenario: Authenticated recommendation request
- **WHEN** an authenticated browser sends a recommendation request through the public recommender route
- **THEN** the gateway forwards it to the recommender and returns the result

#### Scenario: Unauthenticated recommendation request
- **WHEN** a browser without a valid session sends a protected recommendation request
- **THEN** the gateway rejects it without forwarding it to the recommender

### Requirement: Browser authorization is gateway-derived
For browser-facing protected routes, downstream bearer credentials SHALL be derived from the validated session rather than trusted from a caller-supplied Authorization header.

#### Scenario: Caller supplies an Authorization header
- **WHEN** a browser request includes both a session cookie and its own Authorization header
- **THEN** the gateway ignores or replaces the caller-supplied credential with the credential derived from the validated session
