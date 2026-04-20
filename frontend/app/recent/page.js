'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const PLATFORM_COLORS = {
  Amazon:   '#f97316',
  Flipkart: '#3b82f6',
  Croma:    '#22c55e',
  Reliance: '#a78bfa',
};

function PlatformDot({ platform }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ background: PLATFORM_COLORS[platform] || '#666' }}
      title={platform}
    />
  );
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  return `${days}d ago`;
}

export default function RecentPage() {
  const router  = useRouter();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    axios.get(`${API}/api/products/recent?limit=20`)
      .then(res => setItems(res.data.recent || []))
      .catch(() => setError('Could not load recent searches.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSearchAgain = async (query) => {
    try {
      const res = await axios.get(`${API}/api/products/search?q=${encodeURIComponent(query)}`);
      sessionStorage.setItem('pricewise_results', JSON.stringify(res.data));
      sessionStorage.setItem('pricewise_query', query);
      router.push(`/results?q=${encodeURIComponent(query)}`);
    } catch {
      router.push(`/results?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* Navbar */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/')} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <span className="text-sm font-semibold">PriceWise India</span>
        </button>
        <span className="text-white/20 text-sm">·</span>
        <span className="text-sm text-white/50">Recent Searches</span>
        <button
          onClick={() => router.push('/')}
          className="ml-auto text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          ← Home
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Recent Searches</h1>
            <p className="text-white/40 text-sm mt-1">
              All products searched across Amazon, Flipkart, Croma & Reliance
            </p>
          </div>
          {items.length > 0 && (
            <span className="text-xs text-white/30 bg-white/5 px-3 py-1.5 rounded-full">
              {items.length} searches
            </span>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-white">
            <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56"/>
            </svg>
            <p className="text-white/40 text-sm">Loading recent searches...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-24">
            <p className="text-white/40 mb-4">{error}</p>
            <button onClick={() => router.push('/')} className="text-orange-400 text-sm">
              Search a product
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="text-center py-24 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </div>
            <p className="text-white/40 text-sm">No searches yet. Start by comparing a product!</p>
            <button
              onClick={() => router.push('/')}
              className="text-sm px-5 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-400 transition-all"
            >
              Search a product
            </button>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="bg-[#111] border border-white/8 rounded-2xl overflow-hidden hover:border-white/15 transition-all group"
              >
                {/* Image strip */}
                <div className="h-32 bg-white/[0.03] flex items-center justify-center overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-white/10">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  {/* Product name */}
                  <p className="text-sm font-semibold text-white leading-snug mb-1 line-clamp-1">
                    {item.name}
                  </p>
                  <p className="text-xs text-white/30 mb-3">{timeAgo(item.searched_at)}</p>

                  {/* Platforms available */}
                  <div className="flex items-center gap-1.5 mb-3">
                    {item.platforms.map(p => (
                      <PlatformDot key={p} platform={p} />
                    ))}
                    <span className="text-xs text-white/30 ml-1">
                      {item.platforms.length} platform{item.platforms.length !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Best price */}
                  {item.best_price && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-white/40">Best price</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white">
                          ₹{item.best_price.toLocaleString('en-IN')}
                        </span>
                        {item.best_platform && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{
                              color: PLATFORM_COLORS[item.best_platform],
                              background: `${PLATFORM_COLORS[item.best_platform]}15`,
                            }}
                          >
                            {item.best_platform}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSearchAgain(item.query)}
                      className="flex-1 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold hover:bg-orange-500/20 transition-all"
                    >
                      Refresh prices
                    </button>
                    <button
                      onClick={() => router.push(`/results?q=${encodeURIComponent(item.query)}`)}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs hover:text-white hover:border-white/20 transition-all"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
