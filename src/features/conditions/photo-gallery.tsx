import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import {
  useDeletePhoto,
  usePhotosByCondition,
} from "@/src/features/conditions/hooks";
import type { ProgressPhoto, UUID } from "@/src/types/domain";
import dayjs from "dayjs";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";

interface PhotoGalleryProps {
  conditionId: UUID;
  currentUserId?: UUID;
  onPhotoDeleted?: () => void;
  editable?: boolean;
}

/**
 * PhotoGallery Component
 * Displays all photos attached to a condition/diagnostic
 * Allows deletion if user is the uploader
 */
export function PhotoGallery({
  conditionId,
  currentUserId,
  onPhotoDeleted,
  editable = false,
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(
    null,
  );

  const photosQuery = usePhotosByCondition(conditionId);
  const deletePhotoMutation = useDeletePhoto(conditionId);

  const photos = photosQuery.data ?? [];
  const loading = photosQuery.isLoading;
  const deleting = deletePhotoMutation.isPending
    ? (deletePhotoMutation.variables?.photoId ?? null)
    : null;

  const handleDeletePhoto = async (photo: ProgressPhoto) => {
    Alert.alert("Delete Photo", "Are you sure you want to delete this photo?", [
      {
        text: "Cancel",
        onPress: () => {},
        style: "cancel",
      },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await deletePhotoMutation.mutateAsync({
              photoId: photo.id,
              imageUrl: photo.imageUrl,
            });
            onPhotoDeleted?.();
            Alert.alert("Success", "Photo deleted successfully");
          } catch (error) {
            console.error("Failed to delete photo:", error);
            Alert.alert(
              "Error",
              error instanceof Error ? error.message : "Failed to delete photo",
            );
          }
        },
        style: "destructive",
      },
    ]);
  };

  if (loading) {
    return (
      <VStack className="gap-3 p-4 items-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-sm text-gray-500">Loading photos...</Text>
      </VStack>
    );
  }

  if (photos.length === 0) {
    return (
      <Box className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <Text className="text-center text-gray-500 text-sm">
          📭 No photos yet. {editable ? "Capture your first photo!" : ""}
        </Text>
      </Box>
    );
  }

  return (
    <VStack className="gap-3">
      <Text className="font-semibold text-sm">Photos ({photos.length})</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="gap-3 flex-row"
        contentContainerStyle={{ paddingHorizontal: 0, gap: 12 }}
      >
        {photos.map((photo) => {
          const isOwnedByCurrentUser =
            currentUserId && photo.uploadedById === currentUserId;
          const canDelete = editable && isOwnedByCurrentUser;

          return (
            <Box key={photo.id} className="relative">
              {/* Photo Image */}
              <Pressable onPress={() => setSelectedPhoto(photo)}>
                <Image
                  source={{ uri: photo.imageUrl }}
                  style={{
                    width: 150,
                    height: 150,
                    borderRadius: 8,
                    backgroundColor: "#e5e7eb",
                  }}
                  onError={(error) => {
                    console.error(`Failed to load image ${photo.id}:`, error);
                  }}
                />
              </Pressable>

              {/* Overlay with info */}
              <Box className="absolute inset-0 bg-black/30 rounded-lg flex justify-between p-2">
                {/* View Type Badge */}
                {photo.viewType && (
                  <Box className="bg-blue-600 px-2 py-1 rounded self-start">
                    <Text className="text-white text-xs font-semibold">
                      {photo.viewType}
                    </Text>
                  </Box>
                )}

                {/* Delete Button (if editable and owner) */}
                {canDelete && (
                  <Button
                    size="sm"
                    onPress={() => handleDeletePhoto(photo)}
                    disabled={deleting === photo.id}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 absolute top-1 right-1 p-1"
                  >
                    <ButtonText className="text-xs">
                      {deleting === photo.id ? "..." : "x"}
                    </ButtonText>
                  </Button>
                )}
              </Box>

              {/* Date and Notes */}
              <VStack className="gap-1 mt-2 px-1">
                <Text className="text-xs text-gray-600">
                  {dayjs(photo.capturedAt).format("MMM DD, HH:mm")}
                </Text>
                {photo.notes && (
                  <Text className="text-xs text-gray-700 line-clamp-2">
                    {photo.notes}
                  </Text>
                )}
              </VStack>
            </Box>
          );
        })}
      </ScrollView>

      <Modal
        visible={Boolean(selectedPhoto)}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <Pressable
          className="flex-1 bg-black/95"
          onPress={() => setSelectedPhoto(null)}
        >
          <View className="flex-1 items-center justify-center px-4">
            {selectedPhoto ? (
              <>
                <Image
                  source={{ uri: selectedPhoto.imageUrl }}
                  style={{
                    width: "100%",
                    height: "75%",
                    resizeMode: "contain",
                    backgroundColor: "#111827",
                    borderRadius: 12,
                  }}
                />
                <Text className="mt-3 text-center text-white text-sm">
                  {selectedPhoto.viewType ?? "Foto"}
                </Text>
                {selectedPhoto.notes ? (
                  <Text className="mt-1 text-center text-gray-200 text-xs">
                    {selectedPhoto.notes}
                  </Text>
                ) : null}
                <Text className="mt-2 text-center text-gray-400 text-xs">
                  Toca para cerrar
                </Text>
              </>
            ) : null}
          </View>
        </Pressable>
      </Modal>
    </VStack>
  );
}
