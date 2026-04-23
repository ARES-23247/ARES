import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useRichEditor } from "./editor/useRichEditor";
import RichEditorToolbar from "./editor/RichEditorToolbar";
import AssetPickerModal from "./AssetPickerModal";
import { DEFAULT_COVER_IMAGE } from "../utils/constants";
import { useImageUpload } from "../hooks/useImageUpload";
import { useEntityFetch } from "../hooks/useEntityFetch";
import { adminApi } from "../api/adminApi";
import CoverAssetPicker from "./editor/CoverAssetPicker";
import EditorFooter from "./editor/EditorFooter";

interface SeasonData {
  id: string;
  challenge_name: string;
  robot_name?: string;
  robot_image?: string;
  robot_description?: string;
  robot_cad_url?: string;
  summary?: string;
  start_date?: string;
  end_date?: string;
  status: "published" | "draft";
}

export default function SeasonEditor() {
  const { editId } = useParams<{ editId?: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const { uploadFile, isUploading: isUploadingCover } = useImageUpload();

  // Local State
  const [isPending, setIsPending] = useState(false);
  const [seasonId, setSeasonId] = useState(""); // e.g. 2025-2026
  const [challengeName, setChallengeName] = useState("");
  const [robotName, setRobotName] = useState("");
  const [robotImageUrl, setRobotImageUrl] = useState(DEFAULT_COVER_IMAGE);
  const [cadUrl, setCadUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

  const editor = useRichEditor({ placeholder: "<p>Describe the robot's design, mechanisms, and season highlights...</p>" });

  useEntityFetch<{ season?: SeasonData }>(
    editId ? `/api/admin/seasons/${editId}` : null, // Assuming a detail endpoint
    (data) => {
      if (data?.season) {
        setSeasonId(data.season.id);
        setChallengeName(data.season.challenge_name);
        setRobotName(data.season.robot_name || "");
        setRobotImageUrl(data.season.robot_image || DEFAULT_COVER_IMAGE);
        setCadUrl(data.season.robot_cad_url || "");
        setSummary(data.season.summary || "");
        setStartDate(data.season.start_date || "");
        setEndDate(data.season.end_date || "");
        if (editor && data.season.robot_description) {
          try {
            editor.commands.setContent(JSON.parse(data.season.robot_description));
          } catch (e) {
            console.error("Failed to parse existing AST", e);
          }
        }
      }
    }
  );

  const handleSave = async (isDraft: boolean = false) => {
    if (!seasonId || !challengeName) {
      setErrorMsg("Season ID (e.g. 2025-2026) and Challenge Name are required.");
      return;
    }

    setIsPending(true);
    setErrorMsg("");

    try {
      const robot_description = editor ? JSON.stringify(editor.getJSON()) : null;
      
      const payload = {
        id: seasonId,
        challenge_name: challengeName,
        robot_name: robotName,
        robot_image: robotImageUrl === DEFAULT_COVER_IMAGE ? null : robotImageUrl,
        robot_description,
        robot_cad_url: cadUrl,
        summary,
        start_date: startDate,
        end_date: endDate,
        status: isDraft ? "draft" : "published"
      };

      await adminApi.request("/api/admin/seasons", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      toast.success(`Season ${seasonId} saved successfully.`);
      queryClient.invalidateQueries({ queryKey: ["admin-seasons"] });
      queryClient.invalidateQueries({ queryKey: ["seasons"] });
      navigate("/dashboard/manage_seasons");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to save season.");
    } finally {
      setIsPending(false);
    }
  };

  if (!editor) return <div className="text-marble/80 animate-pulse font-mono tracking-widest text-sm">Booting Legacy Systems...</div>;

  return (
    <div className="flex flex-col gap-6 w-full relative">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tighter italic mb-2 uppercase">
          {editId ? "Update Legacy" : "Forge New Legacy"}
        </h2>
        <p className="text-marble/40 text-sm font-bold uppercase tracking-widest">
          Documenting the evolution of ARES 23247.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        <div className="space-y-4">
          <div>
            <label htmlFor="season-id" className="block text-[10px] font-black text-ares-gold uppercase tracking-[0.2em] mb-2">Season ID</label>
            <input
              id="season-id"
              type="text"
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              disabled={!!editId}
              className="w-full bg-black border border-white/10 ares-cut-sm px-4 py-3 text-marble placeholder-marble/30 focus:ring-1 focus:ring-ares-gold transition-all"
              placeholder='e.g. 2025-2026'
            />
          </div>
          <div>
            <label htmlFor="challenge-name" className="block text-[10px] font-black text-ares-gold uppercase tracking-[0.2em] mb-2">Challenge Name</label>
            <input
              id="challenge-name"
              type="text"
              value={challengeName}
              onChange={(e) => setChallengeName(e.target.value)}
              className="w-full bg-black border border-white/10 ares-cut-sm px-4 py-3 text-marble placeholder-marble/30 focus:ring-1 focus:ring-ares-gold transition-all"
              placeholder='e.g. CENTERSTAGE'
            />
          </div>
        </div>

        <div>
          <span className="block text-[10px] font-black text-ares-gold uppercase tracking-[0.2em] mb-2">Robot / Season Cover</span>
          <CoverAssetPicker 
            coverImage={robotImageUrl}
            isUploading={isUploadingCover}
            onLibraryClick={() => setIsImagePickerOpen(true)}
            onUrlChange={setRobotImageUrl}
            onFileChange={async (file) => {
              const { url } = await uploadFile(file);
              setRobotImageUrl(url);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="robot-name" className="block text-[10px] font-black text-marble/40 uppercase tracking-[0.2em] mb-2">Robot Name</label>
          <input
            id="robot-name"
            type="text"
            value={robotName}
            onChange={(e) => setRobotName(e.target.value)}
            className="w-full bg-black border border-white/10 ares-cut-sm px-4 py-3 text-marble placeholder-marble/30"
            placeholder='e.g. ARES-1'
          />
        </div>
        <div>
          <label htmlFor="cad-link" className="block text-[10px] font-black text-marble/40 uppercase tracking-[0.2em] mb-2">CAD Link</label>
          <input
            id="cad-link"
            type="text"
            value={cadUrl}
            onChange={(e) => setCadUrl(e.target.value)}
            className="w-full bg-black border border-white/10 ares-cut-sm px-4 py-3 text-marble placeholder-marble/30"
            placeholder='https://onshape.com/...'
          />
        </div>
        <div className="flex gap-2">
            <div className="flex-1">
                <label htmlFor="start-date" className="block text-[10px] font-black text-marble/40 uppercase tracking-[0.2em] mb-2">Start Date</label>
                <input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-black border border-white/10 ares-cut-sm px-4 py-3 text-marble [&::-webkit-calendar-picker-indicator]:invert" />
            </div>
            <div className="flex-1">
                <label htmlFor="end-date" className="block text-[10px] font-black text-marble/40 uppercase tracking-[0.2em] mb-2">End Date</label>
                <input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-black border border-white/10 ares-cut-sm px-4 py-3 text-marble [&::-webkit-calendar-picker-indicator]:invert" />
            </div>
        </div>
      </div>

      <div>
        <label htmlFor="summary" className="block text-[10px] font-black text-marble/40 uppercase tracking-[0.2em] mb-2">Brief Summary</label>
        <textarea
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full bg-black border border-white/10 ares-cut-sm px-4 py-3 text-marble h-20"
          placeholder="One sentence summary of the season's legacy..."
        />
      </div>

      <div className="space-y-2">
        <span className="block text-[10px] font-black text-ares-gold uppercase tracking-[0.2em]">Robot Design & Season Highlights</span>
        <RichEditorToolbar editor={editor} documentTitle={challengeName} />
      </div>

      <AssetPickerModal 
        isOpen={isImagePickerOpen}
        onClose={() => setIsImagePickerOpen(false)}
        onSelect={(url) => {
          setRobotImageUrl(url);
          setIsImagePickerOpen(false);
        }}
      />

      <EditorFooter 
        errorMsg={errorMsg}
        isPending={isPending}
        isEditing={!!editId}
        onDelete={() => {}} // Handle delete if needed
        onSaveDraft={() => handleSave(true)}
        onPublish={() => handleSave(false)}
        updateText="UPDATE LEGACY"
        publishText="ESTABLISH LEGACY"
        roundedClass="ares-cut"
      />
    </div>
  );
}
