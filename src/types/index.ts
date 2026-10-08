export interface NetworkStats {
  tps: number;
  trueTransactionCount: number;
  voteTransactionCount: number;
  slotHeight: number;
  blockHeight: number;
  epoch: number;
  epochProgress: number;
  epochSlotIndex: number;
  epochSlotsTotal: number;
  avgSlotTimeMs: number;
  health: 'ok' | 'behind' | 'unknown';
  lastUpdated: string;
  rpcProvider?: string;
  rpcLatencyMs?: number;
}

export interface SolamiConfig {
  apiKey: string;
  customRpc: string;
  provider: 'solami' | 'mainnet' | 'custom';
  latencyMs: number;
}

export interface ValidatorInfo {
  totalActive: number;
  totalDelinquent: number;
  delinquencyRate: number;
  totalStake: number;
  topValidators: { name: string; stake: number; commission: number; delinquent: boolean }[];
}

export interface EconomicData {
  solPrice: number;
  solPriceChange24h: number;
  marketCap: number;
  volume24h: number;
  solSupply: { total: number; circulating: number };
  stablecoinSupply: number;
  dexVolume24h: number;
  tvl: number;
  tvlChange24h: number;
  dailyActiveAddresses: number;
  medianFee: number;
  rev24h: number;
}

export interface EcosystemNews {
  id: string;
  title: string;
  source: string;
  timestamp: string;
  category: 'upgrade' | 'ecosystem' | 'defi' | 'nft' | 'governance';
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface AnomalyAlert {
  id: string;
  metric: string;
  type: 'spike' | 'drop';
  severity: 'warning' | 'critical';
  value: number;
  baseline: number;
  percentDeviation: number;
  timestamp: string;
  description: string;
}

export interface PriceHistory {
  timestamp: string;
  price: number;
}

export interface TvlHistory {
  timestamp: string;
  tvl: number;
}

export interface TpsHistory {
  timestamp: string;
  tps: number;
}

export type RefreshInterval = 15 | 30 | 60 | 300;
