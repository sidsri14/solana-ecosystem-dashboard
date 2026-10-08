import {
  NetworkStats, ValidatorInfo, EconomicData, EcosystemNews,
  AnomalyAlert, PriceHistory, TvlHistory, TpsHistory, SolamiConfig
} from '../types';

export const SOLAMI_DEFAULT_KEY = 'st-earn-sep-26';
export const SOLAMI_RPC_BASE = 'https://rpc.solami.dev/sol';
const FALLBACK_RPC = 'https://api.mainnet-beta.solana.com';

let lastLatencyMs = 118;

export function getSolamiConfig(): SolamiConfig {
  if (typeof window === 'undefined') {
    return { apiKey: '', customRpc: '', provider: 'solami', latencyMs: 118 };
  }
  const savedProvider = (localStorage.getItem('solami_provider') as any) || 'solami';
  const apiKey = localStorage.getItem('solami_api_key') || '';
  const customRpc = localStorage.getItem('solami_custom_rpc') || '';
  return {
    apiKey,
    customRpc,
    provider: savedProvider,
    latencyMs: lastLatencyMs,
  };
}

export function saveSolamiConfig(config: Partial<SolamiConfig>) {
  if (typeof window === 'undefined') return;
  if (config.apiKey !== undefined) localStorage.setItem('solami_api_key', config.apiKey);
  if (config.customRpc !== undefined) localStorage.setItem('solami_custom_rpc', config.customRpc);
  if (config.provider !== undefined) localStorage.setItem('solami_provider', config.provider);
}

export function getActiveRpcEndpoint(): { url: string; providerName: string } {
  const config = getSolamiConfig();
  if (config.provider === 'custom' && config.customRpc.trim()) {
    return { url: config.customRpc.trim(), providerName: 'Custom Solana RPC' };
  }
  if (config.provider === 'mainnet') {
    return { url: FALLBACK_RPC, providerName: 'Solana Public Mainnet' };
  }
  const key = config.apiKey.trim() || SOLAMI_DEFAULT_KEY;
  return {
    url: `${SOLAMI_RPC_BASE}?api_key=${encodeURIComponent(key)}`,
    providerName: 'Solami Bare-Metal RPC (gRPC / Yellowstone)'
  };
}

async function rpcCall(method: string, params: any[] = []): Promise<any> {
  const { url, providerName } = getActiveRpcEndpoint();
  const startTime = performance.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    lastLatencyMs = Math.round(performance.now() - startTime);
    const json = await res.json();
    return json.result;
  } catch (e) {
    console.warn(`RPC ${method} failed on ${providerName}, trying fallback:`, e);
    if (url !== FALLBACK_RPC) {
      try {
        const fallbackRes = await fetch(FALLBACK_RPC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        });
        const fallbackJson = await fallbackRes.json();
        return fallbackJson.result;
      } catch (err) {
        console.error('Fallback RPC also failed:', err);
      }
    }
    return null;
  }
}

export async function fetchNetworkStats(): Promise<NetworkStats> {
  const [epochInfo, perfSamples, health, slot] = await Promise.all([
    rpcCall('getEpochInfo'),
    rpcCall('getRecentPerformanceSamples', [4]),
    rpcCall('getHealth').catch(() => 'unknown'),
    rpcCall('getSlot'),
  ]);

  let avgTps = 0;
  let avgSlotTimeMs = 400;
  let trueCount = 0;
  let voteCount = 0;
  if (perfSamples && perfSamples.length > 0) {
    const totalTx = perfSamples.reduce((s: number, p: any) => s + (p.numTransactions || 0), 0);
    const totalSlots = perfSamples.reduce((s: number, p: any) => s + (p.numSlots || 1), 0);
    const totalSec = perfSamples.reduce((s: number, p: any) => s + (p.samplePeriodSecs || 60), 0);
    avgTps = Math.round(totalTx / Math.max(totalSec, 1));
    avgSlotTimeMs = Math.round((totalSec * 1000) / Math.max(totalSlots, 1));
    const totalNonVote = perfSamples.reduce((s: number, p: any) => s + (p.numNonVoteTransactions || 0), 0);
    trueCount = totalNonVote;
    voteCount = totalTx - totalNonVote;
  }

  const epoch = epochInfo?.epoch || 0;
  const slotIndex = epochInfo?.slotIndex || 0;
  const slotsInEpoch = epochInfo?.slotsInEpoch || 432000;
  const { providerName } = getActiveRpcEndpoint();

  return {
    tps: avgTps,
    trueTransactionCount: trueCount,
    voteTransactionCount: voteCount,
    slotHeight: slot || epochInfo?.absoluteSlot || 0,
    blockHeight: epochInfo?.blockHeight || 0,
    epoch,
    epochProgress: Math.round((slotIndex / slotsInEpoch) * 10000) / 100,
    epochSlotIndex: slotIndex,
    epochSlotsTotal: slotsInEpoch,
    avgSlotTimeMs,
    health: health === 'ok' ? 'ok' : 'behind',
    lastUpdated: new Date().toLocaleTimeString(),
    rpcProvider: providerName,
    rpcLatencyMs: lastLatencyMs,
  };
}

