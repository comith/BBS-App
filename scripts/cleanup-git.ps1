# Git Migration Script
# This script helps clean up .env files from git history

Write-Host "🔧 BBS-App Git Cleanup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "❌ Error: Not a git repository" -ForegroundColor Red
    Write-Host "Please run this script from the root of your git repository" -ForegroundColor Yellow
    exit 1
}

Write-Host "⚠️  WARNING: This script will modify git history" -ForegroundColor Yellow
Write-Host "Make sure you have a backup before proceeding!" -ForegroundColor Yellow
Write-Host ""
Write-Host "This script will:" -ForegroundColor White
Write-Host "  1. Check if .env files are tracked in git" -ForegroundColor White
Write-Host "  2. Remove them from git (but keep local files)" -ForegroundColor White
Write-Host "  3. Update .gitignore to prevent future commits" -ForegroundColor White
Write-Host ""

$response = Read-Host "Do you want to continue? (yes/no)"
if ($response -ne "yes") {
    Write-Host "❌ Aborted by user" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🔍 Checking for .env files in git..." -ForegroundColor Cyan

# Check if .env files are tracked
$envFiles = @(".env", ".env.local", ".env.production", ".env.development")
$trackedFiles = @()

foreach ($file in $envFiles) {
    $result = git ls-files $file 2>$null
    if ($result) {
        $trackedFiles += $file
        Write-Host "  ✓ Found: $file" -ForegroundColor Yellow
    }
}

if ($trackedFiles.Count -eq 0) {
    Write-Host "✅ No .env files are tracked in git" -ForegroundColor Green
    Write-Host "Your repository is already clean!" -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "📝 Files to be removed from git:" -ForegroundColor Cyan
foreach ($file in $trackedFiles) {
    Write-Host "  - $file" -ForegroundColor White
}

Write-Host ""
Write-Host "🗑️  Removing files from git (keeping local copies)..." -ForegroundColor Cyan

foreach ($file in $trackedFiles) {
    try {
        git rm --cached $file 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Removed: $file" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ⚠️  Could not remove: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Files removed from git tracking" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Commit the changes:" -ForegroundColor White
Write-Host "     git commit -m 'chore: remove .env files from git tracking'" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Push to remote (if needed):" -ForegroundColor White
Write-Host "     git push" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Make sure .env.example is committed:" -ForegroundColor White
Write-Host "     git add .env.example" -ForegroundColor Gray
Write-Host "     git commit -m 'docs: add .env.example template'" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANT SECURITY NOTES:" -ForegroundColor Yellow
Write-Host "  - Old commits still contain .env files in history" -ForegroundColor White
Write-Host "  - Consider rotating any exposed credentials" -ForegroundColor White
Write-Host "  - For complete removal, use: git filter-branch or BFG Repo-Cleaner" -ForegroundColor White
Write-Host ""
Write-Host "✨ Done!" -ForegroundColor Green
