import { firestore, storage } from "@/src/services/firebase/client";
import type { PhotoViewType, ProgressPhoto, UUID } from "@/src/types/domain";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

const PHOTOS_COLLECTION = "progress_photos";

/**
 * Upload a progress photo from device to Firebase Storage and save metadata to Firestore
 */
export async function uploadProgressPhoto(
  imageUri: string,
  conditionId: UUID,
  uploadedById: UUID,
  viewType: PhotoViewType,
  notes?: string,
): Promise<ProgressPhoto> {
  try {
    // Convert local URI from camera/gallery directly to blob for Firebase Storage.
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // 3. Upload to Firebase Storage
    const timestamp = Date.now();
    const fileName = `progress_photos/${conditionId}/${timestamp}.jpg`;
    const storageRef = ref(storage, fileName);

    await uploadBytes(storageRef, blob, {
      contentType: "image/jpeg",
    });

    const downloadUrl = await getDownloadURL(storageRef);

    // 4. Save metadata to Firestore
    const photoId = `photo_${conditionId}_${timestamp}`;
    const photoData: ProgressPhoto = {
      id: photoId,
      conditionId,
      uploadedById,
      imageUrl: downloadUrl,
      viewType: viewType || null,
      notes: notes || null,
      capturedAt: new Date().toISOString(),
    };

    await setDoc(doc(firestore, PHOTOS_COLLECTION, photoId), photoData);

    return photoData;
  } catch (error) {
    console.error("Photo upload failed:", error);
    throw new Error(
      `Failed to upload photo: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get all photos for a specific condition, ordered by capture date (newest first)
 */
export async function getPhotosByCondition(
  conditionId: UUID,
): Promise<ProgressPhoto[]> {
  try {
    const q = query(
      collection(firestore, PHOTOS_COLLECTION),
      where("conditionId", "==", conditionId),
      orderBy("capturedAt", "desc"),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as ProgressPhoto);
  } catch (error) {
    const firestoreError = error as { code?: string };

    // Fallback for missing composite index on (conditionId + capturedAt).
    if (firestoreError.code === "failed-precondition") {
      const fallbackQuery = query(
        collection(firestore, PHOTOS_COLLECTION),
        where("conditionId", "==", conditionId),
      );

      const fallbackSnapshot = await getDocs(fallbackQuery);
      const photos = fallbackSnapshot.docs.map(
        (doc) => doc.data() as ProgressPhoto,
      );

      return photos.sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1));
    }

    console.error("Failed to fetch photos:", error);
    return [];
  }
}

/**
 * Delete a progress photo from Storage and Firestore
 */
export async function deletePhoto(
  photoId: UUID,
  imageUrl: string,
): Promise<void> {
  try {
    // 1. Delete from Firebase Storage
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef).catch((error) => {
      // Storage path may not match URL, continue with Firestore deletion
      console.warn("Storage deletion skipped:", error);
    });

    // 2. Delete from Firestore
    await deleteDoc(doc(firestore, PHOTOS_COLLECTION, photoId));
  } catch (error) {
    console.error("Photo deletion failed:", error);
    throw new Error(
      `Failed to delete photo: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get a single photo by ID
 */
export async function getPhotoById(
  photoId: UUID,
): Promise<ProgressPhoto | null> {
  try {
    const snap = await getDocs(
      query(
        collection(firestore, PHOTOS_COLLECTION),
        where("id", "==", photoId),
      ),
    );

    if (snap.empty) {
      return null;
    }

    return snap.docs[0].data() as ProgressPhoto;
  } catch (error) {
    console.error("Failed to fetch photo:", error);
    return null;
  }
}
