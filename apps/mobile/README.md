# PocketPal Mobile (Expo)

## Package manager

This app is part of a pnpm monorepo. Use pnpm only.

## Local development

```bash
cd apps/mobile
pnpm install --frozen-lockfile
pnpm start
```

## Android preview build (EAS)

```bash
cd apps/mobile
pnpm exec eas build -p android --profile preview
```

## Android production build (EAS)

```bash
cd apps/mobile
pnpm exec eas build -p android --profile production
```

## iOS production build (EAS)

```bash
cd apps/mobile
pnpm exec eas build -p ios --profile production
```
