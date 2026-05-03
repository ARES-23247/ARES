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
        console.info(`[useMedia] Processing "${file.name}" (${file.type}, ${(file.size / 1024).toFixed(1)}KB)…`);
        const { blob: compressedBlob, ext } = await compressImage(file);
        const fileName = file.name.replace(/\.[^/.]+$/, ext);
        console.info(`[useMedia] Compressed → "${fileName}" (${(compressedBlob.size / 1024).toFixed(1)}KB)`);

        const formData = new FormData();
        formData.append("file", compressedBlob, fileName);
        formData.append("folder", selectedFolderFilter === "All" ? "Library" : selectedFolderFilter);
        
        const res = await uploadMutation.mutateAsync({ body: formData as unknown as never });
        if (res.status === 200) {
          successCount++;
        } else {
          const errBody = res.body as { error?: string };
          const detail = errBody?.error || JSON.stringify(res.body);
          console.error(`[useMedia] Upload API returned ${res.status} for "${file.name}":`, res.body);
          toast.error(`"${file.name}" failed (HTTP ${res.status}): ${detail}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
        console.error(`[useMedia] Exception uploading "${file.name}":`, err);
        toast.error(`"${file.name}" failed: ${msg}`);
      }
    }
    if (successCount > 0) toast.success(`Uploaded ${successCount} asset${successCount > 1 ? "s" : ""}`);
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
         deleteMutation.mutate({ params: { key: encodeURIComponent(key) }, body: {} } as unknown as never);
       }
    },
    isDeleting: deleteMutation.isPending,
    uploadAssets: bulkUpload,
    isUploading: uploadMutation.isPending,
    syndicateMutation,
    moveAsset: (key: string, newFolder: string) => moveMutation.mutate({ params: { key: encodeURIComponent(key) }, body: { folder: newFolder } } as unknown as never),
    isMoving: moveMutation.isPending
  };
}
