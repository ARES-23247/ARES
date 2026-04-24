import { useState, useEffect } from "react";
import { fetchJson } from "../api/client";

export function useEntityFetch<T>(endpoint: string | null, onSuccess?: (data: T) => void) {
  const [data, setData] = useState<T | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!endpoint) {
      setTimeout(() => setData(null), 0);
      return;
    }

    const fetchData = async () => {
      setIsPending(true);
      setError("");
      try {
        const json = await fetchJson<T>(endpoint);
        setData(json);
        if (onSuccess) onSuccess(json);
      } catch (err) {
        console.error("Failed to fetch entity", err);
        setError(String(err));
      } finally {
        setIsPending(false);
      }
    };

    fetchData();
  }, [endpoint]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, isPending, error };
}
