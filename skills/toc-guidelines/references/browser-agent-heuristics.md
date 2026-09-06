# Browser Agent Heuristics — how to drive a shared tab effectively

> For the **agent itself** (not end-user explanation): field-tested rules for using the browser
> extension tools (`BROWSER_*`) on unfamiliar pages, document viewers and paywalled sites. Read
> [`browser-extension-guide.md`](browser-extension-guide.md) first for what the extension is, how the
> user connects it and shares a tab; this file is about **using it well once a tab is available**.

Field-tested principles for driving a browser effectively through the `tryopenclaw-connectors` tools (`BROWSER_*`), distilled from hunting for content inside unfamiliar pages, document viewers, and paywalled sites. This is not a fixed script: the goal is to decide each next step from the signals you actually observe, not to run a predefined if-else flow.

## Available tools (real names, not illustrative ones)

`BROWSER_LIST_TABS` · `BROWSER_OPEN_TAB` · `BROWSER_CLOSE_TAB` · `BROWSER_NAVIGATE` · `BROWSER_SNAPSHOT` · `BROWSER_READ` · `BROWSER_CLICK` · `BROWSER_FILL` · `BROWSER_SCROLL` · `BROWSER_SCREENSHOT` · `BROWSER_KEY` · `BROWSER_BATCH` (bundles up to 6 of the above into one call — see section 13) — plus `openclaw_web_fetch` (fetches page content without opening a tab).

**Real limits to keep in mind**: `BROWSER_CLICK` / `BROWSER_FILL` accept only a `ref` (from `BROWSER_SNAPSHOT`) or a CSS `selector` — **there is no (x, y) coordinate parameter**. There is no search-in-page tool and no tool for reading network requests. `BROWSER_KEY` presses one navigation key (Enter, Escape, Tab, arrows, Backspace, PageUp/PageDown, Home/End) — no modifier combos, and it never types text (`BROWSER_FILL` types text but never presses Enter; to submit a box that has no button, `BROWSER_FILL` then `BROWSER_KEY` Enter with the same `ref`/`selector`). For content that is not real DOM (pure images/canvas), interaction is limited to whatever real DOM controls surround it, if any — see section 3.

## Quick checklist when landing on an unfamiliar page

