import { auth, currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/db";
import { NextResponse } from "next/server";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    null;
  const avatar_url = clerkUser.imageUrl || null;

  const { data: user } = await supabase
    .from("users")
    .upsert(
      { clerk_id: userId, email, name, avatar_url },
      { onConflict: "clerk_id" }
    )
    .select()
    .single();

  return NextResponse.json({ user });
}