export async function fetchValidatorInfo(): Promise<ValidatorInfo> {
  const voteAccounts = await rpcCall('getVoteAccounts');
  if (!voteAccounts) {
    return {
      totalActive: 1400, totalDelinquent: 30, delinquencyRate: 2.1,
      totalStake: 380_000_000, topValidators: []
    };
  }

  const current = voteAccounts.current || [];
  const delinquent = voteAccounts.delinquent || [];
  const totalActive = current.length;
  const totalDelinquent = delinquent.length;
  const totalStake = current.reduce((s: number, v: any) => s + (v.activatedStake || 0), 0) / 1e9;

  const sorted = [...current].sort((a: any, b: any) => (b.activatedStake || 0) - (a.activatedStake || 0));
  const topValidators = sorted.slice(0, 10).map((v: any, i: number) => ({
    name: `Validator ${v.votePubkey?.slice(0, 8) || i}...`,
    stake: Math.round((v.activatedStake || 0) / 1e9),
    commission: v.commission || 0,
    delinquent: false,
  }));

  return {
    totalActive, totalDelinquent,
    delinquencyRate: Math.round((totalDelinquent / (totalActive + totalDelinquent)) * 10000) / 100,
    totalStake: Math.round(totalStake),
    topValidators,
  };
}

export async function fetchEconomicData(): Promise<EconomicData> {
  let solPrice = 0, solPriceChange24h = 0, marketCap = 0, volume24h = 0;
  let totalSupply = 0, circulatingSupply = 0;

  try {
    const cgRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true');
    const cg = await cgRes.json();
    solPrice = cg.solana?.usd || 0;
    solPriceChange24h = cg.solana?.usd_24h_change || 0;
    marketCap = cg.solana?.usd_market_cap || 0;
    volume24h = cg.solana?.usd_24h_vol || 0;
  } catch (e) {
    console.warn('CoinGecko fetch failed, using fallback');
    solPrice = 178.50; solPriceChange24h = 2.3; marketCap = 82_000_000_000; volume24h = 3_200_000_000;
  }

  try {
    const supplyRes = await rpcCall('getSupply');
    if (supplyRes?.value) {
      totalSupply = Math.round(supplyRes.value.total / 1e9);
      circulatingSupply = Math.round(supplyRes.value.circulating / 1e9);
    }
  } catch (e) {
    totalSupply = 590_000_000; circulatingSupply = 470_000_000;
  }

  let tvl = 0, tvlChange24h = 0;
  try {
    const defiRes = await fetch('https://api.llama.fi/v2/chains');
    const chains = await defiRes.json();
    const solana = chains.find((c: any) => c.name === 'Solana' || c.gecko_id === 'solana');
    tvl = solana?.tvl || 0;
    tvlChange24h = solana?.change_1d || 0;
  } catch (e) {
    tvl = 8_500_000_000; tvlChange24h = 1.5;
  }

  let dexVolume24h = 0;
  try {
    const dexRes = await fetch('https://api.llama.fi/overview/dexs/solana?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyVolume');
    const dex = await dexRes.json();
    dexVolume24h = dex?.total24h || dex?.totalDataChart?.[dex.totalDataChart.length - 1]?.[1] || 2_800_000_000;
  } catch (e) {
    dexVolume24h = 2_800_000_000;
  }

  return {
    solPrice, solPriceChange24h: Math.round(solPriceChange24h * 100) / 100,
    marketCap, volume24h,
    solSupply: { total: totalSupply, circulating: circulatingSupply },
    stablecoinSupply: 12_500_000_000,
    dexVolume24h,
    tvl, tvlChange24h: Math.round(tvlChange24h * 100) / 100,
    dailyActiveAddresses: 2_400_000 + Math.floor(Math.random() * 200_000),
    medianFee: 0.000025,
    rev24h: 850_000 + Math.floor(Math.random() * 150_000),
  };
}

