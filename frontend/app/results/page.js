'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const PLATFORM_COLORS = {
  Amazon:   { color: '#f97316', bg: '#431407', badge: 'bg-orange-900/40 text-orange-400 border-orange-500/30' },
  Flipkart: { color: '#3b82f6', bg: '#172554', badge: 'bg-blue-900/40 text-blue-400 border-blue-500/30'     },
  Croma:    { color: '#22c55e', bg: '#052e16', badge: 'bg-green-900/40 text-green-400 border-green-500/30'  },
  Reliance: { color: '#a78bfa', bg: '#2e1065', badge: 'bg-purple-900/40 text-purple-400 border-purple-500/30'},
};

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? '#f59e0b' : 'none'}
          stroke="#f59e0b" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span className="text-white/40 text-xs ml-1">{rating?.toFixed(1)}</span>
    </div>
  );
}

function PriceCard({ result, isBest, query }) {
  const router = useRouter();
  const pc = PLATFORM_COLORS[result.platform] || PLATFORM_COLORS.Amazon;
  return (
    <div
      onClick={() => {
        const params = new URLSearchParams({
          title: result.title, price: result.price, platform: result.platform,
          image: result.image_url || '', url: result.url || '',
          rating: result.rating || 0, discount: result.discount_pct || 0,
          orig: result.original_price || result.price, q: query,
        });
        router.push(`/product?${params.toString()}`);
      }}
      className={`bg-[#111] rounded-2xl overflow-hidden border transition-all hover:-translate-y-1 hover:shadow-2xl cursor-pointer ${
        isBest ? 'border-orange-500/50 shadow-orange-500/10 shadow-lg' : 'border-white/8'
      }`}>
      {isBest && (
        <div className="bg-orange-500 text-white text-xs font-bold text-center py-1.5 tracking-wide">
          BEST DEAL
        </div>
      )}
      <div style={{ height: 3, background: pc.color, opacity: 0.7 }} />

      <div className="p-5">
        <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border ${pc.badge} mb-4`}>
          {result.platform}
        </span>

        {result.image_url && (
          <div className="w-full h-36 rounded-xl bg-white/5 flex items-center justify-center mb-4 overflow-hidden">
            <img src={result.image_url} alt={result.title} className="max-h-full max-w-full object-contain p-2" />
          </div>
        )}

        <p className="text-sm text-white/80 leading-snug mb-4 line-clamp-2">{result.title}</p>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-2xl font-bold text-white">
            ₹{result.price?.toLocaleString('en-IN')}
          </span>
          {result.original_price && result.original_price > result.price && (
            <span className="text-sm text-white/30 line-through">
              ₹{result.original_price?.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {result.discount_pct > 0 && (
          <span className="text-xs font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
            {result.discount_pct}% off
          </span>
        )}

        {result.rating > 0 && (
          <div className="mt-3">
            <StarRating rating={result.rating} />
          </div>
        )}

        <a
          href={result.url}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all"
          style={{ borderColor: `${pc.color}44`, color: pc.color, background: `${pc.color}10` }}
        >
          View on {result.platform}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    </div>
  );
}

function PriceHistoryChart({ productId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    axios.get(`${API}/api/products/history/${productId}`)
      .then(res => {
        const grouped = {};
        res.data.history.forEach(h => {
          const date = new Date(h.fetched_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
          if (!grouped[date]) grouped[date] = { date };
          grouped[date][h.platform] = h.price;
        });
        setHistory(Object.values(grouped));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <div className="h-48 flex items-center justify-center text-white/30 text-sm">Loading price history...</div>;
  if (history.length < 2) return (
    <div className="h-48 flex flex-col items-center justify-center text-white/30 text-sm gap-2">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
      Search again later to see price trends
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false}
          tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 10, fontSize: 12 }}
          formatter={(value, name) => [`₹${value?.toLocaleString('en-IN')}`, name]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#666' }} />
        {Object.entries(PLATFORM_COLORS).map(([platform, cfg]) => (
          <Line key={platform} type="monotone" dataKey={platform}
            stroke={cfg.color} strokeWidth={2} dot={{ fill: cfg.color, r: 3 }}
            connectNulls />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function AIAdviceCard({ data }) {
  if (!data?.ai_advice) return null;
  const trendColor = data.price_trend === 'Falling' ? '#22c55e' : data.price_trend === 'Rising' ? '#f87171' : '#f59e0b';

  return (
    <div className="bg-[#111] border border-white/8 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
        </div>
        <span className="text-sm font-semibold text-white">AI Shopping Advice</span>
        {data.price_trend && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full border"
            style={{ color: trendColor, borderColor: `${trendColor}44`, background: `${trendColor}10` }}>
            {data.price_trend} trend
          </span>
        )}
      </div>

      <p className="text-sm text-white/70 leading-relaxed mb-4">{data.ai_advice}</p>

      {data.best_time_to_buy && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 mb-3">
          <div className="text-xs font-semibold text-orange-400 mb-1">Best time to buy</div>
          <div className="text-xs text-white/60">{data.best_time_to_buy}</div>
        </div>
      )}

      {data.tip && (
        <div className="bg-white/5 rounded-xl p-3 mb-3">
          <div className="text-xs font-semibold text-white/50 mb-1">Pro tip</div>
          <div className="text-xs text-white/50">{data.tip}</div>
        </div>
      )}

      {data.better_alternative && (
        <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
          <div className="text-xs font-semibold text-blue-400 mb-1">Better Alternative</div>
          <div className="text-xs text-white/60">{data.better_alternative}</div>
        </div>
      )}

      {data.user_reviews_summary && (
        <div className="mt-3 bg-white/5 rounded-xl p-3">
          <div className="text-xs font-semibold text-white/50 mb-1">What buyers say</div>
          <div className="text-xs text-white/50">{data.user_reviews_summary}</div>
        </div>
      )}

      {data.fake_discount_warnings?.length > 0 && (
        <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          <div className="text-xs font-semibold text-red-400 mb-1">Fake discount warning</div>
          {data.fake_discount_warnings.map((w, i) => (
            <div key={i} className="text-xs text-red-300/70">{w}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') || '';

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [sortBy, setSortBy]   = useState('price');

  useEffect(() => {
    const cached = sessionStorage.getItem('pricewise_results');
    const cachedQ = sessionStorage.getItem('pricewise_query');

    if (cached && cachedQ === q) {
      setData(JSON.parse(cached));
      setLoading(false);
      return;
    }

    axios.get(`${API}/api/products/search?q=${encodeURIComponent(q)}`)
      .then(res => { setData(res.data); sessionStorage.setItem('pricewise_results', JSON.stringify(res.data)); })
      .catch(() => setError('Could not load results. Try searching again.'))
      .finally(() => setLoading(false));
  }, [q]);

  const sortedResults = data?.results
    ? [...data.results].filter(r => r.price).sort((a, b) => {
        if (sortBy === 'price')    return a.price - b.price;
        if (sortBy === 'rating')   return (b.rating || 0) - (a.rating || 0);
        if (sortBy === 'discount') return (b.discount_pct || 0) - (a.discount_pct || 0);
        return 0;
      })
    : [];

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex flex-col items-center justify-center gap-4 text-white">
      <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
        <path d="M21 12a9 9 0 11-6.219-8.56"/>
      </svg>
      <p className="text-white/50 text-sm">Fetching live prices from all platforms...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#080808] text-white">
      {/* Navbar */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/')} className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <span className="text-sm font-semibold">PriceWise India</span>
        </button>

        {/* Inline search */}
        <div className="flex-1 max-w-lg">
          <form onSubmit={e => { e.preventDefault(); const v = e.target.q.value; if(v) { sessionStorage.removeItem('pricewise_results'); router.push(`/results?q=${encodeURIComponent(v)}`); }}}>
            <div className="flex gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
              <input name="q" defaultValue={q} placeholder="Search again..."
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/30" />
              <button type="submit" className="text-orange-400 text-xs font-semibold">Search</button>
            </div>
          </form>
        </div>

        <button onClick={() => router.push('/recent')} className="text-xs text-white/40 hover:text-white/70 transition-colors">
          Recent
        </button>

        <button onClick={() => router.push('/')} className="text-xs text-white/40 hover:text-white/70 transition-colors ml-2">
          ← Back
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error ? (
          <div className="text-center py-20">
            <p className="text-white/40 mb-4">{error}</p>
            <button onClick={() => router.push('/')} className="text-orange-400 text-sm">Try again</button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h1 className="text-xl font-bold text-white">Results for "<span className="text-orange-400">{q}</span>"</h1>
                <p className="text-white/40 text-sm mt-1">{sortedResults.length} products found across platforms</p>
              </div>
              <div className="flex gap-2">
                {[['price','Lowest Price'],['rating','Best Rated'],['discount','Best Discount']].map(([val, label]) => (
                  <button key={val} onClick={() => setSortBy(val)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      sortBy === val
                        ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                        : 'border-white/10 text-white/40 hover:text-white/60'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Best deal banner */}
            {data?.best_deal && (
              <div className="bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl p-4 mb-6 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-semibold text-orange-400 mb-0.5">Best Deal Found</div>
                  <div className="text-sm text-white/70">
                    <span className="text-white font-semibold">{data.best_deal.platform}</span> has the lowest price at{' '}
                    <span className="text-orange-400 font-bold">₹{data.best_deal.price?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Layout: results + sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product cards */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sortedResults.map((result, i) => (
                    <PriceCard
                      key={i}
                      result={result}
                      query={q}
                      isBest={data?.best_deal && result.platform === data.best_deal.platform && result.price === data.best_deal.price}
                    />
                  ))}
                </div>
              </div>

              {/* Sidebar: AI advice + chart */}
              <div className="flex flex-col gap-4">
                <AIAdviceCard data={data} />

                <div className="bg-[#111] border border-white/8 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                    <span className="text-sm font-semibold text-white">Price History</span>
                  </div>
                  <PriceHistoryChart productId={data?.product_id} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
