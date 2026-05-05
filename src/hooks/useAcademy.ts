import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { trackPageView } from "../utils/analytics";

export interface DocRecord {
  slug: string;
  title: string;
  category: string;
  sort_order: number;
  description: string;
  content?: string;
  updated_at?: string;
  snippet?: string;
  cf_email?: string;
  original_author_nickname?: string;
  original_author_avatar?: string;
  display_in_areslib?: number;
  display_in_math_corner?: number;
  display_in_science_corner?: number;
}

export interface Contributor {
  author_email: string;
  nickname?: string;
  avatar?: string;
}

export interface SearchResult {
  slug: string;
  title: string;
  category: string;
  snippet: string;
}

const ACADEMY_SIDEBAR_ORDER = [
  "AI 101",
  "Neural Networks",
  "Machine Vision",
  "Reinforcement Learning",
  "Generative AI",
  "Physics",
  "Mathematics"
];

export function useAcademy(slug: string | undefined) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [feedbackToken, setFeedbackToken] = useState("");

  const { data: allDocsRes } = api.docs.getDocs.useQuery(["docs-list"], {});
  const allDocs = useMemo(() => {
    if (allDocsRes?.status !== 200) return [];
    return allDocsRes.body.docs.filter((doc: DocRecord) => doc.display_in_math_corner === 1 || doc.display_in_science_corner === 1);
  }, [allDocsRes]);

  const ObjectQuery = api.docs.getDoc.useQuery(
    ["doc", slug],
    { params: { slug: slug || "" } },
    { enabled: !!slug }
  );

  const currentDoc = ObjectQuery.data?.status === 200 ? ObjectQuery.data.body.doc : undefined;
  const contributors = ObjectQuery.data?.status === 200 ? ObjectQuery.data.body.contributors : [];
  const docLoading = ObjectQuery.isLoading;

  const { data: searchRes } = api.docs.searchDocs.useQuery(
    ["docs-search", searchQuery],
    { query: { q: searchQuery } },
    { enabled: searchQuery.length >= 2 }
  );
  const searchResults = searchRes?.status === 200 ? searchRes.body.results : [];

  const groupedDocs = useMemo(() => {
    const groups: Record<string, DocRecord[]> = {};
    for (const doc of allDocs) {
      if (!groups[doc.category]) groups[doc.category] = [];
      groups[doc.category].push(doc);
    }
    const ordered: [string, DocRecord[]][] = [];
    for (const cat of ACADEMY_SIDEBAR_ORDER) {
      if (groups[cat]) ordered.push([cat, groups[cat]]);
    }
    for (const [cat, docs] of Object.entries(groups)) {
      if (!ACADEMY_SIDEBAR_ORDER.includes(cat)) ordered.push([cat, docs]);
    }
    return ordered;
  }, [allDocs]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (currentDoc) {
      trackPageView(`/academy/${currentDoc.slug}`, 'academy');
    }
  }, [currentDoc]);

  useEffect(() => {
    if (!slug && allDocs.length > 0) {
      navigate(`/academy/${allDocs[0].slug}`, { replace: true });
    }
  }, [slug, allDocs, navigate]);

  return {
    allDocs,
    currentDoc,
    contributors,
    docLoading,
    searchResults,
    groupedDocs,
    searchQuery,
    setSearchQuery,
    searchOpen,
    setSearchOpen,
    feedbackToken,
    setFeedbackToken,
  };
}