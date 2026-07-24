# Initial Route Ownership Matrix

| Route Area | Current Owner | Temporary Migration Owner | Final Owner | Rewrite Rule |
|---|---|---|---|---|
| `/api/auth/*` | Vercel | Vercel | Vercel | None |
| `/api/admin/*` | Vercel | Azure (Wave 8) | Azure | `/api/admin/*` -> `api.onesystemserp.com/admin/*` |
| `/api/projects/*` | Vercel | Azure (Wave 2) | Azure | `/api/projects/*` -> `api.onesystemserp.com/projects/*` |
| `/api/ai/*` | Vercel | Azure (Wave 7) | Azure | `/api/ai/*` -> `api.onesystemserp.com/ai/*` |
| Server Actions (`financeActions.ts`) | Vercel | Azure (Wave 6) | Azure | Converted to REST/RPC -> `api.onesystemserp.com/rpc/finance/*` |
