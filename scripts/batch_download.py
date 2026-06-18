"""Batch download asmr.one works via API."""
import json, os, sys, time, urllib.request

API_BASE = "https://api.asmr-300.com"
OUTDIR = "C:/Users/YANG/Music/arsm.one"
HEADERS = {"Origin": "https://asmr.one", "Referer": "https://asmr.one/", "User-Agent": "Mozilla/5.0"}

def api(method, path, data=None, token=None):
    h = dict(HEADERS)
    if token: h["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    if body: h["Content-Type"] = "application/json"
    req = urllib.request.Request(f"{API_BASE}{path}", data=body, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())

def flatten(nodes, base=""):
    files = []
    for n in nodes:
        title = n.get("title", "")
        path = f"{base}/{title}" if base else title
        if n.get("type") == "folder":
            files.extend(flatten(n.get("children", []), path))
        else:
            files.append({
                "path": path, "size": n.get("size", 0),
                "url": n.get("mediaDownloadUrl", ""),
            })
    return files

def download(url, dest, retries=3):
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    for attempt in range(retries):
        try:
            r = urllib.request.urlopen(url, timeout=120)
            with open(dest, "wb") as f:
                while True:
                    chunk = r.read(8192)
                    if not chunk: break
                    f.write(chunk)
            return os.path.getsize(dest)
        except Exception as e:
            if attempt == retries - 1: raise
            time.sleep(2 * (attempt + 1))

def process(rid):
    code = "".join(c for c in rid.upper() if c.isdigit())
    print(f"\n{'='*60}\n{rid}")
    
    token = api("POST", "/api/auth/me", {"name":"guest","password":"guest"})["token"]
    work = api("GET", f"/api/work/{code}", token=token)
    tracks = api("GET", f"/api/tracks/{code}?v=2", token=token)
    files = flatten(tracks)
    
    total = sum(f["size"] for f in files)
    print(f"  标题: {work.get('title','')[:50]}...")
    print(f"  文件: {len(files)}  大小: {total/1e6:.1f} MB")
    
    ok = fail = 0
    t0 = time.time()
    for i, f in enumerate(files):
        dest = os.path.join(OUTDIR, rid, f["path"])
        if os.path.exists(dest) and os.path.getsize(dest) == f["size"]:
            ok += 1
            continue  # skip already downloaded
        try:
            sz = download(f["url"], dest)
            ok += 1
            elapsed = time.time() - t0
            speed = (sum(f2["size"] for f2 in files[:i+1]) / 1e6) / max(elapsed, 1)
            print(f"  [{i+1}/{len(files)}] {f['path'][-50:]} ({sz/1e6:.1f}MB) {speed:.1f}MB/s")
        except Exception as e:
            fail += 1
            print(f"  [{i+1}/{len(files)}] FAIL: {f['path'][-50:]} - {e}")
    
    print(f"  结果: {ok} 成功, {fail} 失败, {time.time()-t0:.0f}s")
    return ok, fail

if __name__ == "__main__":
    works = sys.argv[1:] if len(sys.argv) > 1 else ["RJ01591098", "RJ01584624", "RJ01586040"]
    total_ok = total_fail = 0
    for w in works:
        ok, fail = process(w)
        total_ok += ok
        total_fail += fail
    print(f"\n{'='*60}\n总计: {total_ok} 成功, {total_fail} 失败")
