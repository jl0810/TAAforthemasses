# Traceability Matrix

| User Story ID | User Story Title           | Business Rule(s)       | Component / Module                | Test Case ID   |
| :------------ | :------------------------- | :--------------------- | :-------------------------------- | :------------- |
| **US-001**    | Market Pulse Dashboard     | BR-001, BR-003, BR-005 | `SignalMatrix.tsx`, `market.ts`   | TC-001, TC-002 |
| **US-002**    | Historical Signal Analysis | BR-002, BR-003         | `market.ts`, `SignalMatrix.tsx`   | TC-003         |
| **US-003**    | SMA/EMA Strategy Toggle    | BR-001                 | `taa-math.ts`, `market.ts`        | TC-004, TC-005 |
| **US-004**    | Custom Asset Overrides     | BR-004                 | `user.ts`, `profile-settings.tsx` | TC-006         |
| **US-005**    | Secure Access              | BR-005                 | `auth.ts`, `login-form.tsx`       | TC-007         |

## Test Case Mapping

- **TC-001 [Automated]**: Verify SMA calculation accuracy against known data set.
- **TC-002 [Automated]**: Verify Risk-On/Risk-Off status flipping logic.
- **TC-003 [Automated]**: Verify 12-month history generation logic in `getMarketSignals`.
- **TC-004 [Automated]**: Verify EMA calculation follows standard exponential decay.
- **TC-005 [Automated]**: Verify toggle switch updates state and triggers re-fetch (Covered by Integration Test).
- **TC-006 [Automated]**: Verify `getMarketSignals` uses user-provided config when present.
- **TC-007 [Automated]**: Verify unauthenticated access redirects or shows Demo mode.
