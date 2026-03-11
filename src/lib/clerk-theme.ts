export const clerkAppearance = {
  layout: {
    logoImageUrl: "/margem-app-mark.svg",
  },
  variables: {
    colorPrimary: "#172033",
    colorText: "#172033",
    colorTextSecondary: "#5f6777",
    colorBackground: "#ffffff",
    colorInputBackground: "#fcfaf3",
    colorInputText: "#172033",
    colorDanger: "#be123c",
    borderRadius: "1rem",
    fontFamily: "Manrope, sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full",
    card: "rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(51,65,85,0.35)]",
    headerTitle: "text-2xl font-semibold text-[#172033]",
    headerSubtitle: "text-sm text-[#5f6777]",
    socialButtonsBlockButton:
      "h-11 rounded-2xl border border-slate-200 bg-white text-[#172033] shadow-none hover:bg-[#f8f4e8]",
    socialButtonsBlockButtonText: "font-semibold text-[#172033]",
    formButtonPrimary:
      "h-11 rounded-full border-0 bg-[#172033] text-white shadow-none hover:bg-[#0f172a]",
    footerActionLink: "font-semibold text-[#172033] underline-offset-4 hover:underline",
    formFieldLabel: "text-sm font-medium text-[#172033]",
    formFieldInput:
      "h-11 rounded-2xl border border-slate-200 bg-[#fcfaf3] text-[#172033] shadow-none focus:border-[#d7a130] focus:ring-4 focus:ring-[#f3d48b]/30",
    identityPreviewText: "text-[#172033]",
    identityPreviewEditButton: "font-semibold text-[#172033]",
    userButtonAvatarBox: "size-10 rounded-full ring-2 ring-white shadow-sm",
    userButtonPopoverCard:
      "rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_24px_80px_-40px_rgba(51,65,85,0.35)]",
    userButtonPopoverActionButton:
      "rounded-2xl text-[#172033] transition-colors hover:bg-[#f8f4e8]",
    navbar: "rounded-[1.5rem] bg-[#fcfaf3] p-2",
    navbarButton: "rounded-xl text-[#5f6777] hover:bg-white hover:text-[#172033]",
    navbarButtonActive: "bg-white text-[#172033] shadow-sm",
    pageScrollBox: "p-0",
    profileSection: "rounded-[1.5rem] border border-slate-200 bg-white",
    profileSectionTitleText: "text-base font-semibold text-[#172033]",
    badge: "rounded-full bg-[#efe8d5] text-[#172033]",
  },
} as const;

export const clerkEmbeddedAppearance = {
  elements: {
    card: "border-0 bg-transparent shadow-none",
    cardBox: "w-full shadow-none",
    rootBox: "w-full",
    footer: "pt-4",
  },
} as const;

export const clerkProfileAppearance = {
  elements: {
    card: "border-0 bg-transparent shadow-none",
    cardBox: "w-full shadow-none",
    rootBox: "w-full",
    pageScrollBox: "p-0",
  },
} as const;
