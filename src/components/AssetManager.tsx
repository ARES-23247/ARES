import { useState, useEffect } from "react";

interface R2Asset {
  key: string;
  size: number;
  uploaded: string;
  url: string;
}

export default function AssetManager() {
  const [assets, setAssets] = useState<R2Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchAssets = async () => {
      try {
        const res = await fetch("/api/media");
        const data = await res.json();
        if (!cancelled) setAssets(data.assets ?? []);
      } catch (err) {
        console.error("Failed to load assets", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchAssets();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const refetch = () => setRefreshKey((k) => k + 1);

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_W = 1920;
          let w = img.width, h = img.height;
          if (w > MAX_W) { h = Math.round(h * MAX_W / w); w = MAX_W; }
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas ctx error");
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob((blob) => blob ? resolve(blob) : reject("Blob error"), "image/webp", 0.8);
        };
        img.onerror = () => reject("Image load error");
      };
      reader.onerror = () => reject("Reader error");
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed, file.name.replace(/\.[^/.]+$/, ".webp"));
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        refetch();
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (key: string) => {
    setDeletingKey(key);
    try {
      const res = await fetch(`/api/media/${key}`, { method: "DELETE" });
      if (res.ok) {
        setAssets((prev) => prev.filter((a) => a.key !== key));
        setConfirmKey(null);
      }
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setDeletingKey(null);
    }
  };

  const copyUrl = (url: string, key: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tighter">Asset Vault</h2>
          <p className="text-zinc-400 text-sm mt-1">
            Manage images stored in the Cloudflare R2 bucket. {assets.length} asset{assets.length !== 1 && "s"} total.
          </p>
        </div>
        <div>
          <label
            htmlFor="asset-upload-input"
            className={`px-6 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs cursor-pointer transition-all focus-within:ring-2 focus-within:ring-ares-gold ${
              isUploading
                ? "bg-zinc-800 text-zinc-400 animate-pulse pointer-events-none"
                : "bg-ares-gold text-obsidian hover:bg-ares-gold/80 shadow-lg"
            }`}
          >
            {isUploading ? "Uploading..." : "Upload Asset"}
            <input
              id="asset-upload-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 md:w-12 md:h-12 border-4 border-zinc-800 border-t-ares-gold rounded-full animate-spin"></div>
        </div>
      ) : assets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-[300px]">
          <p className="text-zinc-400 text-sm italic">No assets found in R2. Upload an image to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto max-h-[600px] pr-2">
          {assets.map((asset) => (
            <div
              key={asset.key}
              className="group relative bg-black/40 border border-zinc-800/60 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors flex flex-col"
            >
              {/* Thumbnail */}
              <div className="relative aspect-square bg-zinc-900">
                <img
                  src={asset.url}
                  alt={asset.key}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => copyUrl(asset.url, asset.key)}
                    className="px-3 py-1.5 bg-white text-obsidian text-xs font-bold rounded-lg hover:bg-ares-gold transition-colors"
                  >
                    {copiedKey === asset.key ? "Copied!" : "Copy URL"}
                  </button>
                  {confirmKey === asset.key ? (
                    <button
                      onClick={() => handleDelete(asset.key)}
                      disabled={deletingKey === asset.key}
                      className="px-3 py-1.5 bg-ares-red text-white text-xs font-bold rounded-lg animate-pulse shadow-[0_0_10px_rgba(192,0,0,0.5)]"
                    >
                      {deletingKey === asset.key ? "..." : "Confirm"}
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmKey(asset.key)}
                      className="px-3 py-1.5 bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg hover:bg-ares-red hover:text-white transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Info strip */}
              <div className="p-2 flex flex-col gap-0.5">
                <p className="text-zinc-300 text-[10px] font-bold truncate" title={asset.key}>
                  {asset.key}
                </p>
                <p className="text-zinc-500 text-[10px]">
                  {formatSize(asset.size)} · {new Date(asset.uploaded).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
