import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";

type User = {
  id: number;
  clerkId: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

const AGENTS_URL = "http://localhost:8080";

export function useCurrentUser() {
  const { getToken } = useAuth();

  const { data, isLoading, error, refetch } = useQuery<{ user: User }>({
    queryKey: ["user"],
    queryFn: async () => {
      const token = await getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${AGENTS_URL}/user/me`, { headers });
      if (res.status === 404) {
        await fetch(`${AGENTS_URL}/user/sync`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
        });
        const retryRes = await fetch(`${AGENTS_URL}/user/me`, { headers });
        if (!retryRes.ok) throw new Error("Failed to load user data");
        return retryRes.json();
      }
      if (!res.ok) throw new Error("Failed to load user data");
      return res.json();
    },
    staleTime: 5 * 60_000,
  });

  return {
    data: data ?? null,
    loading: isLoading,
    error: error ? (error as Error).message : null,
    refetch,
  };
}
