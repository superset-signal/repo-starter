import { SignIn } from "@clerk/clerk-react";

export function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </main>
  );
}
