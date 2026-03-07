"use client";

import { InstagramProfile } from "@/lib/types";
import { Users, Image, ExternalLink } from "lucide-react";

interface InstagramPreviewProps {
  profile: InstagramProfile;
}

export default function InstagramPreview({ profile }: InstagramPreviewProps) {
  const engagementRate =
    profile.followersCount > 0 && profile.recentPosts.length > 0
      ? (
          (profile.recentPosts.reduce(
            (sum, p) => sum + p.likesCount + p.commentsCount,
            0
          ) /
            profile.recentPosts.length /
            profile.followersCount) *
          100
        ).toFixed(2)
      : null;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        {profile.profilePicUrl && (
          <img
            src={profile.profilePicUrl}
            alt={profile.fullName}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-orange-200/50"
          />
        )}
        <div>
          <p className="font-semibold text-gray-900">
            {profile.fullName || profile.username}
          </p>
          <p className="text-sm text-gray-400">@{profile.username}</p>
        </div>
      </div>

      {profile.bio && (
        <p className="text-sm text-gray-600 mb-4 whitespace-pre-line leading-relaxed">
          {profile.bio}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="glass-subtle rounded-xl p-3">
          <Users className="w-4 h-4 mx-auto text-orange-400 mb-1.5" />
          <p className="text-lg font-bold text-gray-900">
            {profile.followersCount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">Followers</p>
        </div>
        <div className="glass-subtle rounded-xl p-3">
          <Image className="w-4 h-4 mx-auto text-orange-400 mb-1.5" />
          <p className="text-lg font-bold text-gray-900">
            {profile.postsCount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">Posty</p>
        </div>
        <div className="glass-subtle rounded-xl p-3">
          <ExternalLink className="w-4 h-4 mx-auto text-orange-400 mb-1.5" />
          <p className="text-lg font-bold text-gray-900">
            {engagementRate ? `${engagementRate}%` : "N/A"}
          </p>
          <p className="text-xs text-gray-400">Engagement</p>
        </div>
      </div>
    </div>
  );
}
