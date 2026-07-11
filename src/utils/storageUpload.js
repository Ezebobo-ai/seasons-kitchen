// src/utils/storageUpload.js
//
// Shared Firebase Storage helpers. Any feature that needs to store a file
// (menu item photos, hero video, slideshow images, etc.) should go through
// Storage and save only the resulting URL in Firestore — never the raw
// file/base64 — to avoid Firestore's 1MB-per-document limit.

import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import app from "../firebase.js";

const storage = getStorage(app);

/**
 * Upload a File to Firebase Storage under `folder/` and return its public
 * download URL plus its Storage path (needed later for cleanup on delete).
 */
export async function uploadFileToStorage(file, folder) {
  const path = `${folder}/${Date.now()}-${file.name}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  const url = await getDownloadURL(ref);
  return { url, path };
}

/**
 * Best-effort delete of a previously-uploaded Storage file. Safe to call on
 * paths that don't exist (e.g. local /public assets, or legacy base64
 * entries saved before files moved to Storage) — failures are logged, not
 * thrown, so a cleanup miss never blocks the calling feature.
 */
export async function deleteFileFromStorage(path) {
  if (!path) return;
  try {
    await deleteObject(storageRef(storage, path));
  } catch (err) {
    console.warn("[storageUpload] could not delete", path, err);
  }
}
