// src/Context/MediaContext.jsx
// Manages hero video + slideshow images for the landing page.
// All data is persisted in Firestore: settings/admin → { media: { video, images } }
// onSnapshot keeps every open tab in sync automatically.

import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";

const MediaContext = createContext(null);

// Firestore document: the same "settings/admin" doc used by MenuContext,
// but we write only to the "media" key via merge:true so menu data is untouched.
const ADMIN_REF = () => doc(db, "settings", "admin");

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

const DEFAULT_IMAGE_ENTRIES = DEFAULT_IMAGES.map((src) => ({
  src,
  name: src.replace("/", ""),
}));

// Strip any undefined values before writing to Firestore.
function clean(obj) {
  if (Array.isArray(obj)) return obj.map(clean);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, clean(v)])
    );
  }
  return obj;
}

// Persist the full media object to Firestore.
// Uses merge:true so it never overwrites the "menu" key on the same document.
async function saveMedia(video, images) {
  const payload = clean({
    media: {
      video: video ?? null,          // null is safe in Firestore; undefined is not
      images: images ?? [],
    },
  });
  await setDoc(ADMIN_REF(), payload, { merge: true });
}

export function MediaProvider({ children }) {
  // heroVideo: null | { src: string, name: string }
  const [heroVideo, setHeroVideo] = useState(null);
  // slideshowImages: array of { src: string, name: string }
  const [slideshowImages, setSlideshowImages] = useState(DEFAULT_IMAGE_ENTRIES);
  // Track whether we have loaded from Firestore yet (avoids flash of defaults)
  const [loaded, setLoaded] = useState(false);

  // ── Single source of truth: onSnapshot ──────────────────────────────────
  // Fires immediately with cached data, then again on every remote change.
  // No localStorage reads or writes anywhere in this file.
  useEffect(() => {
    const unsub = onSnapshot(
      ADMIN_REF(),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.media) {
            // video: stored as object or null
            setHeroVideo(data.media.video ?? null);
            // images: stored as array of { src, name }
            const imgs = Array.isArray(data.media.images) && data.media.images.length
              ? data.media.images
              : DEFAULT_IMAGE_ENTRIES;
            setSlideshowImages(imgs);
          } else {
            // Document exists (for menu) but media key not written yet —
            // seed defaults into Firestore so the landing page has images.
            saveMedia(null, DEFAULT_IMAGE_ENTRIES).catch(console.error);
          }
        } else {
          // Brand-new project — seed everything.
          saveMedia(null, DEFAULT_IMAGE_ENTRIES).catch(console.error);
        }
        setLoaded(true);
      },
      (err) => {
        console.error("[MediaContext] onSnapshot error:", err);
        setLoaded(true); // still mark loaded so UI isn't stuck
      }
    );
    return () => unsub();
  }, []);

  // ── Video actions ────────────────────────────────────────────────────────
  // Reads the file as a base64 data-URL and saves to Firestore.
  const uploadVideo = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const entry = { src: reader.result, name: file.name };
        try {
          await saveMedia(entry, slideshowImages);
          // onSnapshot will update state — no manual setHeroVideo needed.
          resolve(entry);
        } catch (err) {
          console.error("[MediaContext] uploadVideo save failed:", err);
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const deleteVideo = async () => {
    try {
      await saveMedia(null, slideshowImages);
      // onSnapshot updates state.
    } catch (err) {
      console.error("[MediaContext] deleteVideo failed:", err);
      throw err;
    }
  };

  // ── Image actions ────────────────────────────────────────────────────────
  const uploadImages = (files) => {
    return new Promise((resolve, reject) => {
      const newEntries = [];
      let processed = 0;
      const fileArray = Array.from(files);

      fileArray.forEach((file) => {
        const reader = new FileReader();
        reader.onload = async () => {
          newEntries.push({ src: reader.result, name: file.name });
          processed++;
          if (processed === fileArray.length) {
            const next = [...slideshowImages, ...newEntries].slice(0, 20);
            try {
              await saveMedia(heroVideo, next);
              resolve(newEntries);
            } catch (err) {
              console.error("[MediaContext] uploadImages save failed:", err);
              reject(err);
            }
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    });
  };

  const deleteImage = async (index) => {
    const next = slideshowImages.filter((_, i) => i !== index);
    try {
      await saveMedia(heroVideo, next);
    } catch (err) {
      console.error("[MediaContext] deleteImage failed:", err);
      throw err;
    }
  };

  const replaceImage = (index, file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const entry = { src: reader.result, name: file.name };
        const next = slideshowImages.map((img, i) => (i === index ? entry : img));
        try {
          await saveMedia(heroVideo, next);
          resolve(entry);
        } catch (err) {
          console.error("[MediaContext] replaceImage save failed:", err);
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const resetImages = async () => {
    try {
      await saveMedia(heroVideo, DEFAULT_IMAGE_ENTRIES);
    } catch (err) {
      console.error("[MediaContext] resetImages failed:", err);
      throw err;
    }
  };

  return (
    <MediaContext.Provider
      value={{
        heroVideo,
        uploadVideo,
        deleteVideo,
        slideshowImages,
        uploadImages,
        deleteImage,
        replaceImage,
        resetImages,
        loaded,
      }}
    >
      {children}
    </MediaContext.Provider>
  );
}

export function useMedia() {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error("useMedia must be used inside <MediaProvider>");
  return ctx;
}
