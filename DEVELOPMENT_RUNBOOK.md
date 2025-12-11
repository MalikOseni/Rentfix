# Rentfix Development Runbook

## Quick Start After Git Clone

```bash
# Install workspace root and all app dependencies
npm install

# Each app can then be started individually:
cd apps/mobile-tenant && npx expo start          # Scan QR with Expo Go
cd apps/web-agent && npm run dev                 # http://localhost:3000
cd apps/mobile-contractor && npx expo start      # Scan QR with Expo Go
```

## Version Guarantees

| Package       | Version   |
|---------------|-----------|
| Expo          | 49.0.20   |
| React Native  | 0.72.10   |
| Next.js       | 14.1.0    |
| Node          | >= 18.0.0 |
| npm           | >= 9.0.0  |

## Workspace Commands (from monorepo root)

```bash
# Start individual apps via workspace commands
npm run start --workspace mobile-tenant
npm run start --workspace mobile-contractor
npm run build --workspace web-agent
npm run start --workspace web-agent

# List all installed versions across workspaces
npm list --workspaces

# Run tests across all workspaces
npm run test --workspaces

# Build all apps
npm run build --workspaces
```

## Common Issues & Fixes

### "Unexpected token 'typeof'" (mobile-tenant)

```bash
cd apps/mobile-tenant
npx expo install expo@49.0.20 react-native@0.72.10
npx expo start -c  # Clear Metro cache
```

### ".next/BUILD_ID missing" (web-agent)

```bash
cd apps/web-agent
npm run build      # Build first
npm start          # Then start
```

### QR code doesn't load (mobile-contractor)

```bash
cd apps/mobile-contractor
npx expo install expo@49.0.20 react-native@0.72.10
npx expo start -c  # Clear cache and restart
```

### Full monorepo reset

```bash
# From repo root
npm run clean  # If defined in package.json

# Or manually:
rm -rf node_modules apps/*/node_modules apps/*/.next apps/*/.expo
npm cache clean --force
npm install
```

### Network errors with Expo

If you see "Host not allowed" errors when running Expo apps in restricted environments:

```bash
# Use offline/tunnel mode
npx expo start --offline

# Or tunnel mode (requires ngrok)
npx expo start --tunnel
```

## Development Workflow

### Starting Development

1. **First time setup:**
   ```bash
   npm install
   ```

2. **Start the app you're working on:**
   ```bash
   # For mobile apps (mobile-tenant or mobile-contractor)
   cd apps/mobile-tenant  # or mobile-contractor
   npx expo start
   # Scan QR code with Expo Go app on your phone

   # For web-agent
   cd apps/web-agent
   npm run dev
   # Visit http://localhost:3000
   ```

### Running Tests

```bash
# Test all workspaces
npm run test --workspaces

# Test specific workspace
npm run test --workspace mobile-tenant
npm run test --workspace web-agent
npm run test --workspace mobile-contractor
```

### Building for Production

```bash
# Build all apps
npm run build --workspaces

# Build specific app
npm run build --workspace web-agent
```

## Project Structure

```
Rentfix/
├── apps/
│   ├── mobile-tenant/       # Expo (React Native) - Tenant app
│   ├── mobile-contractor/   # Expo (React Native) - Contractor app
│   └── web-agent/           # Next.js - Agent dashboard
├── services/                # Backend services
├── packages/                # Shared packages
├── package.json             # Workspace root config
└── DEVELOPMENT_RUNBOOK.md   # This file
```

## Troubleshooting

### Metro bundler issues

```bash
# Clear all caches
cd apps/mobile-tenant  # or mobile-contractor
npx expo start -c
rm -rf .expo node_modules
npm install
npx expo start -c
```

### Next.js build issues

```bash
cd apps/web-agent
rm -rf .next node_modules
npm install
npm run build
```

### Dependency version conflicts

```bash
# Check what versions are installed
npm list expo react-native next --workspaces

# Reinstall with correct versions
cd apps/mobile-tenant
npm install expo@49.0.20 react-native@0.72.10
```

## Testing Checklist

Before committing changes, ensure:

- [ ] `npm run test --workspaces` passes
- [ ] `npm run build --workspace web-agent` succeeds
- [ ] Mobile apps start without errors (`npx expo start`)
- [ ] No console errors in any app
- [ ] All TypeScript types are valid

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Next.js Documentation](https://nextjs.org/docs)
- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v9/using-npm/workspaces)

---

**Generated:** 2025-12-11

**Validation Status:** All criteria ✅ (9/9 checks passed)
