# 🌐 SolPulse: Solana Ecosystem Auto-Updating Report & Interactive Dashboard

> **Built for Superteam Earn — Superteam Canada Bounty ($1,000 USDG)**  
> *Comprehensive, automatically updating report on the current state of the Solana ecosystem.*

---

## 🎯 What Is SolPulse?

SolPulse is a **real-time, auto-refreshing Solana ecosystem intelligence dashboard** that pulls live data from **Solana RPC**, **CoinGecko**, and **DeFiLlama** — all without API keys. It delivers:

1. **Interactive Dark-Theme HTML Dashboard** — Network performance, economic indicators, validator health, anomaly detection, and charts
2. **Human-Readable Markdown Reports** — Downloadable `.md` files with tables and narrative
3. **Machine-Readable JSON Reports** — Structured data exports for programmatic consumption

---

## 📊 Data Sources (No API Keys Required)

| Source | Endpoints Used | Data Provided |
|--------|---------------|---------------|
| **Solana RPC** | `getEpochInfo`, `getRecentPerformanceSamples`, `getVoteAccounts`, `getSlot`, `getHealth`, `getSupply` | TPS, slot time, epoch progress, validator count, stake distribution, SOL supply |
| **CoinGecko** | `/simple/price` | SOL price, 24h change, market cap, trading volume |
| **DeFiLlama** | `/v2/chains`, `/overview/dexs/solana` | TVL, TVL change, DEX volume |

---

## 🔍 Key Metrics Covered

### Network Performance
- TPS (transactions per second) with vote/non-vote breakdown
- Slot height, block height, epoch, epoch progress
- Average slot time (ms)
- Network health status

### Validators
- Active vs delinquent validator count
- Delinquency rate
- Total stake distribution
- Top 10 validators by stake with commission rates
- Epoch progress bar with slot-level granularity

### Economic Indicators
- SOL price with 24h change
- Market cap, 24h trading volume
- TVL with 24h change
- DEX volume (from DeFiLlama)
- Daily active addresses
- Median transaction fee
- Real Economic Value (REV) 24h
- Total supply vs circulating supply

### Charts (30-day / 24-hour)
- SOL price (30-day area chart)
- TVL (30-day area chart)
- TPS (24-hour bar chart)

### Anomaly Detection
- TPS spike detection (>5000)
- TPS drop detection (<1000)
- Slow slot time alerts (>600ms)
- Large TVL drops (>10%)

### Ecosystem News
- Curated feed of upgrade proposals, DeFi milestones, governance votes, and ecosystem developments

---

## 🚀 Local Setup

```bash
npm install
npm run dev    # http://localhost:5178/
npm run build  # Production bundle
```

### Configurable Auto-Refresh
Select refresh interval from the header: **15s, 30s, 60s, or 5 minutes**.

---

## 📤 Export Formats

### Markdown Report (.md)
- Formatted tables with all network, validator, and economic metrics
- Anomaly alerts section
- Human-readable narrative

### JSON Report (.json)
- Structured object with `network`, `validators`, `economics`, `anomalies` keys
- Timestamped with ISO 8601
- Ready for downstream consumption

Both formats are downloadable via the "Export Reports" tab, or copy-to-clipboard for instant use.

---

## 📜 License
MIT License. Built for Superteam Earn.
