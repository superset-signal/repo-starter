// Auto-generated types. Regenerate with: pnpm db:types
// Or edit manually to match your schema.

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          clerk_id: string;
          email: string | null;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          clerk_id: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          clerk_id?: string;
          email?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
    };
  };
};
