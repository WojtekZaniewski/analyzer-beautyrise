// Form input
export interface AnalysisRequest {
  salonName: string;
  instagramHandle: string;
  problemDescription: string;
  problemCategories: string[];
  additionalNotes?: string;
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

// Analysis result
export interface AnalysisReport {
  id: string;
  createdAt: string;
  salonName: string;
  instagramHandle: string;
  problemDescription: string;
  problemCategories: string[];
  instagramData: InstagramProfile | null;
  analysis: AnalysisResult;
}

export interface AnalysisResult {
  overallScore: number;
  summary: string;
  categories: AnalysisCategory[];
  actionPlan: ActionItem[];
}

export interface AnalysisCategory {
  name: string;
  score: number;
  findings: string[];
  recommendations: string[];
}

export interface ActionItem {
  priority: "high" | "medium" | "low";
  area: string;
  action: string;
  expectedImpact: string;
}
