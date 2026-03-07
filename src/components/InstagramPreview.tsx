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
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="flex items-center gap-3 mb-3">
        {profile.profilePicUrl && (
          <img
            src={profile.profilePicUrl}
            alt={profile.fullName}
            className="w-12 h-12 rounded-full object-cover"
          />
        )}
        <div>
          <p className="font-medium text-gray-900">
            {profile.fullName || profile.username}
          </p>
          <p className="text-sm text-gray-500">@{profile.username}</p>
        </div>
      </div>

      {profile.bio && (
        <p className="text-sm text-gray-700 mb-3 whitespace-pre-line">
          {profile.bio}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-white rounded-lg p-2">
          <Users className="w-4 h-4 mx-auto text-gray-400 mb-1" />
          <p className="text-lg font-semibold text-gray-900">
            {profile.followersCount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">Followers</p>
        </div>
        <div className="bg-white rounded-lg p-2">
          <Image className="w-4 h-4 mx-auto text-gray-400 mb-1" />
          <p className="text-lg font-semibold text-gray-900">
            {profile.postsCount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">Posty</p>
        </div>
        <div className="bg-white rounded-lg p-2">
          <ExternalLink className="w-4 h-4 mx-auto text-gray-400 mb-1" />
          <p className="text-lg font-semibold text-gray-900">
            {engagementRate ? `${engagementRate}%` : "N/A"}
          </p>
          <p className="text-xs text-gray-500">Engagement</p>
        </div>
      </div>
    </div>
  );
}
