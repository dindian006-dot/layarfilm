$git = "C:\Program Files\Git\cmd\git.exe"
Write-Host "Starting sync to GitHub..."

# Add all changes
& $git add .

# Check if there are changes to commit
$status = & $git status --porcelain
if ($status) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "Changes detected. Committing..."
    & $git commit -m "Auto-sync: $timestamp"
    
    # Try pushing to main then master if main fails
    Write-Host "Pushing to GitHub..."
    $pushResult = & $git push origin main 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Push to 'main' failed, trying 'master'..."
        & $git push origin master
    }
} else {
    Write-Host "No changes to sync."
}

Write-Host "Sync completed."
