# PraxisLume Flutter App

Flutter client for PraxisLume v0.1 plus light v0.2.

The app uses Riverpod and `go_router`. Supabase configuration is supplied through dart defines:

```powershell
flutter run -d chrome --dart-define=SUPABASE_URL=http://127.0.0.1:54321 --dart-define=SUPABASE_ANON_KEY=<local-anon-key>
```

Use the anon key from `npx.cmd supabase status`; never pass the service-role key to Flutter.
