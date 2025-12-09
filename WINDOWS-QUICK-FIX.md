# RentFix NPM Setup for Windows - QUICK FIX GUIDE
## Windows PowerShell Commands (Not Linux/Bash)

---

## 🔧 YOUR IMMEDIATE ISSUE

**Error You Got:**
```
Remove-Item: A parameter cannot be found that matches parameter name 'rf'.
```

**Cause:** PowerShell uses different commands than Linux bash.

**Solution:** Use Windows PowerShell syntax below.

---

## ✅ CORRECT WINDOWS COMMANDS

### Step 1: Clean NPM Cache (SAME ON WINDOWS)
```powershell
npm cache clean --force
```

✓ This works the same on Windows

---

### Step 2: Remove node_modules (WINDOWS SYNTAX)

**❌ WRONG (Linux/Bash):**
```bash
rm -rf node_modules
```

**✅ CORRECT (Windows PowerShell):**
```powershell
Remove-Item -Path "node_modules" -Recurse -Force
```

Or shorter version:
```powershell
rmdir /s /q node_modules
```

---

## 🚀 WINDOWS CLEANUP ONE-LINER

Copy and paste this into PowerShell:

```powershell
npm cache clean --force; Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue; Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue; Write-Host "✓ Clean and ready for npm ci" -ForegroundColor Green
```

---

## 📋 COMPLETE WINDOWS SETUP STEPS

```powershell
# Step 1: Navigate to project
cd "C:\Users\malikoseni\OneDrive - GT Stewart\my files\Rentfix"

# Step 2: Clean NPM cache
npm cache clean --force

# Step 3: Remove node_modules
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue

# Step 4: Remove lock files
Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "npm-shrinkwrap.json" -Force -ErrorAction SilentlyContinue

# Step 5: Fresh install
npm ci

# Step 6: Verify
npm list --depth=0
npm audit --audit-level=moderate

# Step 7: Type check
npx tsc --noEmit

# All done! Run this to start development:
# npm run dev
```

---

## 🪟 WINDOWS POWERSHELL VS LINUX BASH

| Action | Linux Bash | Windows PowerShell |
|--------|-----------|-------------------|
| Remove folder | `rm -rf node_modules` | `Remove-Item -Path "node_modules" -Recurse -Force` |
| Remove file | `rm file.json` | `Remove-Item -Path "file.json" -Force` or `del file.json` |
| List files | `ls` | `Get-ChildItem` or `dir` |
| Clear cache | `npm cache clean --force` | `npm cache clean --force` (same) |
| Navigate (with spaces) | `cd "my folder"` | `cd "my folder"` (same) |

---

## ⚙️ IF YOU SEE WARNINGS

**Warning: Unknown project config**
```
npm warn Unknown project config "workspace-root-path"
npm warn Unknown project config "strict-peer-dependencies"
```
→ **This is OK.** Ignore it. Your npm version doesn't recognize these, but they work fine.

**Warning: Recommended protections disabled**
```
npm warn using --force Recommended protections disabled.
```
→ **This is OK.** The `--force` flag is needed for clean cache. This is safe.

---

## ✅ YOU'RE READY!

After running the commands above:
```powershell
# Start database
docker-compose up -d

# Start development
npm run dev

# Apps will be at:
# - http://localhost:3000 (Next.js Dashboard)
# - http://localhost:4000 (API Gateway)
```

---

**Windows PowerShell is fully supported. Just use the right commands!** 🚀