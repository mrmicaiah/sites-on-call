# Sites On Call — Studio87 Session Status / Handoff

**Purpose of this file:** This is the single source of truth for where the Sites On Call restructure stands as of the last working session. If you are a new manager chat and the user said "where were we," READ THIS FILE TOP TO BOTTOM before doing anything or dispatching anything to the worker. It tells you exactly what is done, what is safe, what is pending, and what the immediate next action is.

**Branch this work lives on:** `kill-scorecard-offer`
**Written by:** the outgoing manager chat, at the user's request, before a funded pause.

---

## 0. READ THIS FIRST — the one thing that matters for safety

**NOTHING IN THIS SESSION HAS BEEN MERGED OR DEPLOYED.** All repo work is on branch `kill-scorecard-offer`, which HAS been pushed to origin. `main` is untouched and nothing is merged or deployed. `origin/main` is unchanged. The live website (sitesoncall.com) is exactly as it was before this session started — the old pages are still what the public sees.

**The ONLY production change made this session was to the Supabase database.** During the session the live contact form briefly BROKE (an overloaded RPC function caused a PostgREST resolution error) and was then FIXED. The fix was confirmed by a real human form submission that succeeded end to end (lead + booking both stored correctly). As of the end of session the live contact form WORKS. The database has exactly one `create_web_lead` function (11-arg, consent-aware, anon-locked).

---

## 1. The big strategic picture (what changed and why)

The business model shifted mid-project. The new reality, which supersedes large parts of the master doc (`sites-on-call-master-doc.md` in the project files — NOTE: that doc is now partly outdated, see section 6):

- **Cold calling is DEAD.** Gloria (the caller) is gone. The whole two-person outreach relay described in the master doc sections 1-5 no longer exists.
- **The free "Online Presence Scorecard" offer is DEAD on Sites On Call.** It moved to a separate property, **RankOnCall (rankoncall.com)**, as a **paid $39 "Deep Dive" product**. On RankOnCall it's a smaller, teaser-style free version that upsells the paid deep dive.
- **RankOnCall is now the top-of-funnel lead generator.** The intended flow: articles rank on Google, a banner on each article points readers to RankOnCall, RankOnCall's deep dive shows them their problems, that funnels back to Sites On Call for website/SEO work.
- **Sites On Call no longer has its own free lead magnet.** Its articles now carry a website/SEO-services CTA plus (once flipped live) the RankOnCall banner.

This is why the whole "kill the scorecard" body of work exists.

---

## 2. Repo work — DONE this session (all on branch `kill-scorecard-offer`, NOT pushed)

Branch `kill-scorecard-offer` was cut from `main` at `aee815e`. Commit stack, oldest to newest:

