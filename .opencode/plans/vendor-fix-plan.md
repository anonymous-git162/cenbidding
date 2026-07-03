# Vendor Submission & Procurements Fix Plan

## Problems Identified
1. **Backend stale** — PID 29788 just started (4:48 PM) after rebuilding dist; old backend (PID 36288, started 1:44 PM) was running pre-fix code
2. **`GET /api/procurements` with `status` filter returned 500** — old code used `where.status = dto.status as ProcurementStatus` (breaks on comma-separated; unknown single-value issue); fix: split comma-separated and use `{ in: statuses }`
3. **`POST /api/rfq-submissions` returned 500** — controller expected `vendorId` in body (never sent by frontend); fix: derive via `prisma.vendor.findUnique({ where: { userId: user.id } })`

## Fixes Applied (in source + compiled to dist)
- `backend/src/modules/procurements/procurements.service.ts:110-112` — comma-separated status → `{ in: [...] }`
- `backend/src/modules/rfq-submission/rfq-submission.controller.ts` — vendorId from `req.user.id`
- `backend/src/modules/rfq-submission/rfq-submission.controller.spec.ts` — updated PrismaService mock

## Tests Run
- [x] Backend process restarted (PID 29788, 4:48 PM)
- [x] Login as vendor → GET /procurements?status=RFQ_OPEN,RFP_PUBLISHED,RFI_PUBLISHED
- [x] Login as vendor → POST /rfq-submissions (submit to a procurement)
- [x] Login as requester → GET /procurements?status=RFQ_OPEN
- [x] Login as admin → POST /api/ai/write-tor
- [x] Login as admin → POST /api/ai/score-vendor
- [x] Backend unit tests (`npm run test`) — 367 passed
- [x] Frontend TypeScript (`npx tsc --noEmit`) — 0 errors
- [x] Frontend tests (`npm test`) — 179 passed
- [x] Backend e2e tests (`npm run test:e2e`) — 101 passed
- [x] Playwright e2e tests (49 tests) — 49 passed

## Notes
- `POST /api/ai/score-vendor` accepts fields: `vendorName`, `price`, `proposalText`, `allVendorPrices`, `procurementTitle` (not `vendorId`/`procurementId`)
- DB name is `ebidding` (not `ebidding_final`)
- vendor@ebidding.com has Vendor record: `bc1a35e0-186f-426f-a5bd-002b070a9b24`
