import React, { useEffect, useState, createContext, useContext, useRef, useMemo, useCallback } from "react";
import YPartyKitProvider from "y-partykit/provider";
import * as Y from "yjs";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";

interface CollaborativeEditorContextType {
  ydoc: Y.Doc | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any | undefined;
  isCollaborative: boolean;
}

const CollaborativeEditorContext = createContext<CollaborativeEditorContextType>({
  ydoc: undefined,
  provider: undefined,
  isCollaborative: false,
});

export function useCollaborativeEditor() {
  return useContext(CollaborativeEditorContext);
}

/** Connection timeout in milliseconds before falling back to standalone mode */
const CONNECT_TIMEOUT_MS = 5000;

/**
 * Inner component that handles the PartyKit connection lifecycle.
 * Separated so the no-host path never mounts provider logic at all.
 */
function ConnectedEditorRoom({
  roomId,
  host,
  ydoc,
  children,
  onDocLoaded,
}: {
  roomId: string;
  host: string;
  ydoc: Y.Doc;
  children: React.ReactNode;
  onDocLoaded?: (ydoc: Y.Doc) => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [provider, setProvider] = useState<any>(undefined);
  const [isSynced, setIsSynced] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const newProvider = new YPartyKitProvider(host, roomId, ydoc);

    newProvider.on("synced", (synced: boolean) => {
      if (synced && timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsSynced(synced);
      setProvider(newProvider);
      if (synced) {
        onDocLoaded?.(ydoc);
      }
    });

    // Bypass sync wait in Playwright tests
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_TEST__) {
      queueMicrotask(() => {
        setIsSynced(true);
        setProvider(newProvider);
        onDocLoaded?.(ydoc);
      });
    } else {
      timeoutRef.current = setTimeout(() => {
        console.warn(`[CollaborativeEditor] PartyKit connection timed out after ${CONNECT_TIMEOUT_MS}ms for room "${roomId}". Falling back to standalone mode.`);
        setTimedOut(true);
        onDocLoaded?.(ydoc);
      }, CONNECT_TIMEOUT_MS);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      newProvider.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, host]);

  const isCollaborative = isSynced && !timedOut;

  if (!isSynced && !timedOut) {
    return (
      <div className="flex items-center justify-center py-20 bg-ares-black border-x border-b border-white/10 rounded-b-xl min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-ares-cyan" size={24} />
          <span className="text-xs text-ares-gray">Connecting to collaborative server...</span>
        </div>
      </div>
    );
  }

  return (
    <CollaborativeEditorContext.Provider value={{ ydoc, provider, isCollaborative }}>
      <div className="relative">
        <StatusBadge isCollaborative={isCollaborative} />
        {children}
      </div>
    </CollaborativeEditorContext.Provider>
  );
}

function StatusBadge({ isCollaborative }: { isCollaborative: boolean }) {
  return (
    <div className={`absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium ${
      isCollaborative
        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
    }`}>
      {isCollaborative ? (
        <><Wifi size={10} /> Live</>
      ) : (
        <><WifiOff size={10} /> Offline</>
      )}
    </div>
  );
}

export function CollaborativeEditorRoom({
  roomId,
  children,
  _initialContent,
  onDocLoaded,
}: {
  roomId: string;
  children: React.ReactNode;
  _initialContent?: string;
  onDocLoaded?: (ydoc: Y.Doc) => void;
}) {
  const [ydoc] = useState<Y.Doc>(() => new Y.Doc());
  const host = useMemo(() => import.meta.env.VITE_PARTYKIT_HOST || "", []);

  const stableOnDocLoaded = useCallback((doc: Y.Doc) => {
    onDocLoaded?.(doc);
  }, [onDocLoaded]);

  // No PartyKit host configured — render standalone immediately
  if (!host) {
    return (
      <CollaborativeEditorContext.Provider value={{ ydoc, provider: undefined, isCollaborative: false }}>
        <div className="relative">
          <StatusBadge isCollaborative={false} />
          {children}
        </div>
      </CollaborativeEditorContext.Provider>
    );
  }

  return (
    <ConnectedEditorRoom roomId={roomId} host={host} ydoc={ydoc} onDocLoaded={stableOnDocLoaded}>
      {children}
    </ConnectedEditorRoom>
  );
}
