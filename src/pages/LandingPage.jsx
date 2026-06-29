// src/pages/LandingPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMedia } from "../Context/MediaContext.jsx";

function HeroSlideshow({ images }) {
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState(null);
  const [fading, setFading] = useState(false);
  const timerRef = useRef(null);

  const advance = () => {
    setFading(true);
    setPrev(active);
    setTimeout(() => {
      setActive((i) => (i + 1) % images.length);
      setFading(false);
      setPrev(null);
    }, 900);
  };

  useEffect(() => {
    if (images.length <= 1) return;
    timerRef.current = setInterval(advance, 5000);
    return () => clearInterval(timerRef.current);
  }, [images.length, active]);

  const goTo = (i) => {
    clearInterval(timerRef.current);
    setFading(true);
    setPrev(active);
    setTimeout(() => {
      setActive(i);
      setFading(false);
      setPrev(null);
      timerRef.current = setInterval(advance, 5000);
    }, 900);
  };

  if (!images.length) return null;

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl">
    
      {prev !== null && (
        <img
          src={images[prev].src ?? images[prev]}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: fading ? 0 : 1, transition: "opacity 0.9s ease-in-out", zIndex: 1 }}
        />
      )}
      {/* Active slide — fades in */}
      <img
        src={images[active].src ?? images[active]}
        alt={`Dish ${active + 1}`}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: fading ? 0 : 1, transition: "opacity 0.9s ease-in-out", zIndex: 2 }}
      />
      {/* Bottom gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" style={{ zIndex: 3 }} />

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5" style={{ zIndex: 4 }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: i === active ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: i === active ? "#ffffff" : "rgba(255,255,255,0.45)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.35s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}


function Pill({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full">
      {children}
    </span>
  );
}


export default function LandingPage() {
  const navigate = useNavigate();
  const { heroVideo, slideshowImages } = useMedia();
  const videoRef = useRef(null);

  
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [heroVideo]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-emerald-50">

      
      <section className="relative w-full min-h-[100vh] lg:min-h-screen flex flex-col">

        
        <div className="absolute inset-0 overflow-hidden" aria-hidden="true">

          {heroVideo ? (
      
            <video
              ref={videoRef}
              src={heroVideo.src}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            /* Fallback: premium static gradient */
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900" />
              {/* Decorative bokeh blobs */}
              <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full bg-emerald-600/20 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full bg-teal-500/15 blur-3xl" />
              <div className="absolute top-1/2 left-1/3 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
            </>
          )}

          {/* Dark overlay — always present for text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/65 via-black/45 to-black/60" />
        </div>

        {/* ── Hero content ─────────────────────────────────────── */}
        <div className="relative z-10 flex flex-col justify-center flex-1 pt-24 pb-16 px-6">
          <div className="max-w-6xl mx-auto w-full">

            {/* Main grid: copy left, card right — single consistent gap, vertically centered */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-10 items-center">

              {/* LEFT — headline & CTAs (one consistent vertical rhythm) */}
              <div className="flex flex-col gap-5 text-center lg:text-left items-center lg:items-start">

                {/* Brand row: logo + name + "now open" badge together, no duplicate stacking */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/30 shadow-xl flex-shrink-0 bg-white">
                      <img src="/logo.png" alt="Seasons Kitchen" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-white text-base font-bold leading-tight">Seasons Kitchen</span>
                  </div>
                  <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Now Open
                  </span>
                </div>

                <h1
                  className="text-white font-extrabold leading-[1.1] tracking-tight max-w-xl"
                  style={{ fontSize: "clamp(2.1rem, 4.4vw, 3.4rem)" }}
                >
                  Home-style meals,{" "}
                  <span className="text-emerald-400">made with love</span>{" "}
                  &amp; seasonal ingredients.
                </h1>

                <p className="text-white/75 text-base lg:text-lg leading-relaxed max-w-md">
                  Fast delivery, warm service, and flavors that feel like home.
                  Order from our seasonal menu and taste the difference.
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                  <button
                    onClick={() => navigate("/menu")}
                    className="group inline-flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-6 py-3.5 rounded-full shadow-lg shadow-emerald-900/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    <svg className="w-5 h-5 transition-transform group-hover:rotate-12" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 .587l3.668 7.431L23.5 9.75l-5.75 5.6L19.335 24 12 20.013 4.665 24l1.585-8.65L.5 9.75l7.832-1.732L12 .587z" />
                    </svg>
                    Order Now
                  </button>
                  <Link
                    to="/menu"
                    className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/25 text-white font-semibold px-6 py-3.5 rounded-full transition-all duration-200 hover:-translate-y-0.5"
                  >
                    View Menu
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {/* Popular tags */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                  <span className="text-white/50 text-xs font-medium">Popular:</span>
                  {["Jollof Rice", "Fried Rice", "Turkey Pepper Soup", "Tigernut"].map((d) => (
                    <Pill key={d}>{d}</Pill>
                  ))}
                </div>

                {/* Social proof */}
                <div className="flex items-center gap-6 pt-4 mt-1 border-t border-white/10 w-full justify-center lg:justify-start">
                  {[
                    { num: "500+", label: "Happy customers" },
                    { num: "50+", label: "Menu items" },
                    { num: "4.9★", label: "Average rating" },
                  ].map((s) => (
                    <div key={s.num} className="text-center lg:text-left">
                      <p className="text-white font-extrabold text-xl leading-tight">{s.num}</p>
                      <p className="text-white/50 text-xs">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT — image slideshow card, vertically centered against left column */}
              <div className="flex justify-center lg:justify-end w-full">
                <div className="w-full max-w-sm">
                  {/* Floating card */}
                  <div
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-3 shadow-2xl"
                    style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.45)" }}
                  >
                    {/* Slideshow */}
                    <div className="relative rounded-2xl overflow-hidden" style={{ height: 280 }}>
                      <HeroSlideshow images={slideshowImages} />
                    </div>

                    {/* Card footer */}
                    <div className="px-2 pt-3 pb-1 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">Chef's Special</p>
                        <p className="text-white/50 text-xs mt-0.5 truncate">Rotating seasonal menu</p>
                      </div>
                      <button
                        onClick={() => navigate("/menu")}
                        className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-4 py-2 rounded-full transition-all flex-shrink-0"
                      >
                        Order →
                      </button>
                    </div>
                  </div>

                  {/* Quick-nav pills under card */}
                  <div className="flex justify-center gap-3 mt-4">
                    <Link to="/contact" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full transition-all">
                      Contact
                    </Link>
                    <Link to="/feedback" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full transition-all">
                      Feedback
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Scroll cue (decorative, hidden on short/mobile screens to avoid overlap) ── */}
        <div className="hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex-col items-center gap-1 text-white/40 text-xs">
          <span>Scroll</span>
          <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          WHY SEASONS KITCHEN — value propositions strip
      ════════════════════════════════════════════════════════ */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3">Why choose us</p>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-10">
            Food that feels like home
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "🌿", title: "Seasonal Ingredients", desc: "Fresh, locally sourced produce that changes with the season." },
              { icon: "🚀", title: "Fast Delivery", desc: "Hot meals at your door in under 45 minutes." },
              { icon: "👨‍🍳", title: "Home-style Cooking", desc: "Recipes passed down through generations, cooked with care." },
              { icon: "⭐", title: "5-Star Service", desc: "Rated 4.9/5 by hundreds of satisfied customers." },
            ].map((f) => (
              <div key={f.title} className="group flex flex-col items-center text-center p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-50 transition-all duration-200 hover:-translate-y-1">
                <span className="text-4xl mb-3">{f.icon}</span>
                <h3 className="font-bold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CTA — bottom conversion nudge, repositioned as a contained
          card on a light background instead of a full-bleed green banner
      ════════════════════════════════════════════════════════ */}
      <section className="bg-emerald-50 py-16 px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-emerald-100 shadow-sm px-8 py-12 text-center relative overflow-hidden">
          {/* subtle accent, not a full saturated block */}
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-emerald-100 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-teal-50 blur-3xl" aria-hidden="true" />

          <h2 className="relative text-gray-900 text-3xl font-extrabold mb-3">Ready to order?</h2>
          <p className="relative text-gray-500 mb-7 max-w-md mx-auto">
            Browse our seasonal menu and get a fresh, home-cooked meal delivered to you.
          </p>
          <button
            onClick={() => navigate("/menu")}
            className="relative bg-emerald-600 text-white font-extrabold px-10 py-4 rounded-full shadow-lg shadow-emerald-200 hover:shadow-xl hover:bg-emerald-500 transition-all duration-200 hover:-translate-y-0.5 text-base"
          >
            Browse the Menu →
          </button>
        </div>
      </section>

    </div>
  );
}
