"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { fetchAPI, getStoredProfile } from "@/lib/api";
import type { SaveAgentResponse } from "@/lib/types";

interface SaveButtonProps {
  agentId: string;
  agentName: string;
}

export function SaveButton({ agentId, agentName }: SaveButtonProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = async () => {
    const { authToken } = getStoredProfile();
    if (!authToken) {
      setError("Connect through the host app before sending a save transaction.");
      setSuccess(null);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await fetchAPI<SaveAgentResponse>(`/agents/${agentId}/save`, {
        method: "POST",
        token: authToken,
        body: { amount: 10 },
      });

      setSuccess(`Runway extended to ${Math.round(result.runway)}h.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save agent");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-lg py-3 font-syne text-sm font-bold uppercase tracking-wider transition-all"
        style={{
          background: saving ? "var(--ash)" : "var(--blood)",
          color: saving ? "var(--muted)" : "#fff",
          border: "1px solid var(--blood)",
        }}
      >
        <Heart size={16} fill={saving ? "none" : "currentColor"} />
        {saving ? "Submitting..." : `Save ${agentName}`}
      </button>
      <p className="font-mono text-[10px]" style={{ color: error ? "var(--dying)" : "var(--muted)" }}>
        {error ?? success ?? "Sends a 10 USDC save request through the authenticated API session."}
      </p>
    </div>
  );
}
