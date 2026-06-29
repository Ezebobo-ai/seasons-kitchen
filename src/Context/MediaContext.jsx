// src/Context/MediaContext.jsx
// Manages hero video + slideshow images for the landing page.
// Admin uploads are stored as base64 data-URLs in localStorage so they
// survive page reloads without a backend.

import React, { createContext, useContext, useState, useEffect } from "react";

const MediaContext = createContext(null);

const LS_VIDEO_KEY   = "sk_hero_video";
const LS_IMAGES_KEY  = "sk_hero_images";

const DEFAULT_IMAGES = [
  "/egg.jpeg",
  "/fried rice.jpeg",
  "/Special.jpeg",
  "/spegeti_jp.jpeg",
  "/Sweet.jpeg",
  "/Tigernut.jpeg",
  "/Turkey pepper soup.jpeg",
  "/jellof_Rice.jpeg",
  "/white rice.jpeg",
  "/yam.jpeg",
];

export function MediaProvider({ children }) {
  // heroVideo: null | { src: string, name: string }
  const [heroVideo, setHeroVideo] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_VIDEO_KEY)) || null; }
    catch { return null; }
  });

  // slideshowImages: array of { src: string, name: string }
  const [slideshowImages, setSlideshowImages] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_IMAGES_KEY));
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    return DEFAULT_IMAGES.map((src) => ({ src, name: src.replace("/", "") }));
  });

  // Persist whenever they change
  useEffect(() => {
    if (heroVideo) localStorage.setItem(LS_VIDEO_KEY, JSON.stringify(heroVideo));
    else localStorage.removeItem(LS_VIDEO_KEY);
  }, [heroVideo]);

  useEffect(() => {
    localStorage.setItem(LS_IMAGES_KEY, JSON.stringify(slideshowImages));
  }, [slideshowImages]);

  // ── Video actions ────────────────────────────────────────────────────────
  const uploadVideo = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const entry = { src: reader.result, name: file.name };
        setHeroVideo(entry);
        resolve(entry);
      };
      reader.readAsDataURL(file);
    });
  };

  const deleteVideo = () => setHeroVideo(null);

  // ── Image actions ────────────────────────────────────────────────────────
  const uploadImages = (files) => {
    const newEntries = [];
    let processed = 0;
    return new Promise((resolve) => {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          newEntries.push({ src: reader.result, name: file.name });
          processed++;
          if (processed === files.length) {
            setSlideshowImages((prev) => [...prev, ...newEntries].slice(0, 20));
            resolve(newEntries);
          }
        };
        reader.readAsDataURL(file);
      });
    });
  };

  const deleteImage = (index) => {
    setSlideshowImages((prev) => prev.filter((_, i) => i !== index));
  };

  const replaceImage = (index, file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const entry = { src: reader.result, name: file.name };
        setSlideshowImages((prev) => prev.map((img, i) => (i === index ? entry : img)));
        resolve(entry);
      };
      reader.readAsDataURL(file);
    });
  };

  const resetImages = () => {
    setSlideshowImages(DEFAULT_IMAGES.map((src) => ({ src, name: src.replace("/", "") })));
  };

  return (
    <MediaContext.Provider value={{
      heroVideo, uploadVideo, deleteVideo,
      slideshowImages, uploadImages, deleteImage, replaceImage, resetImages,
    }}>
      {children}
    </MediaContext.Provider>
  );
}

export function useMedia() {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error("useMedia must be used inside <MediaProvider>");
  return ctx;
}
