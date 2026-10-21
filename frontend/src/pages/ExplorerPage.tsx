import { useState } from 'react';
import toast from 'react-hot-toast';
import { HashScanLink, LoadingSpinner, EmptyState, StatusBadge } from '../components/Shared';
import * as api from '../api';
import type { ProjectTimeline, SerialInfo, ExplorerEvent } from '../types';

const EVENT_ICONS: Record<string, string> = {
  'project.registered': '📝',
  'dmrv.report': '🛰️',
  'audit.visa.issued': '✅',
  'nft.minted': '🪙',
  'nft.transferred': '📦',
  'ct.retirement': '🔥',
};

const EVENT_LABELS: Record<string, string> = {
  'project.registered': 'Project Registered',
  'dmrv.report': 'Satellite Report Hashed',
  'audit.visa.issued': 'Audit Visa Issued',
  'nft.minted': 'NFT Serials Minted',
  'nft.transferred': 'Serials Transferred',
  'ct.retirement': 'Credits Retired (Burned)',
};

function EventTimeline({ events }: { events: ExplorerEvent[] }) {
  return (
    <div className="space-y-0">
      {events.map((evt, i) => (
        <div key={i} className="flex gap-4 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-brand-500/50 flex items-center justify-center text-lg">
              {EVENT_ICONS[evt.type] || '📌'}
            </div>
            {i < events.length - 1 && (
              <div className="w-0.5 h-full min-h-[40px] bg-gradient-to-b from-brand-500/50 to-gray-800" />
            )}
          </div>

          {/* Event card */}
          <div className="glass-card p-4 mb-4 flex-1">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-semibold text-white text-sm">
                {EVENT_LABELS[evt.type] || evt.type}
              </h4>
              <span className="text-[10px] text-gray-500 font-mono">
                {new Date(evt.consensusTimestamp).toLocaleString()}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <HashScanLink txId={evt.txId} />
              {Object.entries(evt.data).map(([k, v]) => (
                <span key={k} className="text-xs text-gray-400">
                  <span className="text-gray-600">{k}:</span>{' '}
                  <span className="text-gray-300 font-mono">{String(v)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ExplorerPage() {
  const [searchType, setSearchType] = useState<'project' | 'serial'>('project');
  const [searchInput, setSearchInput] = useState('proj_atlas_cedar');
  const [tokenIdInput, setTokenIdInput] = useState('0.0.300101');
  const [serialInput, setSerialInput] = useState('1');
  const [loading, setLoading] = useState(false);
  const [projectResult, setProjectResult] = useState<ProjectTimeline | null>(null);
  const [serialResult, setSerialResult] = useState<SerialInfo | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setProjectResult(null);
    setSerialResult(null);
    try {
      if (searchType === 'project') {
        const result = await api.getProjectTimeline(searchInput);
        setProjectResult(result);
        toast.success(`Found ${result.events.length} events`);
      } else {
        const result = await api.getSerialInfo(tokenIdInput, parseInt(serialInput));
        setSerialResult(result);
        toast.success(`Serial #${result.serial}: ${result.deleted ? 'Retired' : 'Active'}`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="section-title">🔗 On-Chain Explorer</h1>
        <p className="section-subtitle">Verify any carbon credit's full lifecycle on Hedera Hashgraph.</p>
      </div>

      {/* Search */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex gap-2 justify-center">
          <button
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              searchType === 'project'
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                : 'text-gray-400 hover:text-gray-200 bg-gray-800/50'
            }`}
            onClick={() => setSearchType('project')}
          >
            By Project
          </button>
          <button
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              searchType === 'serial'
                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                : 'text-gray-400 hover:text-gray-200 bg-gray-800/50'
            }`}
            onClick={() => setSearchType('serial')}
          >
            By Token + Serial
          </button>
        </div>

        {searchType === 'project' ? (
          <div className="flex gap-2">
            <input
              className="input-field flex-1"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Project ID or Name (e.g. Atlas Cedar or proj_atlas_cedar)"
            />
            <button className="btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : 'Search'}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              className="input-field flex-1"
              value={tokenIdInput}
              onChange={(e) => setTokenIdInput(e.target.value)}
              placeholder="Token ID (e.g. 0.0.300101)"
            />
            <input
              className="input-field w-24"
              type="number"
              value={serialInput}
              onChange={(e) => setSerialInput(e.target.value)}
              placeholder="Serial"
            />
            <button className="btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? <LoadingSpinner size="sm" /> : 'Search'}
            </button>
          </div>
        )}
      </div>

      {/* Project timeline result */}
      {projectResult && (
        <div className="space-y-4 animate-slide-up">
          <div className="glass-card p-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-white">{projectResult.name}</h2>
                <p className="text-sm text-gray-500 font-mono">{projectResult.projectId}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={projectResult.status} />
                {projectResult.tokenId && (
                  <span className="font-mono text-xs text-brand-400">{projectResult.tokenId}</span>
                )}
              </div>
            </div>
          </div>
          <EventTimeline events={projectResult.events} />
        </div>
      )}

      {/* Serial result */}
      {serialResult && (
        <div className="space-y-4 animate-slide-up">
          <div className="glass-card p-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Serial #{serialResult.serial}
                </h2>
                <p className="text-sm text-gray-500 font-mono">{serialResult.tokenId}</p>
              </div>
              <div className="flex items-center gap-2">
                {serialResult.deleted ? (
                  <span className="status-retired">🔥 Retired</span>
                ) : (
                  <span className="status-listed">✓ Active</span>
                )}
                {serialResult.owner && (
                  <span className="text-xs text-gray-400">Owner: {serialResult.owner}</span>
                )}
              </div>
            </div>
          </div>
          <EventTimeline events={serialResult.events} />
        </div>
      )}

      {!projectResult && !serialResult && !loading && (
        <EmptyState
          icon="🔎"
          title="Search the Hedera ledger"
          description="Look up a project or individual serial number to see its full on-chain history."
        />
      )}
    </div>
  );
}
