export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    credentials: "include",
  });
  
  if (!res.ok && res.status !== 207) {
    let errorMessage = `API Error [${res.status}]: ${res.statusText || "Unknown error"}`;
    try {
      const errorData = await res.json() as Record<string, unknown>;
      if (errorData.error) {
        let errStr = "";
        if (typeof errorData.error === "string") {
          errStr = errorData.error;
        } else if (typeof errorData.error === "object" && errorData.error !== null) {
          const errObj = errorData.error as Record<string, unknown>;
          if (Array.isArray(errObj.issues)) {
            errStr = errObj.issues.map((i: unknown) => {
              const issue = i as { path?: string[]; message?: string };
              return `${issue.path ? issue.path.join('.') + ': ' : ''}${issue.message}`;
            }).join(", ");
          } else if (typeof errObj.message === "string") {
            errStr = errObj.message;
          } else {
            errStr = JSON.stringify(errObj);
          }
        }
        errorMessage = errStr + (errorData.details ? `: ${errorData.details}` : "");
      } else if (typeof errorData.message === "string") {
        errorMessage = errorData.message;
      }
    } catch {
      try {
        const text = await res.text();
        if (text) errorMessage += ` - ${text.substring(0, 100)}`;
      } catch { /* ignore */ }
    }
    
    const err = new Error(errorMessage) as Error & { status?: number; url?: string };
    err.status = res.status;
    err.url = url;
    throw err;
  }
  
  return res.json() as Promise<T>;
}
