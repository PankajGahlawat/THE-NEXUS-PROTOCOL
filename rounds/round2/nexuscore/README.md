# NexusCore Technologies — CTF Round 2
**Port:** 7007  |  **Run:** `python3 app.py`

## 8 Advanced Vulnerabilities
| # | Vuln | Endpoint | Method |
|---|------|----------|--------|
| V1 | SSRF | `/api/integrations/fetch` | POST |
| V2 | XXE | `/api/reports/upload` | POST |
| V3 | Command Injection | `/api/diagnostics/run` | POST |
| V4 | JWT Algorithm Confusion | `/api/admin/users` | GET |
| V5 | Race Condition | `/api/licenses/redeem` | POST |
| V6 | Insecure Deserialization | `/api/session/import` | POST |
| V7 | GraphQL Injection | `/api/graphql` | POST |
| V8 | SSTI | `/api/notifications/preview` | POST |

## Demo Accounts
- `demo / demo123` (engineer, clearance 1)
- `karan.dev / Karan#dev2023` (engineer, clearance 2)
- `admin / NexusCore@2024!` (CISO, clearance 5)

## Quick Start
```bash
pip3 install flask --break-system-packages
python3 app.py
# Open http://localhost:7007
```
