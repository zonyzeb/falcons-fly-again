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


def build_players(items):
    output = []
    for item in items:
        player_id = item.get("player_id")
        output.append(
            {
                "name": item.get("name") or "",
                "sub_title": item.get("player_skill") or "",
                "profile_url": f"https://cricheroes.com/player-profile/{player_id}"
                if player_id
                else "",
                "profile_pic_url": item.get("profile_photo") or "",
            }
        )
    return output


def safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def build_player_stats(batting_data, bowling_data, fielding_data):
    """Merge batting, bowling, and fielding leaderboard data into per-player stats."""
    players = {}

    for item in batting_data:
        pid = item.get("player_id")
        if not pid:
            continue
        players[pid] = {
            "player_id": pid,
            "name": item.get("name") or "",
            "profile_photo": item.get("profile_photo") or "",
            "batting": {
                "innings": safe_int(item.get("innings")),
                "runs": safe_int(item.get("total_runs")),
                "balls_faced": safe_int(item.get("ball_faced")),
                "highest_score": safe_int(item.get("highest_run")),
                "highest_score_not_out": item.get("highest_run_with_not_out") or "",
                "average": safe_float(item.get("average")),
                "strike_rate": safe_float(item.get("strike_rate")),
                "not_outs": safe_int(item.get("not_out")),
                "fours": safe_int(item.get("4s")),
                "sixes": safe_int(item.get("6s")),
                "fifties": safe_int(item.get("50s")),
                "hundreds": safe_int(item.get("100s")),
            },
            "bowling": {},
            "fielding": {},
        }

    for item in bowling_data:
        pid = item.get("player_id")
        if not pid:
            continue
        if pid not in players:
            players[pid] = {
                "player_id": pid,
                "name": item.get("name") or "",
                "profile_photo": item.get("profile_photo") or "",
                "batting": {},
                "bowling": {},
                "fielding": {},
            }
        players[pid]["bowling"] = {
            "innings": safe_int(item.get("innings")),
            "wickets": safe_int(item.get("total_wickets")),
            "overs": item.get("overs") or "0",
            "runs_conceded": safe_int(item.get("runs")),
            "best_figures": safe_int(item.get("highest_wicket")),
            "economy": safe_float(item.get("economy")),
            "average": safe_float(item.get("avg")),
            "strike_rate": safe_float(item.get("SR")),
            "maidens": safe_int(item.get("maidens")),
        }

    for item in fielding_data:
        pid = item.get("player_id")
        if not pid:
            continue
        if pid not in players:
            players[pid] = {
                "player_id": pid,
                "name": item.get("name") or "",
                "profile_photo": item.get("profile_photo") or "",
                "batting": {},
                "bowling": {},
                "fielding": {},
            }
        players[pid]["fielding"] = {
            "matches": safe_int(item.get("total_match")),
            "catches": safe_int(item.get("catches")),
            "caught_behind": safe_int(item.get("caught_behind")),
            "run_outs": safe_int(item.get("run_outs")),
            "assisted_run_outs": safe_int(item.get("assist_run_outs")),
            "stumpings": safe_int(item.get("stumpings")),
            "caught_and_bowled": safe_int(item.get("caught_and_bowl")),
            "total_dismissals": safe_int(item.get("total_dismissal")),
        }

    return sorted(players.values(), key=lambda p: p.get("name", ""))


def fetch_matches_safe(team_id, max_pages):
    try:
        return fetch_paginated(f"team/get-team-match/{team_id}", max_pages)
    except RuntimeError as e:
        if "hasn't played any matches" in str(e):
            print(f"  No matches found for team {team_id}")
            return []
        raise


def fetch_leaderboard_safe(team_id, category):
    try:
        payload = fetch_json(f"leaderboard/get-team-{category}-leaderboard/{team_id}")
        return payload.get("data", [])
    except RuntimeError as e:
        if "no" in str(e).lower() and "found" in str(e).lower():
            print(f"  No {category} leaderboard for team {team_id}")
            return []
        raise


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

    # Leaderboard: try current team first, fall back to legacy
    print("Fetching leaderboards...")
    raw_leaderboards = {}
    leaderboard = {}
    for category in ("batting", "bowling", "fielding"):
        items = fetch_leaderboard_safe(TEAM_ID, category)
        if not items:
            items = fetch_leaderboard_safe(LEGACY_TEAM_ID, category)
        raw_leaderboards[category] = items
        leaderboard[category] = build_leaderboard(category, items)

    # Per-player stats merged from all leaderboards
    print("Building player stats...")
    player_stats = build_player_stats(
        raw_leaderboards.get("batting", []),
        raw_leaderboards.get("bowling", []),
        raw_leaderboards.get("fielding", []),
    )
    print(f"  Stats for {len(player_stats)} players")

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
