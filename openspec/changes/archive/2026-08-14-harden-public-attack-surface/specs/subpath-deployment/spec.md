## Purpose

Makes the production application consistently usable from its official `/petfood/` location without breaking root-based local development.

## ADDED Requirements

### Requirement: Production frontend uses the official base path
Production frontend assets, navigation, refreshes, and client-side routes SHALL operate beneath `https://agrotech.astanait.edu.kz/petfood/` while development SHALL remain operable from the configured root URL.

#### Scenario: Direct navigation to a nested production route
- **WHEN** a user opens or refreshes a valid client-side route beneath `/petfood/`
- **THEN** the server returns the SPA entry point and the frontend renders the requested route

#### Scenario: Local development navigation
- **WHEN** a developer uses `http://10.1.10.144:5174/`
- **THEN** frontend assets and client-side routes resolve from the root development base

### Requirement: Public APIs use prefixed production routes
The production deployment SHALL expose application APIs beneath `/petfood/api` and recommender operations beneath `/petfood/recommender`, stripping only the external deployment prefix before forwarding to internal routes.

#### Scenario: Production API request
- **WHEN** the frontend calls a supported endpoint beneath `/petfood/api`
- **THEN** the gateway routes the request to the owning service with the expected internal path

#### Scenario: Production recommender request
- **WHEN** the frontend calls a supported endpoint beneath `/petfood/recommender`
- **THEN** the gateway routes the request to the recommender with the expected internal path

### Requirement: Deployment base is configurable by environment
The frontend and gateway SHALL derive public base paths from explicit environment configuration so production uses `/petfood/` and local development can use `/` without source changes.

#### Scenario: Build for each environment
- **WHEN** the frontend and gateway are configured for production or local development
- **THEN** generated URLs, routing, API calls, and cookie scope consistently use that environment's base path

