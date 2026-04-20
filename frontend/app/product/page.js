'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const PLATFORM_COLORS = {
  Amazon:   { color: '#f97316', bg: '#431407', border: 'border-orange-500/30', text: 'text-orange-400' },
  Flipkart: { color: '#3b82f6', bg: '#172554', border: 'border-blue-500/30',   text: 'text-blue-400'   },
  Croma:    { color: '#22c55e', bg: '#052e16', border: 'border-green-500/30',  text: 'text-green-400'  },
  Reliance: { color: '#a78bfa', bg: '#2e1065', border: 'border-purple-500/30', text: 'text-purple-400' },
};

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? '#f59e0b' : 'none'}
          stroke="#f59e0b" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
      <span className="text-white/50 text-sm ml-1">{rating?.toFixed(1)}</span>
    </div>
  );
}

function ProductDetailContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const title     = searchParams.get('title')    || '';
  const price     = searchParams.get('price')    || '';
  const platform  = searchParams.get('platform') || '';
  const image     = searchParams.get('image')    || '';
  const url       = searchParams.get('url')      || '';
  const rating    = parseFloat(searchParams.get('rating')   || '0');
  const discount  = parseFloat(searchParams.get('discount') || '0');
  const origPrice = searchParams.get('orig')     || '';
  const query     = searchParams.get('q')        || '';

  const [allResults, setAllResults] = useState([]);
  const [aiData,     setAiData]     = useState(null);
  const [aiDetails,  setAiDetails]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [activeImg,  setActiveImg]  = useState(image);

  const pc = PLATFORM_COLORS[platform] || PLATFORM_COLORS.Amazon;

  useEffect(() => {
    const cached = sessionStorage.getItem('pricewise_results');
    if (cached) {
      const data = JSON.parse(cached);
      setAllResults(data.results || []);
      setAiData(data);
    }

    if (query) {
      axios.get(`${API}/api/products/details?q=${encodeURIComponent(query)}&title=${encodeURIComponent(title)}`)
        .then(res => setAiDetails(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [query, title]);

  const otherPrices  = allResults.filter(r => r.platform !== platform && r.price);
  const alternatives = allResults.filter(r => r.title !== title && r.price).slice(0, 4);

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
        <button
          onClick={() => router.back()}
          className="ml-2 flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back to results
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT — Image + thumbnails */}
          <div className="lg:col-span-1">
            <div className="bg-[#111] border border-white/8 rounded-2xl p-6 flex flex-col items-center gap-4 sticky top-6">
              <div className="flex items-center gap-2 w-full">
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-medium">
                  Available
                </span>
                <span className={`text-xs px-2 py-1 rounded-full border font-medium ${pc.border} ${pc.text}`}
                  style={{ background: `${pc.color}10` }}>
                  {platform}
                </span>
              </div>

              <div className="w-full h-64 flex items-center justify-center bg-white/3 rounded-xl overflow-hidden">
                {activeImg
                  ? <img src={activeImg} alt={title} className="max-h-full max-w-full object-contain p-4" />
                  : <div className="text-white/20 text-sm">No image</div>
                }
              </div>

              {allResults.filter(r => r.image_url).length > 1 && (
                <div className="flex gap-2 flex-wrap justify-center">
                  {allResults.filter(r => r.image_url).slice(0, 5).map((r, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(r.image_url)}
                      className={`w-14 h-14 rounded-lg bg-white/5 border overflow-hidden transition-all ${
                        activeImg === r.image_url ? 'border-orange-500' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={r.image_url} alt="" className="w-full h-full object-contain p-1" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Details */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Title + rating */}
            <div>
              <p className="text-xs text-white/30 uppercase tracking-widest mb-2 font-medium">{platform}</p>
              <h1 className="text-xl font-bold text-white leading-snug mb-3">{title}</h1>
              {rating > 0 && (
                <div className="flex items-center gap-3">
                  <StarRating rating={rating} />
                  <span className="text-xs text-white/30">·</span>
                  <span className="text-xs text-white/40">via {platform}</span>
                </div>
              )}
            </div>

            {/* Price section */}
            <div className="bg-[#111] border border-white/8 rounded-2xl p-5">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
                {platform} Price
              </div>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-3xl font-bold text-white">
                  ₹{parseFloat(price).toLocaleString('en-IN')}
                </span>
                {origPrice && parseFloat(origPrice) > parseFloat(price) && (
                  <span className="text-lg text-white/30 line-through">
                    ₹{parseFloat(origPrice).toLocaleString('en-IN')}
                  </span>
                )}
                {discount > 0 && (
                  <span className="text-sm font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
                    {discount}% off
                  </span>
                )}
              </div>
              <a href={url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 mt-3 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-80"
                style={{ background: pc.color }}>
                Buy on {platform}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            </div>

            {/* Other platform prices */}
            {otherPrices.length > 0 && (
              <div className="bg-[#111] border border-white/8 rounded-2xl p-5">
                <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">
                  Compare on Other Platforms
                </div>
                <div className="flex flex-col gap-3">
                  {otherPrices.map((r, i) => {
                    const rpc = PLATFORM_COLORS[r.platform] || PLATFORM_COLORS.Amazon;
                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${rpc.border} ${rpc.text}`}
                            style={{ background: `${rpc.color}10` }}>
                            {r.platform}
                          </span>
                          {r.discount_pct > 0 && (
                            <span className="text-xs text-green-400">{r.discount_pct}% off</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-white">
                            ₹{r.price?.toLocaleString('en-IN')}
                          </span>
                          <a href={r.url} target="_blank" rel="noreferrer"
                            className="text-xs px-3 py-1.5 rounded-lg border text-white/60 border-white/10 hover:border-white/30 transition-all">
                            View
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Expert View — Pros & Cons */}
            {(loading || aiDetails) && (
              <div className="bg-[#111] border border-white/8 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                    </svg>
                  </div>
                  <span className="text-sm font-semibold">AI Expert View</span>
                </div>

                {loading ? (
                  <div className="flex items-center gap-2 text-white/30 text-sm">
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                    Generating AI analysis...
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-semibold text-green-400 mb-3 flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                          Pros
                        </div>
                        <div className="flex flex-col gap-2">
                          {(aiDetails?.pros || []).map((pro, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-white/60 leading-relaxed">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                              {pro}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-semibold text-red-400 mb-3 flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                          Cons
                        </div>
                        <div className="flex flex-col gap-2">
                          {(aiDetails?.cons || []).map((con, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-white/60 leading-relaxed">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                              {con}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {aiDetails?.verdict && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="text-xs font-semibold text-white/50 mb-2">Verdict</div>
                        <p className="text-xs text-white/50 leading-relaxed">{aiDetails.verdict}</p>
                      </div>
                    )}

                    {aiDetails?.best_for && (
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-3">
                          <div className="text-xs font-semibold text-green-400 mb-1">Best for</div>
                          <p className="text-xs text-white/50">{aiDetails.best_for}</p>
                        </div>
                        {aiDetails?.avoid_if && (
                          <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                            <div className="text-xs font-semibold text-red-400 mb-1">Avoid if</div>
                            <p className="text-xs text-white/50">{aiDetails.avoid_if}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* AI Buy Advice — rich version */}
            {aiData?.ai_advice && (
              <div className="bg-[#111] border border-white/8 rounded-2xl p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                    </svg>
                  </div>
                  <span className="text-sm font-semibold">AI Buy Advice</span>
                  {aiData.price_trend && aiData.price_trend !== 'Unknown' && (
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border font-medium ${
                      aiData.price_trend === 'Falling'
                        ? 'text-green-400 border-green-500/30 bg-green-500/10'
                        : aiData.price_trend === 'Rising'
                        ? 'text-red-400 border-red-500/30 bg-red-500/10'
                        : 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                    }`}>
                      {aiData.price_trend} trend
                    </span>
                  )}
                </div>

                <p className="text-sm text-white/60 leading-relaxed">{aiData.ai_advice}</p>

                {aiData.user_reviews_summary && (
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="text-xs font-semibold text-white/40 mb-1">What buyers say</div>
                    <p className="text-xs text-white/50 leading-relaxed">{aiData.user_reviews_summary}</p>
                  </div>
                )}

                {aiData.better_alternative && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                    <div className="text-xs font-semibold text-blue-400 mb-1">Better alternative</div>
                    <p className="text-xs text-white/60 leading-relaxed">{aiData.better_alternative}</p>
                  </div>
                )}

                {aiData.best_time_to_buy && (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                    <div className="text-xs font-semibold text-orange-400 mb-1">Best time to buy</div>
                    <p className="text-xs text-white/60">{aiData.best_time_to_buy}</p>
                  </div>
                )}

                {aiData.tip && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                    <div className="text-xs font-semibold text-green-400 mb-1">Pro tip</div>
                    <p className="text-xs text-white/60">{aiData.tip}</p>
                  </div>
                )}

                {aiData.fake_discount_warnings?.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                    <div className="text-xs font-semibold text-red-400 mb-1">Fake discount warning</div>
                    {aiData.fake_discount_warnings.map((w, i) => (
                      <p key={i} className="text-xs text-red-300/70">{w}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Alternatives */}
            {alternatives.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-white mb-3">Alternatives</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {alternatives.map((alt, i) => {
                    const apc = PLATFORM_COLORS[alt.platform] || PLATFORM_COLORS.Amazon;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          const params = new URLSearchParams({
                            title: alt.title, price: alt.price, platform: alt.platform,
                            image: alt.image_url || '', url: alt.url || '',
                            rating: alt.rating || 0, discount: alt.discount_pct || 0,
                            orig: alt.original_price || alt.price, q: query,
                          });
                          router.push(`/product?${params.toString()}`);
                        }}
                        className="bg-[#111] border border-white/8 rounded-xl p-3 text-left hover:border-white/20 transition-all"
                      >
                        {alt.image_url && (
                          <div className="w-full h-20 flex items-center justify-center bg-white/3 rounded-lg mb-2 overflow-hidden">
                            <img src={alt.image_url} alt="" className="max-h-full max-w-full object-contain p-1" />
                          </div>
                        )}
                        <p className="text-xs text-white/60 line-clamp-2 leading-snug mb-2">{alt.title}</p>
                        <p className="text-sm font-bold" style={{ color: apc.color }}>
                          ₹{alt.price?.toLocaleString('en-IN')}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
      </div>
    }>
      <ProductDetailContent />
    </Suspense>
  );
}
