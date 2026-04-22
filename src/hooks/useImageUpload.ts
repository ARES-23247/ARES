import { useState } from "react";
import { compressImage } from "../utils/imageProcessor";
import { adminApi } from "../api/adminApi";

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const uploadFile = async (file: File): Promise<{url: string, altText?: string}> => {
    setIsUploading(true);
    setErrorMsg("");
    try {
      const { blob: compressedBlob, ext } = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressedBlob, file.name.replace(/\.[^/.]+$/, ext));
      const data = await adminApi.uploadFile<{ url?: string, error?: string, altText?: string }>("/api/admin/upload", formData);
      
      if (!data.url) throw new Error(data.error || "Upload failed");
      return { url: data.url, altText: data.altText };
    } catch (err) {
      const msg = String(err);
      setErrorMsg(msg);
      throw new Error(msg, { cause: err });
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, errorMsg, setErrorMsg };
}
