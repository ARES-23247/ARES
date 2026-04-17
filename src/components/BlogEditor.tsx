import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BlogEditor() {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("/gallery_1.png");
  const [errorMsg, setErrorMsg] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingInline, setIsUploadingInline] = useState(false);

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
          if (!ctx) return reject("Canvas ctx error");
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

  const editor = useEditor({
    extensions: [StarterKit, Image.configure({ inline: true, HTMLAttributes: { class: 'rounded-xl max-w-full my-4 border border-white/10 shadow-lg' } })],
    content: "<p>Start drafting your robotics article here. Tell us about your journey to Einstein...</p>",
    editorProps: {
      attributes: {
        class: "prose prose-invert lg:prose-lg max-w-none focus:outline-none min-h-[350px] text-white/80 p-6",
      },
    },
  });

  const handlePublish = async () => {
    if (!title || !editor) {
      setErrorMsg("Title and content are required.");
      return;
    }

    setIsPending(true);
    setErrorMsg("");

    try {
      const ast = editor.getJSON();

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, coverImageUrl, ast }),
      });

      const data = await res.json();

      if (data.success) {
        navigate(`/blog/${data.slug}`);
      } else {
        setErrorMsg(data.error || "Failed to publish");
      }
    } catch {
      setErrorMsg("Network error — could not reach the API.");
    } finally {
      setIsPending(false);
    }
  };

  if (!editor) return <div className="text-white/50 animate-pulse font-mono tracking-widest text-sm">Booting Editor System...</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Settings Grid */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="post-title" className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Post Title</label>
          <input
            id="post-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-ares-red/50 transition-colors lg:text-lg"
            placeholder='e.g. Our Road to State'
          />
        </div>
        <div className="flex-1">
          <label htmlFor="author-name" className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Author Name</label>
          <input
            id="author-name"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-ares-gold/50 transition-colors lg:text-lg"
            placeholder="e.g. Software Team"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="cover-asset" className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Cover Asset</label>
          <div className="flex gap-2 relative">
            <input
              id="cover-asset"
              type="text"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors lg:text-lg"
              placeholder="/gallery_2.png"
            />
            <button 
              className={`px-4 py-3 rounded-lg text-sm font-bold border border-white/10 transition-colors ${isUploadingCover ? "bg-white/20 text-white animate-pulse" : "bg-black/40 text-ares-gold hover:bg-ares-gold hover:text-black"}`}
              onClick={() => document.getElementById('cover-upload')?.click()}
            >
              UPL
            </button>
            <input 
              id="cover-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploadingCover(true);
                try {
                  const url = await uploadFile(file);
                  setCoverImageUrl(url);
                } catch(err) {
                  setErrorMsg(String(err));
                } finally {
                  setIsUploadingCover(false);
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white/5 border border-white/10 p-2 rounded-xl flex flex-wrap gap-2 items-center backdrop-blur-md sticky top-4 z-10">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${editor.isActive("bold") ? "bg-ares-red text-white shadow-lg" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>B</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-4 py-2 rounded-lg text-sm italic transition-all ${editor.isActive("italic") ? "bg-ares-gold text-white shadow-lg" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>I</button>
        <div className="w-px h-6 bg-white/10 mx-2"></div>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`px-4 py-2 rounded-lg text-sm font-black transition-all ${editor.isActive("heading", { level: 1 }) ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>H1</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${editor.isActive("heading", { level: 2 }) ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>H2</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${editor.isActive("heading", { level: 3 }) ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>H3</button>
        <div className="w-px h-6 bg-white/10 mx-2"></div>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-4 py-2 rounded-lg text-sm transition-all ${editor.isActive("bulletList") ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}>Bullet List</button>
        <div className="w-px h-6 bg-white/10 mx-2"></div>
        <button 
          className={`px-4 py-2 rounded-lg text-sm transition-all ${isUploadingInline ? "bg-white/20 text-white animate-pulse" : "text-ares-gold hover:bg-white/10 hover:text-ares-gold"}`}
          onClick={() => document.getElementById('inline-img-upload')?.click()}
        >
          Add Image
        </button>
        <input 
          id="inline-img-upload" 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setIsUploadingInline(true);
            try {
              const url = await uploadFile(file);
              editor.chain().focus().setImage({ src: url }).run();
            } catch(err) {
              setErrorMsg(String(err));
            } finally {
              setIsUploadingInline(false);
            }
          }} 
        />
      </div>

      {/* Editor */}
      <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden shadow-inner focus-within:border-white/20 transition-colors">
        <EditorContent editor={editor} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-ares-red/80 text-sm font-medium px-4">{errorMsg}</span>
        <button
          onClick={handlePublish}
          disabled={isPending}
          className={`flex items-center justify-center min-w-[200px] px-8 py-3.5 rounded-full font-black tracking-wide transition-all shadow-xl disabled:opacity-50 
            ${isPending ? "bg-white/20 text-white animate-pulse" : "bg-white text-black hover:bg-ares-gold hover:text-white hover:scale-105"}`}
        >
          {isPending ? "COMMITTING ASSET..." : "PUBLISH ENTRY"}
        </button>
      </div>
    </div>
  );
}
