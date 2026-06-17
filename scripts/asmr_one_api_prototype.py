import json
import os
import sys
import urllib.parse
import urllib.request


API_BASE = "https://api.asmr-300.com"
COMMON_HEADERS = {
    "Origin": "https://asmr.one",
    "Referer": "https://asmr.one/",
    "User-Agent": "Mozilla/5.0",
}


def http_json(url: str, method: str = "GET", data: bytes | None = None, headers: dict | None = None):
    req_headers = dict(COMMON_HEADERS)
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, data=data, headers=req_headers, method=method)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def login_guest() -> str:
    body = json.dumps({"name": "guest", "password": "guest"}).encode("utf-8")
    payload = http_json(
        f"{API_BASE}/api/auth/me",
        method="POST",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    token = payload.get("token")
    if not token:
        raise RuntimeError("guest login failed: token missing")
    return token


def fetch_work(work_id: str, token: str):
    return http_json(
        f"{API_BASE}/api/work/{work_id}",
        headers={"Authorization": f"Bearer {token}"},
    )


def fetch_tracks(work_id: str, token: str):
    return http_json(
        f"{API_BASE}/api/tracks/{work_id}?v=2",
        headers={"Authorization": f"Bearer {token}"},
    )


def flatten_tracks(nodes, base_path=""):
    files = []
    for node in nodes:
        title = node.get("title", "")
        current_path = f"{base_path}/{title}" if base_path else title
        if node.get("type") == "folder":
            files.extend(flatten_tracks(node.get("children", []), current_path))
            continue
        files.append(
            {
                "path": current_path,
                "type": node.get("type"),
                "size": node.get("size"),
                "hash": node.get("hash"),
                "mediaStreamUrl": node.get("mediaStreamUrl"),
                "mediaDownloadUrl": node.get("mediaDownloadUrl"),
                "streamLowQualityUrl": node.get("streamLowQualityUrl"),
            }
        )
    return files


def main():
    if len(sys.argv) < 2:
        print("usage: python scripts/asmr_one_api_prototype.py RJ01538000")
        raise SystemExit(1)

    source_id = sys.argv[1].upper()
    work_id = "".join(ch for ch in source_id if ch.isdigit())

    token = login_guest()
    work = fetch_work(work_id, token)
    tracks = fetch_tracks(work_id, token)
    files = flatten_tracks(tracks)

    result = {
        "sourceId": source_id,
        "workId": work_id,
        "title": work.get("title"),
        "release": work.get("release"),
        "hasSubtitle": work.get("has_subtitle"),
        "fileCount": len(files),
        "files": files,
    }

    text = json.dumps(result, ensure_ascii=False, indent=2)
    if os.name == "nt":
        sys.stdout.buffer.write(text.encode("utf-8", errors="replace"))
        sys.stdout.buffer.write(b"\n")
    else:
        print(text)


if __name__ == "__main__":
    main()
