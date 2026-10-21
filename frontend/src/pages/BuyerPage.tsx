import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { StatusBadge, HederaBadge, HashScanLink, LoadingSpinner, EmptyState } from '../components/Shared';
import * as api from '../api';
import type { CatalogItem, FootprintResult, Order, PaymentResult } from '../types';

export default function BuyerPage() {
  // footprint calculator
  const [elec, setElec] = useState('1500');
  const [fuel, setFuel] = useState('400');
  const [freight, setFreight] = useState('2000');
  const [footprint, setFootprint] = useState<FootprintResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // catalog
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);

  // order flow
  const [buyQty, setBuyQty] = useState<Record<string, string>>({});
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [payResult, setPayResult] = useState<PaymentResult | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [countdown, setCountdown] = useState('');
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    api.getCatalog().then(setCatalog).catch(() => toast.error('Failed to load catalog'));
  }, []);

  // countdown timer for locked order
  useEffect(() => {
    if (!currentOrder) return;
    const tick = () => {
      const remaining = new Date(currentOrder.expiresAt).getTime() - Date.now();
      if (remaining <= 0) {
        setCountdown('Expired');
        clearInterval(timerRef.current);
      } else {
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setCountdown(`${m}:${s.toString().padStart(2, '0')}`);
      }
    };
    tick();
    timerRef.current = window.setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentOrder]);

  const handleCalcFootprint = async () => {
    setCalcLoading(true);
    try {
      const result = await api.calculateFootprint({
        electricityKwh: parseFloat(elec) || 0,
        fuelLiters: parseFloat(fuel) || 0,
        freightTkm: parseFloat(freight) || 0,
      });
      setFootprint(result);
      toast.success(`Your footprint: ${result.tco2e} tCO₂e`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCalcLoading(false);
    }
  };

  const handleBuy = async (item: CatalogItem) => {
    const qty = parseInt(buyQty[item.projectId] || '5');
    if (qty <= 0 || qty > item.availableSerials) {
      toast.error(`Choose between 1 and ${item.availableSerials} tonnes`);
      return;
    }
    setOrderLoading(true);
    try {
      const order = await api.createOrder({
        buyerId: 'buyer_demo',
        projectId: item.projectId,
        quantity: qty,
      });
      setCurrentOrder(order);
      toast.success(`Order locked! Total: $${order.totalUsd}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setOrderLoading(false);
    }
  };

  const handlePay = async () => {
    if (!currentOrder) return;
    setPayLoading(true);
    try {
      const result = await api.payOrder(currentOrder.orderId);
      setPayResult(result);
      toast.success('Payment complete! Credits retired on Hedera.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPayLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="section-title">🛒 Buyer Dashboard</h1>
        <p className="section-subtitle">Calculate your carbon footprint, browse verified credits, and offset.</p>
      </div>

      {/* Footprint Calculator */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">⚡ Carbon Footprint Calculator</h2>
        <div className="grid sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">Electricity (kWh)</label>
            <input className="input-field" type="number" value={elec}
              onChange={(e) => setElec(e.target.value)} placeholder="1500" />
          </div>
          <div>
            <label className="label">Fuel / Diesel (liters)</label>
            <input className="input-field" type="number" value={fuel}
              onChange={(e) => setFuel(e.target.value)} placeholder="400" />
          </div>
          <div>
            <label className="label">Freight (tonne-km)</label>
            <input className="input-field" type="number" value={freight}
              onChange={(e) => setFreight(e.target.value)} placeholder="2000" />
          </div>
        </div>
        <button className="btn-primary" onClick={handleCalcFootprint} disabled={calcLoading}>
          {calcLoading ? <LoadingSpinner size="sm" /> : 'Calculate Footprint'}
        </button>

        {footprint && (
          <div className="mt-4 grid sm:grid-cols-4 gap-3 animate-slide-up">
            <div className="bg-brand-500/10 rounded-xl p-4 text-center border border-brand-500/20">
              <p className="text-xs text-brand-400">Total Footprint</p>
              <p className="text-2xl font-bold text-white">{footprint.tco2e}</p>
              <p className="text-xs text-gray-400">tCO₂e</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Electricity</p>
              <p className="font-bold text-yellow-400">{footprint.breakdown.electricityKg.toFixed(0)} kg</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Fuel</p>
              <p className="font-bold text-orange-400">{footprint.breakdown.fuelKg.toFixed(0)} kg</p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Freight</p>
              <p className="font-bold text-blue-400">{footprint.breakdown.freightKg.toFixed(0)} kg</p>
            </div>
          </div>
        )}
      </div>

      {/* Catalog */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">🌿 Available Credits</h2>
        {catalog.length === 0 ? (
          <EmptyState icon="🏷️" title="No credits available" description="Credits appear here after auditor approval." />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalog.map((item) => (
              <div key={item.projectId} className="glass-card-hover p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-white text-sm leading-tight flex-1">{item.name}</h3>
                  <HederaBadge />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-gray-500 uppercase">NDVI</p>
                    <p className="font-bold text-brand-400">{item.ndviMean.toFixed(2)}</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-gray-500 uppercase">Price</p>
                    <p className="font-bold text-white">${item.pricePerTonneUsd}/t</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-gray-500 uppercase">Available</p>
                    <p className="font-bold text-teal-400">{item.availableSerials} t</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-gray-500 uppercase">Token</p>
                    <p className="font-mono text-xs text-gray-300">{item.tokenId}</p>
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  <input
                    className="input-field w-20 text-center text-sm"
                    type="number"
                    min="1"
                    max={item.availableSerials}
                    value={buyQty[item.projectId] || '5'}
                    onChange={(e) => setBuyQty({ ...buyQty, [item.projectId]: e.target.value })}
                    placeholder="Qty"
                  />
                  <button className="btn-primary flex-1 text-sm" onClick={() => handleBuy(item)} disabled={orderLoading}>
                    Buy {buyQty[item.projectId] || 5} tCO₂e
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order / Payment Modal */}
      {currentOrder && !payResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-6 max-w-md w-full mx-4 space-y-4 animate-slide-up">
            <h3 className="text-lg font-semibold text-white">🔒 Order Locked</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Order ID</p>
                <p className="font-mono text-xs text-gray-300">{currentOrder.orderId}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-bold text-white">${currentOrder.totalUsd.toFixed(2)}</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400">Expires in</p>
              <p className={`text-3xl font-bold font-mono ${
                countdown === 'Expired' ? 'text-red-400' : 'text-brand-400'
              }`}>
                {countdown}
              </p>
            </div>
            <div className="relative group">
              <button className="btn-primary w-full" onClick={handlePay} disabled={payLoading || countdown === 'Expired'}>
                {payLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" /> Processing…
                  </span>
                ) : (
                  '💳 Pay (Simulated)'
                )}
              </button>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2
                bg-gray-800 rounded-lg p-2 text-xs text-gray-400 text-center border border-gray-700">
                ℹ️ Payment is simulated — no real money is exchanged. The Hedera token transfer and wipe are real on testnet.
              </div>
            </div>
            <button className="btn-secondary w-full text-sm" onClick={() => setCurrentOrder(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Success Screen */}
      {payResult && (
        <div className="glass-card p-6 space-y-4 animate-slide-up">
          <div className="text-center">
            <span className="text-5xl block mb-2">🎉</span>
            <h3 className="text-xl font-bold text-white">Credits Retired!</h3>
            <p className="text-sm text-gray-400 mt-1">Your carbon offset is permanently recorded on Hedera.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-gray-800/50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Serials Burned</p>
              <p className="font-bold text-purple-400">
                {payResult.serials[0]}–{payResult.serials[payResult.serials.length - 1]}
              </p>
            </div>
            <div className="bg-gray-800/50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Wipe Tx</p>
              <HashScanLink txId={payResult.wipeTxId} label={payResult.wipeTxId.slice(0, 16) + '…'} />
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href={api.getCertificateUrl(currentOrder?.orderId || '')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex-1 text-center"
            >
              📄 Download Certificate
            </a>
            <button
              className="btn-secondary flex-1"
              onClick={() => { setCurrentOrder(null); setPayResult(null); }}
            >
              New Purchase
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
