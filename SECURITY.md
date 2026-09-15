# Security Policy

CrisisWeave is designed for crisis-response evaluation and may eventually be used around sensitive operational information. Please report security issues responsibly.

## Reporting a vulnerability

Do not publish exploit details, credentials, private locations, personal data, or other sensitive evidence in a public issue.

Use GitHub private vulnerability reporting when it is available for this repository. If it is not available, contact the repository owner through GitHub before public disclosure so a private reporting channel can be arranged.

Include the affected revision, a minimal reproduction, expected impact, and any safe remediation ideas you have.

## Scope

High-priority reports include privacy leaks, authentication or authorization bypasses, unsafe caching of sensitive data, integrity failures in public crisis information, dependency or build-chain compromise, and ways to expose operational-only fields through a public surface.

Synthetic demo data is not considered sensitive, but a defect that would expose equivalent fields in a real deployment is in scope.

## Safe handling

Do not test against real people, emergency operations, or third-party systems without authorization. Prefer synthetic fixtures and local reproductions.
