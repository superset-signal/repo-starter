import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
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
  const avatarUrl = clerkUser.imageUrl || null;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (existing.length > 0) {
    const [user] = await db
      .update(users)
      .set({ email, name, avatarUrl })
      .where(eq(users.clerkId, userId))
      .returning();
    return NextResponse.json({ user });
  }

  const [user] = await db
    .insert(users)
    .values({ clerkId: userId, email, name, avatarUrl })
    .returning();

  return NextResponse.json({ user });
}
