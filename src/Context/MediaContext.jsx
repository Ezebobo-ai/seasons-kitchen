// src/Context/MediaContext.jsx
// Manages hero video + slideshow images for the landing page.
//
// ── FIX: previously video/images were base64-encoded and written directly
// into the "settings/admin" Firestore document — the SAME document used for
// the entire menu array. Firestore hard-caps a document at 1MB, but the
// upload UI allowed videos up to 60MB. Any video (and often multiple
// images) pushed the shared document over that limit, causing the write to
// be rejected by the server after the local optimistic cache had already
// shown it as "saved" — which looked exactly like data silently reverting.
//
// Files now go to Firebase Storage (a file bucket with no such size limit),
// and only the small download URL string is written to Firestore.

import React, { createContext, useContext, useState, useEffect } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";
import { uploadFileToStorage, deleteFileFromStorage } from "../utils/storageUpload.js";

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
  // heroVideo: null | { src: string, name: string, path?: string }
  const [heroVideo, setHeroVideo] = useState(null);
  // slideshowImages: array of { src: string, name: string, path?: string }
  const [slideshowImages, setSlideshowImages] = useState(DEFAULT_IMAGE_ENTRIES);
  // Track whether we have loaded from Firestore yet (avoids flash of defaults)
  const [loaded, setLoaded] = useState(false);

  // ── Single source of truth: onSnapshot ──────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      ADMIN_REF(),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.media) {
            setHeroVideo(data.media.video ?? null);
            const imgs = Array.isArray(data.media.images) && data.media.images.length
              ? data.media.images
              : DEFAULT_IMAGE_ENTRIES;
            setSlideshowImages(imgs);
          } else {
            saveMedia(null, DEFAULT_IMAGE_ENTRIES).catch(console.error);
          }
        } else {
          saveMedia(null, DEFAULT_IMAGE_ENTRIES).catch(console.error);
        }
        setLoaded(true);
      },
      (err) => {
        console.error("[MediaContext] onSnapshot error:", err);
        setLoaded(true);
      }
    );
    return () => unsub();
  }, []);

  // ── Video actions ────────────────────────────────────────────────────────
  const uploadVideo = async (file) => {
    const { url, path } = await uploadFileToStorage(file, "media/videos");
    const entry = { src: url, name: file.name, path };
    const previousPath = heroVideo?.path;
    try {
      await saveMedia(entry, slideshowImages);
      // Clean up the old video file now that the new one is confirmed saved.
      if (previousPath) deleteFileFromStorage(previousPath);
      return entry;
    } catch (err) {
      console.error("[MediaContext] uploadVideo save failed:", err);
      // Firestore write failed — remove the orphaned upload so Storage
      // doesn't accumulate files that are never referenced.
      deleteFileFromStorage(path);
      throw err;
    }
  };

  const deleteVideo = async () => {
    const previousPath = heroVideo?.path;
    try {
      await saveMedia(null, slideshowImages);
      if (previousPath) deleteFileFromStorage(previousPath);
    } catch (err) {
      console.error("[MediaContext] deleteVideo failed:", err);
      throw err;
    }
  };

  // ── Image actions ────────────────────────────────────────────────────────
  const uploadImages = async (files) => {
    const fileArray = Array.from(files);
    const uploaded = [];
    try {
      for (const file of fileArray) {
        const { url, path } = await uploadFileToStorage(file, "media/images");
        uploaded.push({ src: url, name: file.name, path });
      }
      const next = [...slideshowImages, ...uploaded].slice(0, 20);
      await saveMedia(heroVideo, next);
      return uploaded;
    } catch (err) {
      console.error("[MediaContext] uploadImages save failed:", err);
      // Clean up any files that made it to Storage before the failure.
      uploaded.forEach((u) => deleteFileFromStorage(u.path));
      throw err;
    }
  };

  const deleteImage = async (index) => {
    const removed = slideshowImages[index];
    const next = slideshowImages.filter((_, i) => i !== index);
    try {
      await saveMedia(heroVideo, next);
      if (removed?.path) deleteFileFromStorage(removed.path);
    } catch (err) {
      console.error("[MediaContext] deleteImage failed:", err);
      throw err;
    }
  };

  const replaceImage = async (index, file) => {
    const { url, path } = await uploadFileToStorage(file, "media/images");
    const entry = { src: url, name: file.name, path };
    const previous = slideshowImages[index];
    const next = slideshowImages.map((img, i) => (i === index ? entry : img));
    try {
      await saveMedia(heroVideo, next);
      if (previous?.path) deleteFileFromStorage(previous.path);
      return entry;
    } catch (err) {
      console.error("[MediaContext] replaceImage save failed:", err);
      deleteFileFromStorage(path);
      throw err;
    }
  };

  const resetImages = async () => {
    const previousPaths = slideshowImages.map((img) => img.path).filter(Boolean);
    try {
      await saveMedia(heroVideo, DEFAULT_IMAGE_ENTRIES);
      previousPaths.forEach(deleteFileFromStorage);
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
