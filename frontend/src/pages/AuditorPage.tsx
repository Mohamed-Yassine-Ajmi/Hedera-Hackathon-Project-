import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import MapView from '../components/MapView';
import NdviChart from '../components/NdviChart';
import { StatusBadge, HashScanLink, LoadingSpinner, EmptyState, HederaBadge } from '../components/Shared';
import * as api from '../api';
import type { Project, AuditResult } from '../types';
import { MOCK_NDVI_SERIES } from '../mocks';

export default function AuditorPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [netTonnage, setNetTonnage] = useState('50');
  const [bufferPct, setBufferPct] = useState('15');
  const [notes, setNotes] = useState('Verified against Sentinel-2 spectral indices and baseline.');
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [vcExpanded, setVcExpanded] = useState(false);

  useEffect(() => {
    api.listProjects()
      .then((all) => setProjects(all.filter((p) => p.status === 'ANALYZED')))
      .catch(() => toast.error('Failed to load projects'));
  }, []);

  const handleAudit = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const result = await api.auditProject(selected.id, {
        auditorId: 'auditor_demo',
        approve: true,
        netTonnage: parseInt(netTonnage),
        bufferPct: parseFloat(bufferPct),
        notes,
      });
      setAuditResult(result);
      toast.success('Audit approved! NFTs minted.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="section-title">🔍 Auditor Dashboard</h1>
        <p className="section-subtitle">Review satellite evidence and approve carbon credits.</p>
      </div>

      {projects.length === 0 && !auditResult ? (
        <EmptyState icon="📋" title="No projects awaiting audit"
          description="Projects will appear here once satellite analysis is complete." />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Project list */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Pending Review</h2>
            {projects.map((p) => (
              <div
                key={p.id}
                className={`glass-card-hover p-4 cursor-pointer ${
                  selected?.id === p.id ? 'border-brand-500/50 shadow-glow' : ''
                }`}
                onClick={() => { setSelected(p); setAuditResult(null); }}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-white text-sm">{p.name}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-xs text-gray-500">{p.owner}</p>
                <div className="flex gap-3 mt-2 text-xs text-gray-400">
                  <span>{p.area_ha.toFixed(1)} ha</span>
                  {p.ndvi_mean && <span>NDVI {p.ndvi_mean.toFixed(2)}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Review panel */}
          <div className="lg:col-span-2 space-y-4">
            {selected ? (
              <>
                <div className="glass-card p-5">
                  <h2 className="text-lg font-semibold text-white mb-4">{selected.name}</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <MapView polygon={selected.geojson} height="h-[250px]" />
                    <NdviChart data={MOCK_NDVI_SERIES} height={220} />
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">Area</p>
                      <p className="font-bold text-white">
                        {(selected.area_ha ?? (selected as any).areaHa ?? 0).toFixed(1)} ha
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">NDVI Mean</p>
                      <p className="font-bold text-brand-400">{selected.ndvi_mean?.toFixed(3) || '-'}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                      <p className="text-xs text-gray-500">PDD Hash</p>
                      <p className="font-mono text-xs text-gray-300 truncate" title={selected.pddHash || (selected as any).pdd_hash}>
                        {(selected.pddHash || (selected as any).pdd_hash)
                          ? (selected.pddHash || (selected as any).pdd_hash).slice(0, 14) + '…'
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Audit form */}
                {!auditResult && (
                  <div className="glass-card p-5 space-y-4">
                    <h3 className="font-semibold text-white">Audit Decision</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Net Tonnage (tCO₂e)</label>
                        <input className="input-field" type="number" value={netTonnage}
                          onChange={(e) => setNetTonnage(e.target.value)} />
                      </div>
                      <div>
                        <label className="label">Buffer %</label>
                        <input className="input-field" type="number" value={bufferPct}
                          onChange={(e) => setBufferPct(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="label">Notes</label>
                      <textarea className="input-field h-20" value={notes}
                        onChange={(e) => setNotes(e.target.value)} />
                    </div>
                    <button className="btn-primary w-full" onClick={handleAudit} disabled={loading}>
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <LoadingSpinner size="sm" /> Signing & Minting…
                        </span>
                      ) : (
                        '✅ Approve & Sign'
                      )}
                    </button>
                  </div>
                )}

                {/* Audit result */}
                {auditResult && (
                  <div className="glass-card p-5 space-y-4 animate-slide-up">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎉</span>
                      <h3 className="font-semibold text-white">Audit Complete</h3>
                      <HederaBadge />
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Token ID</p>
                        <p className="font-mono text-brand-400 font-bold">{auditResult.tokenId}</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Serials Minted</p>
                        <p className="font-bold text-white">{auditResult.serials.length}</p>
                      </div>
                      <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Status</p>
                        <StatusBadge status={auditResult.status} />
                      </div>
                    </div>

                    {auditResult.txIds.map((txId) => (
                      <HashScanLink key={txId} txId={txId} label="View Mint Transaction" />
                    ))}

                    {/* Collapsible VC JSON */}
                    <div>
                      <button
                        className="text-sm text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-1"
                        onClick={() => setVcExpanded(!vcExpanded)}
                      >
                        <span className={`transition-transform ${vcExpanded ? 'rotate-90' : ''}`}>▶</span>
                        Verifiable Credential JSON
                      </button>
                      {vcExpanded && (
                        <pre className="mt-2 bg-gray-900 rounded-xl p-4 text-xs text-gray-300 overflow-auto max-h-64 border border-gray-700/50">
                          {JSON.stringify(auditResult.vc, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-600">
                Select a project to review
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
