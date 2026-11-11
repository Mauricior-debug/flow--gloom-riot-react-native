#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
pkill -f "expo start" 2>/dev/null || true
pkill -f ngrok 2>/dev/null || true
fuser -k 8081/tcp 2>/dev/null || true
sleep 1
unset CI
unset EXPO_PACKAGER_PROXY_URL
unset REACT_NATIVE_PACKAGER_HOSTNAME
if [[ -f "$HOME/.config/elite-expo.env" ]]; then
  # shellcheck disable=SC1090
  source "$HOME/.config/elite-expo.env"
fi
# Never keep a Cloudflare/proxy override — it breaks Expo Go manifests
unset EXPO_PACKAGER_PROXY_URL
unset REACT_NATIVE_PACKAGER_HOSTNAME
npx expo whoami || true
exec env -u CI -u EXPO_PACKAGER_PROXY_URL -u REACT_NATIVE_PACKAGER_HOSTNAME \
  npx expo start --host tunnel --port 8081
