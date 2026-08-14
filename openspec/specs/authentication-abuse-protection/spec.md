# Authentication Abuse Protection Specification

## Purpose

Protects public authentication flows from automated abuse without exposing whether an account or one-time code exists.

## Requirements

### Requirement: Layered authentication rate limits
The system SHALL apply both source-based limits at the public gateway and identity-aware limits to OTP request and verification operations. Limits SHALL use the trusted client address established by the deployment proxy configuration rather than arbitrary forwarded headers.

#### Scenario: Excessive requests from one source
- **WHEN** a client exceeds the configured gateway limit for a public authentication operation
- **THEN** the gateway rejects the request with HTTP 429 and a retry indication without forwarding it downstream

#### Scenario: Distributed requests for one identity
- **WHEN** requests for the same normalized identity exceed the configured account-level limit across multiple source addresses
- **THEN** the system rejects or suppresses further attempts for the configured cooldown period

### Requirement: OTP lifecycle controls
The system MUST limit verification attempts per issued OTP, enforce a resend cooldown, expire OTPs after a configured interval, and invalidate an OTP after successful use or exhaustion of attempts.

#### Scenario: OTP attempt limit reached
- **WHEN** a user submits incorrect OTP values until the configured attempt limit is reached
- **THEN** the current OTP becomes unusable and further verification attempts are rejected

#### Scenario: OTP resend during cooldown
- **WHEN** a client requests another OTP for the same normalized identity before the resend cooldown ends
- **THEN** the system does not issue an additional usable OTP

### Requirement: Non-enumerating authentication responses
Public authentication responses SHALL not reveal whether an account, email address, phone number, session, or OTP exists beyond information required to complete a successful authenticated flow.

#### Scenario: Unknown and known identity requests
- **WHEN** equivalent OTP requests are made for a registered identity and an unregistered identity
- **THEN** their public status and message semantics do not disclose which identity is registered
