# Business Rules for TAA for the Masses

## BR-001: Signal Generation Logic

The core "Ivy 5" timing logic is defined as follows:

1.  **Trend Calculation**:
    - **SMA**: Simple Average of the last 10 month-end prices.
    - **EMA**: Exponential Moving Average over 10 periods (Month-End).
2.  **Signal Status**:
    - **Risk-On**: Current Month-End Price > 10-Month Trend.
    - **Risk-Off**: Current Month-End Price <= 10-Month Trend.
3.  **Safety Buffer**:
    - Calculated as `(Price - Trend) / Trend`.
    - Positive buffer indicates strength; negative indicates weakness.

## BR-002: Trading Actions

Actions are derived by comparing the **Previous Month's Status** to the **Current Month's Status**:

- **BUY**: Risk-Off (Prev) -> Risk-On (Curr)
- **SELL**: Risk-On (Prev) -> Risk-Off (Curr)
- **HOLD**: Risk-On (Prev) -> Risk-On (Curr)
- **STAY CASH**: Risk-Off (Prev) -> Risk-Off (Curr)

## BR-003: Data Handling

- **Data Source**: Tiingo API (EOD data).
- **Frequency**: Signals are calculated based on **Daily Adjusted Close** prices, sampled at the last trading day of each month.
- **History**: A minimum of 26 months of historical data is required to accurately seed the first MA and provide a 12-month visible history.

## BR-004: User Ticker Overrides

- Users can override standard tickers (VTI, VEA, BND, VNQ, GSG).
- Overrides must be valid tickers resolvable by the Tiingo API.
- If a user override is invalid or data is missing, the system should fall back or display an error state, but **NOT** revert to default silently (transparency rule).

## BR-005: Demo Mode

- If no user is logged in, or if the database is unreachable, the system must display "Demo Mode".
- Demo Mode uses static mock data to demonstrate functionality without incurring API costs.
- Signal dates in Demo Mode should be labeled clearly (e.g., "DEMO" or specific past dates) to avoid confusion with live advice.
