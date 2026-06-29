// src/components/BackgroundCarousel.jsx
import React, { useEffect, useState, useRef } from "react";

export default function BackgroundCarousel({
  images = [],            // array of image URLs (up to 10 recommended)
  interval = 2000,        // ms between slides (default 2000ms = 2s)
  transition = 600,       // ms fade duration
  pauseOnHover = true,
  className = ""
}) {
  const maxImages = 10;
  const imgs = images.slice(0, maxImages);
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  // preload images
  useEffect(() => {
    imgs.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [imgs]);

  // autoplay with pause and prefers-reduced-motion support
  useEffect(() => {
    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced || imgs.length <= 1) return;

    function start() {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setIndex((i) => (i + 1) % imgs.length);
      }, interval);
    }

    if (!isPaused) start();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [imgs.length, interval, isPaused]);

  if (!imgs || imgs.length === 0) return null;

  return (
    <div
      className={`absolute inset-0 -z-10 overflow-hidden ${className}`}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      aria-hidden="true"
    >
      {imgs.map((src, i) => {
        const visible = i === index;
        return (
          <div
            key={src + i}
            className="absolute inset-0 transition-opacity"
            style={{
              opacity: visible ? 1 : 0,
              transitionDuration: `${transition}ms`,
            }}
          >
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
              style={{ width: "100%", height: "100%" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        );
      })}

      {/* Dots / manual controls */}
      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-6 z-20 flex gap-2">
        {imgs.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`w-3 h-3 rounded-full transition-all ${i === index ? "bg-white scale-110" : "bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}