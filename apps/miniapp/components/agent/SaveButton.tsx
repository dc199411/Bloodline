"use client";

import { Heart } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface SaveButtonProps {
  agentId: string;
  agentName: string;
}

export function SaveButton({ agentName }: SaveButtonProps) {
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSave = useCallback(() => {
    setSaving(true);
    timerRef.current = setTimeout(() => setSaving(false), 2000);
  }, []);

  return (
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
      {saving ? "Processing..." : `Save ${agentName}`}
    </button>
  );
}
