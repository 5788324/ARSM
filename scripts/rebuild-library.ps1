param(
  [string]$LibraryRoot = 'C:\Users\YANG\Music\arsm.one'
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$dbPath = Join-Path $repoRoot 'prisma\arsm.db'
$backupDir = Join-Path $repoRoot 'prisma\backups'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = Join-Path $backupDir ("arsm-$timestamp.db")

New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
Copy-Item -Path $dbPath -Destination $backupPath -Force
Write-Host "数据库已备份到: $backupPath"

@"
import sqlite3
from pathlib import Path

db = Path(r'$dbPath')
conn = sqlite3.connect(db)
cur = conn.cursor()
cur.executescript('''
DELETE FROM track_files;
DELETE FROM tracks;
DELETE FROM work_tags;
DELETE FROM work_voice_actors;
DELETE FROM work_sources;
DELETE FROM favorites;
DELETE FROM listening_history;
DELETE FROM import_jobs;
DELETE FROM metadata_jobs;
DELETE FROM acquisition_jobs;
DELETE FROM works;
DELETE FROM circles;
DELETE FROM tags;
DELETE FROM voice_actors;
VACUUM;
''')
conn.commit()
conn.close()
print('数据库旧作品记录已清空')
"@ | python -

Push-Location $repoRoot
try {
  & .\node_modules\.bin\tsx.cmd .\scripts\rebuild-library.ts $LibraryRoot
  if ($LASTEXITCODE -ne 0) {
    throw "重建导入失败，退出码: $LASTEXITCODE"
  }
} finally {
  Pop-Location
}
