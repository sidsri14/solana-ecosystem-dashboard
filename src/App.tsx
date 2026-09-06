import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchNetworkStats, fetchValidatorInfo, fetchEconomicData,
  generateEcosystemNews, generateAnomalyAlerts, generatePriceHistory,
  generateTvlHistory, generateTpsHistory, generateMarkdownReport, generateJsonReport
} from './services/dataService';
import {
  NetworkStats, ValidatorInfo, EconomicData, EcosystemNews,
  AnomalyAlert, PriceHistory, TvlHistory, TpsHistory, RefreshInterval
} from './types';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, CartesianGrid
} from 'recharts';
import {
  Activity, TrendingUp, TrendingDown, Shield, Users, DollarSign, Zap,
  AlertTriangle, CheckCircle2, Clock, RefreshCw, Download, FileText,
  Radio, Eye, Layers, Globe, ChevronDown, Copy, Server, Cpu, Wallet,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Bell, Hash
} from 'lucide-react';

function fmt(n: number, decimals = 2): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(decimals)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(decimals)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(decimals)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(decimals)}K`;
  return n.toFixed(decimals);
}

function MetricCard({ label, value, unit, change, icon: Icon, color, sub }: {
  label: string; value: string; unit?: string; change?: number; icon: any; color: string; sub?: string;
}) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-colors group">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">{label}</span>
        <div className={`w-7 h-7 rounded-lg bg-${color}-500/15 flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 text-${color}-400`} />
        </div>
      </div>
      <div className="flex items-baseline space-x-1.5">
        <span className="text-2xl font-black text-white tracking-tight">{value}</span>
        {unit && <span className="text-xs text-zinc-400 font-mono">{unit}</span>}
      </div>
      {change !== undefined && (
        <div className={`flex items-center space-x-1 mt-1 text-[11px] font-semibold ${change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span>{change >= 0 ? '+' : ''}{change.toFixed(2)}%</span>
        </div>
      )}
      {sub && <p className="text-[10px] text-zinc-500 font-mono mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
        <Icon className={`w-4 h-4 text-${color}-400`} />
        <span>{title}</span>
      </h2>
      {children}
    </div>
  );
}

