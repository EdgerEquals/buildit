#!/usr/bin/env python3
"""Write config.enc.json for this page. Needs the page password (env var named by profile.json "password_env",
env or login shell); refuses without it. Prints status only, never a secret. Keeps the salt while the password matches.
The encrypted config holds everything personal (name, title, bot, host from the box-only profile) plus this page's
own relay topic, so the public files carry none of it. Relay topic: <state dir>/relay.json (0600), created once.
The relay webhook is NOT needed here (only `chat.py relay` uses it).
  --push   git add/commit/push config.enc.json (+ an empty log.enc.json if missing)
"""
import json, os, secrets, subprocess, sys, base64
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import chat as C

if not C.PROFILE.get('password_env'): C.die('missing ' + os.path.join(C.STATE_DIR, 'profile.json') + ' (nothing written)')
PW = (C.secret(C.PW_ENV + '_NEW', required=False) or C.secret(C.PW_ENV, required=False)
      or (C.PW_FALLBACK_ENV and C.secret(C.PW_FALLBACK_ENV, required=False)))
if not PW: C.die('missing env: ' + C.PW_ENV + ' (nothing written)')
# short passwords allowed by owner decision 2026-10-25; weaker against offline guessing
if len(PW) < 4: C.die('the page password is shorter than 4 characters; use a longer one (nothing written)')
cfg_path, log_path = os.path.join(HERE, 'config.enc.json'), os.path.join(HERE, 'log.enc.json')
old = C.load_json(cfg_path); log = C.load_json(log_path, {'entries': []})
salt = None
if old:
    try: C.decrypt_json(C.derive_key(PW, old['kdf']['salt'], old['kdf']['iter']), old['config']); salt = old['kdf']['salt']
    except Exception:
        if log.get('entries'): C.die('password changed but log.enc.json has entries; nothing written')
salt = salt or base64.b64encode(secrets.token_bytes(16)).decode()
relay = C.load_json(C.RELAY_FILE)
if not relay:
    relay = {'base': 'https://ntfy.sh', 'topic': 'bi-' + secrets.token_urlsafe(24).replace('-', 'x').replace('_', 'y')}
    C.save_private(C.RELAY_FILE, relay)
for other in ['~/.config/simmie-chat/relay.json'] + list(C.PROFILE.get('other_relay_files', [])):
    o = C.load_json(os.path.expanduser(other)) or {}
    if o.get('topic') == relay['topic']: C.die('relay topic collides with ' + other + '; nothing written')
key = C.derive_key(PW, salt)
conf = {'relay': relay, 'repo': 'EdgerEquals/buildit', 'branch': 'main', 'path': '',
        **{k: C.PROFILE[k] for k in ('name', 'title', 'bot', 'host') if C.PROFILE.get(k)}}
out = {'v': 1, 'kdf': {'name': 'PBKDF2', 'hash': 'SHA-256', 'iter': C.ITER, 'salt': salt}, 'config': C.encrypt_json(key, conf)}
assert C.decrypt_json(key, out['config']) == conf
with open(cfg_path, 'w') as f: json.dump(out, f, indent=1); f.write('\n')
if not os.path.exists(log_path):
    with open(log_path, 'w') as f: f.write('{"v":1,"entries":[]}\n')
print('wrote config.enc.json (salt %s)' % ('kept' if old and salt == old['kdf']['salt'] else 'new'))
if '--push' in sys.argv:
    g = lambda *a: subprocess.run(['git', '-C', HERE, *a], check=True, capture_output=True, text=True)
    g('add', 'config.enc.json', 'log.enc.json')
    if subprocess.run(['git', '-C', HERE, 'diff', '--cached', '--quiet']).returncode:
        g('commit', '-m', 'Encrypted config (page opens behind the password)'); g('push', 'origin', 'HEAD:main'); print('pushed')
    else: print('no change to push')
