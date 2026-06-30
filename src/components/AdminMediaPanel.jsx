// src/components/AdminMediaPanel.jsx
// Drop-in panel for the Admin dashboard — media management tab.
// No changes to UI — only the size-limit alert text is updated to remove
// the "localStorage" reference now that storage is Firestore.

import React, { useRef, useState } from "react";
import { useMedia } from "../Context/MediaContext.jsx";

// ─── Small helper components ─────────────────────────────────────────────────
function SectionTitle({ emoji, title, sub }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-lg shadow-sm flex-shrink-0">
        {emoji}
      </div>
      <div>
        <h3 className="font-bold text-gray-800 leading-tight">{title}</h3>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function UploadZone({ label, accept, onFiles, multiple = false, dragActive, onDragEnter, onDragLeave, onDrop }) {
  const inputRef = useRef(null);
  return (
    <label
      className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-8 cursor-pointer transition-all duration-200 ${
        dragActive
          ? "border-green-400 bg-green-50 scale-[1.01]"
          : "border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50/60"
      }`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="w-12 h-12 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-2xl">
        📤
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <p className="text-xs text-gray-400 mt-1">Drag & drop or click to browse</p>
      </div>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden"
        onChange={(e) => e.target.files?.length && onFiles(e.target.files)} />
    </label>
  );
}

// ─── Video sub-panel ──────────────────────────────────────────────────────────
function VideoPanel() {
  const { heroVideo, uploadVideo, deleteVideo } = useMedia();
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);

  const handleFiles = async (files) => {
    const file = files[0];
    if (!file || !file.type.startsWith("video/")) {
      alert("Please upload a video file (MP4, WebM, etc.)");
      return;
    }
    // FIX: updated limit message — no longer mentions localStorage
    if (file.size > 60 * 1024 * 1024) {
      alert("Video must be under 60 MB.");
      return;
    }
    setUploading(true);
    try {
      await uploadVideo(file);
    } catch {
      alert("❌ Failed to save video — please check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5">
        <SectionTitle emoji="🎬" title="Hero Background Video" sub="Plays automatically behind the landing page hero section" />

        {heroVideo ? (
          <div className="space-y-3">
            {/* Preview */}
            <div className="relative rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "16/7" }}>
              <video src={heroVideo.src} className="w-full h-full object-cover opacity-90" muted loop />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <span className="bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full truncate max-w-[60%]">
                  🎥 {heroVideo.name}
                </span>
                <span className="bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  Active
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center gap-1.5 cursor-pointer bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold py-2.5 rounded-xl transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Replace Video
                <input type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFiles(e.target.files)} />
              </label>
              <button
                onClick={() => { if (confirm("Remove hero video? The landing page will use a gradient background.")) deleteVideo(); }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-semibold py-2.5 rounded-xl transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Video
              </button>
            </div>
          </div>
        ) : (
          uploading ? (
            <div className="flex flex-col items-center gap-3 py-10 text-gray-400">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin" />
              <p className="text-sm font-medium">Processing video…</p>
            </div>
          ) : (
            <UploadZone
              label="Upload hero background video"
              accept="video/*"
              onFiles={handleFiles}
              dragActive={drag}
              onDragEnter={() => setDrag(true)}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
            />
          )
        )}

        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
          </svg>
          MP4 or WebM recommended · max 60 MB · video auto-plays muted
        </p>
      </div>
    </div>
  );
}

// ─── Images sub-panel ─────────────────────────────────────────────────────────
function ImagesPanel() {
  const { slideshowImages, uploadImages, deleteImage, replaceImage, resetImages } = useMedia();
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);

  const handleUpload = async (files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!valid.length) return;
    setUploading(true);
    try {
      await uploadImages(valid);
    } catch {
      alert("❌ Failed to save images — please check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleReplace = (index, e) => {
    const file = e.target.files?.[0];
    if (file) replaceImage(index, file);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5">
        <SectionTitle emoji="🖼️" title="Hero Image Slideshow" sub="Up to 20 images rotate in the landing page showcase" />

        {/* Upload zone */}
        {slideshowImages.length < 20 && (
          uploading ? (
            <div className="flex items-center justify-center gap-3 py-6 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 mb-4">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-green-500 rounded-full animate-spin" />
              <span className="text-sm font-medium">Uploading images…</span>
            </div>
          ) : (
            <div className="mb-4">
              <UploadZone
                label={`Add images (${slideshowImages.length}/20 used)`}
                accept="image/*"
                multiple
                onFiles={handleUpload}
                dragActive={drag}
                onDragEnter={() => setDrag(true)}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); handleUpload(e.dataTransfer.files); }}
              />
            </div>
          )
        )}

        {/* Image grid */}
        {slideshowImages.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {slideshowImages.length} image{slideshowImages.length !== 1 ? "s" : ""}
              </p>
              <button
                onClick={() => { if (confirm("Reset to default food images?")) resetImages(); }}
                className="text-xs text-gray-400 hover:text-orange-500 transition font-medium"
              >
                ↺ Reset to defaults
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {slideshowImages.map((img, i) => (
                <div key={i} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                  <img
                    src={img.src ?? img}
                    alt={img.name ?? `slide-${i}`}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                    {/* Replace */}
                    <label className="w-7 h-7 rounded-lg bg-blue-500 hover:bg-blue-400 flex items-center justify-center cursor-pointer transition shadow-lg" title="Replace">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleReplace(i, e)} />
                    </label>
                    {/* Delete */}
                    <button
                      onClick={() => { if (confirm("Remove this image?")) deleteImage(i); }}
                      className="w-7 h-7 rounded-lg bg-red-500 hover:bg-red-400 flex items-center justify-center transition shadow-lg"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {/* Index badge */}
                  <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
          </svg>
          JPG, PNG, WebP · Max 20 images · Changes reflect live on the landing page
        </p>
      </div>
    </div>
  );
}

// ─── Exported panel (renders both) ───────────────────────────────────────────
export default function AdminMediaPanel() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-bold text-gray-800 text-lg">Media Management</h3>
        <p className="text-xs text-gray-500 mt-0.5">Control the hero video and slideshow images shown on the landing page</p>
      </div>
      <VideoPanel />
      <ImagesPanel />
    </div>
  );
}
