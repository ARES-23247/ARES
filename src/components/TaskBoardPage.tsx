import { useState } from "react";
import { Layout } from "lucide-react";
import ProjectBoardKanban from "./command/ProjectBoardKanban";
import { TaskTableView } from "./kanban/TaskTableView";
import type { TaskItem } from "./command/ProjectBoardKanban";
import { KANBAN_SUBTEAMS } from "./command/ProjectBoardKanban";
import { api } from "../api/client";
import { useQueryClient } from "@tanstack/react-query";


interface TaskListResponse {
  status: number;
  body: { tasks: TaskItem[] };
  headers: Headers;
}

export default function TaskBoardPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // -- Queries --------------------------------------------------------
  const queryKey = ["tasks", "list", { parent_id: "null" }];
  const { data: tasksRes, isLoading: isTasksLoading } = api.tasks.list.useQuery(
    queryKey,
    { query: { parent_id: "null" } },
    { refetchInterval: 30000 }
  );

  const tasksBody = tasksRes?.status === 200 ? tasksRes.body : null;
  const tasks = tasksBody?.tasks || [];

  // -- Mutations ------------------------------------------------------
  const updateMutation = api.tasks.update.useMutation({
    onMutate: async ({ params, body }: { params: { id: string }; body: Partial<TaskItem> }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: TaskListResponse | undefined) => {
        if (!old?.body?.tasks) return old;
        const newTasks = old.body.tasks.map((task: TaskItem) =>
          task.id === params.id ? { ...task, ...body } : task
        );
        return { ...old, body: { ...old.body, tasks: newTasks } };
      });

      return { previousTasks };
    },
    onError: (_err: unknown, _vars: unknown, context: { previousTasks?: unknown } | undefined) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "list"] });
    },
  });

  const deleteMutation = api.tasks.delete.useMutation({
    onMutate: async ({ params }: { params: { id: string } }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: TaskListResponse | undefined) => {
        if (!old?.body?.tasks) return old;
        const newTasks = old.body.tasks.filter((task: TaskItem) => task.id !== params.id);
        return { ...old, body: { ...old.body, tasks: newTasks } };
      });

      return { previousTasks };
    },
    onError: (_err: unknown, _vars: unknown, context: { previousTasks?: unknown } | undefined) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "list"] });
    },
  });

  const reorderMutation = api.tasks.reorder.useMutation({
    onMutate: async ({ body }: { body: { items: { id: string; status: string; sort_order: number }[] } }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: TaskListResponse | undefined) => {
        if (!old?.body?.tasks) return old;
        const newTasks = old.body.tasks.map((task: TaskItem) => {
          const updatedItem = body.items.find((i) => i.id === task.id);
          if (updatedItem) {
            return { ...task, status: updatedItem.status, sort_order: updatedItem.sort_order };
          }
          return task;
        });
        return { ...old, body: { ...old.body, tasks: newTasks } };
      });

      return { previousTasks };
    },
    onError: (_err: unknown, _vars: unknown, context: { previousTasks?: unknown } | undefined) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", "list"] });
    },
  });

  // -- Handlers -------------------------------------------------------
  const subteams = KANBAN_SUBTEAMS;
  const [subteamFilter, setSubteamFilter] = useState<string | null>(null);

  const filteredTasks = subteamFilter 
    ? tasks.filter((t: TaskItem) => t.subteam?.toLowerCase() === subteamFilter.toLowerCase())
    : tasks;

  const handleCreateTaskWithSubteam = async (title: string) => {
    setIsCreating(true);
    try {
      const res = await api.tasks.create.mutation({
        body: { 
          title, 
          subteam: subteamFilter // Auto-assign to current sub-board if active
        }
      });
      if (res.status === 200 && res.body.success && res.body.task) {
        queryClient.setQueryData(queryKey, (old: TaskListResponse | undefined) => {
          if (!old?.body?.tasks) return old;
          return { ...old, body: { ...old.body, tasks: [res.body.task, ...old.body.tasks] } };
        });
        queryClient.invalidateQueries({ queryKey: ["tasks", "list"] });
      }
    } catch (err) {
      console.error("Create task failed:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<TaskItem>) => {
    updateMutation.mutate({ params: { id }, body: updates });
  };

  const handleDeleteTask = async (id: string) => {
    deleteMutation.mutate({ params: { id } });
  };

  const handleReorder = async (items: { id: string; status: string; sort_order: number }[]) => {
    reorderMutation.mutate({ body: { items } });
  };

  const boardContent = (
    <div className={isFullscreen ? "fixed inset-0 z-50 bg-obsidian overflow-hidden flex flex-col" : "space-y-6 flex flex-col"}>
      {/* Header */}
      <div className={`flex items-center justify-between ${isFullscreen ? "p-6 pb-2 shrink-0 border-b border-white/5 bg-obsidian" : "mb-2"}`}>
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-ares-cyan/20 to-ares-gold/20 ares-cut-sm border border-white/10">
              <Layout className="text-ares-cyan" size={24} />
            </div>
            Task Board
          </h2>
          <p className="text-marble/40 text-sm mt-1">
            Native D1-powered project management kanban
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-black/40 ares-cut-sm border border-white/10 p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === "kanban" ? "bg-ares-cyan/20 text-ares-cyan" : "text-ares-gray hover:text-white"}`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${viewMode === "table" ? "bg-ares-cyan/20 text-ares-cyan" : "text-ares-gray hover:text-white"}`}
            >
              Table
            </button>
          </div>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="px-4 py-2 bg-ares-gray-dark/50 hover:bg-white/10 text-white font-bold text-sm ares-cut-sm border border-white/10 transition-colors"
          >
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      {/* Sub Boards Filter */}
      <div className={`flex flex-wrap gap-2 ${isFullscreen ? "px-6 py-2 shrink-0 bg-obsidian/50" : "mb-6"}`}>
        <button
          onClick={() => setSubteamFilter(null)}
          className={`px-3 py-1.5 text-xs font-bold ares-cut-sm transition-all ${
            !subteamFilter ? "bg-ares-cyan text-black" : "bg-ares-gray-dark/50 text-ares-gray hover:text-white"
          }`}
        >
          All Boards
        </button>
        {subteams.map(st => (
          <button
            key={st}
            onClick={() => setSubteamFilter(st)}
            className={`px-3 py-1.5 text-xs font-bold ares-cut-sm transition-all ${
              subteamFilter === st ? "bg-ares-cyan/20 text-ares-cyan border border-ares-cyan/30" : "bg-ares-gray-dark/50 text-ares-gray border border-white/5 hover:text-white"
            }`}
          >
            {st}
          </button>
        ))}
      </div>
      {/* Main Board Content */}
      <div className={`flex-1 relative ${isFullscreen ? "px-6 pb-6 overflow-hidden flex flex-col" : "min-h-[600px]"}`}>
        {viewMode === "kanban" ? (
          <ProjectBoardKanban
            tasks={filteredTasks}
            isLoading={isTasksLoading}
            onCreateTask={handleCreateTaskWithSubteam}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onReorder={handleReorder}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["tasks", "list"] })}
            isCreating={isCreating}
          />
        ) : (
          <TaskTableView 
            tasks={filteredTasks}
            onRowClick={(task) => {
              // Future: Open task details modal when clicking a row
              console.log("Row clicked:", task.id);
            }}
          />
        )}
      </div>
    </div>
  );

  // Bypass Liveblocks realtime connections during E2E testing
  const isE2E = typeof window !== "undefined" && "__PLAYWRIGHT_TEST__" in window;
  if (isE2E) {
    return boardContent;
  }

  // TODO: Add PartySocket room connection for awareness
  return boardContent;
}
