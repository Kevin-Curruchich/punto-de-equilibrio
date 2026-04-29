import { Button, ButtonText } from "@/components/ui/button";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Input, InputField } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { VStack } from "@/components/ui/vstack";
import { uploadProgressPhoto } from "@/src/services/firebase/photos";
import type { PhotoViewType, UUID } from "@/src/types/domain";
import { useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import { Alert, Image } from "react-native";

interface PhotoPickerProps {
  conditionId: UUID;
  userId: UUID;
  defaultViewType?: PhotoViewType;
  defaultNotes?: string;
  onPhotoUploaded: (photoId: string) => void;
  onError?: (error: string) => void;
}

/**
 * PhotoPicker Component
 * Allows physiotherapist to capture new photos via camera or select from gallery
 * and upload them to a condition/diagnostic
 */
export function PhotoPicker({
  conditionId,
  userId,
  defaultViewType = "general",
  defaultNotes,
  onPhotoUploaded,
  onError,
}: PhotoPickerProps) {
  const [loading, setLoading] = useState(false);
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [viewType, setViewType] = useState(String(defaultViewType));
  const [notes, setNotes] = useState(defaultNotes ?? "");
  const queryClient = useQueryClient();

  // Request camera permissions
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Permission Needed",
        "Please enable camera access in settings to take photos",
      );
      return false;
    }
    return true;
  };

  // Request gallery permissions
  const requestGalleryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Gallery Permission Needed",
        "Please enable photo library access in settings",
      );
      return false;
    }
    return true;
  };

  /**
   * Open camera to capture new photo
   */
  const handleTakePhoto = useCallback(async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to capture photo";
      console.error("Camera error:", error);
      onError?.(errorMessage);
      Alert.alert("Error", errorMessage);
    }
  }, [onError]);

  /**
   * Open gallery to select existing photo
   */
  const handlePickFromGallery = useCallback(async () => {
    try {
      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to select photo";
      console.error("Gallery error:", error);
      onError?.(errorMessage);
      Alert.alert("Error", errorMessage);
    }
  }, [onError]);

  const handleAddPhoto = useCallback(() => {
    setIsDraftOpen(true);
    Alert.alert("Agregar foto", "Selecciona una opcion", [
      {
        text: "Tomar foto",
        onPress: () => {
          void handleTakePhoto();
        },
      },
      {
        text: "Elegir de galeria",
        onPress: () => {
          void handlePickFromGallery();
        },
      },
      {
        text: "Cancelar",
        style: "cancel",
      },
    ]);
  }, [handlePickFromGallery, handleTakePhoto]);

  const handleCancelDraft = useCallback(() => {
    setIsDraftOpen(false);
    setSelectedImageUri(null);
    setViewType(String(defaultViewType));
    setNotes(defaultNotes ?? "");
  }, [defaultNotes, defaultViewType]);

  const handleSavePhoto = useCallback(async () => {
    if (!selectedImageUri) {
      Alert.alert("Selecciona una foto", "Primero elige o toma una foto.");
      return;
    }

    try {
      setLoading(true);

      const photo = await uploadProgressPhoto(
        selectedImageUri,
        conditionId,
        userId,
        viewType.trim() || "general",
        notes.trim() || undefined,
      );

      await queryClient.invalidateQueries({
        queryKey: ["photos", conditionId],
      });

      onPhotoUploaded(photo.id);
      handleCancelDraft();
      Alert.alert("Success", "✅ Photo uploaded successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload photo";
      onError?.(errorMessage);
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    conditionId,
    userId,
    viewType,
    notes,
    selectedImageUri,
    queryClient,
    onPhotoUploaded,
    handleCancelDraft,
    onError,
  ]);

  return (
    <VStack className="gap-3 p-2 border border-gray-200 rounded-lg">
      <Text className="font-semibold text-sm">Agregar foto al diagnostico</Text>

      <Button onPress={handleAddPhoto} disabled={loading} className="w-full">
        {loading ? <Spinner size="small" color="white" /> : null}
        <ButtonText>{loading ? "Subiendo..." : "Agregar foto"}</ButtonText>
      </Button>

      {isDraftOpen ? (
        <VStack className="gap-3">
          <FormControl>
            <FormControlLabel>
              <FormControlLabelText className="text-xs text-muted-foreground">
                Tipo de foto
              </FormControlLabelText>
            </FormControlLabel>
            <Input className="border-border bg-card">
              <InputField
                value={viewType}
                onChangeText={setViewType}
                placeholder="Ej: frontal, documento, evaluacion"
              />
            </Input>
          </FormControl>

          <FormControl>
            <FormControlLabel>
              <FormControlLabelText className="text-xs text-muted-foreground">
                Nota (opcional)
              </FormControlLabelText>
            </FormControlLabel>
            <Textarea className="border-border bg-card">
              <TextareaInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Comentario de la foto"
                numberOfLines={2}
              />
            </Textarea>
          </FormControl>

          {selectedImageUri ? (
            <VStack className="gap-2">
              <Image
                source={{ uri: selectedImageUri }}
                style={{
                  width: "100%",
                  height: 220,
                  borderRadius: 12,
                  backgroundColor: "#e5e7eb",
                }}
                resizeMode="cover"
              />
              <Text className="text-xs text-muted-foreground">
                Foto seleccionada. Guarda para subirla o cancela para
                descartarla.
              </Text>
            </VStack>
          ) : (
            <Text className="text-xs text-muted-foreground">
              Despues de elegir una opcion, la foto seleccionada aparecera aqui.
            </Text>
          )}

          <Button variant="outline" onPress={handleAddPhoto} disabled={loading}>
            <ButtonText>
              {selectedImageUri ? "Cambiar foto" : "Seleccionar foto"}
            </ButtonText>
          </Button>

          <VStack className="gap-2">
            <Button
              onPress={handleSavePhoto}
              disabled={loading || !selectedImageUri}
            >
              {loading ? <Spinner size="small" color="white" /> : null}
              <ButtonText>Guardar foto</ButtonText>
            </Button>
            <Button
              variant="outline"
              onPress={handleCancelDraft}
              disabled={loading}
            >
              <ButtonText>Cancelar</ButtonText>
            </Button>
          </VStack>
        </VStack>
      ) : null}
    </VStack>
  );
}
