import { useState } from "react";
import { Layout } from "lucide-react";
import ProjectBoardKanban from "./command/ProjectBoardKanban";
import { api } from "../api/client";
import { useQueryClient } from "@tanstack/react-query";

export default function TaskBoardPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  // -- Queries --------------------------------------------------------
  const { data: tasksRes, isLoading: isTasksLoading } = api.tasks.list.useQuery(
    ["command-tasks"],
    {},
    { refetchInterval: 30000 }
  );

  const tasksBody = tasksRes?.status === 200 ? tasksRes.body : null;
  const tasks = tasksBody?.tasks || [];

  // -- Handlers -------------------------------------------------------
  const handleCreateTask = async (title: string) => {
    setIsCreating(true);
    try {
      const res = await api.tasks.create.mutation({
        body: { title }
      });
      if (res.status === 200 && res.body.success) {
        queryClient.invalidateQueries({ queryKey: ["command-tasks"] });
      }
    } catch (err) {
      console.error("Create task failed:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateTask = async (id: string, updates: Record<string, unknown>) => {
    try {
      await api.tasks.update.mutation({
        params: { id },
        body: updates,
      });
      queryClient.invalidateQueries({ queryKey: ["command-tasks"] });
    } catch (err) {
      console.error("Update task failed:", err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.tasks.delete.mutation({
        params: { id },
        body: null,
      });
      queryClient.invalidateQueries({ queryKey: ["command-tasks"] });
    } catch (err) {
      console.error("Delete task failed:", err);
    }
  };

  const handleReorder = async (items: { id: string; status: string; sort_order: number }[]) => {
    try {
      await api.tasks.reorder.mutation({
        body: { items },
      });
      queryClient.invalidateQueries({ queryKey: ["command-tasks"] });
    } catch (err) {
      console.error("Reorder tasks failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
      </div>

      {/* Native Task Board – Kanban View */}
      <ProjectBoardKanban
        tasks={tasks}
        isLoading={isTasksLoading}
        isCreating={isCreating}
        onCreateTask={handleCreateTask}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onReorder={handleReorder}
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ["command-tasks"] })}
      />
    </div>
  );
}
