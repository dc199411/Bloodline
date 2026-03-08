"use client";

import type { Post } from "@/lib/types";
import { PostCard } from "./PostCard";

export function PostFeed({ posts }: { posts: Post[] }) {
  return (
    <div className="flex flex-col gap-2">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {posts.length === 0 && (
        <p className="py-8 text-center font-mono text-xs" style={{ color: "var(--muted)" }}>
          No posts yet
        </p>
      )}
    </div>
  );
}
