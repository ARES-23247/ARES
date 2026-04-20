import { useMutation, useQueryClient } from "@tanstack/react-query";

type HttpMethod = "DELETE" | "POST" | "PATCH" | "PUT";

interface UseContentMutationOptions<TVariables = string> {
  /** Build the endpoint URL from the mutation variables. */
  endpoint: (vars: TVariables) => string;
  /** HTTP method. Defaults to DELETE. */
  method?: HttpMethod;
  /** React-Query cache key(s) to invalidate on success. */
  invalidateKeys: string[];
  /** Optional JSON body builder — if omitted, no body is sent. */
  body?: (vars: TVariables) => unknown;
  /** Optional success callback (receives response data). */
  onSuccess?: (data: unknown) => void;
  /** Whether to clear the confirm dialog on success. Defaults to true. */
  clearConfirm?: boolean;
  /** Setter to clear confirmId state. */
  setConfirmId?: (id: string | null) => void;
}

/**
 * Generic hook for content mutation actions (delete, restore, purge, sort, sync).
 * Eliminates ~120 lines of duplicated useMutation boilerplate in ContentManager.
 */
export function useContentMutation<TVariables = string>(opts: UseContentMutationOptions<TVariables>) {
  const queryClient = useQueryClient();
  const {
    endpoint,
    method = "DELETE",
    invalidateKeys,
    body,
    onSuccess,
    clearConfirm = true,
    setConfirmId,
  } = opts;

  return useMutation({
    mutationFn: async (vars: TVariables) => {
      const fetchOpts: RequestInit = {
        method,
        credentials: "include",
      };
      if (body) {
        fetchOpts.headers = { "Content-Type": "application/json" };
        fetchOpts.body = JSON.stringify(body(vars));
      }
      const res = await fetch(endpoint(vars), fetchOpts);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `Operation failed. Status: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      if (clearConfirm && setConfirmId) {
        setConfirmId(null);
      }
      onSuccess?.(data);
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });
}
