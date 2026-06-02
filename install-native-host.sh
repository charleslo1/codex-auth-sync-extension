#!/usr/bin/env bash
set -euo pipefail

HOST_NAME="com.codex.auth_sync"

usage() {
  cat <<'EOF'
Usage:
  ./install-native-host.sh <chrome-extension-id>

Steps:
  1. Open chrome://extensions
  2. Enable Developer mode
  3. Load unpacked extension from ./extension
  4. Copy the extension ID and pass it to this script
EOF
}

if [ "$#" -ne 1 ]; then
  usage
  exit 1
fi

EXTENSION_ID="$1"
case "$EXTENSION_ID" in
  [a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p][a-p])
    ;;
  *)
    echo "Error: invalid Chrome extension ID: $EXTENSION_ID" >&2
    exit 1
    ;;
esac

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
HOST_SOURCE="$SCRIPT_DIR/native-host/codex_auth_sync_host.py"
HOST_INSTALL_DIR="$HOME/.codex"
HOST_INSTALL_PATH="$HOST_INSTALL_DIR/codex_auth_sync_host.py"
MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
MANIFEST_PATH="$MANIFEST_DIR/$HOST_NAME.json"

[ -f "$HOST_SOURCE" ] || {
  echo "Error: native host source not found: $HOST_SOURCE" >&2
  exit 1
}

mkdir -p "$HOST_INSTALL_DIR" "$MANIFEST_DIR"
chmod 700 "$HOST_INSTALL_DIR" 2>/dev/null || true
cp "$HOST_SOURCE" "$HOST_INSTALL_PATH"
chmod 755 "$HOST_INSTALL_PATH"

cat > "$MANIFEST_PATH" <<EOF
{
  "name": "$HOST_NAME",
  "description": "Codex Auth Sync native host",
  "path": "$HOST_INSTALL_PATH",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://$EXTENSION_ID/"
  ]
}
EOF

echo "Native host installed:"
echo "  $MANIFEST_PATH"
echo "Allowed extension:"
echo "  $EXTENSION_ID"
