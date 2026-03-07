#!/usr/bin/env python3
"""
Instagram profile scraper - lokalny bypass ograniczen Vercela.
Uzywaj z domowego/biurowego IP zamiast polegac na bezposrednim fetch z Vercela.

Instalacja:
    pip install -r requirements.txt

Uzycie:
    python instagram_scraper.py <username>
    python instagram_scraper.py <username> --login <twoj_login_ig>  # lepszy bypass rate limits
    python instagram_scraper.py https://www.instagram.com/username/

Output: JSON na stdout (mozna pipe'owac do pliku)
"""

import sys
import json
import argparse
import instaloader


def extract_username(handle_or_url: str) -> str:
    handle = handle_or_url.strip()
    for prefix in ["https://www.instagram.com/", "http://www.instagram.com/",
                   "https://instagram.com/", "http://instagram.com/"]:
        if handle.startswith(prefix):
            handle = handle[len(prefix):]
    handle = handle.lstrip("@").rstrip("/").split("?")[0]
    return handle


def scrape_profile(username: str, login: str | None = None) -> dict:
    L = instaloader.Instaloader(
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        quiet=True,
    )

    if login:
        print(f"[info] Logowanie jako {login} ...", file=sys.stderr)
        L.interactive_login(login)

    try:
        profile = instaloader.Profile.from_username(L.context, username)
    except instaloader.exceptions.ProfileNotExistsException:
        print(f"[error] Profil '{username}' nie istnieje.", file=sys.stderr)
        sys.exit(1)

    return {
        "username": profile.username,
        "fullName": profile.full_name,
        "bio": profile.biography,
        "followersCount": profile.followers,
        "followingCount": profile.followees,
        "postsCount": profile.mediacount,
        "isVerified": profile.is_verified,
        "profilePicUrl": profile.profile_pic_url,
        "recentPosts": [],
    }


def main():
    parser = argparse.ArgumentParser(description="Instagram profile scraper")
    parser.add_argument("username", help="Instagram handle lub pelny URL profilu")
    parser.add_argument("--login", "-l", default=None,
                        help="Instagram login (opcjonalny, lepszy bypass rate limits)")
    args = parser.parse_args()

    username = extract_username(args.username)
    if not username:
        print("[error] Nieprawidlowy handle Instagram.", file=sys.stderr)
        sys.exit(1)

    print(f"[info] Pobieranie profilu: {username}", file=sys.stderr)
    data = scrape_profile(username, login=args.login)
    print(json.dumps(data, ensure_ascii=False, indent=2))
    print(f"[info] OK — followers: {data['followersCount']}, posts: {data['postsCount']}",
          file=sys.stderr)


if __name__ == "__main__":
    main()
