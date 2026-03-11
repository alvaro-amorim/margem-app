"use client";

import { UserButton } from "@clerk/nextjs";

import { clerkAppearance } from "@/lib/clerk-theme";

export function AppUserButton() {
  return (
    <UserButton
      userProfileMode="navigation"
      userProfileUrl="/account"
      appearance={{
        elements: {
          userButtonAvatarBox: clerkAppearance.elements.userButtonAvatarBox,
          userButtonPopoverCard: clerkAppearance.elements.userButtonPopoverCard,
          userButtonPopoverActionButton: clerkAppearance.elements.userButtonPopoverActionButton,
        },
      }}
    />
  );
}
