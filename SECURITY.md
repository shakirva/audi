# Security Policy — Venueza ERP

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | ✅ Yes             |

## Reporting a Vulnerability

If you discover a security vulnerability in the Venueza ERP platform, please report it responsibly.

### How to Report

1. **Email:** Send details to the repository owner (do NOT open a public GitHub issue).
2. **Include:** A description of the vulnerability, steps to reproduce, and potential impact.
3. **Response Time:** We will acknowledge your report within 48 hours.

### What We Will Do

- Acknowledge your report within 48 hours.
- Investigate and validate the vulnerability.
- Develop and test a fix.
- Deploy the fix using our safe deployment protocol.
- Credit you (if desired) once the fix is live.

## Security Practices

This project follows these security practices:

- **SSH Hardening:** Root login disabled, key-only authentication.
- **Fail2Ban:** Active brute-force protection on the VPS.
- **SSL/TLS:** All traffic encrypted via Certbot auto-renewing certificates.
- **Nightly Backups:** Automated daily backups to Cloudflare R2 with restore verification.
- **Branch Protection:** Force push and deletion blocked on `main`.
- **CI/CD:** All code changes must pass lint and build checks before merge.
- **Environment Isolation:** Staging and production environments are fully separated.
- **Database Safety:** No direct schema changes without backup + staging test.

## Dependencies

We use Dependabot to automatically monitor and update dependencies for known vulnerabilities.
