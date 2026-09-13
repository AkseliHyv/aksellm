export const THEME_OPTIONS = ["Catppuccin", "Nord", "Gruvbox", "Dracula", "Tokyo Night", "Rose Pine", "Solarized Dark"] as const;

export type Theme = typeof THEME_OPTIONS[number];
