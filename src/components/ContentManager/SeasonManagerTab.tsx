import { History } from "lucide-react";
import DashboardEmptyState from "../dashboard/DashboardEmptyState";
import { useQuery } from "@tanstack/react-query";
import { useContentMutation } from "../../hooks/useContentMutation";
import { ViewType, ClickToDeleteButton } from "./shared";
import { adminApi } from "../../api/adminApi";

interface SeasonItem {
  id: string;
  challenge_name: string;
  robot_name?: string;
  status: string;
  is_deleted: number;
}

interface SeasonManagerTabProps {
  view: ViewType;
  onEditSeason?: (id: string) => void;
  confirmId: string | null;
  setConfirmId: (id: string | null) => void;
  restoreMutation: any;
  purgeMutation: any;
}

export default function SeasonManagerTab({
  view,
  onEditSeason,
  confirmId,
  setConfirmId,
  restoreMutation,
  purgeMutation
}: SeasonManagerTabProps) {
  const { data: seasons = [], isLoading } = useQuery<SeasonItem[]>({
    queryKey: ["admin-seasons"],
    queryFn: async () => {
      const data = await adminApi.get<{ seasons?: SeasonItem[] }>("/api/admin/seasons");
      return data.seasons ?? [];
    },
  });

  const deleteSeasonMutation = useContentMutation<string>({
    endpoint: (id) => `/api/admin/seasons/${id}`,
    invalidateKeys: ["admin-seasons", "seasons"],
    setConfirmId,
  });

  if (isLoading) return <div className="h-32 flex items-center justify-center"><div className="w-6 h-6 border-2 border-white/10 border-t-ares-gold rounded-full animate-spin"></div></div>;

  const filtered = seasons.filter(s => {
    const isDeleted = Number(s.is_deleted) === 1;
    if (view === 'trash') return isDeleted;
    if (view === 'pending') return !isDeleted && s.status === 'draft';
    return !isDeleted && s.status === 'published';
  });

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <h3 className={`font-bold uppercase tracking-widest text-xs ${view === 'trash' ? 'text-ares-red' : view === 'pending' ? 'text-ares-gold' : 'text-ares-gold'}`}>
          {view === 'trash' ? 'Trashed Legacies' : view === 'pending' ? 'Draft Legacies' : 'Active Legacies'}
        </h3>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto flex-1 min-h-0 pr-2 custom-scrollbar">
        {filtered.length === 0 ? (
          <DashboardEmptyState
            className="text-marble/50 text-xs italic py-8 text-center border border-dashed border-white/5 ares-cut-sm"
            icon={<History size={24} />}
            message={`No ${view} seasons found.`}
          />
        ) : (
          filtered.map((season) => (
            <div key={season.id} className={`bg-black/40 border ${Number(season.is_deleted) === 1 ? 'border-ares-red/30 bg-ares-red/[0.02]' : 'border-white/10'} ares-cut-sm p-4 flex flex-col justify-between gap-4 hover:border-ares-gold/20 transition-colors`}>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-marble/90 truncate flex items-center gap-2">
                  {season.id} - {season.challenge_name}
                  {Number(season.is_deleted) === 1 && <span className="text-[9px] font-bold text-ares-red bg-ares-red/10 border border-ares-red/20 px-1.5 py-0.5 rounded uppercase tracking-wider">Deleted</span>}
                  {season.status === 'draft' && <span className="text-[9px] font-bold text-ares-gold bg-ares-gold/10 border border-ares-gold/20 px-1.5 py-0.5 rounded uppercase tracking-wider">Draft</span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-marble/40 bg-obsidian border border-white/10 px-2 py-0.5 ares-cut-sm uppercase tracking-widest">{season.robot_name || 'No Robot Assigned'}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                {Number(season.is_deleted) !== 1 ? (
                  <>
                    <button
                      onClick={() => onEditSeason && onEditSeason(season.id)}
                      className="text-xs font-bold text-marble/40 hover:text-ares-gold bg-white/5 hover:bg-white/10 px-3 py-1 ares-cut-sm transition-colors"
                    >
                      EDIT
                    </button>
                    <ClickToDeleteButton 
                      id={season.id} 
                      onDelete={() => deleteSeasonMutation.mutate(season.id)} 
                      isDeleting={deleteSeasonMutation.isPending && deleteSeasonMutation.variables === season.id} 
                      confirmId={confirmId}
                      setConfirmId={setConfirmId}
                    />
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => restoreMutation.mutate({ type: 'season', id: season.id })}
                      disabled={restoreMutation.isPending}
                      className="text-xs font-bold text-ares-gold bg-ares-gold/10 hover:bg-ares-gold/20 px-3 py-1 ares-cut-sm transition-colors"
                    >
                      {restoreMutation.isPending && restoreMutation.variables?.id === season.id ? "RESTORING..." : "RESTORE"}
                    </button>
                    <ClickToDeleteButton 
                      id={`purge-${season.id}`} 
                      onDelete={() => purgeMutation.mutate({ type: 'season', id: season.id })} 
                      isDeleting={purgeMutation.isPending && purgeMutation.variables?.id === season.id} 
                      confirmId={confirmId}
                      setConfirmId={setConfirmId}
                    />
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