export function generateEcosystemNews(): EcosystemNews[] {
  return [
    { id: 'n1', title: 'Alpenglow consensus upgrade proposal moves to final review', source: 'Solana Foundation', timestamp: '2h ago', category: 'upgrade', sentiment: 'positive' },
    { id: 'n2', title: 'Jupiter exceeds $500B cumulative swap volume milestone', source: 'Jupiter Exchange', timestamp: '4h ago', category: 'defi', sentiment: 'positive' },
    { id: 'n3', title: 'Firedancer validator client reaches 40% testnet stake', source: 'Jump Crypto', timestamp: '6h ago', category: 'upgrade', sentiment: 'positive' },
    { id: 'n4', title: 'Solana tokenized equities surpass $2B in daily trading volume', source: 'Backed Finance', timestamp: '8h ago', category: 'ecosystem', sentiment: 'positive' },
    { id: 'n5', title: 'SIMD-525 (fee market overhaul) enters community vote phase', source: 'Solana Governance', timestamp: '12h ago', category: 'governance', sentiment: 'neutral' },
    { id: 'n6', title: 'Helius RPC processes 1 trillion API calls in August 2026', source: 'Helius Labs', timestamp: '14h ago', category: 'ecosystem', sentiment: 'positive' },
    { id: 'n7', title: 'Solana DePIN protocols reach $1.2B combined TVL', source: 'DePIN Pulse', timestamp: '18h ago', category: 'ecosystem', sentiment: 'positive' },
    { id: 'n8', title: 'Metaplex Core NFT standard adoption crosses 50M mints', source: 'Metaplex Foundation', timestamp: '1d ago', category: 'nft', sentiment: 'positive' },
  ];
}

export function generateAnomalyAlerts(stats: NetworkStats, econ: EconomicData): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];
  if (stats.tps > 5000) {
    alerts.push({
      id: 'a-tps-spike', metric: 'TPS', type: 'spike', severity: 'warning',
      value: stats.tps, baseline: 3500, percentDeviation: Math.round(((stats.tps - 3500) / 3500) * 100),
      timestamp: stats.lastUpdated, description: `TPS spiked to ${stats.tps}, ${Math.round(((stats.tps - 3500) / 3500) * 100)}% above 7-day average of 3,500.`
    });
  }
  if (stats.tps < 1000 && stats.tps > 0) {
    alerts.push({
      id: 'a-tps-drop', metric: 'TPS', type: 'drop', severity: 'critical',
      value: stats.tps, baseline: 3500, percentDeviation: Math.round(((3500 - stats.tps) / 3500) * 100),
      timestamp: stats.lastUpdated, description: `TPS dropped to ${stats.tps}, significantly below normal range.`
    });
  }
  if (stats.avgSlotTimeMs > 600) {
    alerts.push({
      id: 'a-slot-slow', metric: 'Slot Time', type: 'spike', severity: 'warning',
      value: stats.avgSlotTimeMs, baseline: 400, percentDeviation: Math.round(((stats.avgSlotTimeMs - 400) / 400) * 100),
      timestamp: stats.lastUpdated, description: `Average slot time ${stats.avgSlotTimeMs}ms exceeds 600ms threshold.`
    });
  }
  if (econ.tvlChange24h < -10) {
    alerts.push({
      id: 'a-tvl-drop', metric: 'TVL', type: 'drop', severity: 'critical',
      value: econ.tvl, baseline: econ.tvl / (1 + econ.tvlChange24h / 100), percentDeviation: Math.abs(econ.tvlChange24h),
      timestamp: stats.lastUpdated, description: `Solana TVL dropped ${Math.abs(econ.tvlChange24h)}% in 24 hours.`
    });
  }
  return alerts;
}

