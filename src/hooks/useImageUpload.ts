import { useState } from "react";
import { compressImage } from "../utils/imageProcessor";
import { api } from "../api/client";

export function useImageUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const uploadFile = async (file: File): Promise<{url: string, altText?: string}> => {
    if (isUploading) throw new Error("An upload is already in progress.");
    setIsUploading(true);
    setErrorMsg("");
    try {
      const { blob: compressedBlob, ext } = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressedBlob, file.name.replace(/\.[^/.]+$/, ext));
      
      const res = await api.media.upload.mutation({
        body: formData
      });
      
      if (res.status === 200) {
        return { url: res.body.url, altText: res.body.altText };
      } else {
        throw new Error((res.body as unknown as { error?: string })?.error || "Upload failed");
      }
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
