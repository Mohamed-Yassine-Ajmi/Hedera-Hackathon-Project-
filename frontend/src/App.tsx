import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SellerPage from './pages/SellerPage';
import AuditorPage from './pages/AuditorPage';
import BuyerPage from './pages/BuyerPage';
import ExplorerPage from './pages/ExplorerPage';
import VerifyPage from './pages/VerifyPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/seller" element={<SellerPage />} />
          <Route path="/auditor" element={<AuditorPage />} />
          <Route path="/buyer" element={<BuyerPage />} />
          <Route path="/explorer" element={<ExplorerPage />} />
          <Route path="/verify/:tokenId/:serial" element={<VerifyPage />} />
        </Routes>
      </main>
      <footer className="text-center py-4 text-xs text-gray-600 border-t border-gray-800/50">
        ClimateTrust • Hedera Hackathon MVP • Dar Blockchain 2026
      </footer>
    </div>
  );
}
