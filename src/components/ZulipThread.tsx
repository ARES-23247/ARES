import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, RefreshCw } from 'lucide-react';

interface ZulipMessage {
  id: number;
  content: string;
  sender_email: string;
  sender_full_name: string;
  sender_id: number;
  timestamp: number;
  avatar_url: string | null;
}

interface ZulipThreadProps {
  stream: string;
  topic: string;
}

export default function ZulipThread({ stream, topic }: ZulipThreadProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['zulip-messages', stream, topic],
    queryFn: async () => {
      const res = await fetch(`/api/zulip/topic?stream=${encodeURIComponent(stream)}&topic=${encodeURIComponent(topic)}`);
      if (!res.ok) {
        if (res.status === 403) throw new Error("Bot not subscribed to this stream.");
        throw new Error("Failed to fetch messages.");
      }
      const json = await res.json() as { success: boolean, messages: ZulipMessage[] };
      return json.messages || [];
    },
    // Don't refetch on window focus to avoid spamming the Zulip API
    refetchOnWindowFocus: false,
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="my-8 border border-white/10 rounded-lg p-6 bg-black/40 glass-card animate-pulse">
        <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
          <MessageSquare className="text-ares-gray" size={20} />
          <h3 className="font-heading font-bold text-ares-gray">Zulip Thread: {topic}</h3>
        </div>
        <div className="space-y-4">
          <div className="h-16 bg-white/5 rounded w-full"></div>
          <div className="h-16 bg-white/5 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="my-8 border border-white/10 rounded-lg p-6 bg-black/40 glass-card">
        <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-4">
          <MessageSquare className="text-ares-gray" size={20} />
          <h3 className="font-heading font-bold text-ares-gray">Zulip Thread: {topic}</h3>
        </div>
        <div className="text-center py-6">
          <p className="text-ares-gray mb-4">
            {error ? (error as Error).message : "No messages found for this topic yet."}
          </p>
          <button 
            type="button"
            onClick={() => refetch()}
            className="text-xs bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded inline-flex items-center gap-2 transition-colors border border-white/10"
          >
            <RefreshCw size={14} /> Refresh Thread
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="my-8 border border-white/10 rounded-lg bg-black/40 glass-card overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <MessageSquare className="text-ares-cyan" size={20} />
          <h3 className="font-heading font-bold text-white">Zulip Discussion: {topic}</h3>
          <span className="bg-ares-cyan/20 text-ares-cyan text-xs font-bold px-2 py-0.5 rounded-full">
            {data.length}
          </span>
        </div>
        <button 
          type="button"
          onClick={() => refetch()}
          className="text-ares-gray hover:text-white transition-colors"
          title="Refresh Messages"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      
      <div className="p-4 space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar">
        {data.map((msg) => (
          <div key={msg.id} className="flex gap-4">
            <div className="flex-shrink-0">
              {msg.avatar_url ? (
                <img src={msg.avatar_url} alt={msg.sender_full_name} className="w-10 h-10 rounded-full border border-white/10" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-ares-gray flex items-center justify-center font-bold text-black">
                  {msg.sender_full_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-white">{msg.sender_full_name}</span>
                <span className="text-xs text-ares-gray">{new Date(msg.timestamp * 1000).toLocaleString()}</span>
              </div>
              <div 
                className="prose prose-sm prose-invert max-w-none text-marble/80 prose-p:my-1 prose-a:text-ares-cyan prose-a:no-underline hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: msg.content }} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
