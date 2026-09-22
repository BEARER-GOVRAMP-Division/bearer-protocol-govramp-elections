# Repository Guide

## Overview

This repository contains a **browser-only conceptual demonstration** for election-operations workflows branded around the BEARER Protocol. The app is intentionally limited to synthetic client-side data so the repository can be reviewed, run locally, and validated without external services.

## Prominent disclaimer

- This is **not** a real voting system.
- This repository does **not** process real votes, voter identities, credentials, biometrics, cryptographic keys, or government records.
- This repository does **not** establish a real GovRAMP authorization, ISO certification, SCOTUS mandate, FIPS validation, SAR result, or 3PAO assessment.
- References to compliance, audits, privacy, biometrics, cryptography, and chain-of-custody are illustrative placeholders for planning discussions only.

## Project structure

- `BEARER_Protocol_Application.html` — standalone browser entry point
- `src/app.js` — UI rendering and browser interactions
- `src/demoState.js` — pure demo state transitions used by both the UI and automated tests
- `tests/demoState.test.js` — Node-based tests for core simulation state changes
- `scripts/validate-demo.js` — lightweight validation for key files and required disclaimer text
- `ISO_Statement_of_Applicability.md` — conceptual placeholder document
- `GovRAMP_Fast-Track_Proposal.md` — conceptual placeholder proposal

## Local development

The app uses only static files and native browser modules.

```bash
cd /home/runner/work/bearer-protocol-govramp-elections/bearer-protocol-govramp-elections
python3 -m http.server 8000
```

Open:

- `http://localhost:8000/BEARER_Protocol_Application.html`

You can also open the HTML file directly in a browser that supports ES modules, but a local static server is recommended.

## Validation

Run the automated checks in a clean environment:

```bash
npm run check
```

This performs:

1. `npm run validate` — static validation for required files and disclaimer language
2. `npm test` — state-transition tests using Node’s built-in test runner

## Demo behavior

- Loading the app requires a user action to populate synthetic precinct data.
- “Record simulated ballot” updates only local in-memory state in the current browser session.
- Resetting the session clears all locally simulated activity.
- Success messaging is intentionally qualified so it does not imply a real vote was cast or counted.

## Architecture and limitations

### Current architecture

- Single-page static HTML shell
- Browser-rendered UI with native JavaScript modules
- Pure state-update module for deterministic simulation logic
- No backend, persistence, authentication, networking, cryptographic operations, or identity processing

### Known limitations

- No real voter authentication, ballot definition, ballot marking, ballot transport, tallying, audit export, or recount functionality
- No independent security review or threat model
- No Section 508/WCAG accessibility certification
- No privacy impact assessment, records-retention policy, or operational monitoring
- No hardware security module, key ceremony, or certified cryptographic boundary
- No compliance evidence package suitable for procurement or deployment decisions

## Roadmap before any real-world use

The following would be required before considering any real election or government use:

1. Independent election-security architecture review and threat modeling
2. End-to-end accessibility testing with assistive technologies
3. Privacy impact assessment and data-governance controls
4. Certified voting-system compliance and jurisdiction-specific legal review
5. Secure backend services, durable audit logging, and operational monitoring
6. Verified key management, hardware-backed cryptography, and credential lifecycle controls
7. Incident response, change management, supply-chain controls, and continuous security testing

## Documentation policy

All documents in this repository should clearly distinguish between:

- current demo behavior,
- conceptual future requirements,
- and external authorizations or certifications that are **not** presently held or claimed.
