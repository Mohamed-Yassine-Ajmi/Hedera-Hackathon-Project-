import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import MapView from '../components/MapView';
import NdviChart from '../components/NdviChart';
import { StatusBadge, Stepper, HashScanLink, LoadingSpinner, EmptyState } from '../components/Shared';
import * as api from '../api';
import type { GeoJsonPolygon, AnalysisResult, Project } from '../types';
import { MOCK_NDVI_SERIES } from '../mocks';

const METHODOLOGIES = [
  'VM0007 - REDD+ Improved Forest Management',
  'VM0042 - Improved Agricultural Land Management',
  'AR-AM0014 - Afforestation and Reforestation',
  'VM0015 - Avoided Unplanned Deforestation',
];

const STATUS_STEPS = ['DRAFT', 'ANALYZED', 'LISTED'];

export default function SellerPage() {
  // form state
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [methodology, setMethodology] = useState(METHODOLOGIES[0]);
  const [geojson, setGeojson] = useState<GeoJsonPolygon | null>(null);
  const [geojsonText, setGeojsonText] = useState('');
  const [pddFile, setPddFile] = useState<File | null>(null);
  const [pddHash, setPddHash] = useState('');
  const [pricePerTonne, setPricePerTonne] = useState('28');

  // project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [conflictGeo, setConflictGeo] = useState<GeoJsonPolygon | null>(null);

  // load projects on mount
  const [loaded, setLoaded] = useState(false);
  if (!loaded) {
    setLoaded(true);
    api.listProjects().then(setProjects).catch(() => toast.error('Failed to load projects'));
  }

  const onPolygonDrawn = useCallback((g: GeoJsonPolygon) => {
    setGeojson(g);
    setGeojsonText(JSON.stringify(g, null, 2));
    setConflictGeo(null);
  }, []);

  const handleGeoJsonPaste = () => {
    try {
      const parsed = JSON.parse(geojsonText);
      if (parsed.type !== 'Polygon' || !parsed.coordinates) {
        toast.error('Invalid GeoJSON: must be a Polygon');
        return;
      }
      setGeojson(parsed);
      toast.success('GeoJSON loaded');
    } catch {
      toast.error('Invalid JSON');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPddFile(file);
    const buffer = await file.arrayBuffer();
    const hashBuf = await crypto.subtle.digest('SHA-256', buffer);
    const hashArr = Array.from(new Uint8Array(hashBuf));
    const hex = '0x' + hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
    setPddHash(hex);
    toast.success(`SHA-256: ${hex.slice(0, 16)}…`);
  };

  const handleSubmit = async () => {
    if (!name || !owner || !geojson) {
      toast.error('Fill all required fields and draw/paste a polygon');
      return;
    }
    setLoading(true);
    setConflictGeo(null);
    try {
      let finalPddHash = pddHash;
      if (!finalPddHash) {
        const encoder = new TextEncoder();
        const hashBuf = await crypto.subtle.digest('SHA-256', encoder.encode(`${name}-${owner}-${Date.now()}`));
        finalPddHash = '0x' + Array.from(new Uint8Array(hashBuf)).map((b) => b.toString(16).padStart(2, '0')).join('');
      }

      const result = await api.createProject({
        name,
        owner,
        methodology,
        geojson,
        pddHash: finalPddHash,
        pricePerTonneUsd: parseFloat(pricePerTonne) || 28,
      });
      toast.success(`Project ${result.id} registered! Click "Run satellite analysis" below to proceed.`);
      const updated = await api.listProjects();
      setProjects(updated);
      const createdObj = updated.find((p) => p.id === result.id);
      if (createdObj) {
        setSelectedProject(createdObj);
      }
      // reset form fields
      setName(''); setOwner(''); setGeojsonText(''); setGeojson(null); setPddHash(''); setPddFile(null);
    } catch (err: any) {
      if (err.status === 409 && err.body?.conflictingProjectId) {
        toast.error(err.body.error || 'Parcel overlaps!');
        const conflicting = projects.find((p) => p.id === err.body.conflictingProjectId);
        if (conflicting?.geojson) setConflictGeo(conflicting.geojson);
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (project: Project) => {
    setLoading(true);
    try {
      const result = await api.analyzeProject(project.id);
      setAnalysis(result);
      toast.success('Satellite analysis complete!');
      const updated = await api.listProjects();
      setProjects(updated);
      setSelectedProject(updated.find((p) => p.id === project.id) || project);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentStep = selectedProject
    ? STATUS_STEPS.indexOf(selectedProject.status)
    : -1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="section-title">🌱 Seller Dashboard</h1>
        <p className="section-subtitle">Register land parcels, run satellite analysis, and get projects listed.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Registration Form */}
        <div className="glass-card p-6 space-y-5">
          <h2 className="text-lg font-semibold text-white">Register New Project</h2>

          <div>
            <label className="label">Project Name *</label>
            <input className="input-field" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Atlas Cedar Reforestation" />
          </div>

          <div>
            <label className="label">Owner *</label>
            <input className="input-field" value={owner} onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g. Atlas Conservation NGO" />
          </div>

          <div>
            <label className="label">Methodology</label>
            <select className="input-field" value={methodology} onChange={(e) => setMethodology(e.target.value)}>
              {METHODOLOGIES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Price per Tonne (USD)</label>
            <input className="input-field" type="number" value={pricePerTonne}
              onChange={(e) => setPricePerTonne(e.target.value)} placeholder="28" />
          </div>

          <div>
            <label className="label">PDD Document</label>
            <input type="file" className="input-field text-sm file:mr-3 file:py-1 file:px-3
              file:rounded-lg file:border-0 file:bg-brand-500/20 file:text-brand-400 file:font-medium
              file:cursor-pointer" onChange={handleFileUpload} />
            {pddHash && (
              <p className="mt-1 text-xs text-gray-500 font-mono truncate">SHA-256: {pddHash}</p>
            )}
          </div>

          <div>
            <label className="label">GeoJSON (paste)</label>
            <textarea className="input-field font-mono text-xs h-24" value={geojsonText}
              onChange={(e) => setGeojsonText(e.target.value)}
              placeholder='{"type":"Polygon","coordinates":[[[lng,lat],...]]}' />
            <button className="btn-secondary text-xs mt-2" onClick={handleGeoJsonPaste}>
              Load from text
            </button>
          </div>

          <button className="btn-primary w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? <LoadingSpinner size="sm" /> : 'Register Parcel'}
          </button>
        </div>

        {/* Map */}
        <div className="space-y-4">
          <MapView
            editable
            onPolygonDrawn={onPolygonDrawn}
            polygon={geojson || undefined}
            conflictPolygon={conflictGeo || undefined}
            height="h-[480px]"
          />
          {geojson && (
            <p className="text-xs text-gray-500">
              ✓ Polygon set — {geojson.coordinates[0].length - 1} vertices
            </p>
          )}
        </div>
      </div>

      {/* Project List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Your Projects</h2>
        {projects.length === 0 ? (
          <EmptyState icon="📂" title="No projects yet" description="Register your first parcel above." />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className={`glass-card-hover p-5 cursor-pointer ${
                  selectedProject?.id === p.id ? 'border-brand-500/50 shadow-glow' : ''
                }`}
                onClick={() => { setSelectedProject(p); setAnalysis(null); }}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white text-sm leading-tight">{p.name}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-xs text-gray-500 mb-3">{p.owner}</p>
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>{(p.area_ha ?? (p as any).areaHa ?? 0).toFixed(1)} ha</span>
                  {p.ndvi_mean && <span>NDVI {p.ndvi_mean.toFixed(2)}</span>}
                  {p.token_id && <span className="font-mono text-brand-400">{p.token_id}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Detail */}
      {selectedProject && (
        <div className="glass-card p-6 space-y-6 animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white">{selectedProject.name}</h2>
              <p className="text-sm text-gray-500 font-mono flex items-center gap-2">
                ID: <span className="text-brand-400 select-all">{selectedProject.id}</span>
              </p>
            </div>
            <Stepper steps={STATUS_STEPS} current={currentStep >= 0 ? currentStep : 0} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <MapView polygon={selectedProject.geojson} height="h-[300px]" />

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <p className="text-xs text-gray-500">Area</p>
                  <p className="text-lg font-bold text-white">
                    {(selectedProject.area_ha ?? (selectedProject as any).areaHa ?? 0).toFixed(1)}{' '}
                    <span className="text-sm text-gray-400">ha</span>
                  </p>
                </div>
                {selectedProject.ndvi_mean && (
                  <div className="bg-gray-800/50 rounded-xl p-3">
                    <p className="text-xs text-gray-500">NDVI Mean</p>
                    <p className="text-lg font-bold text-brand-400">{selectedProject.ndvi_mean.toFixed(3)}</p>
                  </div>
                )}
                {analysis && (
                  <>
                    <div className="bg-gray-800/50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">tCO₂e</p>
                      <p className="text-lg font-bold text-white">{analysis.tco2e}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">HCS Seq</p>
                      <p className="text-lg font-bold text-teal-400">#{analysis.hcsSeq}</p>
                    </div>
                  </>
                )}
              </div>

              {analysis?.reportHash && (
                <div className="bg-gray-800/50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Report Hash</p>
                  <p className="text-xs font-mono text-gray-300 break-all">{analysis.reportHash}</p>
                </div>
              )}

              {selectedProject.status === 'DRAFT' && (
                <button
                  className="btn-primary w-full"
                  onClick={() => handleAnalyze(selectedProject)}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" /> Running Satellite Analysis…
                    </span>
                  ) : (
                    '🛰️ Run Satellite Analysis'
                  )}
                </button>
              )}
            </div>
          </div>

          {(analysis?.ndviSeries || selectedProject.ndvi_mean) && (
            <NdviChart data={analysis?.ndviSeries || MOCK_NDVI_SERIES} />
          )}
        </div>
      )}
    </div>
  );
}
