'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const POPULAR = ['iPhone 15', 'Samsung Galaxy S24', 'OnePlus 12', 'MacBook Air M2', 'Sony WH-1000XM5', 'Boat Airdopes', 'Redmi Note 13', 'iPad Air'];

export default function Home() {
  const [query, setQuery]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const router = useRouter();

  const handleSearch = async (q) => {
    const searchTerm = q || query;
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API}/api/products/search?q=${encodeURIComponent(searchTerm)}`);
      sessionStorage.setItem('pricewise_results', JSON.stringify(res.data));
      sessionStorage.setItem('pricewise_query', searchTerm);
      router.push(`/results?q=${encodeURIComponent(searchTerm)}`);
    } catch (err) {
      setError('No products found. Try a different search term.');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white font-sans">
      {/* Navbar */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <span className="text-[15px] font-semibold tracking-tight">PriceWise India</span>
        </div>
        <div className="flex items-center gap-1">
          {['Amazon', 'Croma', 'Flipkart', 'Vijay Sales', 'Tata CLiQ'].map(p => (
            <span key={p} className="text-[11px] px-2 py-1 rounded-full bg-white/5 text-white/40 font-medium hidden sm:inline">{p}</span>
          ))}
          <button
            onClick={() => router.push('/recent')}
            className="ml-3 text-[11px] px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all font-medium"
          >
            Recent
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          Live prices from Amazon & 10+ Indian retailers
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">
          Stop overpaying.<br />Buy smarter.
        </h1>
        <p className="text-white/40 text-lg mb-10 max-w-md">
          Compare prices across Amazon, Croma, Flipkart, Vijay Sales & more. Get AI-powered advice on when to buy.
        </p>

        {/* Search bar */}
        <div className="w-full max-w-2xl">
          <div className="flex gap-3 bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-orange-500/50 transition-all">
            <div className="flex items-center pl-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search for any product — iPhone 15, Samsung TV, boAt headphones..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-transparent outline-none text-white placeholder:text-white/30 text-[15px] py-2"
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="px-6 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-400 transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                  </svg>
                  Searching
                </span>
              ) : 'Compare'}
            </button>
          </div>

          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}

          {/* Popular searches */}
          <div className="flex flex-wrap gap-2 justify-center mt-5">
            <span className="text-white/30 text-xs self-center">Popular:</span>
            {POPULAR.map(item => (
              <button
                key={item}
                onClick={() => handleSearch(item)}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Retailer strip */}
      <div className="max-w-3xl mx-auto px-6 mb-12">
        <p className="text-center text-white/20 text-xs mb-4 uppercase tracking-widest">Searches across</p>
        <div className="flex flex-wrap justify-center gap-3">
          {['Amazon', 'Croma', 'Flipkart', 'Reliance Digital', 'Vijay Sales', 'Tata CLiQ', 'Poorvika', 'Sangeetha'].map(r => (
            <span key={r} className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/8 text-white/40 font-medium">
              {r}
            </span>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div className="max-w-4xl mx-auto px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '⚡', title: 'Live Prices', desc: 'Real-time prices fetched from Amazon & 10+ Indian retailers instantly' },
          { icon: '🤖', title: 'AI Buy Advice', desc: 'Gemini AI tells you whether to buy now or wait for a better deal' },
          { icon: '📊', title: 'Price History', desc: 'See how prices have changed over time and spot fake discounts' },
        ].map(f => (
          <div key={f.title} className="bg-white/[0.03] border border-white/8 rounded-2xl p-5">
            <div className="text-2xl mb-3">{f.icon}</div>
            <div className="text-sm font-semibold text-white mb-1">{f.title}</div>
            <div className="text-xs text-white/40 leading-relaxed">{f.desc}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