1. Run `BROWSER_SNAPSHOT` (structure + refs) or `BROWSER_SCREENSHOT` (visual) first, so you know what you are dealing with before choosing the next tool.
2. Check immediately: does the page demand a login, a CAPTCHA, or a payment step? If so, see "Safety boundaries" below — do not try to work around it with heuristics; stop and ask the user.
3. Is there a cookie/consent banner or a blocking popup? Clear it first (`BROWSER_SNAPSHOT` to find the decline button's ref, then `BROWSER_CLICK` — pick the most privacy-preserving option, decline non-essential).
4. Is the content real text/DOM, an image/canvas, or a dynamically loaded SPA? Probe cheaply with `BROWSER_READ` / `BROWSER_SNAPSHOT` (far cheaper than `BROWSER_SCREENSHOT`) — see section 3 for how to tell the three cases apart.
5. Does the target page have its own navigation (a jump-to-page box, in-app search, a table of contents)? Prefer finding its ref via `BROWSER_SNAPSHOT` and using `BROWSER_FILL` / `BROWSER_CLICK` over repeating `BROWSER_SCROLL` / `BROWSER_CLICK` yourself. For a page-jump or search-as-you-type box, pass `mode:"type"` to `BROWSER_FILL` (see section 14).
6. Know your stop condition up front (a recognizable landmark) so you do not read past the goal, and know your give-up threshold if you get stuck (see "Retry threshold").

## Safety boundaries — always stop; no heuristic may cross these

The heuristics in this skill exist to *find and read content* more efficiently. They must never be used to get past the boundaries below. When you hit one, stop immediately and report back to the user instead of looking for a way to "escalate":

- **Login walls / account requirements**: do not create accounts, and do not enter the user's password or credentials, even if they were provided earlier.
- **CAPTCHA / anti-bot mechanisms**: do not attempt to solve or bypass them.
- **Payments / subscriptions / card details**: never perform these yourself, even when a "free trial" is offered.
- **Legitimate free-unlock paywalls** (for example "watch an ad to unlock") are fine to use — that is not a forbidden boundary. The boundary is anything that requires payment or an account.

## 1. Escalate from cheap to expensive (progressive escalation)

Always try the cheap/fast option first and move to a more expensive one only when the cheap one has clearly failed:

- `openclaw_web_fetch` (no tab needed) before `BROWSER_OPEN_TAB`.
- `BROWSER_READ` / `BROWSER_SNAPSHOT` (text/DOM) before `BROWSER_SCREENSHOT` (far more tokens, and the model has to "look" at an image).
- The target page's own search / jump-to-page features (via refs from `BROWSER_SNAPSHOT`) before sequential `BROWSER_CLICK` / `BROWSER_SCROLL` loops of your own.
- A pre-planned sequence of actions (see section 13) via `BROWSER_BATCH` before firing the same actions one call at a time.

Each failed step is data that eliminates an option, not wasted effort.

## 2. The Observe → Act → Observe loop

Never assume the state after an action — always re-check (`BROWSER_SCREENSHOT` / `BROWSER_SNAPSHOT`) before deciding the next step, especially after `BROWSER_NAVIGATE`, `BROWSER_CLICK`, or whenever the page may still be loading (spinner, blank page). A blank page right after navigation usually means it is still loading — wait a beat and check again rather than concluding it failed.

## 3. Pick the tool by content type (three cases, not two)

- **Real DOM/text** (ordinary HTML pages, articles, forms) → `BROWSER_READ` (long text, whole page or a specific element by `ref`/`selector`), `BROWSER_SNAPSHOT` (which interactive elements exist, and their `ref`s for precise `BROWSER_CLICK` / `BROWSER_FILL`).
- **Image/canvas** (PDF/scan viewers, documents rendered page-by-page as images, drawing apps) → the DOM has nothing to read; use `BROWSER_SCREENSHOT` and inspect the returned image closely (the model "zooms" by reading the image carefully — there is no separate zoom tool). Tell-tale sign: `BROWSER_SNAPSHOT` / `BROWSER_READ` return very few or no meaningful text nodes even though the screenshot clearly shows text. **Important limit**: `BROWSER_CLICK` / `BROWSER_FILL` do not support coordinate clicks (x, y) — you can only interact with real DOM controls around the image/canvas area (for example "next page" or "skip ad" buttons, if they are real HTML elements; find their refs via `BROWSER_SNAPSHOT`). You cannot click an arbitrary point inside an image/canvas.
- **Dynamically loaded SPA / lazy-load / infinite scroll** (React, Vue, ...) → the DOM exists, but content has not rendered yet on arrival, or only the on-screen part is rendered. Tell-tale sign: `BROWSER_READ` / `BROWSER_SNAPSHOT` return noticeably less content than what `BROWSER_SCREENSHOT` shows. Handling: `BROWSER_SCROLL` (real wheel input, which correctly triggers lazy-loading) then `BROWSER_READ` / `BROWSER_SNAPSHOT` again — there is no network-request tool to shortcut via an API.

## 4. Treat anomalies as signals, not just errors to skip

An odd result (zero search hits, a repeating tool error, an unexpectedly empty page) always carries information about the system you are interacting with. Before retrying blindly, ask: "what does this result tell me about the page's structure or state?" and adjust your strategy accordingly.

## 5. Use background knowledge to form hypotheses, then verify — a bonus, not a required step

When you already know the typical structure or conventions of the kind of document you are handling (for example textbooks usually have a summary at the start or end; apps usually have search or a table of contents), form a hypothesis about the likely location and jump straight there to check, rather than browsing sequentially from the beginning.

This heuristic only pays off when you genuinely have the right prior for that domain. In a completely unfamiliar domain (no background knowledge to guess from), do not force a hypothesis — fall back to the general principles (1-4, 6-10) and explore systematically instead of guessing.

## 6. Exploit the target page's built-in features

Most viewers and apps ship their own navigation (jump-to-page box, in-app search, breadcrumbs, table of contents). Find its ref via `BROWSER_SNAPSHOT` and use `BROWSER_FILL` / `BROWSER_CLICK` once (or `BROWSER_FILL` + `BROWSER_KEY` Enter when the search box has no button) — always faster and more accurate than automating it with dozens of `BROWSER_CLICK` "next" presses or incremental `BROWSER_SCROLL`s.

## 7. Clear obstacles before anything else

Cookie/consent banners, ad popups, and login modals almost always appear first on an unfamiliar page and block everything behind them. Deal with them (choosing the most privacy-preserving option for cookie banners) as soon as you land, before attempting the main task. The cheapest first attempt on a modal/popup is `BROWSER_KEY` Escape; if it survives, find the dismiss button's ref via `BROWSER_SNAPSHOT` and `BROWSER_CLICK` it. If the modal is a hard login wall (cannot be dismissed to view the content) → see "Safety boundaries".

## 8. Verify important data before committing to it

For any small or easily misread data (numbers, phonetic characters, small text in images), zoom in / re-read at least once before reporting the final result — especially when the cost of misreading far outweighs the cost of one more look.

## 9. Preserve session state; avoid unnecessary resets

Every fresh `BROWSER_NAVIGATE` can throw away progress you have already made (re-dismissing the cookie banner, re-unlocking a paywall, ...). Navigate again only when genuinely needed; prefer continuing on the existing `tabId` (`BROWSER_LIST_TABS` to recover it if you lost track) over recreating everything with `BROWSER_OPEN_TAB` / `BROWSER_NAVIGATE`.

## 10. Stay anchored to the goal and a clear stop condition

Before you start exploring, define the landmark that means "arrived" (for example the exact title or section you are looking for). Once you see it, stop wandering and switch to extraction/processing instead of reading further into unrelated content.

## 11. Retry threshold — know when to stop and ask the user

Set a reasonable attempt budget (for example, after roughly 15-20 actions with no progress toward the goal). If you exceed it and are still stuck, stop, summarize what you tried, and ask the user rather than repeating the same strategy indefinitely. Without this, an agent can loop through trial-and-error forever when the domain does not behave as predicted (for example when the hypothesis from section 5 pointed to the wrong place).

## 12. Read tool errors literally — some mean "stop", not "retry"

The browser tools return specific error messages when the underlying debugger connection to the tab is lost. Treat them as instructions, not as transient noise:

- **"…debugger detached from tab …"** → the tab's connection was lost and an automatic re-attach already failed. Call `BROWSER_LIST_TABS` once to refresh the tab list, then retry the action **once**. If it fails again, stop and report to the user.
- **"…another extension injected a restricted frame…"** (typically a password manager such as Bitwarden/1Password, or an AI sidebar/translator, on pages with a login form) → Chrome itself is refusing access to this tab. **No retry will help.** Tell the user plainly which kind of extension is blocking, ask them to disable it for this Chrome profile (or use a dedicated profile for the agent), and wait for them — do not keep hammering the tab and do not switch to a different browser tool to "work around" it.
- **"Tab … is still attaching…"** → genuinely transient (a freshly opened or navigating tab). Wait a few seconds and retry; give up after 2-3 attempts and report.
- **"Tab … is no longer shared with this workspace"** → the user un-shared or closed the tab. Ask them to share it again (see the extension guide); do not open a new tab on their behalf unless the task allows it.
- A plain **"Timeout … exceeded"** with none of the messages above usually means the page really is busy (heavy animation, endless loading). Prefer `BROWSER_READ` over `BROWSER_SNAPSHOT`/`BROWSER_SCREENSHOT` on such pages, wait a beat between actions, and apply the retry threshold from section 11.
- **"…ran out of its time budget before this step could run"** (only from `BROWSER_BATCH`) → the batch had too many or too slow steps to fit its own internal time budget. Do not retry the same batch as-is — split it into a smaller batch, or run the remaining steps one call at a time.

- **"[fill_typing_timeout] Typed N of M characters…"**, **"[fill_needs_typing_too_long] …"**, **"[fill_needs_typing_multiline] …"** (from `BROWSER_FILL`) → the field needed key-by-key typing and the text could not be typed in full. Read whether the message says the field **has been cleared** (then nothing is in the box) or **could NOT be cleared** (then run `BROWSER_READ`/`BROWSER_SNAPSHOT` on it first — it may hold half-typed text). Either way: **do not press Enter or click Send**; shorten the text, split it into several `BROWSER_FILL` calls, or remove line breaks. Never retry the identical call. See section 14.

## 13. Bundle a pre-planned action sequence with `BROWSER_BATCH`

When you already know the exact sequence of 2-6 actions to run against ONE already-open tab, and every `ref`/`selector` those actions need is already known — bundle them into one `BROWSER_BATCH` call instead of firing each one separately. Typical case: you already ran `BROWSER_SNAPSHOT` and know the refs for two form fields and a submit button — `BROWSER_FILL` → `BROWSER_FILL` → `BROWSER_CLICK` → `BROWSER_SCREENSHOT` in one call instead of four.

`BROWSER_BATCH` only accepts the tab-action tools (`BROWSER_NAVIGATE`, `BROWSER_CLICK`, `BROWSER_FILL`, `BROWSER_KEY`, `BROWSER_READ`, `BROWSER_SNAPSHOT`, `BROWSER_SCROLL`, `BROWSER_SCREENSHOT`) against one `tabId` given once at the top level — not `BROWSER_OPEN_TAB`/`BROWSER_CLOSE_TAB`/`BROWSER_LIST_TABS`, and not itself.

What makes it safe, and when NOT to use it:

- **Every `ref` inside the batch must come from a `BROWSER_SNAPSHOT` taken BEFORE the batch — never from a `BROWSER_SNAPSHOT` that is itself one of the batch's steps.** The whole sequence is planned upfront in one shot; a step cannot react to what an earlier step in the same batch discovered. If the next action genuinely depends on a snapshot/read result you don't have yet, run that one step alone first, then batch the rest once the refs are known.
- If one of the actions is `BROWSER_NAVIGATE`, do not rely on `ref` in any action after it in the same batch — a ref is tied to the page it was captured on, and navigating invalidates it. Use a CSS `selector` for anything after a `BROWSER_NAVIGATE`, or put `BROWSER_NAVIGATE` as the last action in the batch.
- `BROWSER_BATCH` stops at the first failing action and reports which step failed — check that before assuming later steps ran. A failed `BROWSER_FILL` step stops the batch too and normally leaves its field cleared — so a `BROWSER_KEY` Enter or a submit `BROWSER_CLICK` planned after it never runs; do not "finish" the batch by submitting manually without re-checking the field.
- **Never bundle a public/irreversible action** (posting, sending, paying, deleting, ...) into the same batch as the steps before it, even when every `ref` for it is already known and batching is technically possible. Run it as its own call AFTER you have verified (screenshot/read) that the preceding steps actually succeeded and the content is correct — a batch has no built-in checkpoint to catch a failed/garbled fill before the irreversible step fires. There is no confirmation step inside a batch: a navigation-policy refusal stops it like any other error, but nothing pauses to ask the user before a send/post/submit fires. Pressing Enter with `BROWSER_KEY` in a chat/comment/post box is exactly such an action — Enter in a search box is harmless, Enter in a message box sends.
- **At most one `BROWSER_SCREENSHOT` or `BROWSER_SNAPSHOT` per batch, and only as the LAST action** — the tool rejects anything else. Two of them in one result exceed the chat message size cap and the whole batch result is silently dropped from history; and a mid-batch observation is useless anyway, since no later step can react to it. For data you need mid-batch, use `BROWSER_READ` with a `selector`.
- Between batches, re-observe before planning the next one: the batch's final `SCREENSHOT`/`SNAPSHOT`/`READ` is what tells you the real state. The Observe → Act → Observe loop (section 2) still applies — just at batch granularity.
- Prefer it for form-fill-then-verify sequences, multi-field reads (`READ` × N → `SCREENSHOT`), and scroll loops (`SCROLL → READ → SCROLL → READ`, or `SCROLL → SCROLL → SCREENSHOT`) — these need few or no `ref`s, so they carry none of the staleness risk above. Don't force unrelated actions into one batch just to save a call — plain sequential `BROWSER_*` calls are fine, and clearer, when the next step genuinely depends on what the previous one returns.

## 14. Filling fields: trust `verified`, and never submit after a `BROWSER_FILL` error

`BROWSER_FILL` sets the whole value in one go and **reads the field back**. Its result tells you what actually landed:

- `{ filled, verified: true, method: "fill" | "type" }` → the field holds exactly your value. Safe to continue (for example `BROWSER_KEY` Enter with the same `ref`, or `BROWSER_CLICK` on the send/submit button).
- `{ filled, verified: false, actual: "…" }` → the page kept your characters but **reformatted** them (phone/date/card masks, forced uppercase, trimmed spaces). Compare `actual` with what you meant; usually this is fine and you continue. Do **not** re-fill in a loop hoping for an exact match.
- An error starting with `[fill_typing_timeout]`, `[fill_needs_typing_too_long]` or `[fill_needs_typing_multiline]` → see section 12. Nothing was submitted; the message says whether the field is now empty. Shorten or split the text — a long message is better sent as two shorter fills into the same box only if the page allows it, otherwise ask the user how to proceed.

How it works underneath, so you can predict it: the tool first inserts the whole text at once (cheap, length-independent). Only if the field ignores bulk input (rare: page-jump boxes, some search-as-you-type widgets) does it fall back to typing key by key — and typing costs time per character over the relay, so long texts may be refused rather than half-typed. Pass `mode:"type"` yourself only when you already know the field is one of those; never as a default.

Enter is a separate action: `BROWSER_FILL` never presses it. After a `verified: true` result, use `BROWSER_KEY` with `key:"Enter"` and the same `ref` when the box has no button, or `BROWSER_CLICK` the button. In a chat/comment/post box that **sends** — treat it as irreversible (section 13) and verify first.
