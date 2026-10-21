import type { ProjectStatus, OrderStatus } from '../types';

const STATUS_CLASSES: Record<string, string> = {
  DRAFT: 'status-draft',
  ANALYZED: 'status-analyzed',
  LISTED: 'status-listed',
  SOLD_OUT: 'status-listed',
  LOCKED: 'status-locked',
  RETIRED: 'status-retired',
};

export function StatusBadge({ status }: { status: ProjectStatus | OrderStatus | string }) {
  return (
    <span className={STATUS_CLASSES[status] || 'status-draft'}>
      {status === 'DRAFT' && '○ '}
      {status === 'ANALYZED' && '◉ '}
      {status === 'LISTED' && '✓ '}
      {status === 'RETIRED' && '⬢ '}
      {status}
    </span>
  );
}

export function HederaBadge({ label }: { label?: string }) {
  return (
    <span className="hedera-badge">
      <svg className="w-3 h-3" viewBox="0 0 40 40" fill="currentColor">
        <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M12 14h4v4h8v-4h4v12h-4v-4h-8v4h-4z" />
      </svg>
      {label || 'Verified on Hedera'}
    </span>
  );
}

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size];
  return (
    <svg className={`${s} animate-spin text-brand-400`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
    </svg>
  );
}

export function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-xl font-semibold text-gray-300 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm">{description}</p>
    </div>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
              i < current
                ? 'bg-brand-500 text-white'
                : i === current
                ? 'bg-brand-500/20 text-brand-400 border-2 border-brand-500 stepper-active'
                : 'bg-gray-800 text-gray-500 border border-gray-700'
            }`}
          >
            {i < current ? '✓' : i + 1}
          </div>
          <span className={`text-xs font-medium hidden sm:inline ${
            i <= current ? 'text-gray-200' : 'text-gray-600'
          }`}>
            {step}
          </span>
          {i < steps.length - 1 && (
            <div className={`w-6 h-0.5 ${i < current ? 'bg-brand-500' : 'bg-gray-700'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function HashScanLink({ txId, label }: { txId: string; label?: string }) {
  const url = `https://hashscan.io/testnet/transaction/${txId.replace(/@/g, '-').replace(/\./g, '.')}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 text-sm transition-colors"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
      </svg>
      {label || 'HashScan'}
    </a>
  );
}
