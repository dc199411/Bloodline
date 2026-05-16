"use client";

import { useEffect, useRef, useState } from "react";
import { fetchAPI, getStoredProfile } from "./api";
import type {
  Agent,
  Bounty,
  BScore,
  Post,
  UserProfileSnapshot,
} from "./types";

export interface AgentFilters {
  stage?: string;
  owner?: string;
}

export interface BountyFilters {
  type?: string;
}

type FetchState<T> = {
  data: T;
  loading: boolean;
  error: Error | null;
};

type AgentsResponse = {
  agents?: Agent[];
};

type AgentResponse = {
  agent?: Agent;
};

type BountiesResponse = {
  bounties?: Bounty[];
};

type SocialResponse = {
  posts?: Post[];
};

type LeaderboardResponse = {
  leaderboard?: Agent[];
};

function useFetch<T>(path: string | null, initialData: T): FetchState<T> {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      setData(initialData);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    setData(initialData);
    setLoading(true);
    setError(null);

    fetchAPI<T>(path)
      .then((response) => {
        if (!cancelled) {
          setData(response);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Request failed"));
          setData(initialData);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
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
  const result = useFetch<AgentsResponse>(path, { agents: [] });

  return {
    data: result.data.agents ?? [],
    loading: result.loading,
    error: result.error,
  };
}

export function useAgent(id: string | null) {
  const result = useFetch<AgentResponse>(id ? `/agents/${id}` : null, { agent: undefined });

  return {
    agent: result.data.agent ?? null,
    loading: result.loading,
    error: result.error,
  };
}

export function useBounties(filters?: BountyFilters) {
  const params = new URLSearchParams();
  if (filters?.type) params.set("type", filters.type);

  const query = params.toString();
  const path = query ? `/bounties?${query}` : "/bounties";
  const result = useFetch<BountiesResponse>(path, { bounties: [] });

  return {
    data: result.data.bounties ?? [],
    loading: result.loading,
    error: result.error,
  };
}

export function useSocialFeed() {
  const result = useFetch<SocialResponse>("/social/feed", { posts: [] });

  return {
    data: result.data.posts ?? [],
    loading: result.loading,
    error: result.error,
  };
}

export function useDangerAgents() {
  const result = useFetch<AgentsResponse>("/agents/danger", { agents: [] });

  return {
    data: result.data.agents ?? [],
    loading: result.loading,
    error: result.error,
  };
}

export function useLeaderboard() {
  const result = useFetch<LeaderboardResponse>("/agents/leaderboard", { leaderboard: [] });

  return {
    data: result.data.leaderboard ?? [],
    loading: result.loading,
    error: result.error,
  };
}

export function useBScore(agentId: string | null) {
  const [data, setData] = useState<BScore | null>(null);
  const [loading, setLoading] = useState(Boolean(agentId));
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

    fetchAPI<{
      composite: number;
      rank?: number;
    }>(`/bscore/${agentId}`)
      .then((response) => {
        if (!cancelled) {
          setData({
            agentId,
            score: response.composite,
            rank: response.rank,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err : new Error("Failed to fetch bscore"));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [agentId]);

  return { bscore: data, loading, error };
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfileSnapshot>({
    walletAddress: null,
    authToken: null,
  });

  useEffect(() => {
    setProfile(getStoredProfile());

    const syncProfile = () => {
      setProfile(getStoredProfile());
    };

    window.addEventListener("storage", syncProfile);
    window.addEventListener("focus", syncProfile);

    return () => {
      window.removeEventListener("storage", syncProfile);
      window.removeEventListener("focus", syncProfile);
    };
  }, []);

  return profile;
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
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}
