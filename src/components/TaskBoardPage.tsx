import { useState } from "react";
import { Layout } from "lucide-react";
import ProjectBoardKanban from "./command/ProjectBoardKanban";
import { api } from "../api/client";
import { useQueryClient } from "@tanstack/react-query";

export default function TaskBoardPage() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  // -- Queries --------------------------------------------------------
  const queryKey = api.tasks.list.queryKey(["command-tasks"], {});
  const { data: tasksRes, isLoading: isTasksLoading } = api.tasks.list.useQuery(
    queryKey,
    {},
    { refetchInterval: 30000 }
  );

  const tasksBody = tasksRes?.status === 200 ? tasksRes.body : null;
  const tasks = tasksBody?.tasks || [];

  // -- Mutations ------------------------------------------------------
  const updateMutation = api.tasks.update.useMutation({
    onMutate: async ({ params, body }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.body?.tasks) return old;
        const newTasks = old.body.tasks.map((task: any) =>
          task.id === params.id ? { ...task, ...body } : task
        );
        return { ...old, body: { ...old.body, tasks: newTasks } };
      });

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = api.tasks.delete.useMutation({
    onMutate: async ({ params }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.body?.tasks) return old;
        const newTasks = old.body.tasks.filter((task: any) => task.id !== params.id);
        return { ...old, body: { ...old.body, tasks: newTasks } };
      });

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const reorderMutation = api.tasks.reorder.useMutation({
    onMutate: async ({ body }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old?.body?.tasks) return old;
        const newTasks = old.body.tasks.map((task: any) => {
          const updatedItem = body.items.find((i: any) => i.id === task.id);
          if (updatedItem) {
            return { ...task, status: updatedItem.status, sort_order: updatedItem.sort_order };
          }
          return task;
        });
        return { ...old, body: { ...old.body, tasks: newTasks } };
      });

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(queryKey, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // -- Handlers -------------------------------------------------------
  const handleCreateTask = async (title: string) => {
    setIsCreating(true);
    try {
      const res = await api.tasks.create.mutation({
        body: { title }
      });
      if (res.status === 200 && res.body.success) {
        queryClient.invalidateQueries({ queryKey });
      }
    } catch (err) {
      console.error("Create task failed:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateTask = async (id: string, updates: any) => {
    updateMutation.mutate({ params: { id }, body: updates });
  };

  const handleDeleteTask = async (id: string) => {
    deleteMutation.mutate({ params: { id } });
  };

  const handleReorder = async (items: any[]) => {
    reorderMutation.mutate({ body: { items } });
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
