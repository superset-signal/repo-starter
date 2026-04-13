import { SignUp } from "@clerk/clerk-react";

export function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </main>
  );
}
