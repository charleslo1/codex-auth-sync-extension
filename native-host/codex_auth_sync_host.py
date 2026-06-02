#!/usr/bin/env python3
import json
import os
import struct
import sys
import tempfile
from datetime import datetime, timezone


def read_message():
    raw_length = sys.stdin.buffer.read(4)
    if len(raw_length) == 0:
        return None
    if len(raw_length) != 4:
        raise ValueError("invalid native message length")
    message_length = struct.unpack("<I", raw_length)[0]
    if message_length <= 0 or message_length > 1024 * 1024:
        raise ValueError("native message length is out of range")
    payload = sys.stdin.buffer.read(message_length)
    if len(payload) != message_length:
        raise ValueError("incomplete native message")
    return json.loads(payload.decode("utf-8"))


def write_message(message):
    payload = json.dumps(message, separators=(",", ":")).encode("utf-8")
    sys.stdout.buffer.write(struct.pack("<I", len(payload)))
    sys.stdout.buffer.write(payload)
    sys.stdout.buffer.flush()


def validate_auth(auth):
    if not isinstance(auth, dict):
        raise ValueError("auth must be an object")
    if not isinstance(auth.get("last_refresh"), str) or not auth["last_refresh"]:
        raise ValueError("auth.last_refresh is missing")

    tokens = auth.get("tokens")
    if not isinstance(tokens, dict):
        raise ValueError("auth.tokens is missing")

    for key in ("access_token", "id_token", "refresh_token", "account_id"):
        value = tokens.get(key)
        if not isinstance(value, str) or not value:
            raise ValueError(f"auth.tokens.{key} is missing")


def auth_output_path():
    configured = os.environ.get("CODEX_AUTH_PATH", "~/.codex/auth.json")
    return os.path.abspath(os.path.expanduser(configured))


def save_auth(auth):
    validate_auth(auth)

    path = auth_output_path()
    auth_dir = os.path.dirname(path)
    os.makedirs(auth_dir, mode=0o700, exist_ok=True)
    if auth_dir == os.path.expanduser("~/.codex"):
        try:
            os.chmod(auth_dir, 0o700)
        except OSError:
            pass

    backup_path = None
    if os.path.exists(path):
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        backup_path = f"{path}.backup.{stamp}"
        with open(path, "rb") as src, open(backup_path, "wb") as dst:
            dst.write(src.read())
        os.chmod(backup_path, 0o600)

    fd, tmp_path = tempfile.mkstemp(prefix="auth.json.tmp.", dir=auth_dir)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as tmp:
            json.dump(auth, tmp, indent=2)
            tmp.write("\n")
        os.chmod(tmp_path, 0o600)
        os.replace(tmp_path, path)
        os.chmod(path, 0o600)
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    return {
        "ok": True,
        "path": path,
        "backup_path": backup_path,
    }


def handle_message(message):
    if not isinstance(message, dict):
        raise ValueError("message must be an object")

    message_type = message.get("type")
    if message_type == "ping":
        return {"ok": True}
    if message_type == "saveAuth":
        return save_auth(message.get("auth"))

    raise ValueError("unknown message type")


def main():
    try:
        message = read_message()
        if message is None:
            return
        write_message(handle_message(message))
    except Exception as exc:
        write_message({"ok": False, "error": str(exc)})


if __name__ == "__main__":
    main()
