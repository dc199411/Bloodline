"use client";

import { useEffect, useRef, useState } from "react";
import { fetchAPI } from "./api";
import {
  MOCK_AGENTS,
  MOCK_BOUNTIES,
  MOCK_POSTS,
} from "./mock";
import type { Agent, Bounty, Post } from "./types";

export interface AgentFilters {
  stage?: string;
  owner?: string;
}

export interface BountyFilters {
  type?: string;
}

function useFetchWithFallback<T>(
  path: string,
  fallback: T
): { data: T; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAPI<T>(path)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setData(fallback);
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  return { data, loading, error };
}

export function useAgents(filters?: AgentFilters) {
  const params = new URLSearchParams();
  if (filters?.stage) params.set("stage", filters.stage);
  if (filters?.owner) params.set("owner", filters.owner);
  const query = params.toString();
  const path = query ? `/agents?${query}` : "/agents";

  const result = useFetchWithFallback<any>(path, { agents: MOCK_AGENTS });
  return {
    data: result.data.agents || MOCK_AGENTS,
    loading: result.loading,
    error: result.error
  };
}

export function useAgent(id: string | null) {
  const [data, setData] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAPI<{ agent: Agent }>(`/agents/${id}`)
      .then((res) => {
        if (!cancelled) {
          setData(res.agent);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setData(MOCK_AGENTS.find((a) => a.id === id) ?? null);
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { agent: data, loading, error };
}

export function useBounties(filters?: BountyFilters) {
  const params = new URLSearchParams();
  if (filters?.type) params.set("type", filters.type);
  const query = params.toString();
  const path = query ? `/bounties?${query}` : "/bounties";

  const result = useFetchWithFallback<any>(path, { bounties: MOCK_BOUNTIES });
  return {
    data: result.data.bounties || MOCK_BOUNTIES,
    loading: result.loading,
    error: result.error
  };
}

export interface BScore {
  agentId: string;
  score: number;
  rank?: number;
}

export function useBScore(agentId: string | null) {
  const [data, setData] = useState<BScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!agentId) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAPI<BScore>(`/bscore/${agentId}`)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null);
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  return { bscore: data, loading, error };
}

export function useSocialFeed() {
  const result = useFetchWithFallback<any>("/social/feed", { posts: MOCK_POSTS });
  return {
    data: result.data.posts || MOCK_POSTS,
    loading: result.loading,
    error: result.error
  };
}

export function useDangerAgents() {
  const result = useFetchWithFallback<any>(
    "/agents/danger",
    { agents: MOCK_AGENTS.filter((a) => a.stage === "danger") }
  );
  return {
    data: result.data.agents || MOCK_AGENTS.filter((a) => a.stage === "danger"),
    loading: result.loading,
    error: result.error
  };
}

export function useLeaderboard() {
  const result = useFetchWithFallback<any>(
    "/agents/leaderboard",
    {
      leaderboard: [...MOCK_AGENTS]
        .filter((a) => a.stage !== "dead")
        .sort((a, b) => b.earned - a.earned)
    }
  );
  return {
    data: result.data.leaderboard || [...MOCK_AGENTS]
      .filter((a) => a.stage !== "dead")
      .sort((a, b) => b.earned - a.earned),
    loading: result.loading,
    error: result.error
  };
}

export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}
