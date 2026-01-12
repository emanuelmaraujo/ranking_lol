$ErrorActionPreference = "Stop"

# Configuration
$ContainerName = "ranking_db"
$DbUser = "ranking_admin" # NEW secure user from .env
$DbName = "ranking_lol"
$BackupFile = "..\backups\ranking_lol_latest.sql"

if (-not (Test-Path $BackupFile)) {
    Write-Error "Backup file not found: $BackupFile"
    exit 1
}

Write-Host "Starting restore for $DbName..."

try {
    # 1. Copy backup to container
    docker cp "$BackupFile" "$ContainerName`:/tmp/restore.sql"
    
    # 2. Drop existing connections (ignoring errors if no connections)
    # This is often needed if api is running
    # but since we just started, might be fine. 
    # Let's try direct psql restore.
    
    # 3. Restore
    # We use -d postgres first to drop/create target DB if needed, 
    # but often pg_dump -c includes DROP TABLE. 
    # Since we push schema with prisma, tables exist, but empty.
    # The backup has DROP commands (-c).
    
    docker exec -t $ContainerName psql -U $DbUser -d $DbName -f "/tmp/restore.sql"
    
    # 4. Cleanup
    docker exec $ContainerName rm "/tmp/restore.sql"
    
    Write-Host "Restore Success!"
} catch {
    Write-Error "Restore Failed: $_"
    exit 1
}
