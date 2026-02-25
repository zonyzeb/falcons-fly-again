import json
import os
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime

TEAM_ID = int(os.environ.get("CRICHEROES_TEAM_ID", "12228002"))
LEGACY_TEAM_ID = int(os.environ.get("CRICHEROES_LEGACY_TEAM_ID", "6984017"))
LEGACY_YEAR = int(os.environ.get("CRICHEROES_LEGACY_YEAR", "2025"))
OUTPUT_DIR = "data"

API_BASE = os.environ.get("CRICHEROES_API_BASE", "https://api.cricheroes.in/api/v1")
API_KEY = os.environ.get("CRICHEROES_API_KEY", "cr!CkH3r0s")
DEVICE_TYPE = os.environ.get("CRICHEROES_DEVICE_TYPE", "Android")
UDID = os.environ.get("CRICHEROES_UDID", "ab7905ae4e2ddf11cc91ca0e05241cfc")
MAX_MATCH_PAGES = int(os.environ.get("CRICHEROES_MAX_MATCH_PAGES", "10"))
REQUEST_TIMEOUT = int(os.environ.get("CRICHEROES_TIMEOUT_SECONDS", "30"))

HEADERS = {
    "api-key": API_KEY,
    "device-type": DEVICE_TYPE,
    "udid": UDID,
    "user-agent": "Mozilla/5.0",
    "accept": "application/json",
}


def save_json(filename, data):
    path = os.path.join(OUTPUT_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Saved {path}")


def build_url(path, params=None):
    if path.startswith("http"):
        url = path
    else:
        url = f"{API_BASE.rstrip('/')}/{path.lstrip('/')}"
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    return url


def fetch_json(path, params=None, retries=3):
    url = build_url(path, params=params)
    for attempt in range(1, retries + 1):
        try:
            request = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT) as response:
                payload = json.loads(response.read().decode("utf-8"))
            if isinstance(payload, dict) and payload.get("status") is False:
                message = payload.get("error", {}).get("message") or "Unknown API error"
                raise RuntimeError(message)
            return payload
        except Exception:
            if attempt == retries:
                raise
            time.sleep(2**attempt)


def fetch_paginated(path, max_pages):
    data = []
    next_path = path
    pages = 0
    while next_path and pages < max_pages:
        payload = fetch_json(next_path)
        data.extend(payload.get("data", []))
        next_path = payload.get("page", {}).get("next")
        pages += 1
    return data


def safe_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def parse_match_year(match):
    start_time = match.get("match_start_time", "")
    if not start_time:
        return None
    try:
        return datetime.fromisoformat(start_time.replace("Z", "+00:00")).year
    except ValueError:
        return None


def format_date(value):
    if not value:
        return ""
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).strftime("%d-%b-%y")
    except ValueError:
        return ""


def build_match(match):
    team_a = (match.get("team_a") or "").strip()
    team_b = (match.get("team_b") or "").strip()
    team_a_summary = (match.get("team_a_summary") or "").strip()
    team_b_summary = (match.get("team_b_summary") or "").strip()
    ground_name = (match.get("ground_name") or "").strip()
    match_date = format_date(match.get("match_start_time"))
    overs = match.get("overs")

    score = []
    if team_a:
        score.append(f"{team_a} {team_a_summary}".strip())
    if team_b:
        score.append(f"{team_b} {team_b_summary}".strip())

    info_parts = [part for part in [ground_name, match_date] if part]
    if overs:
        info_parts.append(f"{overs} Ov")
    info = ", ".join(info_parts)

    summary = match.get("match_summary", {}).get("summary") or match.get("match_result", "")
    match_id = match.get("match_id")
    match_url = f"https://cricheroes.com/scorecard/{match_id}" if match_id else ""

    return {
        "tournament": match.get("tournament_name") or "",
        "info": info,
        "score": score,
        "result": summary,
        "url": match_url,
        "date": match_date,
        "venue": ground_name,
    }


def build_team_stats(matches_raw, team_ids):
    total = len(matches_raw)
    wins = 0
    losses = 0
    ties = 0
    no_result = 0

    for match in matches_raw:
        result = (match.get("match_result") or "").lower()
        winning_team_id = safe_int(match.get("winning_team_id"))
        if "tie" in result:
            ties += 1
        elif winning_team_id == 0:
            no_result += 1
        elif winning_team_id in team_ids:
            wins += 1
        else:
            losses += 1

    win_pct = (wins / total * 100) if total else 0.0

    return [
        {"label": "Matches", "value": str(total)},
        {"label": "Wins", "value": str(wins)},
        {"label": "Losses", "value": str(losses)},
        {"label": "Ties", "value": str(ties)},
        {"label": "No Result", "value": str(no_result)},
        {"label": "Win %", "value": f"{win_pct:.1f}%"},
    ]


