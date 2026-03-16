# Run this script AFTER you've created a new empty repo on GitHub.
# Usage: .\push-to-github.ps1 -RepoUrl "https://github.com/YOUR_USERNAME/rugsniffer.git"

param(
    [Parameter(Mandatory=$true)]
    [string]$RepoUrl
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Git is not installed or not in PATH. Install from https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

Write-Host "Initializing git and committing..." -ForegroundColor Cyan
git init
git add .
git commit -m "Initial commit: RugSniffer DeFi app with backend"

Write-Host "Setting main branch and remote..." -ForegroundColor Cyan
git branch -M main
git remote remove origin 2>$null
git remote add origin $RepoUrl

Write-Host "Pushing to GitHub (you may be prompted to sign in)..." -ForegroundColor Cyan
git push -u origin main

Write-Host "Done. Go to https://vercel.com and import this repo." -ForegroundColor Green
