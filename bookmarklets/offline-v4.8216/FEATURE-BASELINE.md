# TETR.IO Patch — Feature Baseline

**Baseline ID:** `tetrio-patch-feature-baseline-v1`  
**Applies from:** v4.8215  
**Purpose:** This is the canonical checklist of functionality that a release must preserve. It is shipped in every All-OS release and copied alongside the downloadable files.

## Non-negotiable maintenance rule

1. Before adding, changing, or removing a feature, update this file in the same change.
2. Every new feature must be described here: its user-visible behavior, where it is available, and its controls/settings.
3. Existing entries may not silently disappear. A removal or behavior change must retain the old entry with a dated `Removed/changed` note and the reason.
4. A release build must fail if this file is missing, its Baseline ID is missing, or the released copy differs from this source file.
5. The release ZIP must contain this file at its top level. The browser bookmarklet folder must also include it.
6. Keep this document in Markdown or plain text. Do not replace it with an image, generated UI, or a link to a private document.

## Supported distribution and launch paths

- **macOS, Windows, Linux:** installer launchers are included for patch patterns A, O, and R.
- **Browser bookmarklet:** starts an isolated `blob:https://tetr.io/...` client. It does not require or use localhost. Its patch resources, including the QP OFFLINE icon, are retrieved from the GitHub repository connection.
- **No AI module:** the browser-only bookmarklet contains no AI feature.
- **Offline feature isolation:** the Tab panel and local tools load only inside the isolated local/blob client; they do not install over normal live TETR.IO pages.

## Offline control panel and local play

- **Tab panel:** `Tab` opens/closes the offline panel from the blob client, including after navigation to SOLO, replay, or a game board.
- **Local modes:** local SOLO, ZEN, QP/revive practice, TL/CUSTOM FT, saved room presets, custom labels, custom missions, and incoming-attack controls are supported by the offline modules.
- **QP OFFLINE icon:** the QP entry keeps its icon in the blob client by loading the packaged `qpo.svg` through the GitHub connection.
- **Local diagnostics:** render diagnostics and UI health reporting are included so failed local launches or replay saves are reported instead of silently ignored.
- **Local replay library:** local games can be saved and the library can be sorted by newest, oldest, or mode.

## Replay behavior

- **Files and online records:** local replay files and an official authenticated replay record can be loaded by the offline client.
- **Start order:** loading a replay opens its native record/results view first; it must not begin playback immediately. The player chooses a round or starts replay from that view.
- **Two-player layout:** two-player replay boards use the normal TL/custom-room positions.
- **Native controls:** `Ctrl` toggles the native replay bar for 40L, BLITZ, QP, TL, and active offline games. The bar stays out of menus and live online boards.
- **Replay appearance settings:** the Tab panel provides QP replay background, TL introduction, and TL score-rise settings.
- **Replay keys:** during a replay/results screen, `Z` toggles the TL introduction, `X` toggles final-collapse presentation, and `C` toggles TL score-rise/`+1` presentation. These keys must not replace normal gameplay keybinds.
- **TL presentation:** preserve the normal red/blue player presentation and use only the shortened GET READY portion required by the offline replay presentation.

## QP, revive, mission, and rotation behavior

- **QP rules:** offline QP preserves the native `all-mini+` detector and native MOD branches for All-Spin and Warlock instead of overwriting them with a different spin rule.
- **Revive practice:** DUO revive practice supports the local partner board, revive policy, mission handling, and the incapacitated BOT opacity effect.
- **Mission rotation:** when a revive mission explicitly requires board rotation, rotate the DUO opponent board automatically. No extra `Z`-key rotation action is added.
- **Board rotation engine:** renderer/stage lookup is attempted before rotation effects run. Fixed, random, continuous, reset, and mission rotation use the shared board-rotation modules.

## Online custom-room rotation (ROTATO)

- `/rotate` and `/rotato` work only in eligible online custom rooms; they are disabled in TETRA LEAGUE and QUICK PLAY.
- Supported commands are toggle, a fixed angle, random angle, continuous spin, random continuous spin, and reset.
- The initial ROTATO unlock requires active participation against `Y_KEI1215`; watching alone never unlocks it.
- Shared room rotation requires the room master's observed official START click or `/start`, uses the validated `ROTATO_TOOL` protocol with SHA-256 protection, and observes the FT-session/master-transfer limits.
- While playing, a user affects only their own board. An unlocked spectator can apply the visual state to displayed active boards.
- Rotation cleanup restores native board-holder rotation when reset or when leaving the room.

## Preservation requirements

- Preserve terrain, HOLD, LagGuard, ReplayUnique, replay behavior, and non-browser AI behavior outside the paths explicitly modified by this patch.
- Do not add normal online-match gameplay features to the blob/bookmarklet client; its online scope is replay loading only.
- Do not claim a feature is available solely because source code exists. It must remain in the release payload and pass the build checks below.

## Required release checks

- The feature baseline source exists and includes `tetrio-patch-feature-baseline-v1`.
- The top-level release copy and bookmarklet copy are byte-for-byte identical to this source.
- The All-OS ZIP contains both copies.
- JavaScript syntax checks and archive-integrity checks pass before delivery.

## Change log

- **v4.8215 — 2026-11-03:** baseline created. It records the current offline/blob, replay, TL presentation, QP spin, revive mission, rotation, online custom-room, distribution, and preservation requirements.
- **v4.8216 — 2026-11-03:** bookmarklet connection changed to the GitHub repository endpoint; QP OFFLINE icon delivery was added to that endpoint.
