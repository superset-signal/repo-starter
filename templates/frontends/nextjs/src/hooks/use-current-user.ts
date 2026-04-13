"use client";

import { useQuery } from "@tanstack/react-query";

type User = {
  id: number;
  clerkId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

async function fetchUser(): Promise<{ user: User }> {
  const res = await fetch("/api/user/me");
  if (res.status === 404) {
    await fetch("/api/user/sync", { method: "POST" });
    const retryRes = await fetch("/api/user/me");
    if (!retryRes.ok) throw new Error("Failed to load user data");
    return retryRes.json();
  }
  if (!res.ok) throw new Error("Failed to load user data");
  return res.json();
}

export function useCurrentUser() {
  const { data, isLoading, error, refetch } = useQuery<{ user: User }>({
    queryKey: ["user"],
    queryFn: fetchUser,
    staleTime: 5 * 60_000,
  });

  return {
    data: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
