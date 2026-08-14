## Purpose

Allows credentialed browser access only from explicitly trusted production and development origins while keeping local-network development usable.

## ADDED Requirements

### Requirement: Explicit credentialed origin allowlist
Credentialed API responses SHALL allow only origins present in an environment-specific exact-match allowlist and SHALL NOT use wildcard or arbitrary origin reflection.

#### Scenario: Official production origin
- **WHEN** a credentialed request has origin `https://agrotech.astanait.edu.kz`
- **THEN** the production deployment permits the CORS request

#### Scenario: Local network development origin
- **WHEN** a credentialed request in development has origin `http://10.1.10.144:5174`
- **THEN** the development deployment permits the CORS request

#### Scenario: Localhost development origin
- **WHEN** a credentialed request in development has origin `http://localhost:5174` or `http://127.0.0.1:5174`
- **THEN** the development deployment permits the CORS request

#### Scenario: Untrusted origin
- **WHEN** a credentialed request has an origin absent from the active allowlist
- **THEN** the system returns no permissive CORS headers and does not reflect the supplied origin in an error payload

### Requirement: Consistent origin policy
Gateway success responses, gateway-generated errors, and routed service responses SHALL apply the same active origin policy.

#### Scenario: Gateway rejects an allowed-origin request
- **WHEN** a request from an allowed origin fails authentication or rate limiting at the gateway
- **THEN** the error response includes the appropriate CORS headers for that allowed origin

