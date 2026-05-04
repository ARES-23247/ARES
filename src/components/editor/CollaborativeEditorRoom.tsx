import React, { useEffect, useState, createContext, useContext } from "react";
import YPartyKitProvider from "y-partykit/provider";
import * as Y from "yjs";
import { RefreshCw } from "lucide-react";

interface CollaborativeEditorContextType {
  ydoc: Y.Doc | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any | undefined;
}

const CollaborativeEditorContext = createContext<CollaborativeEditorContextType>({
  ydoc: undefined,
  provider: undefined,
});

export function useCollaborativeEditor() {
  return useContext(CollaborativeEditorContext);
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
  const [provider, setProvider] = useState<YPartyKitProvider | null>(null);
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    // Determine host: dev vs production
    const host = import.meta.env.VITE_PARTYKIT_HOST || "localhost:1999";
    const newProvider = new YPartyKitProvider(host, roomId, ydoc);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProvider(newProvider);

    newProvider.on("synced", (synced: boolean) => {
      setIsSynced(synced);
      if (synced) {
        onDocLoaded?.(ydoc);
      }
    });

    return () => {
      newProvider.destroy();
      ydoc.destroy();
    };
  }, [roomId, ydoc, onDocLoaded]);

  if (!isSynced || !provider) {
    return (
      <div className="flex items-center justify-center py-20 bg-ares-black border-x border-b border-white/10 rounded-b-xl min-h-[400px]">
        <RefreshCw className="animate-spin text-ares-red" size={32} />
      </div>
    );
  }

  return (
    <CollaborativeEditorContext.Provider value={{ ydoc, provider }}>
      {children}
    </CollaborativeEditorContext.Provider>
  );
}
