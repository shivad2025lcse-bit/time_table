# Runtime Validation Report

**Generated**: 2026-11-27T13:46:39+05:30  
**Target**: `D:\Java_project\frontend`  
**Validation mode**: standalone

## Summary

| Step | Status | Exit Code | Details |
|---|---|---:|---|
| Frontend lint | PASS | 0 | `npm run lint`; existing warnings remain |
| Production build | PASS | 0 | `npm run build` |
| Frontend behavior tests | PASS | 0 | 1 Vitest file; 3 passed, 0 failed |
| Faculty leave/substitution backend tests | PASS | 0 | `TemporaryTimetableAndEmailTests`; 9 passed, 0 failed |
| Frontend startup | PASS | 0 | Runtime HTTP probe returned 200 for `/` |
| Backend API proxy | PASS | 0 | Runtime HTTP probe returned 200 for `/api/timetable` |
| Browser module navigation | PARTIAL | n/a | Logged-in admin: all 10 sidebar actions opened expected dialogs; no API failures during navigation. Forms were not submitted. This was an interactive browser check, not a replayable Playwright spec. |
| 7,000-user load test | NOT RUN | n/a | No approved staging URL or test-rate limits were provided. |

**Overall**: PASS for the standalone frontend plan (5/5 assertions); manual browser coverage is partial, and capacity is unverified.

## Environment and gaps

- Node.js: available (`v26.13.1`).
- Docker: unavailable (`docker` command not found); infrastructure/container fidelity was not tested.
- Backend: `/api/timetable` returned HTTP 200 on port 8095 during validation.
- The runtime Playwright recorder could not complete its browser-spec handoff: Vite exited with a Windows `EBUSY` file-watcher error while the recorder created a temporary request file. Vite now ignores `.tsupgrader` paths. The current plan uses HTTP probes rather than claiming automated browser coverage.
- Email alert dialog rendered and displayed that delivery is simulated/not configured; no OTP or email was sent.
- The restored file-backed database was not modified by the read-only module navigation checks.

## Changes and evidence

- Made the mobile sidebar vertically scrollable so lower navigation actions can be reached.
- Configured Vite to ignore generated `.tsupgrader` files, avoiding the observed Windows watcher crash.
- Added three frontend behavior tests for role choices, empty admin login validation, and admin sidebar navigation labels.
- Limited Vitest to one worker to avoid an observed Node out-of-memory failure in this constrained environment.
- Standalone eval-plan results: [standalone-result.json](./frontend/.tsupgrader/runtime-validation/standalone-result.json).
- Eval plan: [eval-plan.json](./frontend/.tsupgrader/runtime-validation/eval-plan.json).
- Backend verification: `mvnw.cmd -Dtest=TemporaryTimetableAndEmailTests test` passed, including faculty self-only leave, persisted coverage/substitution access, student visibility, and timetable lookup.

## Verdict

```text
environment:
  docker: UNAVAILABLE — docker command not found
  node: AVAILABLE — v26.13.1
  playwright: PARTIAL — interactive browser check available; recording handoff did not complete
  infra-tier: FALLBACK(embedded/file-backed H2) — Docker unavailable; DB fidelity not validated
  browser-tier: PARTIAL — interactive admin dialogs checked; automated browser spec not recorded
startup: PASS — Vite dev server via HTTP probe and backend timetable API, both returned 200
integration: PARTIAL — 9 targeted backend leave/substitution tests and 3 frontend behavior tests passed; the full backend suite was not run
e2e: PARTIAL — exit_code: n/a (interactive check); 10 admin dialogs opened; no form submissions or automated browser replay
overall: NEEDS_SIGNOFF — standalone frontend plan passed; browser journey breadth and 7,000-user capacity remain unverified
```
