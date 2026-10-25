# buildit

A private page that is both a chat page and a dashboard, behind a password gate (same design as the Simmie chat
page). Live at https://edgerequals.github.io/buildit/ (noindex, robots.txt Disallow). Self-contained: no runtime
dependency on any other repo.

Nothing personal is in this public repo: the owner's name, the page title, the bot's name and every answer live only
in the encrypted `config.enc.json` / `log.enc.json` and on the page after the password. Secret NAMES and the name/title
come from a box-only profile, `~/.config/buildit-chat/profile.json` (0600). No `config.enc.json` -> the page says it
isn't set up yet.

## How it works
```
page (password unlocks key) --encrypted msg, text/plain POST--> ntfy.sh/<own secret topic>
   ^  live encrypted ping (EventSource) + polls log.enc.json            |  box relay: chat.py relay -> bot routine webhook
   |                                                                     v
log.enc.json in this repo  <--chat.py append (git push)--  the bot's routine
```
* Key: PBKDF2-HMAC-SHA256(password, random salt, 250 000) -> AES-GCM-256 (`js/crypto.js`, `chat.py`). Unlock is kept
  in sessionStorage (the derived key, not the password); **Lock** clears it.
* Roles in messages: `user` (the page's owner), `bot`, `dad` (Danny).
* **Bot name = ONE setting:** `bot` inside the encrypted config (never in public plaintext). The user may rename the
  bot themselves (Danny's exception to propose-only): the **Rename** control in the chat sends an encrypted
  `kind:'rename-bot'` message, and `chat.py context` / `pending --ingest` apply it (rewrites `config.enc.json` with the
  same key + salt, commits, pushes, and mirrors it into the box profile). By hand: `python3 chat.py set-bot-name "..."`.
* **Questions** (`js/app.js`): part 1 about the user (yes/no, this-or-that with Roll), part 2 colour palettes (two side
  by side, Roll swaps one), part 3 yes/no on pieces of Danny's dashboard with a tiny CSS preview each, optional note
  per question. Progress is kept encrypted in localStorage. Each finished part is sent as ONE encrypted message
  (`kind:'answers'`, split if long), like a chat message, so it lands in the encrypted log.
* **Light:** system fonts, ~60 KB HTML/CSS/JS (~19 KB gzipped), CSS-only previews, one 4 KB SVG. Load tiers
  (`js/load-tiers.js`): questions first, chat poll + live line in tier 2, the mark prefetch in tier 3.

## Permissions (training wheels): `permissions.json` -> `edit_mode`
* `propose-only` (default): the user can ASK for changes; nothing they ask changes anything. `chat.py context` prints
  the rule at every wake. The bot records each ask with `python3 chat.py propose --text "..." [--msg-id ID]`; every
  answer set from the questions is queued automatically. Private queue: `~/.config/buildit-chat/proposals.json`.
  Danny decides: `python3 chat.py proposals` / `python3 chat.py proposals --decide ID yes|no`.
* `allow-listed`: only items in `allowed_without_danny` may be done without Danny. Unknown values -> propose-only.
  Loosening needs Danny's yes (commit with a rollback tag).

## Box side
```bash
python3 build.py --push                  # needs the page password env var (see profile); writes + pushes config.enc.json
python3 chat.py pending --ingest         # messages/answers waiting on the relay (~12 h) -> encrypted log (+ queue answers)
python3 chat.py history 40
printf '%s' '<webhook body>' | python3 chat.py context    # routine wake
python3 chat.py append --from bot --text "..."            # reply
python3 chat.py ask --from dad --text "..."               # Yes / No / Ask more question
python3 chat.py relay-ensure             # once the webhook env vars exist
bash tools/install_page_guard.sh         # page-guard pre-push hook (tools/PAGE_GUARD.md)
```
Never `git push --no-verify`. Every change gets a `pre-...` rollback tag first.
