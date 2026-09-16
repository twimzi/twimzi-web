# Twimzi Web

Standalone Next.js website frontend for Twimzi. This project is intentionally separate from the existing Flutter app at `C:\Projects\twimzi`.

## Run

```powershell
cd C:\Projects\twimzi-web
npm.cmd install
npm.cmd run dev
```

## Production checks

```powershell
npm.cmd run lint
npm.cmd run build
```

## Structure

- `src/config` — site and navigation configuration
- `src/design-system` — centralized theme tokens
- `src/components/ui` — reusable UI primitives
- `src/components/layout` — header/footer
- `src/components/home` — homepage sections
- `src/app` — routes/pages

## Next phase

Replace demo data with Supabase-backed business/product/service data without modifying the Flutter app or database schema until integration is planned.
