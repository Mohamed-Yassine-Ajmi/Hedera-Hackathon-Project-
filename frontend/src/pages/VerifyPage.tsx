import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HashScanLink, LoadingSpinner, HederaBadge } from '../components/Shared';
import * as api from '../api';
import type { SerialInfo } from '../types';

export default function VerifyPage() {
  const { tokenId, serial } = useParams<{ tokenId: string; serial: string }>();
  const [info, setInfo] = useState<SerialInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenId || !serial) return;
    api.getSerialInfo(tokenId, parseInt(serial))
      .then(setInfo)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [tokenId, serial]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <span className="text-5xl block mb-4">❌</span>
        <h1 className="text-2xl font-bold text-white mb-2">Not Found</h1>
        <p className="text-gray-400">
          No record found for token {tokenId} serial #{serial}.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fade-in">
      <div className="glass-card p-6 text-center space-y-4">
        <span className="text-6xl block">{info.deleted ? '🔥' : '✅'}</span>
        <h1 className="text-2xl font-bold text-white">
          Carbon Credit #{info.serial}
        </h1>
        <HederaBadge />

        <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Token</span>
            <span className="font-mono text-gray-300">{info.tokenId}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Serial</span>
            <span className="font-mono text-gray-300">#{info.serial}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className={info.deleted ? 'text-purple-400 font-semibold' : 'text-brand-400 font-semibold'}>
              {info.deleted ? '🔥 Permanently Retired' : '✓ Active'}
            </span>
          </div>
          {info.owner && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Owner</span>
              <span className="font-mono text-gray-300">{info.owner}</span>
            </div>
          )}
        </div>

        <div className="space-y-2 text-left">
          <h3 className="text-sm font-semibold text-gray-400">On-Chain History</h3>
          {info.events.map((evt, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs">
                {i + 1}
              </span>
              <span className="text-gray-300 flex-1">{evt.type}</span>
              <HashScanLink txId={evt.txId} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
