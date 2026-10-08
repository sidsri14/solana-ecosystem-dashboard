# 🌐 SolPulse: Solana Ecosystem Intelligence & Solami Bare-Metal Data Gateway

> **Built for Superteam Earn — Solami Hackathon Track ($3,000 USDG) & Crypto World's Fair**  
> *Real-time on-chain telemetry, TPS and slot performance, validator health, and automated anomaly intelligence powered by Solami Bare-Metal RPC.*

- **Live Application**: [https://sidsri14.github.io/solana-ecosystem-dashboard/](https://sidsri14.github.io/solana-ecosystem-dashboard/)
- **Repository**: [https://github.com/sidsri14/solana-ecosystem-dashboard](https://github.com/sidsri14/solana-ecosystem-dashboard)

---

## ⚡ Solami Bare-Metal Integration Architecture

SolPulse integrates **Solami Bare-Metal Infrastructure** (`https://rpc.solami.dev/sol`) as its primary, ultra-low-latency data highway:

```
[ Solana Mainnet Cluster ]
         │
         ▼ (Yellowstone gRPC / Bare Metal)
[ Solami Edge Nodes (rpc.solami.dev) ]
         │
         ├─ High-throughput JSON-RPC (200 rps)
         ├─ Slot & Performance Samples (getRecentPerformanceSamples)
         ├─ Validator Epoch & Voting State (getVoteAccounts, getEpochInfo)
         └─ Fallback Circuit Breaker (Public RPC)
         │
         ▼
[ SolPulse Intelligence Engine ]
         ├─ Real-Time TPS Breakdown (True Tx vs Vote Tx)
         ├─ Microsecond Slot Timing & Latency Telemetry
         ├─ Anomaly Spike/Drop Detection Engine
         └─ Instant Markdown & JSON Exportable Reports
```

---

## 🎯 What Is SolPulse?

SolPulse is a **real-time, auto-refreshing Solana ecosystem intelligence dashboard** that pulls live data from **Solami Bare-Metal RPC**, **CoinGecko**, and **DeFiLlama**. It delivers:

1. **Interactive Dark-Theme HTML Dashboard** — Network performance, economic indicators, validator health, anomaly detection, and live latency diagnostics
2. **Solami Data Gateway Selector** — Seamlessly toggle between Solami Bare-Metal RPC (`https://rpc.solami.dev/sol?api_key=...`), Public Mainnet fallback, and custom private RPC endpoints
3. **Human-Readable Markdown Reports** — Downloadable `.md` files with tables and narrative
4. **Machine-Readable JSON Reports** — Structured data exports for programmatic consumption

---

## 📊 Data Sources & Solami Infrastructure

| Source | Endpoints / Methods | Data Provided |
|--------|---------------------|---------------|
| **Solami Bare-Metal RPC** | `rpc.solami.dev/sol`, `getEpochInfo`, `getRecentPerformanceSamples`, `getVoteAccounts`, `getSlot`, `getHealth`, `getSupply` | Sub-150ms TPS, microsecond slot timing, validator stake distribution, network health, circulating/total SOL supply |
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
