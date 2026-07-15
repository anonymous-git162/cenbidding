# Task Tracker — Bug Fixes Plan

## ✅ All Fixes Complete

**All HIGH, MEDIUM, and LOW priority fixes have been implemented, tested, and pushed.**

- Backend: 12/12 fixes ✅
- Frontend: 16/16 fixes ✅ (including bonus VendorsPage fix)
- All tests pass: Backend 375/375, Frontend 181/181
- 23 files changed, 250 insertions, 133 deletions

---

## Backend Fixes

### Backend HIGH (10 fixes)
1. ✅ **ChangePasswordDto** — Created typed DTO to replace inline body type stripped by `whitelist: true`
   - Files: `auth.dto.ts`, `auth.controller.ts`

2. ✅ **placeBid race condition** — Wrapped in `prisma.$transaction` to prevent duplicate bids
   - File: `ebidding.service.ts`

3. ✅ **openRound endsAt** — Set `endsAt` to 24 hours from open for auto-close cron
   - File: `ebidding.service.ts`

4. ✅ **Escalation notifications** — Replaced raw prisma call with `notificationsService.createForUsers()`
   - File: `approval.service.ts`

5. ✅ **Empty approver auto-approve guard** — Changed `=== 0 || ...` to `> 0 && ...`
   - File: `approval.service.ts`

6. ✅ **submitForApproval transaction** — Atomic status update + approver sync
   - File: `approval.service.ts`

7. ✅ **notifyVendorsRoundOpen error handling** — Re-throw after logging instead of silent catch
   - File: `ebidding.service.ts`

8. ✅ **@Roles() on evaluation endpoints** — Prevent vendor score leakage
   - Files: `evaluation.controller.ts`

9. ✅ **Test fix** — Added mock for `vendorInvitation.findMany`
   - File: `ebidding.service.spec.ts`

10. ✅ **All backend tests pass** — 375/375

### Backend MEDIUM (2 fixes)
11. ✅ **WebSocket bulk notification real IDs** — Query back created notifications, send individual WebSocket messages with real UUIDs
    - File: `notifications.service.ts`

12. ✅ **Audit log off-by-one** — Already fixed before this session (no `+ 1` in approvedCount)

---

## Frontend Fixes

### Frontend HIGH (10 fixes)
1. ✅ **EvaluationPage state mutation** — Copy state before mutation
   - File: `EvaluationPage.tsx`

2. ✅ **EvaluationPage race condition** — Cancel flag in useEffect
   - File: `EvaluationPage.tsx`

3. ✅ **ApprovalsPage bulk approve rollback** — `Promise.allSettled` for error tracking
   - File: `ApprovalsPage.tsx`

4. ✅ **ApprovalsPage stale load closure** — Added `user` to useEffect deps
   - File: `ApprovalsPage.tsx`

5. ✅ **ProcurementDetailPage empty catch blocks** — Replaced with `.catch(() => null)`
   - File: `ProcurementDetailPage.tsx`

6. ✅ **setTimeout cleanup on unmount** — Added cleanup to 6 pages
   - Files: `EvaluationPage.tsx`, `ChangePasswordPage.tsx`, `InvitationsPage.tsx`, `VendorsPage.tsx`, `RegisterPage.tsx`, `ApprovalsPage.tsx`

7. ✅ **FileUploader silent catch** — Surface upload errors to users
   - File: `FileUploader.tsx`

8. ✅ **BiddingRoomPage null access** — Guard for `procurements.find()`
   - File: `BiddingRoomPage.tsx`

9. ✅ **ProcurementListPage timer cleanup** — Cleanup effect for `searchTimer`
   - File: `ProcurementListPage.tsx`

10. ✅ **All frontend tests pass** — 181/181

### Frontend MEDIUM (2 fixes)
11. ✅ **ReportingPage composite key** — Replaced array index with `${item.entityType}-${item.action}-${item.createdAt}`
    - File: `ReportingPage.tsx`

12. ✅ **Inline colors → TYPE_COLORS** — Unified 4 pages to use shared `TYPE_COLORS` / `TYPE_COLORS_BG` constants
    - Files: `ApprovalsPage.tsx`, `ProcurementDetailPage.tsx`, `InvitationsPage.tsx`, `ResultsPage.tsx`, `statusColors.ts`

### Frontend LOW (4 fixes)
13. ✅ **useSocket stale connected flag** — `useState` + `connect`/`disconnect` events
    - File: `useSocket.ts`

14. ✅ **useSocket listener cleanup** — `socket.off(event)` + `listenersRef.clear()` on unmount
    - File: `useSocket.ts`

15. ✅ **ProcurementCreatePage form reset confirmation** — `isFormDirty` check + confirmation dialog
    - File: `ProcurementCreatePage.tsx`

16. ✅ **VendorsPage duplicate loading state** — Removed pre-existing duplicate `useState` declaration
    - File: `VendorsPage.tsx`

### Skipped (not real bugs)
- **VendorAnalyticsPage index key** — Recharts static data, no reconciliation issue
- **EvaluationPage aiDialog stale closure** — Closure refreshes every render, dialog is singleton
- **Audit log off-by-one** — Already fixed before this session

---

## Commits

| Commit | Description | Files |
|--------|-------------|-------|
| `7f48869` | Bug fixes across backend and frontend (HIGH + MEDIUM) | 20 files |
| `77db1f5` | Unify inline colors with TYPE_COLORS + form reset confirmation | 6 files |

---

*Last updated: Wed Jul 15 2026 — All fixes complete, tests passing, pushed to master.*
