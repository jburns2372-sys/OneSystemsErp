$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$recoveryDir = "C:\Users\user\Documents\JD SOFTWARE PROJECTS\OneSystemsErp\OneSystemsERP_Checkpoints\Gate9D-Interrupted-Recovery-$timestamp"
New-Item -ItemType Directory -Force -Path $recoveryDir | Out-Null

$repo = "C:\Users\user\Documents\JD SOFTWARE PROJECTS\OneSystemsErp\PGH-PMS_saved 06-11-2026_11pm"
Set-Location -Path $repo

git branch --show-current > "$recoveryDir\branch.txt"
git rev-parse HEAD > "$recoveryDir\head.txt"
git status > "$recoveryDir\status.txt"
git diff > "$recoveryDir\diff_unstaged.txt"
git diff --cached > "$recoveryDir\diff_staged.txt"
git ls-files --others --exclude-standard > "$recoveryDir\untracked_files.txt"
git stash list > "$recoveryDir\stash_list.txt"
"C:\Users\user\Documents\JD SOFTWARE PROJECTS\OneSystemsErp\OneSystemsERP_Checkpoints\Gate9D-20260718-122114" > "$recoveryDir\prior_checkpoint.txt"

$changedFiles = git diff --name-only
foreach ($file in $changedFiles) {
    if (-not [string]::IsNullOrWhiteSpace($file) -and (Test-Path -Path $file -PathType Leaf)) {
        $target = Join-Path $recoveryDir $file
        $parent = Split-Path -Parent $target
        if (!(Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
        Copy-Item -Path $file -Destination $target -Force
    }
}

$untrackedFiles = git ls-files --others --exclude-standard
foreach ($file in $untrackedFiles) {
    if (-not [string]::IsNullOrWhiteSpace($file) -and (Test-Path -Path $file -PathType Leaf)) {
        $target = Join-Path $recoveryDir $file
        $parent = Split-Path -Parent $target
        if (!(Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }
        Copy-Item -Path $file -Destination $target -Force
    }
}
Write-Output "RECOVERY_DIR=$recoveryDir"
