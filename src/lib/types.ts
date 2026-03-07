// Form input
export interface AnalysisRequest {
  salonName: string;
  instagramHandle: string;
  websiteUrl?: string;
  problemDescription: string;
  problemCategories: string[];
  contactName?: string;
  email?: string;
}

// Instagram scraped data
export interface InstagramProfile {
  username: string;
  fullName: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified: boolean;
  profilePicUrl: string;
  externalUrl?: string;
  recentPosts: InstagramPost[];
}

export interface InstagramPost {
  id: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  timestamp: string;
  imageUrl: string;
  type: "image" | "video" | "carousel";
}

// Analysis result — consulting methodology structure
export interface AnalysisReport {
  id: string;
  createdAt: string;
  salonName: string;
  instagramHandle: string;
  problemDescription: string;
  problemCategories: string[];
  contactName?: string;
  email?: string;
  instagramData: InstagramProfile | null;
  analysis: AnalysisResult;
}

export interface AnalysisResult {
  executiveSummary: {
    situation: string;
    complication: string;
    resolution: string;
    overallScore: number;
  };
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  categories: AnalysisCategory[];
  actionPlan: {
    quickWins: ActionItem[];
    coreChanges: ActionItem[];
    transformation: ActionItem[];
  };
  keyMetrics: KeyMetric[];
}

export interface AnalysisCategory {
  name: string;
  score: number;
  hypothesis: string;
  evidence: string[];
  findings: string[];
  recommendations: string[];
}

export interface ActionItem {
  area: string;
  action: string;
  expectedImpact: string;
  kpiMetric?: string;
}

export interface KeyMetric {
  metric: string;
  current: string;
  target: string;
  timeline: string;
}
