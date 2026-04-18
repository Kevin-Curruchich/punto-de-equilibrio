import {
  deletePhoto,
  getPhotosByCondition,
  uploadProgressPhoto,
} from "@/src/services/firebase/photos";
import type { PhotoViewType, ProgressPhoto, UUID } from "@/src/types/domain";
import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";

const PHOTOS_QUERY_KEY = (conditionId: UUID) => ["photos", conditionId];

/**
 * Hook to fetch all photos for a condition
 */
export function usePhotosByCondition(
  conditionId: UUID,
): UseQueryResult<ProgressPhoto[], Error> {
  return useQuery({
    queryKey: PHOTOS_QUERY_KEY(conditionId),
    queryFn: () => getPhotosByCondition(conditionId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
}

/**
 * Hook to upload a progress photo
 */
export function useUploadPhoto(conditionId: UUID): UseMutationResult<
  ProgressPhoto,
  Error,
  {
    imageUri: string;
    userId: UUID;
    viewType: PhotoViewType;
    notes?: string;
  }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ imageUri, userId, viewType, notes }) => {
      return uploadProgressPhoto(
        imageUri,
        conditionId,
        userId,
        viewType,
        notes,
      );
    },
    onSuccess: (newPhoto) => {
      // Invalidate and refetch photos for this condition
      queryClient.invalidateQueries({
        queryKey: PHOTOS_QUERY_KEY(conditionId),
      });
    },
    onError: (error) => {
      console.error("Photo upload error:", error);
    },
  });
}

/**
 * Hook to delete a progress photo
 */
export function useDeletePhoto(
  conditionId: UUID,
): UseMutationResult<void, Error, { photoId: UUID; imageUrl: string }> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, imageUrl }) => {
      return deletePhoto(photoId, imageUrl);
    },
    onSuccess: () => {
      // Invalidate and refetch photos for this condition
      queryClient.invalidateQueries({
        queryKey: PHOTOS_QUERY_KEY(conditionId),
      });
    },
    onError: (error) => {
      console.error("Photo deletion error:", error);
    },
  });
}
