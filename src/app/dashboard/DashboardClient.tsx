'use client';

import { useState } from 'react';

type Receipt = {
  id: string;
  activity: string;
  category: 'Travel' | 'Food' | 'Shopping';
  co2_kg: number;
  confidence: number;
  date: string;
  spend_amount?: string | null;
};

type ScanResult = {
  total_co2: number;
  breakdown: { Travel: number; Food: number; Shopping: number };
  receipts: Receipt[];
  ai_nudge: string;
};

export default function DashboardClient({ user, initialData }: { user: any, initialData?: ScanResult | null }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanData, setScanData] = useState<ScanResult | null>(initialData || null);
  const [error, setError] = useState('');

  const handleScan = async () => {
    setIsScanning(true);
    setError('');
    
    try {
      const response = await fetch('/api/scan', { method: 'POST' });
      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to scan emails');
      }
      const data = await response.json();
      setScanData((prev) => {
        if (!prev) return data;
        
        return {
          total_co2: prev.total_co2 + (data.total_co2 || 0),
          breakdown: {
            Travel: prev.breakdown.Travel + (data.breakdown?.Travel || 0),
            Food: prev.breakdown.Food + (data.breakdown?.Food || 0),
            Shopping: prev.breakdown.Shopping + (data.breakdown?.Shopping || 0),
          },
          receipts: [...(data.receipts || []), ...prev.receipts],
          ai_nudge: data.ai_nudge || prev.ai_nudge
        };
      });
    } catch (err: any) {
      setError(err.message || 'An error occurred during scanning.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="relative">
      <div className="glow-leaf w-[500px] h-[500px] top-[-200px] right-[-100px] bg-gradient-to-bl from-accent-flora to-earth-200"></div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 relative z-10 glass-panel p-6">
        <div>
          <h1 className="text-3xl font-bold text-earth-900 tracking-tight">Welcome!</h1>
          <p className="text-earth-600 text-sm mt-1">
            Analyzing impact for <span className="font-medium text-earth-800">{user.email}</span>
          </p>
        </div>
        
        <a href="/auth/logout" className="btn-outline mt-4 sm:mt-0 bg-white/50">
          Sign Out
        </a>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 shadow-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-earth-200 rounded-full blur-3xl opacity-50"></div>
            
            <p className="text-earth-600 font-medium mb-2 uppercase tracking-wider text-xs">
              Estimated Monthly Footprint
            </p>
            <div className="flex items-baseline gap-3">
              <span className={`text-7xl font-extrabold tracking-tighter ${scanData ? 'text-earth-900' : 'text-earth-300'}`}>
                {scanData ? scanData.total_co2.toFixed(1) : '--'}
              </span>
              <span className="text-2xl text-earth-500 font-medium">kg CO₂</span>
            </div>
            
            <p className="text-earth-500 text-sm mt-4 max-w-sm">
              {scanData 
                ? "Based on analysis of your recent Gmail receipts and bookings."
                : "Your footprint will appear here once we scan your inbox."}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {['Travel', 'Food', 'Shopping'].map((category) => {
              const val = scanData?.breakdown[category as keyof typeof scanData.breakdown];
              return (
                <div key={category} className="glass-panel p-6 text-center hover:bg-white/80 transition-colors">
                  <p className="text-earth-500 text-xs uppercase tracking-widest mb-2 font-medium">{category}</p>
                  <p className={`text-3xl font-bold tracking-tight ${val !== undefined ? 'text-earth-800' : 'text-earth-300'}`}>
                    {val !== undefined ? val.toFixed(1) : '--'}
                  </p>
                  <p className="text-earth-400 text-xs mt-1">kg CO₂</p>
                </div>
              );
            })}
          </div>
          
          {scanData && scanData.receipts.length > 0 && (
            <div className="glass-panel p-8">
              <h3 className="text-earth-900 font-semibold text-lg mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-earth-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Scanned Activities
              </h3>
              <div className="space-y-4">
                {scanData.receipts.map((receipt) => (
                  <div key={receipt.id} className="flex items-center justify-between p-4 rounded-2xl bg-earth-50/50 border border-earth-100 hover:bg-earth-100/50 transition-colors">
                    <div>
                      <p className="font-medium text-earth-900">{receipt.activity}</p>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-xs text-earth-500">{receipt.date}</span>
                        <span className="w-1 h-1 rounded-full bg-earth-300"></span>
                        <span className="text-xs font-medium text-earth-600 bg-earth-100 px-2 py-0.5 rounded-full">{receipt.category}</span>
                      </div>
                    </div>
                    <div className="flex gap-4 items-center text-right">
                      <div className="border-r border-earth-200 pr-4">
                        <p className="font-medium text-earth-700">{receipt.spend_amount || 'N/A'}</p>
                        <p className="text-[10px] text-earth-400 uppercase">Cost</p>
                      </div>
                      <div>
                        <p className="font-bold text-earth-800">{receipt.co2_kg} <span className="text-xs font-normal text-earth-500">kg</span></p>
                        <p className="text-[10px] text-earth-400">{(receipt.confidence * 100).toFixed(0)}% AI Match</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          
          <div className="glass-panel p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-earth-100 rounded-full flex items-center justify-center mb-4 border border-earth-200">
              <span className="text-2xl">🤖</span>
            </div>
            <h2 className="text-xl font-bold text-earth-900 mb-2">Gemini Scanner</h2>
            <p className="text-earth-600 text-sm mb-8 leading-relaxed">
              We'll fetch your 20 most recent receipts via Gmail and classify their planetary impact using Google's generative AI.
            </p>
            
            <button
              onClick={handleScan}
              disabled={isScanning}
              className={`w-full py-4 rounded-2xl text-white font-medium text-lg transition-all shadow-md focus:outline-none focus:ring-4 focus:ring-earth-300/50 flex justify-center items-center gap-3
                ${isScanning 
                  ? 'bg-earth-400 cursor-not-allowed shadow-none' 
                  : 'bg-earth-600 hover:bg-earth-700 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0'}`}
            >
              {isScanning ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Inbox...
                </>
              ) : (
                'Scan my emails'
              )}
            </button>
            <p className="text-[11px] text-earth-400 mt-4 uppercase tracking-widest">Read-Only Permission</p>
          </div>

          <div className="glass-panel p-8 bg-gradient-to-br from-earth-800 to-earth-950 text-white relative overflow-hidden border-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-earth-500 rounded-full blur-[60px] opacity-40"></div>
            <p className="text-earth-300 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 13a1 1 0 112 0v1a1 1 0 11-2 0v-1zm1-8a1 1 0 011 1v4a1 1 0 11-2 0V6a1 1 0 011-1z" /></svg>
              AI Insight
            </p>
            <p className="text-earth-50 text-lg leading-relaxed font-light">
              {scanData?.ai_nudge 
                ? scanData.ai_nudge 
                : "Connect your inbox to receive personalized, AI-driven nudges aimed at comfortably reducing your exact emissions footprint."}
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
