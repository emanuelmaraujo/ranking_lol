$ErrorActionPreference = "Stop"

# Configuration
$ContainerName = "ranking_db"
$DbUser = "admin" # Current insecure user, will be updated later to use Env if needed
$DbName = "ranking_lol"
$BackupDir = "..\backups"
$Date = Get-Date -Format "yyyyMMdd-HHmm"
$Filename = "ranking_lol_latest.sql" # Fixed name for overwrite strategy as requested
$ArchiveName = "ranking_lol_$Date.sql" # Timestamped version for history

# Create Backup Directory
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

Write-Host "Starting backup for $DbName..."

# Execute pg_dump inside container
try {
    # 1. Create Timestamped Backup (History)
    docker exec -t $ContainerName pg_dump -U $DbUser -d $DbName -c --no-owner -f "/tmp/$ArchiveName"
    
    # 2. Copy to Host
    docker cp "$ContainerName`:/tmp/$ArchiveName" "$BackupDir\$ArchiveName"
    
    # 3. Create/Overwrite "Latest" copy
    Copy-Item -Path "$BackupDir\$ArchiveName" -Destination "$BackupDir\$Filename" -Force
    
    # 4. Cleanup container
    docker exec $ContainerName rm "/tmp/$ArchiveName"
    
    Write-Host "Backup Success!"
    Write-Host "Latest: $BackupDir\$Filename"
    Write-Host "Archive: $BackupDir\$ArchiveName"
} catch {
    Write-Error "Backup Failed: $_"
    exit 1
}
