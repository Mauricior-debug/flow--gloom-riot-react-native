# GLOOM RIOT · React Native

Exact Expo SDK 56 port of the GLOOM RIOT dice-board phone game.

## Run

```bash
npm install
npx expo start
```

Open in Expo Go. Screens live under `src/app` (expo-router).

## Screens

| Route | Purpose |
| --- | --- |
| `/` | Splash + loading bar |
| `/onboarding` | Avatar + display name |
| `/home` | Sky home hub |
| `/map` | Five worlds / 26 boards |
| `/level/[id]` | Level preview |
| `/play/[id]` | Dice board gameplay |
| `/daily` | 7-day gifts |
| `/store` | Coins, items, cosmetics, practice £ buys |
| `/inventory` | Items + equip cosmetics |
| `/achievements` | Track + claim |
| `/leaderboard` | Local + seed rivals |
| `/news` | News cards |
| `/profile` | Account picture + auth entry |
| `/settings` | Sound, motion, text, contrast |
| `/support` | Help copy |
| `/admin` | Local demo banner / unlocks |
| `/auth/login` `/register` `/forgot` `/reset` | Local profile only |

## Notes

- Progress saves on device via AsyncStorage.
- Cloud label shows **Saved on this phone** or **Synced** with a local profile.
- Ads are simulated. Pound prices are practice purchases.
- No Base44 SDK, keys, or sync URLs.
