/**
 * Profile Theme System - SUPER CARD Locked
 * 5 predefined brand-safe color themes for artist profiles
 */

export type ProfileTheme = 'gold' | 'silver' | 'emerald' | 'violet' | 'ice';

export interface ThemeConfig {
  id: ProfileTheme;
  name: string;
  description: string;
  // Tailwind classes for various elements
  ringClass: string;
  shadowClass: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentClass: string;
  // CSS custom property value (HSL)
  colorValue: string;
}

export const PROFILE_THEMES: Record<ProfileTheme, ThemeConfig> = {
  gold: {
    id: 'gold',
    name: 'Gold',
    description: 'FlyMusic signature',
    ringClass: 'ring-primary',
    shadowClass: 'shadow-primary/30',
    badgeBg: 'bg-primary/20',
    badgeText: 'text-primary',
    badgeBorder: 'border-primary/30',
    accentClass: 'text-primary',
    colorValue: '45 93% 47%', // Gold HSL
  },
  silver: {
    id: 'silver',
    name: 'Silver',
    description: 'Clean & professional',
    ringClass: 'ring-gray-400',
    shadowClass: 'shadow-gray-400/30',
    badgeBg: 'bg-gray-400/20',
    badgeText: 'text-gray-300',
    badgeBorder: 'border-gray-400/30',
    accentClass: 'text-gray-300',
    colorValue: '0 0% 75%', // Silver HSL
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    description: 'Fresh & organic',
    ringClass: 'ring-emerald-500',
    shadowClass: 'shadow-emerald-500/30',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
    accentClass: 'text-emerald-400',
    colorValue: '160 84% 39%', // Emerald HSL
  },
  violet: {
    id: 'violet',
    name: 'Violet',
    description: 'Creative & bold',
    ringClass: 'ring-violet-500',
    shadowClass: 'shadow-violet-500/30',
    badgeBg: 'bg-violet-500/20',
    badgeText: 'text-violet-400',
    badgeBorder: 'border-violet-500/30',
    accentClass: 'text-violet-400',
    colorValue: '263 70% 58%', // Violet HSL
  },
  ice: {
    id: 'ice',
    name: 'Ice',
    description: 'Cool & modern',
    ringClass: 'ring-sky-300',
    shadowClass: 'shadow-sky-300/30',
    badgeBg: 'bg-sky-300/20',
    badgeText: 'text-sky-300',
    badgeBorder: 'border-sky-300/30',
    accentClass: 'text-sky-300',
    colorValue: '199 95% 74%', // Ice/Sky HSL
  },
};

/**
 * Get theme configuration by theme ID
 */
export function getThemeConfig(themeId: string | null | undefined): ThemeConfig {
  const theme = (themeId as ProfileTheme) || 'gold';
  return PROFILE_THEMES[theme] || PROFILE_THEMES.gold;
}

/**
 * Get all available themes as an array
 */
export function getAllThemes(): ThemeConfig[] {
  return Object.values(PROFILE_THEMES);
}