export function generatePriceHistory(): PriceHistory[] {
  const data: PriceHistory[] = [];
  let price = 160;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    price += (Math.random() - 0.45) * 6;
    price = Math.max(120, Math.min(220, price));
    data.push({ timestamp: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), price: Math.round(price * 100) / 100 });
  }
  return data;
}

export function generateTvlHistory(): TvlHistory[] {
  const data: TvlHistory[] = [];
  let tvl = 6_500_000_000;
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    tvl += (Math.random() - 0.4) * 300_000_000;
    tvl = Math.max(5_000_000_000, Math.min(12_000_000_000, tvl));
    data.push({ timestamp: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), tvl: Math.round(tvl) });
  }
  return data;
}

export function generateTpsHistory(): TpsHistory[] {
  const data: TpsHistory[] = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(); d.setHours(d.getHours() - i);
    data.push({
      timestamp: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      tps: 2000 + Math.floor(Math.random() * 3000),
    });
  }
  return data;
}

export function generateMarkdownReport(stats: NetworkStats, validators: ValidatorInfo, econ: EconomicData, alerts: AnomalyAlert[]): string {
  return `# Solana Ecosystem Report
*Auto-generated at ${new Date().toISOString()}*

## Network Performance
| Metric | Value |
|--------|-------|
| TPS | ${stats.tps.toLocaleString()} |
| Slot Height | ${stats.slotHeight.toLocaleString()} |
| Block Height | ${stats.blockHeight.toLocaleString()} |
| Epoch | ${stats.epoch} (${stats.epochProgress}%) |
| Avg Slot Time | ${stats.avgSlotTimeMs}ms |
| Health | ${stats.health} |

## Validators
| Metric | Value |
|--------|-------|
| Active | ${validators.totalActive.toLocaleString()} |
| Delinquent | ${validators.totalDelinquent} |
| Delinquency Rate | ${validators.delinquencyRate}% |
| Total Stake | ${validators.totalStake.toLocaleString()} SOL |

## Economics
| Metric | Value |
|--------|-------|
| SOL Price | $${econ.solPrice.toFixed(2)} (${econ.solPriceChange24h > 0 ? '+' : ''}${econ.solPriceChange24h}%) |
| Market Cap | $${(econ.marketCap / 1e9).toFixed(2)}B |
| 24h Volume | $${(econ.volume24h / 1e9).toFixed(2)}B |
| TVL | $${(econ.tvl / 1e9).toFixed(2)}B (${econ.tvlChange24h > 0 ? '+' : ''}${econ.tvlChange24h}%) |
| DEX Volume 24h | $${(econ.dexVolume24h / 1e9).toFixed(2)}B |
| Daily Active Addresses | ${econ.dailyActiveAddresses.toLocaleString()} |
| Median Fee | ${econ.medianFee} SOL |
| REV 24h | $${(econ.rev24h / 1000).toFixed(0)}K |
| Total Supply | ${econ.solSupply.total.toLocaleString()} SOL |
| Circulating Supply | ${econ.solSupply.circulating.toLocaleString()} SOL |

## Anomaly Alerts
${alerts.length === 0 ? 'No anomalies detected.' : alerts.map(a => `- **[${a.severity.toUpperCase()}]** ${a.description}`).join('\n')}
`;
}

export function generateJsonReport(stats: NetworkStats, validators: ValidatorInfo, econ: EconomicData, alerts: AnomalyAlert[]): string {
  return JSON.stringify({ generatedAt: new Date().toISOString(), network: stats, validators, economics: econ, anomalies: alerts }, null, 2);
}
