$envFile = ".env.uat-v4-r7"
$dbUrl = (Get-Content $envFile | Where-Object { $_ -match "^DATABASE_URL=" } | ForEach-Object { $_ -replace "^DATABASE_URL=`"?([^`"]+)`"?$", "`$1" })

if (!(Test-Path "backups")) {
    New-Item -ItemType Directory -Force -Path "backups"
}

$dumpFile = "backups\scheduling-reconstruction-uat-v4-r7-pre-gate11d-activation.dump"

Write-Host "Starting backup..."
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" --dbname=$dbUrl -F c -f $dumpFile

Write-Host "Backup completed."
Write-Host "Checking file existence and size..."
$file = Get-Item $dumpFile
Write-Host "Size: $($file.Length) bytes"

Write-Host "Checking TOC..."
& "C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" --list $dumpFile | Select-String "ProjectSchedule|ScheduleApproval|ScheduleReviewComment|BaselineActivation" | Select-Object -First 10
