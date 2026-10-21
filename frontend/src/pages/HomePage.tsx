import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 animate-fade-in">
      {/* Hero */}
      <div className="text-center max-w-2xl space-y-6">
        <div className="text-6xl mb-4">🍃</div>
        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
          <span className="bg-gradient-to-r from-brand-400 via-teal-400 to-brand-300 bg-clip-text text-transparent">
            ClimateTrust
          </span>
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed">
          A transparent B2B carbon credit marketplace for North Africa and the Mediterranean.
          Every tonne is an NFT on <span className="text-brand-400 font-semibold">Hedera Hashgraph</span>,
          backed by satellite evidence and independent audits.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/seller" className="btn-primary">🌱 Seller Dashboard</Link>
          <Link to="/auditor" className="btn-secondary">🔍 Audit Credits</Link>
          <Link to="/buyer" className="btn-secondary">🛒 Buy & Offset</Link>
          <Link to="/explorer" className="btn-secondary">🔗 Explorer</Link>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mt-16 w-full">
        {[
          {
            icon: '🛰️',
            title: 'Satellite Evidence',
            desc: 'Sentinel-2 NDVI analysis proves real biomass growth and carbon sequestration.',
          },
          {
            icon: '🔐',
            title: 'Hedera Hashgraph',
            desc: 'Fixed low fees, 3-5s finality, native tokenization. Every action is on-chain.',
          },
          {
            icon: '🔥',
            title: 'Permanent Retirement',
            desc: 'Credits are burned on-chain via HTS TokenWipe. No double spending, ever.',
          },
        ].map((f) => (
          <div key={f.title} className="glass-card-hover p-5 text-center">
            <span className="text-3xl block mb-3">{f.icon}</span>
            <h3 className="font-semibold text-white mb-1">{f.title}</h3>
            <p className="text-xs text-gray-400">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Tech badges */}
      <div className="flex flex-wrap gap-2 justify-center mt-12">
        {['Hedera Testnet', 'HCS', 'HTS NFTs', 'HFS', 'Ed25519 VCs', 'Sentinel-2', 'NDVI'].map((t) => (
          <span key={t} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-800/60 text-gray-400 border border-gray-700/50">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
