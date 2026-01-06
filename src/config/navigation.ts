import {
  LayoutDashboard,
  User,
  Music,
  Calendar,
  BarChart3,
  MessageSquare,
  Sparkles,
  Video,
  FolderOpen,
  Crown,
  Star,
  Users,
  ShoppingBag,
  Radio,
  DollarSign,
  Link2,
  Settings,
  FileText,
  Briefcase,
  Home,
  Rss,
  ListMusic,
  Activity,
  Trophy,
  Award,
  Target,
  KeyRound,
  Flag,
  Building2,
  Handshake,
  Shield,
  CreditCard,
  FlaskConical,
  Inbox,
  CheckCircle,
  Bell,
  LucideIcon,
} from "lucide-react";

export interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  i18nKey?: string;
  hasBadge?: boolean;
}

export interface NavSection {
  title: string;
  i18nKey?: string;
  items: NavItem[];
}

export interface NavConfig {
  portalName: string;
  portalNameI18nKey: string;
  subtitle?: string;
  subtitleI18nKey?: string;
  sections: NavSection[];
}

// Fan Navigation Config
export const fanNavConfig: NavConfig = {
  portalName: "Fan Portal",
  portalNameI18nKey: "nav.fanPortal",
  sections: [
    {
      title: "Browse",
      i18nKey: "mobile.browse",
      items: [
        { icon: Home, label: "Dashboard", path: "/fan/dashboard", i18nKey: "nav.dashboard" },
        { icon: Rss, label: "Feed", path: "/fan/feed", i18nKey: "nav.feed" },
        { icon: Target, label: "Missions", path: "/fan/missions", i18nKey: "fan.missions" },
      ],
    },
    {
      title: "Collect",
      i18nKey: "mobile.collect",
      items: [
        { icon: Users, label: "My Artists", path: "/fan/artists", i18nKey: "fan.myArtists" },
        { icon: ListMusic, label: "Playlists", path: "/fan/playlists", i18nKey: "nav.playlists" },
        { icon: Trophy, label: "Supporter Pass", path: "/fan/supporter", i18nKey: "fan.supporterPass" },
        { icon: Award, label: "Achievements", path: "/fan/achievements", i18nKey: "fan.achievements" },
      ],
    },
    {
      title: "Account",
      i18nKey: "mobile.account",
      items: [
        { icon: Activity, label: "Activity", path: "/fan/activity", i18nKey: "fan.activity" },
        { icon: Settings, label: "Settings", path: "/fan/settings", i18nKey: "nav.settings" },
      ],
    },
  ],
};

// Artist/Studio Navigation Config
export const artistNavConfig: NavConfig = {
  portalName: "My Studio",
  portalNameI18nKey: "nav.myStudio",
  subtitle: "Creator Control Room",
  subtitleI18nKey: "studio.controlRoom",
  sections: [
    {
      title: "Create",
      i18nKey: "nav.studioSections.create",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/studio", i18nKey: "nav.dashboard" },
        { icon: User, label: "Profile", path: "/studio/profile", i18nKey: "nav.profile" },
        { icon: Music, label: "Tracks", path: "/studio/tracks", i18nKey: "nav.tracks" },
        { icon: Video, label: "Videos", path: "/studio/videos", i18nKey: "nav.videos" },
        { icon: FolderOpen, label: "Video Collections", path: "/studio/video-collections", i18nKey: "nav.videoCollections" },
        { icon: FileText, label: "Press Kit", path: "/studio/presskit", i18nKey: "nav.presskit" },
      ],
    },
    {
      title: "Grow",
      i18nKey: "nav.studioSections.grow",
      items: [
        { icon: Briefcase, label: "Opportunities", path: "/studio/opportunities", i18nKey: "nav.opportunities" },
        { icon: Users, label: "Collaborations", path: "/studio/collaborations", i18nKey: "nav.collaborations" },
        { icon: Sparkles, label: "Spotlight", path: "/studio/spotlight", i18nKey: "nav.spotlight" },
        { icon: Sparkles, label: "Pulse", path: "/studio/pulse", i18nKey: "nav.pulse" },
        { icon: Link2, label: "Promo Hub", path: "/studio/promo", i18nKey: "nav.promo" },
        { icon: BarChart3, label: "Analytics", path: "/studio/analytics", i18nKey: "nav.analytics" },
      ],
    },
    {
      title: "Engage",
      i18nKey: "nav.studioSections.engage",
      items: [
        { icon: Users, label: "Community", path: "/studio/community", i18nKey: "nav.community" },
        { icon: ShoppingBag, label: "Merch", path: "/studio/merch", i18nKey: "nav.merch" },
        { icon: Radio, label: "Live", path: "/studio/live", i18nKey: "nav.liveStreams" },
        { icon: Calendar, label: "Events", path: "/studio/events", i18nKey: "nav.events" },
        { icon: MessageSquare, label: "Comments", path: "/studio/comments", i18nKey: "nav.comments" },
        { icon: Star, label: "Testimonials", path: "/studio/testimonials", i18nKey: "nav.testimonials" },
      ],
    },
    {
      title: "Monetize",
      i18nKey: "nav.studioSections.monetize",
      items: [
        { icon: Crown, label: "Membership", path: "/studio/subscription", i18nKey: "nav.subscription" },
        { icon: DollarSign, label: "Earnings", path: "/studio/earnings", i18nKey: "nav.earnings" },
      ],
    },
    {
      title: "Account",
      i18nKey: "nav.studioSections.account",
      items: [
        { icon: Settings, label: "Settings", path: "/studio/settings", i18nKey: "nav.settings" },
      ],
    },
  ],
};

