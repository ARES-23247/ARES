import { useState } from "react";

export default function EventEditor() {
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    dateStart: "",
    dateEnd: "",
    location: "",
    description: "",
    coverImage: "/gallery_2.png",
  });

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1920;
          let width = img.width;
          let height = img.height;
  
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
  
          canvas.width = width;
          canvas.height = height;
  
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas context error");
          ctx.drawImage(img, 0, 0, width, height);
  
          canvas.toBlob((blob) => blob ? resolve(blob) : reject("Blob error"), "image/webp", 0.8);
        };
        img.onerror = () => reject("Image load error");
      };
      reader.onerror = () => reject("Reader error");
    });
  };

  const uploadFile = async (file: File): Promise<string> => {
    const compressedBlob = await compressImage(file);
    const formData = new FormData();
    formData.append("file", compressedBlob, file.name.replace(/\.[^/.]+$/, ".webp"));
    
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!data.url) throw new Error(data.error || "Upload failed");
    return data.url;
  };

  const handlePublish = async () => {
    if (!form.title || !form.dateStart) {
      setErrorMsg("Title and Start Date are required.");
      return;
    }

    setIsPending(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const id = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
      const payload = { ...form, id };

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMsg("Event published successfully!");
        setForm({ title: "", dateStart: "", dateEnd: "", location: "", description: "", coverImage: "" });
      } else {
        setErrorMsg(data.error || "Failed to publish event");
      }
    } catch {
      setErrorMsg("Network error — could not reach the API.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-black text-white">Publish Event</h2>
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-[2]">
          <label htmlFor="event-title" className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Event Title *</label>
          <input
            id="event-title" type="text"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-ares-red/50 transition-colors"
            placeholder="State Championship"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="event-location" className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Location</label>
          <input
            id="event-location" type="text"
            value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-ares-gold/50 transition-colors"
            placeholder="Fairmont State University"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="event-start" className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Start Date & Time *</label>
          <input
            id="event-start" type="datetime-local"
            value={form.dateStart} onChange={(e) => setForm({ ...form, dateStart: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-white/30 transition-colors [&::-webkit-calendar-picker-indicator]:invert"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="event-end" className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">End Date & Time</label>
          <input
            id="event-end" type="datetime-local"
            value={form.dateEnd} onChange={(e) => setForm({ ...form, dateEnd: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-white/30 transition-colors [&::-webkit-calendar-picker-indicator]:invert"
          />
        </div>
      </div>

      <div>
        <label htmlFor="event-desc" className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Description</label>
        <textarea
          id="event-desc" rows={4}
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-white/30 transition-colors"
          placeholder="Come join us at our pit to see the newest autonomous capabilities..."
        />
      </div>

      <div>
        <label htmlFor="event-cover" className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Cover Asset</label>
        <div className="flex gap-2">
          <input
            id="event-cover" type="text"
            value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-white/30 transition-colors"
            placeholder="/gallery_2.png"
          />
          <button 
            className={`px-6 py-3 rounded-lg text-sm font-bold border border-white/10 transition-colors ${isUploading ? "bg-white/20 animate-pulse text-white" : "bg-black/40 text-ares-gold hover:bg-ares-gold hover:text-black"}`}
            onClick={() => document.getElementById('event-img-upload')?.click()}
          >
            UPL
          </button>
          <input 
            id="event-img-upload" type="file" accept="image/*" className="hidden" 
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setIsUploading(true);
              try {
                const url = await uploadFile(file);
                setForm({ ...form, coverImage: url });
              } catch(err) {
                setErrorMsg(String(err));
              } finally {
                setIsUploading(false);
              }
            }} 
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-ares-red/80 text-sm font-medium">{errorMsg}</span>
        <span className="text-emerald-400 text-sm font-medium">{successMsg}</span>
        <button
          onClick={handlePublish}
          disabled={isPending}
          className={`px-8 py-3.5 rounded-full font-black tracking-wide transition-all shadow-xl disabled:opacity-50 
            ${isPending ? "bg-white/20 text-white animate-pulse" : "bg-white text-black hover:bg-ares-gold hover:text-white"}`}
        >
          {isPending ? "CREATING..." : "PUBLISH EVENT"}
        </button>
      </div>
    </div>
  );
}
