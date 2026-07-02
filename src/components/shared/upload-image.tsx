// @/components/shared/upload-image.tsx

import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Image,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";

export interface UploadImageFile {
  uri: string;
  width?: number;
  height?: number;
  type?: string;
  fileName?: string;
}

export interface UploadImageProps {
  value: string[];
  onChange: (urls: string[]) => void;

  maxImages?: number;
  multiple?: boolean;

  enableCamera?: boolean;
  enableGallery?: boolean;

  compress?: boolean;
  compressionQuality?: number;

  upload?: boolean;
  uploadFn?: (file: UploadImageFile) => Promise<string>;

  size?: number;
  borderRadius?: number;
}

export default function UploadImage({
  value,
  onChange,

  maxImages = 5,
  multiple = true,

  enableCamera = true,
  enableGallery = true,

  compress = true,
  compressionQuality = 0.7,

  upload = false,
  uploadFn,

  size = 90,
  borderRadius = 12,
}: UploadImageProps) {
  const [loading, setLoading] = useState(false);

  const canAddMore = value.length < maxImages;

  // =====================
  // PICK IMAGE
  // =====================
  const pickImage = useCallback(async () => {
    if (!canAddMore) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: multiple,
      quality: 1,
    });

    if (result.canceled) return;

    setLoading(true);

    try {
      const assets = result.assets;

      const processed = await Promise.all(
        assets.map(async (asset) => {
          let uri = asset.uri;

          // =====================
          // COMPRESSION
          // =====================
          if (compress) {
            const manipulated = await ImageManipulator.manipulateAsync(
              uri,
              [],
              {
                compress: compressionQuality,
                format: ImageManipulator.SaveFormat.JPEG,
              },
            );

            uri = manipulated.uri;
          }

          // =====================
          // UPLOAD (OPTIONAL)
          // =====================
          if (upload && uploadFn) {
            const url = await uploadFn({
              uri,
              fileName: asset.fileName ?? "image.jpg",
              type: "image/jpeg",
            });

            return url;
          }

          return uri;
        }),
      );

      const newImages = [...value, ...processed].slice(0, maxImages);
      onChange(newImages);
    } finally {
      setLoading(false);
    }
  }, [value, maxImages, upload, uploadFn, compress, compressionQuality]);

  // =====================
  // CAMERA
  // =====================
  const takePhoto = useCallback(async () => {
    if (!canAddMore) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
    });

    if (result.canceled) return;

    setLoading(true);

    try {
      const asset = result.assets[0];

      let uri = asset.uri;

      if (compress) {
        const manipulated = await ImageManipulator.manipulateAsync(uri, [], {
          compress: compressionQuality,
          format: ImageManipulator.SaveFormat.JPEG,
        });

        uri = manipulated.uri;
      }

      if (upload && uploadFn) {
        uri = await uploadFn({
          uri,
          fileName: asset.fileName ?? "camera.jpg",
          type: "image/jpeg",
        });
      }

      onChange([...value, uri]);
    } finally {
      setLoading(false);
    }
  }, [value, upload, uploadFn]);

  // =====================
  // REMOVE
  // =====================
  const remove = useCallback(
    (index: number) => {
      const copy = [...value];
      copy.splice(index, 1);
      onChange(copy);
    },
    [value],
  );

  // =====================
  // RENDER ITEM
  // =====================
  const renderItem = useCallback(
    ({ item, index }: any) => (
      <View
        style={[
          styles.imageBox,
          {
            width: size,
            height: size,
            borderRadius,
          },
        ]}
      >
        <Image
          source={{ uri: item }}
          style={{ width: "100%", height: "100%", borderRadius }}
        />

        <Pressable onPress={() => remove(index)} style={styles.removeBtn}>
          <Ionicons name="close" size={14} color="#fff" />
        </Pressable>
      </View>
    ),
    [remove, size, borderRadius],
  );

  // =====================
  // ADD BUTTON
  // =====================
  const AddButton = useMemo(
    () => (
      <Pressable
        onPress={pickImage}
        style={[styles.addBox, { width: size, height: size, borderRadius }]}
      >
        <Ionicons name="add" size={24} color="#999" />
        <Text style={styles.addText}>Ajouter</Text>
      </Pressable>
    ),
    [pickImage, size],
  );

  return (
    <View>
      {/* GRID */}
      <FlatList
        data={value}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderItem}
        numColumns={3}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ gap: 10 }}
        ListFooterComponent={canAddMore ? AddButton : null}
      />

      {/* CAMERA BUTTON */}
      {enableCamera && canAddMore && (
        <Pressable onPress={takePhoto} style={styles.cameraBtn}>
          <Ionicons name="camera" size={20} color="#fff" />
          <Text style={{ color: "#fff", marginLeft: 8 }}>Caméra</Text>
        </Pressable>
      )}

      {/* LOADING */}
      {loading && (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      )}
    </View>
  );
}

// =====================
// STYLES
// =====================
const styles = StyleSheet.create({
  imageBox: {
    overflow: "hidden",
    backgroundColor: "#eee",
  },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 4,
  },
  addBox: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderStyle: "dashed",
  },
  addText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  cameraBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignSelf: "center",
    backgroundColor: "#000",
    padding: 10,
    borderRadius: 8,
  },
  loading: {
    position: "absolute",
    top: "50%",
    left: "50%",
  },
});