def build_leaderboard(category, items):
    output = []
    for item in items:
        if category == "batting":
            value = item.get("total_runs", 0)
            label = "runs"
        elif category == "bowling":
            value = item.get("total_wickets", 0)
            label = "wickets"
        else:
            value = item.get("total_catches")
            if value is None:
                value = item.get("catches", 0)
            label = "catches"
        output.append(
            {
                "player_name": item.get("name") or "",
                "stat": f"{value} {label}",
                "profile": category,
            }
        )
    return output


def make_slug(name):
    return name.strip().lower().replace(" ", "-")


def build_players(items):
    output = []
    for item in items:
        player_id = item.get("player_id")
        name = item.get("name") or ""
        output.append(
            {
                "player_id": player_id,
                "name": name,
                "slug": make_slug(name),
                "sub_title": item.get("player_skill") or "",
                "profile_url": f"https://cricheroes.com/player-profile/{player_id}"
                if player_id
                else "",
                "profile_pic_url": item.get("profile_photo") or "",
            }
        )
    return output


def fetch_player_career_stats(player_id):
    """Fetch complete career statistics for a player from the CricHeroes API."""
    try:
        payload = fetch_json(f"player/get-player-statistic/{player_id}", params={"pagesize": 100})
        return payload.get("data", {}).get("statistics", {})
    except Exception as e:
        print(f"  Warning: could not fetch stats for player {player_id}: {e}")
        return {}


def stats_list_to_dict(items):
    """Convert CricHeroes stats array [{"title": "Runs", "value": 216}, ...] to a dict."""
    return {item["title"]: item["value"] for item in items if "title" in item}


def parse_career_batting(raw_dict):
    """Transform raw batting stats dict into our normalized format."""
    if not raw_dict:
        return {}
    hs_raw = str(raw_dict.get("Highest Runs", "0"))
    is_not_out = hs_raw.endswith("*")
    hs_val = hs_raw.rstrip("*")
    try:
        hs_num = int(hs_val)
    except ValueError:
        hs_num = 0
    return {
        "matches": safe_int(raw_dict.get("Matches")),
        "innings": safe_int(raw_dict.get("Innings")),
        "not_outs": safe_int(raw_dict.get("Not out")),
        "runs": safe_int(raw_dict.get("Runs")),
        "highest_score": hs_num,
        "highest_score_not_out": "*" if is_not_out else "",
        "average": safe_float(raw_dict.get("Avg")),
        "strike_rate": safe_float(raw_dict.get("SR")),
        "thirties": safe_int(raw_dict.get("30s")),
        "fifties": safe_int(raw_dict.get("50s")),
        "hundreds": safe_int(raw_dict.get("100s")),
        "fours": safe_int(raw_dict.get("4s")),
        "sixes": safe_int(raw_dict.get("6s")),
        "ducks": safe_int(raw_dict.get("Ducks")),
    }


def parse_career_bowling(raw_dict):
    """Transform raw bowling stats dict into our normalized format."""
    if not raw_dict:
        return {}
    return {
        "matches": safe_int(raw_dict.get("Matches")),
        "innings": safe_int(raw_dict.get("Innings")),
        "overs": str(raw_dict.get("Overs", "0")),
        "maidens": safe_int(raw_dict.get("Maidens")),
        "wickets": safe_int(raw_dict.get("Wickets")),
        "runs_conceded": safe_int(raw_dict.get("Runs")),
        "best_figures": str(raw_dict.get("Best Bowling", "0/0")),
        "three_wickets": safe_int(raw_dict.get("3 Wickets")),
        "five_wickets": safe_int(raw_dict.get("5 Wickets")),
        "economy": safe_float(raw_dict.get("Economy")),
        "strike_rate": safe_float(raw_dict.get("SR")),
        "average": safe_float(raw_dict.get("Avg")),
        "wides": safe_int(raw_dict.get("Wides")),
        "noballs": safe_int(raw_dict.get("NoBalls")),
        "dot_balls": safe_int(raw_dict.get("Dot Balls")),
        "fours_conceded": safe_int(raw_dict.get("4s")),
        "sixes_conceded": safe_int(raw_dict.get("6s")),
    }


def parse_career_fielding(raw_dict):
    """Transform raw fielding stats dict into our normalized format."""
    if not raw_dict:
        return {}
    return {
        "matches": safe_int(raw_dict.get("Matches")),
        "catches": safe_int(raw_dict.get("Catches")),
        "caught_behind": safe_int(raw_dict.get("Caught behind")),
        "run_outs": safe_int(raw_dict.get("Run outs")),
        "stumpings": safe_int(raw_dict.get("Stumpings")),
        "assisted_run_outs": safe_int(raw_dict.get("Assisted Run Outs")),
    }


def safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def build_player_stats_from_api(player_id, name, slug, profile_photo):
    """Fetch and transform career stats for a single player."""
    raw = fetch_player_career_stats(player_id)
    if not raw:
        return {
            "player_id": player_id, "name": name, "slug": slug,
            "profile_photo": profile_photo,
            "batting": {}, "bowling": {}, "fielding": {},
        }

    bat_dict = stats_list_to_dict(raw.get("batting", []))
    bowl_dict = stats_list_to_dict(raw.get("bowling", []))
    field_dict = stats_list_to_dict(raw.get("fielding", []))

    return {
        "player_id": player_id,
        "name": name,
        "slug": slug,
        "profile_photo": profile_photo,
        "batting": parse_career_batting(bat_dict),
        "bowling": parse_career_bowling(bowl_dict),
        "fielding": parse_career_fielding(field_dict),
    }


def fetch_matches_safe(team_id, max_pages):
    try:
        return fetch_paginated(f"team/get-team-match/{team_id}", max_pages)
    except RuntimeError as e:
        if "hasn't played any matches" in str(e):
            print(f"  No matches found for team {team_id}")
            return []
        raise


def fetch_leaderboard_safe(team_id, category, max_pages=10):
    all_items = []
    path = f"leaderboard/get-team-{category}-leaderboard/{team_id}"
    pages = 0
    while path and pages < max_pages:
        try:
            payload = fetch_json(path)
        except RuntimeError as e:
            if "no" in str(e).lower() and "found" in str(e).lower():
                if pages == 0:
                    print(f"  No {category} leaderboard for team {team_id}")
                break
            raise
        data = payload.get("data", [])
        if not data:
            break
        all_items.extend(data)
        next_path = payload.get("page", {}).get("next")
        path = next_path if next_path else None
        pages += 1
    return all_items


def run():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Players from current team
    print(f"Fetching players from team {TEAM_ID}...")
    players_payload = fetch_json(f"team/get-team-players/{TEAM_ID}")
    players = build_players(players_payload.get("data", []))
    print(f"  Found {len(players)} players")

    # Matches from legacy team (filtered to LEGACY_YEAR only)
    print(f"Fetching legacy matches from team {LEGACY_TEAM_ID} (year {LEGACY_YEAR})...")
    legacy_matches_raw = fetch_matches_safe(LEGACY_TEAM_ID, MAX_MATCH_PAGES)
    legacy_matches_raw = [m for m in legacy_matches_raw if parse_match_year(m) == LEGACY_YEAR]
    print(f"  Found {len(legacy_matches_raw)} matches from {LEGACY_YEAR}")

    # Matches from current team
    print(f"Fetching matches from team {TEAM_ID}...")
    current_matches_raw = fetch_matches_safe(TEAM_ID, MAX_MATCH_PAGES)
    print(f"  Found {len(current_matches_raw)} matches")

    # Deduplicate by match_id, preferring current team's data
    seen_ids = set()
    combined_raw = []
    for m in current_matches_raw + legacy_matches_raw:
        mid = m.get("match_id")
        if mid and mid not in seen_ids:
            seen_ids.add(mid)
            combined_raw.append(m)

    matches = [build_match(m) for m in combined_raw]
    print(f"  Total combined matches: {len(matches)}")

    team_stats = build_team_stats(combined_raw, {TEAM_ID, LEGACY_TEAM_ID})

    # Leaderboard (kept for quick summary on homepage)
    print("Fetching leaderboards...")
    leaderboard = {}
    for category in ("batting", "bowling", "fielding"):
        legacy_items = fetch_leaderboard_safe(LEGACY_TEAM_ID, category)
        current_items = fetch_leaderboard_safe(TEAM_ID, category)
        seen_pids = set()
        merged = []
        for item in current_items:
            pid = item.get("player_id")
            if pid:
                seen_pids.add(pid)
            merged.append(item)
        for item in legacy_items:
            if item.get("player_id") not in seen_pids:
                merged.append(item)
        leaderboard[category] = build_leaderboard(category, merged)

    # Fetch career stats for each roster player via the player stats API
    print(f"Fetching career stats for {len(players)} players...")
    player_stats = []
    for i, p in enumerate(players):
        pid = p.get("player_id")
        name = p.get("name", "")
        slug = p.get("slug", make_slug(name))
        photo = p.get("profile_pic_url", "")
        if pid:
            entry = build_player_stats_from_api(pid, name, slug, photo)
            player_stats.append(entry)
            match_count = entry.get("batting", {}).get("matches", 0) or entry.get("bowling", {}).get("matches", 0)
            print(f"  [{i + 1}/{len(players)}] {name}: {match_count} matches")
        else:
            player_stats.append({
                "player_id": pid, "name": name, "slug": slug,
                "profile_photo": photo,
                "batting": {}, "bowling": {}, "fielding": {},
            })
        time.sleep(0.3)
    player_stats.sort(key=lambda p: p.get("name", ""))

    save_json("players.json", players)
    save_json("matches.json", matches)
    save_json("team_stats.json", team_stats)
    save_json("leaderboard.json", leaderboard)
    save_json("player_stats.json", player_stats)
    print("Done!")


try:
    run()
except Exception as e:
    print("❌ Failed to fetch CricHeroes data")
    print(e)
    sys.exit(1)
