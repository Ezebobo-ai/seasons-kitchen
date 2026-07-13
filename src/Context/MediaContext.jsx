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
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";
import { uploadFileToStorage, deleteFileFromStorage } from "../utils/storageUpload.js";
import { seedIfAdmin } from "../utils/seedGuard.js";

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

// ── FIX (CRITICAL-1): read-modify-write, not state-modify-write ───────────
// Every media write now reads the CURRENT Firestore document immediately
// before writing, exactly like MenuContext.persist() and
// InventoryContext.persistInv(). The caller supplies an updater function
// that receives { video, images } as they exist on the SERVER right now,
// and returns the new { video, images } to save. This closes the
// stale-closure race where two near-simultaneous media edits (two tabs,
// or simply normal onSnapshot round-trip latency) could cause the second
// write to silently revert the first.
async function updateMedia(updaterFn) {
  const ref = ADMIN_REF();
  let snap;
  try {
    snap = await getDoc(ref);
  } catch (err) {
    console.error("[MediaContext] updateMedia: failed to read Firestore:", err);
    throw err;
  }

  const serverMedia = snap.exists() ? snap.data().media : null;
  const currentMedia = {
    video: serverMedia?.video ?? null,
    images:
      Array.isArray(serverMedia?.images) && serverMedia.images.length
        ? serverMedia.images
        : DEFAULT_IMAGE_ENTRIES,
  };

  const nextMedia = updaterFn(currentMedia);

  const payload = clean({
    media: {
      video: nextMedia.video ?? null,        // null is safe in Firestore; undefined is not
      images: nextMedia.images ?? [],
    },
  });

  try {
    await setDoc(ref, payload, { merge: true });
    // Do NOT call setHeroVideo/setSlideshowImages here — onSnapshot handles it,
    // exactly as documented in MenuContext/InventoryContext.
  } catch (err) {
    console.error("[MediaContext] updateMedia failed:", err);
    throw err;
  }
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
            // Field missing on an existing doc — seed it, but ONLY from an
            // authenticated admin session. This intentionally bypasses
            // updateMedia() (used by real admin edits) and calls the guard
            // directly, so media edit logic itself is untouched.
            // See utils/seedGuard.js.
            const payload = clean({ media: { video: null, images: DEFAULT_IMAGE_ENTRIES } });
            seedIfAdmin(ADMIN_REF(), payload, "media").catch(console.error);
          }
        } else {
          // Brand-new project — same admin-only seed guard as above.
          const payload = clean({ media: { video: null, images: DEFAULT_IMAGE_ENTRIES } });
          seedIfAdmin(ADMIN_REF(), payload, "media").catch(console.error);
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
    let previousPath;
    try {
      await updateMedia((current) => {
        previousPath = current.video?.path;
        return { video: entry, images: current.images };
      });
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
    let previousPath;
    try {
      await updateMedia((current) => {
        previousPath = current.video?.path;
        return { video: null, images: current.images };
      });
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
      await updateMedia((current) => ({
        video: current.video,
        images: [...current.images, ...uploaded].slice(0, 20),
      }));
      return uploaded;
    } catch (err) {
      console.error("[MediaContext] uploadImages save failed:", err);
      // Clean up any files that made it to Storage before the failure.
      uploaded.forEach((u) => deleteFileFromStorage(u.path));
      throw err;
    }
  };

  const deleteImage = async (index) => {
    // Identify WHICH image was clicked using its own identity (Storage path,
    // or src for the hardcoded defaults that have no path), not its position.
    // `index` is only valid against this browser's local `slideshowImages` —
    // it cannot be safely applied to the freshly-read server array, which
    // may have a different order/length by the time updateMedia's getDoc()
    // resolves. Matching by identity means the correct image is removed
    // wherever it now sits, and is a safe no-op if it was already removed.
    const target = slideshowImages[index];
    if (!target) return;
    try {
      await updateMedia((current) => ({
        video: current.video,
        images: current.images.filter((img) =>
          target.path ? img.path !== target.path : img.src !== target.src
        ),
      }));
      if (target.path) deleteFileFromStorage(target.path);
    } catch (err) {
      console.error("[MediaContext] deleteImage failed:", err);
      throw err;
    }
  };

  const replaceImage = async (index, file) => {
    // Same identity-matching reasoning as deleteImage above.
    const target = slideshowImages[index];
    if (!target) {
      throw new Error("That image was changed elsewhere — please refresh and try again.");
    }
    const { url, path } = await uploadFileToStorage(file, "media/images");
    const entry = { src: url, name: file.name, path };
    try {
      await updateMedia((current) => ({
        video: current.video,
        images: current.images.map((img) =>
          (target.path ? img.path === target.path : img.src === target.src) ? entry : img
        ),
      }));
      if (target.path) deleteFileFromStorage(target.path);
      return entry;
    } catch (err) {
      console.error("[MediaContext] replaceImage save failed:", err);
      deleteFileFromStorage(path);
      throw err;
    }
  };

  const resetImages = async () => {
    let previousPaths = [];
    try {
      await updateMedia((current) => {
        previousPaths = current.images.map((img) => img.path).filter(Boolean);
        return { video: current.video, images: DEFAULT_IMAGE_ENTRIES };
      });
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