1. **`9c7215c`** — Remove free scorecard offer from site + kill duplicate article builds.
   - Deleted hero scorecard link in `src/index.njk`.
   - Deleted the scorecard offer toggle from the contact modal in `src/_includes/layouts/base.njk` (the `wants_snapshot` / `#cf-snapshot` checkbox). The schedule-a-call toggle was LEFT intact.
   - Cleaned `src/js/main.js`: removed snapshotToggle wiring, precheck logic, and the `pre_check_snapshot` analytics field. Changed `openContactModal(precheckSnapshot)` to `openContactModal()`. **Deliberately LEFT** `wants_snapshot: false` in the POST payload so the deployed edge function's expected key wouldn't break — this is now vestigial and slated for removal in the form step (section 4).
   - Deleted `.hero-scorecard-link` and `.snapshot-cta-link` CSS from `src/css/styles.css` (both confirmed unused).
   - **Fixed a live SEO bug:** added `"permalink": false` to `src/articles/posts/posts.json`, which stops Eleventy building a duplicate layout-less copy of every article at `/articles/posts/<slug>/`. (The source fix is correct; stale `_site` artifacts on the worker's disk are expected and harmless — CI builds clean.)

2. **`d6dbe82`** — Remove cold-call tooling (operation discontinued). Deleted `src/coldcall.njk`, `src/coldcall-next.njk`, `src/js/coldcall-schedule.js` (2,659 lines). `src/calls.njk` (the web-booking calendar) was KEPT — it is not coldcall tooling. Its auth still works via its own login form; only a convenience auto-sign-in shortcut that read the coldcall session no longer fires.

3. **`8ebd04a`** — Clean up coldcall orphans and dead links. Removed orphaned `src/coldcall.11tydata.json`, a dead "Back to caller app" link in `src/calls.njk`, and a stale comment.

4. **`3a223ea`** — Rewrite what-google-sees article + retarget article CTA to site services.
   - Full rewrite of `src/articles/posts/what-google-sees-when-someone-searches-your-business.md`. Old version (1,927 words) was built entirely around the dead scorecard offer. New version is ~4,457 words: kept all four vetted North Alabama anecdotes, added an "Anatomy of Your Results Page" SERP-element walkthrough (the skyscraper — nothing in the SERP top 10 had it), a 10-minute self-audit, and a "what to do about each problem" section. Ends with a LIGHTLY DISCLOSED RankOnCall handoff ("there's a tool for this — I built it, so weigh that accordingly — go look before you hire anybody, including me"). 6 internal links, all verified against real slugs. No invented businesses/numbers.
   - Retargeted the article CTA in `src/articles/article.njk`: was "Get your free website today" (dead free-for-everyone model), now "Let's build something that shows up" / a website+SEO services ask. This CTA is on all 22 article pages.

**Preview server** was running on localhost:8081 during the session (port 8080 was occupied by a separate RankOnCall dev server). It is fine if it's no longer running after the pause.

---

## 3. Supabase (production DB, project `fvnuzyexrzkzugqpzkot`) — DONE this session, LEFT SAFE

This is the ONLY production change this session. Goal was Phase 3's database layer: let the contact form record email-marketing consent (CAN-SPAM), replacing the dead `wants_snapshot` field.

**What was applied (all live in production now):**

1. **New column** `leads.email_consent` — `boolean NOT NULL DEFAULT false`. Additive, non-destructive; all existing leads got `false` (correct — no retroactive consent).

2. **`create_web_lead` now exists as an updated 11-argument function.** The 11th param is `p_wants_updates boolean DEFAULT false`. The new body: writes `email_consent`, lands every web lead at stage `new` (the old `snapshot_requested` stage branch was retired — correct, since there's no scorecard queue anymore), and records "Email consent: Yes/No" in the notes blob instead of the old "Wants scorecard" line.

3. **There is exactly ONE `create_web_lead` function — the 11-arg version. No shim, no overload.**

**WHAT HAPPENED (important history):** Mid-session, an attempt to keep backward compatibility created a SECOND overloaded `create_web_lead` (a 10-arg shim forwarding to the 11-arg version). This BROKE the live form: the deployed `submit-lead` edge function calls the RPC by NAMED params via PostgREST, which could not choose between the two overloads and returned a PGRST203 resolution error BEFORE execution — the form showed "Something went wrong" even though Turnstile passed and no row was written. The fix was to DROP the 10-arg shim, leaving a single 11-arg function. Its `p_wants_updates boolean DEFAULT false` default lets a caller sending only 10 fields still resolve cleanly. After the drop, a real human form submission succeeded end to end (lead created at stage `new`, email_consent stored as its default, booking created and Telegram-notified). CONFIRMED WORKING.

**Grants verified:** `anon_can_execute = false` on the single 11-arg function. `book_call` also confirmed anon-revoked and untouched. Spam-protection posture (only the Turnstile-gated edge function reaches these RPCs) intact.

**HARD LESSON for whoever does DB work next:** Do NOT create overloaded versions of an RPC that PostgREST calls by name — even a "safe" backward-compat shim causes PGRST203 and breaks the caller. Keep exactly one function per name; use DEFAULT-valued params for backward compatibility instead of a second overload. And the earlier lesson still stands: `CREATE OR REPLACE` with a new param creates an overload (doesn't replace), new functions get a default PUBLIC grant that must be revoked, and you verify function COUNT + grants after every migration.

**If the form breaks again (recovery):** As of end of session the form is CONFIRMED WORKING (human-tested). If a future change breaks it: the database has exactly one 11-arg `create_web_lead` and that is correct — do NOT add a second overloaded version to "fix" arity (that is what broke it before; see history above). Diagnose by having the user submit the live form and report the browser console/network error. If it is a PGRST203/resolution error, check for accidental function overloads. The blast radius of this RPC is web-form leads ONLY — `book_call`, `get_available_slots`, and all authenticated app paths are untouched.

---

## 4. Phase 3 — WHAT'S LEFT (the immediate next work when funded again)

Phase 3 = "one-box contact form that records email consent." The database layer (section 3) is DONE. Two layers remain. **They have a mandatory order: edge function FIRST, then form.** (If the form sends `wants_updates` before the edge function forwards it, the field is silently dropped — harmless, but pointless.)

**LAYER A — the deployed `submit-lead` edge function (NOT in repo — user-side or Supabase MCP):**
- It must be updated to (1) read a `wants_updates` boolean from the incoming JSON body, and (2) pass it as the 11th positional arg to `create_web_lead`.
- The manager could NOT read this function's source last session (approval gate). **ACTION:** the user should paste the deployed function source from the Supabase dashboard editor into the new chat, OR the manager should retry reading it via the Supabase MCP `get_edge_function` (approval may work in a fresh session). Then spec the one-line change. Do NOT guess at code that can't be seen.
- Likely change: add `wants_updates` to the body destructure, add it to the `create_web_lead` call arguments. Then redeploy the function.

**LAYER B — the form UI + payload (in repo — worker job, on branch `kill-scorecard-offer`):**
- `src/_includes/layouts/base.njk`: add ONE consent checkbox near the submit button. Unchecked by default (affirmative consent). Name it `wants_updates`. One-line CAN-SPAM description, e.g. "Send me occasional emails with lead-gen and SEO tips for contractors. No spam, unsubscribe anytime." The scorecard toggle is already gone; the schedule-call toggle stays.
- `src/js/main.js`: read the new checkbox (`const wantsUpdates = form.querySelector('[name="wants_updates"]')?.checked || false;`), add `wants_updates: wantsUpdates` to the POST payload (~line 588), and REMOVE the now-vestigial `wants_snapshot` read + payload key + analytics field.
- Bump the `main.js` cache-bust version (`?v=N` on the script tag in base.njk) — REQUIRED or returning visitors run stale JS.
- Do Layer B only AFTER Layer A is deployed, or the consent won't store.
- **Note:** consent is RECORDED only. Nothing sends email. Courier is parked/abandoned (see master doc section 10) and would be a separate future project to wire up a nurture sequence.

---

## 5. The MERGE / DEPLOY sequence — USER RUNS THIS (worker's push is harness-blocked)

When the user is ready to put this work live, the order matters. All merges use `--no-ff`. The user runs all pushes/merges personally.

**Current relevant branches:**
- `kill-scorecard-offer` — all the Phase 2 + article work above, plus this handoff doc (`STUDIO87-STATUS.md`). Pushed to origin, NOT merged.
- `rankoncall-banner-dormant` at `ab953b5` — the RankOnCall banner, built but gated OFF. Committed, NOT pushed, NOT merged. It adds the banner markup to `src/articles/article.njk`, styles, and a data file `src/_data/rankoncall.js` with `live: false`. Flipping that one boolean to `true` renders the banner on all 22 article pages pointing at rankoncall.com. Banner copy: headline "Why can't people find you on Google?", "$39 introductory price", "$249.00 value", CTA "Get your Deep Dive".

**The sequence:**
1. Merge `kill-scorecard-offer` into `main` (`--no-ff`). This is what makes the article CTA a services ask instead of "free website today."
2. Merge `rankoncall-banner-dormant` into `main` (`--no-ff`).
3. Flip `live: true` in `src/_data/rankoncall.js`.
4. Push `main`.

**WHY THIS ORDER:** The RankOnCall banner (a $39 paid product) must NOT go live above the OLD "Get your free website today" CTA — that would stack a free-website offer on top of a paid product on every article. Merging `kill-scorecard-offer` first fixes the CTA. Doing both merges before pushing means no deploy window ever shows the bad stack. (Once `kill-scorecard-offer` is merged, the CTA is fixed regardless, so the risk is fully removed.)

---

## 6. Other pending / parked items (lower priority)

- **Master doc rewrite (was "Phase 5"):** `sites-on-call-master-doc.md` (Drive-only, NOT in repo) still describes cold calling, Gloria, the two-person relay, and the free scorecard as live. Sections 1, 2, 4, 5, 6, 7, 9, and most of 10 are now fiction. Needs a rewrite to reflect: no cold calling, no Gloria, scorecard to RankOnCall paid product, RankOnCall as top-of-funnel. This is a writing job for the manager chat (Drive-based, not a worker/repo task).
- **Article Topics Log** (`article-topics-log.md`): should note that `what-google-sees-when-someone-searches-your-business` was fully rewritten and its premise changed (offer removed, RankOnCall handoff added, ~4,457 words).
- **Duplicate `<h1>` bug (site-wide):** every article's `.md` body historically opened with a `# H1` that duplicates the template's `<h1>{{ title }}</h1>`. The rewritten what-google-sees article already OMITS the body H1 (correct). The other ~21 articles still have the duplicate and should be stripped site-wide at some point.
- **Meta entity double-encoding:** article descriptions render escaped HTML entities in snippets — an escaping-path bug, still open.
- **`ARTICLE CTA CARD (Scorecard Offer)` CSS block** at ~styles.css:828 — likely orphaned after Phase 2, flagged but not removed. Cheap cleanup.
- **Vestigial `wants_snapshot`** everywhere — remove during Layer B (section 4). Once the edge function is confirmed forwarding `wants_updates` to the 11-arg RPC, `wants_snapshot` can be retired from the RPC signature entirely.

---

## 7. Operating context for the new manager chat

- **Architecture:** This is a Studio87 manager/worker setup. The manager (claude.ai chat) plans, writes copy, does research, and dispatches to a worker (Claude Code running locally in the repo) via PROMPT blocks. The worker does file edits, git ops, builds, tests. The worker's `git push` is harness-blocked — the USER (Irene) runs all pushes and merges herself, `--no-ff`.
- **The manager CAN and SHOULD** use its own MCP tools directly when faster: Productivity MCP (skills via `get_skill` — `sitesoncall_writing` + `trade_writing` for any writing; also GitHub/Drive tools), SEO-Scout MCP (`seo_wordcount`, `seo_analyze` — verify article length-to-beat), and the Supabase MCP (`fvnuzyexrzkzugqpzkot`) for DB inspection/changes. Writing a flagship article is best done by the MANAGER in-pane, not dispatched (voice quality).
- **The worker's MCPs may be UNAUTHENTICATED** — it reported needing `/mcp` (a user-side terminal command) to auth its Productivity/SEO-Scout servers. If so, route skill/SEO lookups through the manager, which has them.
- **Ground-truth rules that bit us and must be respected:**
  - Repo disk is ground truth. `github_get_file` shows only pushed state (3+ commits stale here). A grep hit in a file does NOT prove that file is used (the orphaned `layouts/article.njk` fooled a prior session).
  - Eleventy 2.0.1 / Nunjucks — NO `split` filter exists.
  - Irene cannot judge from code diffs — she previews rendered output at localhost:8081 (`npx @11ty/eleventy --serve --port=8081`).
  - Turnstile refuses automated/headless tokens — live form tests MUST be done by a human in a browser. A scripted POST only ever hits the captcha gate.
  - Verify Supabase function migrations by checking BOTH function count AND grants afterward (see section 3 lesson).
- **User (Irene) preferences:** direct, no fluff, no flattery, sarcasm welcome, concise. Never fabricate — if you can't verify, say so. Prefers Opus. She reviews before workers execute significant changes; brainstorm + explicit summary before builds.

---

## 8. THE ONE-LINE ANSWER TO "WHERE WERE WE"

Phase 2 (kill the scorecard offer sitewide) is DONE and committed on branch `kill-scorecard-offer` (pushed to origin; `main` untouched, not merged). The what-google-sees article is fully rewritten. The Supabase DB layer of Phase 3 (email-consent column + updated 11-arg RPC) is DONE; it briefly broke the live form via an overload and was fixed and human-confirmed working.

**Immediate next action:** finish Phase 3 — (A) update the deployed `submit-lead` edge function to forward a `wants_updates` field to the 11-arg `create_web_lead` [user pastes the function source or manager reads it via MCP], then (B) dispatch the worker to add the consent checkbox to the form (`base.njk` + `main.js`) on branch `kill-scorecard-offer`.

**Then** the user runs the merge/deploy sequence in section 5 to put everything live (merge kill-scorecard-offer, merge rankoncall-banner-dormant, flip `live: true`, push).

Nothing is broken. Nothing is pushed. The live site is unchanged and the contact form is expected to work (confirm with one human submission).
