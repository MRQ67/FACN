"use client";

import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

export function UserNav() {
  return (
    <nav className="flex items-center gap-4 p-4">
      <Show when="signed-out">
        <SignInButton />
        <SignUpButton />
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </nav>
  );
}
