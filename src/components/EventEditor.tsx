import { useState, useEffect } from "react";

export default function EventEditor({ editId, onClearEdit }: { editId?: string | null; onClearEdit?: () => void }) {
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

  useEffect(() => {
    if (!editId) return;
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${editId}`);
        const data = await res.json();
        if (data.event) {
          setForm({
            title: data.event.title || "",
            dateStart: data.event.date_start || "",
            dateEnd: data.event.date_end || "",
            location: data.event.location || "",
            description: data.event.description || "",
            coverImage: data.event.cover_image || "/gallery_2.png",
          });
        }
      } catch (err) {
        console.error("Failed to load event for editing", err);
      }
    };
    fetchEvent();
  }, [editId]);

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

      const method = editId ? "PUT" : "POST";
      const url = editId ? `/api/events/${editId}` : "/api/events";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMsg(editId ? "Event updated successfully!" : "Event published successfully!");
        if (onClearEdit) onClearEdit();
        if (!editId) {
          setForm({ title: "", dateStart: "", dateEnd: "", location: "", description: "", coverImage: "/gallery_2.png" });
        }
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
    <div className="flex flex-col gap-6 w-full relative">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tight mb-2">
          {editId ? "Edit Event" : "Publish Event"}
        </h2>
        <p className="text-zinc-400 text-sm">
          {editId ? "Update existing competition or outreach details." : "Add upcoming competitions or outreach events to the portal."}
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mt-2">
        <div className="flex-[2]">
          <label htmlFor="event-title" className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Event Title *</label>
          <input
            id="event-title" type="text"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:border-ares-red focus:outline-none focus:ring-1 focus:ring-ares-red transition-all shadow-inner"
            placeholder="State Championship"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="event-location" className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Location</label>
          <input
            id="event-location" type="text"
            value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:border-ares-red focus:outline-none focus:ring-1 focus:ring-ares-red transition-all shadow-inner"
            placeholder="Fairmont State University"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="event-start" className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Start Date & Time *</label>
          <input
            id="event-start" type="datetime-local"
            value={form.dateStart} onChange={(e) => setForm({ ...form, dateStart: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:border-ares-red focus:outline-none focus:ring-1 focus:ring-ares-red transition-all shadow-inner [&::-webkit-calendar-picker-indicator]:invert"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="event-end" className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">End Date & Time</label>
          <input
            id="event-end" type="datetime-local"
            value={form.dateEnd} onChange={(e) => setForm({ ...form, dateEnd: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:border-ares-red focus:outline-none focus:ring-1 focus:ring-ares-red transition-all shadow-inner [&::-webkit-calendar-picker-indicator]:invert"
          />
        </div>
      </div>

      <div>
        <label htmlFor="event-desc" className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Description</label>
        <textarea
          id="event-desc" rows={4}
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:border-ares-red focus:outline-none focus:ring-1 focus:ring-ares-red transition-all shadow-inner resize-y min-h-[120px]"
          placeholder="Come join us at our pit to see the newest autonomous capabilities..."
        />
      </div>

      <div>
        <label htmlFor="event-cover" className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Cover Asset</label>
        <div className="flex gap-2">
          <input
            id="event-cover" type="text"
            value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:border-ares-red focus:outline-none focus:ring-1 focus:ring-ares-red transition-all shadow-inner"
            placeholder="/gallery_2.png"
          />
          <button 
            className={`px-6 py-3 rounded-lg text-sm font-bold border border-zinc-700 transition-all focus:outline-none focus:ring-2 focus:ring-ares-red ring-offset-2 ring-offset-zinc-900 ${isUploading ? "bg-zinc-800 animate-pulse text-zinc-500" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"}`}
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

      <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-800">
        <div className="flex flex-col">
          <span className="text-ares-red text-sm font-medium">{errorMsg}</span>
          <span className="text-emerald-500 text-sm font-medium">{successMsg}</span>
        </div>
        <button
          onClick={handlePublish}
          disabled={isPending}
          className={`px-8 py-3.5 rounded-full font-black tracking-wide transition-all shadow-xl disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ares-red ring-offset-2 ring-offset-zinc-900
            ${isPending ? "bg-zinc-800 text-zinc-500 animate-pulse" : "bg-white text-zinc-950 hover:bg-ares-red hover:text-white hover:-translate-y-0.5"}`}
        >
          {isPending ? "COMMITTING..." : editId ? "UPDATE EVENT" : "PUBLISH EVENT"}
        </button>
      </div>
    </div>
  );
}