// Admin Navigation Config
export const adminNavConfig: NavConfig = {
  portalName: "Admin",
  portalNameI18nKey: "nav.admin",
  subtitle: "FlyMusic Admin Panel",
  sections: [
    {
      title: "Overview",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin", i18nKey: "admin.dashboard" },
        { icon: Inbox, label: "Inbox", path: "/admin/inbox", i18nKey: "admin.inbox", hasBadge: true },
        { icon: FlaskConical, label: "QA Mode", path: "/admin/qa", i18nKey: "admin.qa" },
      ],
    },
    {
      title: "Content",
      items: [
        { icon: Shield, label: "Approvals", path: "/admin/approvals", i18nKey: "admin.approvals" },
        { icon: CheckCircle, label: "Verifications", path: "/admin/verifications", i18nKey: "admin.verifications" },
        { icon: Star, label: "Artists", path: "/admin/artists", i18nKey: "admin.artists" },
        { icon: Activity, label: "Tracks", path: "/admin/tracks", i18nKey: "admin.tracks" },
        { icon: Link2, label: "Smart Links", path: "/admin/smart-links", i18nKey: "admin.smartLinks" },
        { icon: Star, label: "Spotlight", path: "/admin/spotlight", i18nKey: "nav.spotlight" },
        { icon: Bell, label: "Updates", path: "/admin/updates", i18nKey: "admin.updates" },
      ],
    },
    {
      title: "Platform",
      items: [
        { icon: Users, label: "Users", path: "/admin/users", i18nKey: "admin.users" },
        { icon: Users, label: "Waitlist", path: "/admin/waitlist", i18nKey: "admin.waitlist" },
        { icon: KeyRound, label: "Beta Codes", path: "/admin/beta-codes", i18nKey: "admin.betaCodes" },
        { icon: Flag, label: "Feature Flags", path: "/admin/features", i18nKey: "admin.featureFlags" },
        { icon: Building2, label: "Collab Entities", path: "/admin/collab-entities", i18nKey: "admin.collabEntities" },
        { icon: Briefcase, label: "Opportunities", path: "/admin/opportunities", i18nKey: "admin.opportunities" },
        { icon: Handshake, label: "Matching", path: "/admin/matching", i18nKey: "admin.matching" },
        { icon: Activity, label: "Activity Log", path: "/admin/activity", i18nKey: "admin.activityLog" },
        { icon: Shield, label: "Roles", path: "/admin/roles", i18nKey: "admin.roleManagement" },
      ],
    },
    {
      title: "Business",
      items: [
        { icon: Building2, label: "Brand Applications", path: "/admin/brand-applications", i18nKey: "admin.brandApplications" },
        { icon: Activity, label: "Campaigns", path: "/admin/campaigns", i18nKey: "admin.campaigns" },
        { icon: CreditCard, label: "Payouts", path: "/admin/payouts", i18nKey: "admin.payouts" },
      ],
    },
  ],
};

// Brand Navigation Config
export const brandNavConfig: NavConfig = {
  portalName: "Brand Portal",
  portalNameI18nKey: "nav.brandPortal",
  subtitle: "Partner Dashboard",
  subtitleI18nKey: "brand.partnerDashboard",
  sections: [
    {
      title: "Overview",
      i18nKey: "admin.overview",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/brand", i18nKey: "nav.dashboard" },
        { icon: Users, label: "Discover Artists", path: "/brand/discovery", i18nKey: "brand.discoverArtists" },
        { icon: Briefcase, label: "Opportunities", path: "/brand/opportunities", i18nKey: "nav.opportunities" },
        { icon: Inbox, label: "Applications", path: "/brand/applications", i18nKey: "brand.applications" },
        { icon: BarChart3, label: "Analytics", path: "/brand/analytics", i18nKey: "nav.analytics" },
      ],
    },
    {
      title: "Account",
      i18nKey: "mobile.account",
      items: [
        { icon: Settings, label: "Settings", path: "/brand/settings", i18nKey: "nav.settings" },
      ],
    },
  ],
};

// Helper to get all nav items flattened
export const getFlatNavItems = (config: NavConfig): NavItem[] => {
  return config.sections.flatMap((section) => section.items);
};

// Helper to get nav config by role
export const getNavConfigForRole = (role: "fan" | "artist" | "admin" | "brand"): NavConfig => {
  switch (role) {
    case "fan":
      return fanNavConfig;
    case "artist":
      return artistNavConfig;
    case "admin":
      return adminNavConfig;
    case "brand":
      return brandNavConfig;
    default:
      return fanNavConfig;
  }
};

// Helper to find breadcrumb trail for a path
export const getBreadcrumbsForPath = (
  config: NavConfig,
  path: string
): { label: string; path: string; i18nKey?: string }[] => {
  const breadcrumbs: { label: string; path: string; i18nKey?: string }[] = [];

  // Add portal root
  const rootPath = config === fanNavConfig 
    ? "/fan" 
    : config === artistNavConfig 
      ? "/studio" 
      : config === brandNavConfig
        ? "/brand"
        : "/admin";
  breadcrumbs.push({
    label: config.portalName,
    path: rootPath,
    i18nKey: config.portalNameI18nKey,
  });

  // Find current page in nav items
  for (const section of config.sections) {
    for (const item of section.items) {
      if (item.path === path && item.path !== rootPath) {
        breadcrumbs.push({
          label: item.label,
          path: item.path,
          i18nKey: item.i18nKey,
        });
        return breadcrumbs;
      }
    }
  }

  return breadcrumbs;
};
