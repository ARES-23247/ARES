import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { toast } from "sonner";
import { compressImage } from "../utils/imageProcessor";

export interface R2MediaItem {
  key: string;
  url: string;
  folder: string;
  size?: number;
  type?: string;
  uploadedAt?: string;
}

export function useMedia() {
  const queryClient = useQueryClient();
  const [syndicateKey, setSyndicateKey] = useState<string | null>(null);
  const [syndicateCaption, setSyndicateCaption] = useState("");
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>("All");

  const { data: mediaResponse, isLoading, isError } = api.media.adminList.useQuery(['media'], {});

  const rawBody = mediaResponse?.body as unknown;
  const assets: R2MediaItem[] = (Array.isArray(rawBody) ? rawBody : ((rawBody as { media?: R2MediaItem[] })?.media || [])) as R2MediaItem[];

  const deleteMutation = api.media.delete.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success("Asset deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Delete failed");
    }
  });

  const uploadMutation = api.media.upload.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Upload failed");
    }
  });

  const bulkUpload = async (files: File[]) => {
    let successCount = 0;
    for (const file of files) {
      try {
        const { blob: compressedBlob, ext } = await compressImage(file);
        const formData = new FormData();
        formData.append("file", compressedBlob, file.name.replace(/\.[^/.]+$/, ext));
        formData.append("folder", selectedFolderFilter === "All" ? "Library" : selectedFolderFilter);
        
        const res = await uploadMutation.mutateAsync({ body: formData as unknown as never });
        if (res.status === 200) {
          successCount++;
        } else {
          console.error("Upload API error", res.body);
          toast.error(`Upload failed for ${file.name}: ${(res.body as { error?: string })?.error || "Unknown error"}`);
        }
      } catch (err) {
        console.error("Upload error for file", file.name, err);
        toast.error(`Upload failed for ${file.name}`);
      }
    }
    if (successCount > 0) toast.success(`Uploaded ${successCount} assets`);
  };

  const syndicateMutation = api.media.syndicate.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setSyndicateKey(null);
      setSyndicateCaption("");
      toast.success("Syndicated!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Syndication failed");
    }
  });

  const moveMutation = api.media.move.useMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success("Asset moved");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Move failed");
    }
  });

  const uniqueFolders = Array.from(new Set(assets.map((a: R2MediaItem) => a.folder))).filter(Boolean) as string[];
  const filteredAssets = selectedFolderFilter === "All" ? assets : assets.filter((a: R2MediaItem) => a.folder === selectedFolderFilter);

  return {
    assets,
    filteredAssets,
    uniqueFolders,
    isLoading,
    isError,
    selectedFolderFilter,
    setSelectedFolderFilter,
    syndicateKey,
    setSyndicateKey,
    syndicateCaption,
    setSyndicateCaption,
    deleteAsset: (key: string) => {
       if (confirm("Permanently purge this asset from R2?")) {
         deleteMutation.mutate({ params: { key }, body: {} } as unknown as never);
       }
    },
    isDeleting: deleteMutation.isPending,
    uploadAssets: bulkUpload,
    isUploading: uploadMutation.isPending,
    syndicateMutation,
    moveAsset: (key: string, newFolder: string) => moveMutation.mutate({ params: { key }, body: { folder: newFolder } } as unknown as never),
    isMoving: moveMutation.isPending
  };
}
