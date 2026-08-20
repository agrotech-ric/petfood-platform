# Credential Confidentiality Specification

## Purpose

Keeps session credentials, authentication secrets, and personal identifiers out of responses and operational logs where they could be reused or exposed.

## Requirements

### Requirement: Cookie-only browser sessions
Successful browser authentication SHALL establish the session through an HttpOnly `sid` cookie and SHALL NOT include the session identifier, JWT, or equivalent bearer credential in a JSON response body.

#### Scenario: Successful browser login
- **WHEN** a user completes authentication successfully
- **THEN** the response sets the session cookie and the response body contains no reusable session credential

### Requirement: Environment-aware session cookie
The production session cookie MUST be `Secure`, `HttpOnly`, use `SameSite=Lax`, and have `Path=/petfood`. The local HTTP development cookie MUST remain `HttpOnly`, use `SameSite=Lax`, have `Path=/`, and MAY disable `Secure` only through explicit development configuration.

#### Scenario: Official HTTPS deployment
- **WHEN** a session is created through `https://agrotech.astanait.edu.kz/petfood/`
- **THEN** the browser receives a Secure, HttpOnly, SameSite=Lax cookie scoped to `/petfood`

#### Scenario: Local network development
- **WHEN** a session is created through the configured HTTP development environment
- **THEN** the browser receives an HttpOnly, SameSite=Lax cookie scoped to `/` that can operate without HTTPS

### Requirement: Sensitive values are excluded from logs
Application logs SHALL NOT contain plaintext OTPs, JWTs, session identifiers, cookie header values, authorization header values, or full authentication payloads. Personal identifiers used for diagnostics MUST be omitted or irreversibly masked.

#### Scenario: Authentication and notification processing
- **WHEN** an OTP is issued, delivered, verified, or rejected
- **THEN** logs record the event outcome and correlation metadata without the OTP or a reusable credential

#### Scenario: Authenticated request processing
- **WHEN** the gateway or a backend service processes a session cookie or JWT
- **THEN** logs contain neither the raw credential nor decoded personal claims
