# RentFix NPM Setup for Windows - QUICK FIX GUIDE
## Windows PowerShell Commands (Not Linux/Bash)

---

## 🔧 YOUR IMMEDIATE ISSUE

**Error You Got:**
```
The `npm ci` command can only install with an existing package-lock.json
```

**Cause:** You deleted the lock file, but `npm ci` needs it to exist.

**Solution:** Use `npm install` first (not `npm ci`) to regenerate lock file.

---

## ✅ CORRECT WINDOWS COMMANDS

### Quick Fix (Right Now)
```powershell
# You're in the right place, just run:
npm install

# That's it! This will:
# 1. Read package.json
# 2. Download all dependencies
# 3. Create new package-lock.json
# 4. Install everything
```

---

## ⚠️ TWO DIFFERENT NPM COMMANDS

### `npm install` (What you need NOW)
- Used when: Installing for first time or after deleting lock file
- What it does: Creates NEW package-lock.json
- When: During development when you need fresh install
- On Windows: Use this when you've cleaned everything

### `npm ci` (For CI/CD and production)
- Used when: Lock file already exists
- What it does: Uses EXISTING package-lock.json (faster, more reproducible)
- When: In GitHub Actions, Docker, production builds
- On Windows: Use after you have a lock file

---

## 🚀 COMPLETE WINDOWS SETUP (DO THIS NOW)

```powershell
# Step 1: Navigate to project
cd "C:\Users\malikoseni\OneDrive - GT Stewart\my files\Rentfix"

# Step 2: Verify you're in the right place
ls   # Should show package.json, apps/, services/, etc.

# Step 3: Clean cache (optional but recommended)
npm cache clean --force

# Step 4: INSTALL (NOT ci!) to create lock file
npm install

# Step 5: Verify installation
npm list --depth=0

# Step 6: Run audit
npm audit --audit-level=moderate

# Step 7: Check types
npx tsc --noEmit

# Step 8: All done! Start development
npm run dev
```

---

## 📝 WHAT'S DIFFERENT ON WINDOWS

| Step | Linux | Windows PowerShell |
|------|-------|-------------------|
| Remove folder | `rm -rf node_modules` | `Remove-Item -Path "node_modules" -Recurse -Force` |
| Remove file | `rm package-lock.json` | `Remove-Item -Path "package-lock.json" -Force` |
| Install (recreate lock) | `npm install` | `npm install` (SAME) |
| Install (use existing lock) | `npm ci` | `npm ci` (SAME) |
| List packages | `npm list --depth=0` | `npm list --depth=0` (SAME) |
| Start dev | `npm run dev` | `npm run dev` (SAME) |

---

## ⚠️ WARNINGS YOU'LL SEE (IGNORE THEM)

**Warning 1: Unknown config**
```
npm warn Unknown project config "workspace-root-path"
npm warn Unknown project config "strict-peer-dependencies"
```
→ **OK to ignore.** Your npm version doesn't recognize these. They work fine.

**Warning 2: Recommended protections disabled**
```
npm warn using --force Recommended protections disabled.
```
→ **OK to ignore.** The `--force` flag is needed for clean cache. Safe.

---

## 🎯 WHEN TO USE WHICH COMMAND

### Use `npm install`:
- ✅ First time setup
- ✅ After deleting lock file
- ✅ When you want newest compatible versions
- ✅ During development
- ✅ **YOU ARE HERE - USE THIS**

### Use `npm ci`:
- ✅ Lock file already exists
- ✅ In CI/CD pipelines (GitHub Actions)
- ✅ Docker containers
- ✅ Production environments
- ✅ When you want exact versions from lock file

---

## ✅ AFTER `npm install` SUCCEEDS

You'll see:
```
added XXX packages, and audited XXX packages in XXs
found 0 vulnerabilities
```

**Then check these:**

```powershell
# 1. Verify packages installed
npm list --depth=0
# Should show: rentfix-monorepo@0.1.0 and all dependencies

# 2. Check for security issues
npm audit --audit-level=moderate
# Should say: found 0 vulnerabilities

# 3. Check types
npx tsc --noEmit
# Should have no errors

# 4. Check linting
npm run lint
# Should have no errors

# 5. Start development
npm run dev
# Should show services starting on ports 3000, 4000, etc.
```

---

## 🆘 IF `npm install` STILL FAILS

### Error: "npm ERR! code ERESOLVE"
```powershell
# Try this:
npm install --legacy-peer-deps
```

### Error: "Cannot find module"
```powershell
# Clean everything and try again:
npm cache clean --force
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
npm install
```

### Error: "EACCES: permission denied"
```powershell
# Run PowerShell as Administrator:
# Right-click PowerShell → Run as administrator
# Then try npm install again
```

---

## 📚 UNDERSTANDING THE MONOREPO STRUCTURE

```
Rentfix/
├── package.json          ← Root workspace config
├── package-lock.json     ← Lock file (auto-generated, DO NOT edit)
├── apps/
│   ├── web-agent/        ← Next.js app
│   └── mobile-tenant/
├── services/             ← Backend services
├── packages/             ← Shared code
└── node_modules/         ← All dependencies (symlinked)
```

**When you run `npm install`:**
1. Reads root `package.json` and all workspace package.json files
2. Downloads all dependencies to root `node_modules/`
3. Symlinks them for each workspace
4. Creates/updates `package-lock.json`
5. Everything ready to develop!

---

## ✨ NEXT STEPS (WINDOWS)

**Right now:**
```powershell
npm install
```

**After that succeeds:**
```powershell
npm list --depth=0
npm audit --audit-level=moderate
npx tsc --noEmit
npm run dev
```

**Access applications:**
- Dashboard: http://localhost:3000
- API Gateway: http://localhost:4000

---

## 🎓 UNDERSTANDING .npmrc WARNINGS

You saw:
```
npm warn Unknown project config "workspace-root-path"
npm warn Unknown project config "strict-peer-dependencies"
```

This is in your `.npmrc` file. Your current npm doesn't recognize these options, but:
- ✅ They don't break anything
- ✅ They're for future npm versions
- ✅ Safe to ignore
- ✅ Will go away when npm is updated

---

## ✅ WINDOWS-READY CHECKLIST

Before running `npm install`:
- [ ] In correct directory (can see package.json)
- [ ] Ran `npm cache clean --force` (optional)
- [ ] Deleted old node_modules and lock file
- [ ] Ready to run `npm install`

After `npm install` completes:
- [ ] `npm list --depth=0` shows all packages
- [ ] `npm audit --audit-level=moderate` shows 0 vulnerabilities
- [ ] `npx tsc --noEmit` shows no errors
- [ ] Ready to run `npm run dev`

---

**You're in the final stretch! Just run `npm install` and you're done!** 🚀

**Windows PowerShell + npm works perfectly!** ✨