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

/* -----------------------------
   Generic fetch hook (FIXED)
------------------------------ */

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

/* -----------------------------
   Agents
------------------------------ */

type AgentsResponse = {
  agents: Agent[];
};

export function useAgents(filters?: AgentFilters) {
  const params = new URLSearchParams();
  if (filters?.stage) params.set("stage", filters.stage);
  if (filters?.owner) params.set("owner", filters.owner);

  const query = params.toString();
  const path = query ? `/agents?${query}` : "/agents";

  const result = useFetchWithFallback<AgentsResponse>(path, {
    agents: MOCK_AGENTS,
  });

  return {
    data: result.data.agents,
    loading: result.loading,
    error: result.error,
  };
}

/* -----------------------------
   Single Agent
------------------------------ */

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

/* -----------------------------
   Bounties
------------------------------ */

type BountiesResponse = {
  bounties: Bounty[];
};

export function useBounties(filters?: BountyFilters) {
  const params = new URLSearchParams();
  if (filters?.type) params.set("type", filters.type);

  const query = params.toString();
  const path = query ? `/bounties?${query}` : "/bounties";

  const result = useFetchWithFallback<BountiesResponse>(path, {
    bounties: MOCK_BOUNTIES,
  });

  return {
    data: result.data.bounties,
    loading: result.loading,
    error: result.error,
  };
}

/* -----------------------------
   Social Feed
------------------------------ */

type SocialResponse = {
  posts: Post[];
};

export function useSocialFeed() {
  const result = useFetchWithFallback<SocialResponse>("/social/feed", {
    posts: MOCK_POSTS,
  });

  return {
    data: result.data.posts,
    loading: result.loading,
    error: result.error,
  };
}

/* -----------------------------
   Danger Agents
------------------------------ */

export function useDangerAgents() {
  const danger = MOCK_AGENTS.filter((a) => a.stage === "danger");

  const result = useFetchWithFallback<AgentsResponse>(
    "/agents/danger",
    { agents: danger }
  );

  return {
    data: result.data.agents,
    loading: result.loading,
    error: result.error,
  };
}

/* -----------------------------
   Leaderboard
------------------------------ */

type LeaderboardResponse = {
  leaderboard: Agent[];
};

export function useLeaderboard() {
  const sorted = [...MOCK_AGENTS]
    .filter((a) => a.stage !== "dead")
    .sort((a, b) => b.earned - a.earned);

  const result = useFetchWithFallback<LeaderboardResponse>(
    "/agents/leaderboard",
    { leaderboard: sorted }
  );

  return {
    data: result.data.leaderboard,
    loading: result.loading,
    error: result.error,
  };
}

/* -----------------------------
   B Score
------------------------------ */

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
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setData(null);
        if (!cancelled) setError(err);
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

/* -----------------------------
   Scroll Reveal (unchanged)
------------------------------ */

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
