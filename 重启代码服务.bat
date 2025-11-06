@echo off
echo Killing all Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo Starting development server...
pnpm dev

pause

