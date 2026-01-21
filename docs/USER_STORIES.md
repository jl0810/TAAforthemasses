# User Stories for TAA for the Masses

## Market Intelligence

### US-001: Market Pulse Dashboard

**As a** user
**I want** to see a high-level "Signal Matrix" of the 5 key asset classes (US Stocks, Intl Stocks, Bonds, Real Estate, Commodities)
**So that** I can instantly know the current "Risk-On" or "Risk-Off" status of the market.

**Acceptance Criteria:**

- Displays all 5 Ivy assets with current price and trend.
- Shows a clear status indicator (Green/Red) for each asset.
- Displays the "Safety Buffer" percentage.

### US-002: Historical Signal Analysis

**As a** user
**I want** to see the past 12 months of buy/sell signals for any asset
**So that** I can understand the trend stability and frequency of trading signals.

**Acceptance Criteria:**

- Clicking an asset card opens a history view.
- Table shows Month, Price, Trend, Status, and Action (Buy/Sell/Hold).
- Covers at least the last 12 completed months.

### US-003: SMA/EMA Strategy Toggle

**As a** sophisticated investor
**I want** to toggle between Simple Moving Average (SMA) and Exponential Moving Average (EMA)
**So that** I can compare different trend sensitivities and choose the one that fits my risk profile.

**Acceptance Criteria:**

- Global toggle switch available on the dashboard.
- Switching recalculates "Risk-On/Off" status for all assets immediately.
- Preference is persisted or easily switchable.

## Customization

### US-004: Custom Asset Overrides

**As a** user
**I want** to define my own tickers for the 5 asset classes (e.g., spy instead of VTI)
**So that** the signals are relevant to my specific portfolio holdings.

**Acceptance Criteria:**

- Profile page allows editing tickers for each of the 5 slots.
- Dashboard reflects the custom tickers and their specific market data.
- Preferences are saved to my user profile.

## Authentication

### US-005: Secure Access

**As a** user
**I want** to log in securely using my Google account or a Magic Link
**So that** my preferences and custom settings are saved privately.

**Acceptance Criteria:**

- Login page supports Google OAuth and Email Magic Links.
- Unauthenticated users see a "Demo Mode".
