# PodWatch Mobile (React Native + Expo)

Mobile-first React Native rewrite with expanded feature parity and polish.

## Included features

- Animated splash screen
- Home mission screen
- Top Shows carousel (latest episode links)
- Guide screen (featured shows + latest episodes)
- Detailed show pages for 6 featured shows
- Discover screen with:
  - Top podcasts
  - Editors picks
  - Categories
  - Recommendations
  - New episodes
- Contact form (email compose)
- Favorites system (star actions)
- Saved screen for all favorites
- Search + pull-to-refresh on core content screens
- Tab icons and refreshed visual styling

## Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe app.py
```

## Mobile setup

```bash
cd mobile
npm install
npm start
```

## API base URL

Set `EXPO_PUBLIC_API_BASE_URL` if needed:

- Android emulator: `http://10.0.2.2:5000`
- iOS simulator: `http://localhost:5000`
- Physical device: `http://YOUR_LAN_IP:5000`

PowerShell example:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL='http://192.168.1.12:5000'
npm start
```