export default function App() {
  const [networkStats, setNetworkStats] = useState<NetworkStats | null>(null);
  const [validators, setValidators] = useState<ValidatorInfo | null>(null);
  const [economic, setEconomic] = useState<EconomicData | null>(null);
  const [news] = useState<EcosystemNews[]>(generateEcosystemNews());
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [priceHistory] = useState<PriceHistory[]>(generatePriceHistory());
  const [tvlHistory] = useState<TvlHistory[]>(generateTvlHistory());
  const [tpsHistory] = useState<TpsHistory[]>(generateTpsHistory());
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(60);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'validators' | 'reports'>('overview');
  const [copied, setCopied] = useState('');

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ns, vi, ed] = await Promise.all([
        fetchNetworkStats(), fetchValidatorInfo(), fetchEconomicData()
      ]);
      setNetworkStats(ns);
      setValidators(vi);
      setEconomic(ed);
      setAlerts(generateAnomalyAlerts(ns, ed));
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Refresh failed:', e);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { refreshData(); }, [refreshData]);
  useEffect(() => {
    const id = setInterval(refreshData, refreshInterval * 1000);
    return () => clearInterval(id);
  }, [refreshInterval, refreshData]);

  const handleExport = (type: 'md' | 'json') => {
    if (!networkStats || !validators || !economic) return;
    const content = type === 'md'
      ? generateMarkdownReport(networkStats, validators, economic, alerts)
      : generateJsonReport(networkStats, validators, economic, alerts);
    const blob = new Blob([content], { type: type === 'md' ? 'text/markdown' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `solana-report-${Date.now()}.${type}`;
    a.click(); URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-zinc-100 selection:bg-emerald-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#090D16]/90 border-b border-emerald-500/15">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-cyan-400 to-purple-500 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#090D16] rounded-[10px] flex items-center justify-center">
                <Globe className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-tight">SolPulse</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 ml-2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">LIVE</span>
              <p className="text-[9px] text-zinc-500 font-mono -mt-0.5">SOLANA ECOSYSTEM INTELLIGENCE DASHBOARD</p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {(['overview', 'validators', 'reports'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-zinc-400 hover:text-white'
                }`}>
                {tab === 'overview' ? 'Overview' : tab === 'validators' ? 'Validators' : 'Export Reports'}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <select value={refreshInterval} onChange={e => setRefreshInterval(+e.target.value as RefreshInterval)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300 font-mono cursor-pointer">
              <option value={15}>15s</option><option value={30}>30s</option>
              <option value={60}>60s</option><option value={300}>5m</option>
            </select>
            <button onClick={refreshData} disabled={isLoading}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <span className="text-[10px] font-mono text-zinc-500 hidden md:block">
              {networkStats?.health === 'ok' ? '🟢' : '🟡'} {lastRefresh}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Anomaly Alerts Banner */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map(a => (
              <div key={a.id} className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl border text-xs font-semibold ${
                a.severity === 'critical' ? 'bg-rose-950/30 border-rose-500/40 text-rose-400' : 'bg-amber-950/30 border-amber-500/40 text-amber-400'
              }`}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{a.description}</span>
                <span className="ml-auto text-[10px] font-mono opacity-60">{a.timestamp}</span>
              </div>
            ))}
          </div>
        )}

        {/* ===== OVERVIEW TAB ===== */}
        {activeTab === 'overview' && (
          <>
            {/* Network Metrics Grid */}
            <div>
              <SectionHeader icon={Cpu} title="Network Performance" color="cyan" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <MetricCard label="TPS" value={networkStats ? networkStats.tps.toLocaleString() : '—'} icon={Zap} color="cyan" sub={networkStats ? `Vote: ${fmt(networkStats.voteTransactionCount, 0)}` : ''} />
                <MetricCard label="Slot Height" value={networkStats ? networkStats.slotHeight.toLocaleString() : '—'} icon={Hash} color="purple" />
                <MetricCard label="Block Height" value={networkStats ? networkStats.blockHeight.toLocaleString() : '—'} icon={Layers} color="blue" />
                <MetricCard label="Epoch" value={networkStats ? `${networkStats.epoch}` : '—'} icon={Clock} color="amber" sub={networkStats ? `${networkStats.epochProgress}% complete` : ''} />
                <MetricCard label="Slot Time" value={networkStats ? `${networkStats.avgSlotTimeMs}` : '—'} unit="ms" icon={Activity} color="emerald" />
                <MetricCard label="Health" value={networkStats?.health === 'ok' ? 'Healthy' : 'Behind'} icon={CheckCircle2} color="emerald" />
              </div>
            </div>

            {/* Economics */}
            <div>
              <SectionHeader icon={DollarSign} title="Economic Indicators" color="emerald" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <MetricCard label="SOL Price" value={economic ? `$${economic.solPrice.toFixed(2)}` : '—'} icon={TrendingUp} color="emerald" change={economic?.solPriceChange24h} />
                <MetricCard label="Market Cap" value={economic ? `$${fmt(economic.marketCap)}` : '—'} icon={PieChart} color="blue" />
                <MetricCard label="TVL" value={economic ? `$${fmt(economic.tvl)}` : '—'} icon={Wallet} color="purple" change={economic?.tvlChange24h} />
                <MetricCard label="DEX Vol 24h" value={economic ? `$${fmt(economic.dexVolume24h)}` : '—'} icon={BarChart3} color="cyan" />
                <MetricCard label="Active Addrs" value={economic ? fmt(economic.dailyActiveAddresses, 0) : '—'} icon={Users} color="amber" />
                <MetricCard label="REV 24h" value={economic ? `$${fmt(economic.rev24h)}` : '—'} icon={DollarSign} color="rose" />
              </div>
            </div>

            {/* Supply Info */}
            <div>
              <SectionHeader icon={Wallet} title="Supply & Fees" color="purple" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MetricCard label="Total Supply" value={economic ? `${fmt(economic.solSupply.total, 0)}` : '—'} unit="SOL" icon={Globe} color="zinc" />
                <MetricCard label="Circulating" value={economic ? `${fmt(economic.solSupply.circulating, 0)}` : '—'} unit="SOL" icon={RefreshCw} color="cyan" />
                <MetricCard label="24h Volume" value={economic ? `$${fmt(economic.volume24h)}` : '—'} icon={TrendingUp} color="emerald" />
                <MetricCard label="Median Fee" value={economic ? `${economic.medianFee}` : '—'} unit="SOL" icon={Zap} color="amber" />
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                <SectionHeader icon={TrendingUp} title="SOL Price (30d)" color="emerald" />
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={priceHistory}>
                    <defs><linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                    <XAxis dataKey="timestamp" tick={{ fill: '#71717A', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#71717A', fontSize: 10 }} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ background: '#18181B', border: '1px solid #3F3F46', borderRadius: 12, fontSize: 12 }} />
                    <Area type="monotone" dataKey="price" stroke="#10B981" fill="url(#priceGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                <SectionHeader icon={Wallet} title="TVL (30d)" color="purple" />
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={tvlHistory}>
                    <defs><linearGradient id="tvlGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                    <XAxis dataKey="timestamp" tick={{ fill: '#71717A', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#71717A', fontSize: 10 }} tickFormatter={v => `$${fmt(v, 1)}`} domain={['auto', 'auto']} />
                    <Tooltip contentStyle={{ background: '#18181B', border: '1px solid #3F3F46', borderRadius: 12, fontSize: 12 }} formatter={(v: any) => [`$${fmt(v)}`, 'TVL']} />
                    <Area type="monotone" dataKey="tvl" stroke="#8B5CF6" fill="url(#tvlGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 lg:col-span-2">
                <SectionHeader icon={Zap} title="TPS History (24h)" color="cyan" />
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={tpsHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                    <XAxis dataKey="timestamp" tick={{ fill: '#71717A', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#71717A', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#18181B', border: '1px solid #3F3F46', borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="tps" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* News Feed */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
              <SectionHeader icon={Radio} title="Ecosystem & Upgrade News" color="amber" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {news.map(n => (
                  <div key={n.id} className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 flex items-start space-x-3 hover:border-zinc-700 transition-colors">
                    <span className={`mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border font-mono uppercase ${
                      n.category === 'upgrade' ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' :
                      n.category === 'defi' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                      n.category === 'governance' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                      n.category === 'nft' ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' :
                      'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
                    }`}>{n.category}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">{n.title}</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{n.source} · {n.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ===== VALIDATORS TAB ===== */}
        {activeTab === 'validators' && validators && (
          <div className="space-y-6">
            <SectionHeader icon={Server} title="Validator Network" color="purple" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="Active Validators" value={validators.totalActive.toLocaleString()} icon={CheckCircle2} color="emerald" />
              <MetricCard label="Delinquent" value={`${validators.totalDelinquent}`} icon={AlertTriangle} color="rose" />
              <MetricCard label="Delinquency Rate" value={`${validators.delinquencyRate}%`} icon={Shield} color="amber" />
              <MetricCard label="Total Stake" value={fmt(validators.totalStake)} unit="SOL" icon={Wallet} color="purple" />
            </div>

            {/* Epoch Progress Bar */}
            {networkStats && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                <SectionHeader icon={Clock} title="Epoch Progress" color="cyan" />
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-zinc-400">
                    <span>Epoch {networkStats.epoch}</span>
                    <span>{networkStats.epochProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${networkStats.epochProgress}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>Slot {networkStats.epochSlotIndex.toLocaleString()}</span>
                    <span>of {networkStats.epochSlotsTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Top Validators Table */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 overflow-x-auto">
              <SectionHeader icon={Users} title="Top 10 Validators by Stake" color="emerald" />
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800">
                    <th className="text-left py-2 pr-3">#</th>
                    <th className="text-left py-2 pr-3">Validator</th>
                    <th className="text-right py-2 pr-3">Stake (SOL)</th>
                    <th className="text-right py-2 pr-3">Commission</th>
                    <th className="text-right py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {validators.topValidators.map((v, i) => (
                    <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-2.5 pr-3 text-zinc-500">{i + 1}</td>
                      <td className="py-2.5 pr-3 text-white font-semibold">{v.name}</td>
                      <td className="py-2.5 pr-3 text-right text-zinc-300">{v.stake.toLocaleString()}</td>
                      <td className="py-2.5 pr-3 text-right text-zinc-400">{v.commission}%</td>
                      <td className="py-2.5 text-right">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${v.delinquent ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                          {v.delinquent ? 'DELINQUENT' : 'ACTIVE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== REPORTS TAB ===== */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <SectionHeader icon={FileText} title="Auto-Generated Reports" color="amber" />
            <p className="text-xs text-zinc-400 -mt-2">Download Solana ecosystem reports in Markdown or JSON format. Data refreshes every {refreshInterval}s from Solana RPC, CoinGecko, and DeFiLlama.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Markdown Report</h3>
                    <p className="text-[10px] text-zinc-400">Human-readable with tables and formatting</p>
                  </div>
                </div>
                <button onClick={() => handleExport('md')}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 cursor-pointer hover:scale-105 transition-transform">
                  <Download className="w-4 h-4" />
                  <span>Download .md</span>
                </button>
                {networkStats && economic && (
                  <button onClick={() => copyToClipboard(generateMarkdownReport(networkStats, validators!, economic, alerts), 'md')}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition-colors">
                    <Copy className="w-3 h-3" />
                    <span>{copied === 'md' ? 'Copied!' : 'Copy to Clipboard'}</span>
                  </button>
                )}
              </div>

              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">JSON Report</h3>
                    <p className="text-[10px] text-zinc-400">Machine-readable structured data</p>
                  </div>
                </div>
                <button onClick={() => handleExport('json')}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 cursor-pointer hover:scale-105 transition-transform">
                  <Download className="w-4 h-4" />
                  <span>Download .json</span>
                </button>
                {networkStats && economic && (
                  <button onClick={() => copyToClipboard(generateJsonReport(networkStats, validators!, economic, alerts), 'json')}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 cursor-pointer transition-colors">
                    <Copy className="w-3 h-3" />
                    <span>{copied === 'json' ? 'Copied!' : 'Copy to Clipboard'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Data Sources */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
              <SectionHeader icon={Globe} title="Data Sources" color="emerald" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                  <p className="font-bold text-emerald-400 font-mono text-[10px]">SOLANA RPC</p>
                  <p className="text-zinc-300 mt-1">getEpochInfo, getRecentPerformanceSamples, getVoteAccounts, getSlot, getHealth, getSupply</p>
                </div>
                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                  <p className="font-bold text-cyan-400 font-mono text-[10px]">COINGECKO API</p>
                  <p className="text-zinc-300 mt-1">SOL price, 24h change, market cap, trading volume (no API key required)</p>
                </div>
                <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                  <p className="font-bold text-purple-400 font-mono text-[10px]">DEFILLAMA API</p>
                  <p className="text-zinc-300 mt-1">TVL by chain, DEX volume, 24h TVL change (no API key required)</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-800 bg-[#070A11] mt-16 py-6 text-center text-xs text-zinc-500">
        <p>&copy; 2026 SolPulse — Solana Ecosystem Auto-Updating Dashboard</p>
        <p className="font-mono mt-1 text-[10px] text-zinc-600">Data: Solana RPC · CoinGecko · DeFiLlama | No API keys required | Refresh: {refreshInterval}s</p>
      </footer>
    </div>
  );
}
