export const twimziTheme = {
  colors: {
    primary: "#0D9488",
    primaryDark: "#0F766E",
    primaryLight: "#CCFBF1",
    secondary: "#F0FDFA",
    accent: "#F97316",
    accentSecondary: "#FB923C",
    accentLight: "#FFEDD5",
    background: "#FFFFFF",
    surface: "#FFFFFF",
    text: "#0F172A",
    textSecondary: "#475569",
    textMuted: "#64748B",
    border: "#E2E8F0",
    gradient:
      "linear-gradient(135deg, #0D9488 0%, #14B8A6 55%, #F97316 100%)",
  },

  typography: {
    fontFamily: "Poppins",
  },

  radius: {
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.25rem",
    full: "9999px",
  },

  layout: {
    maxWidth: "1280px",
    contentPadding: "1.25rem",
  },
} as const;