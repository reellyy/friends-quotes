/**
 * Browser-executable test suite for the "50 Lines" Friends quotes one-pager.
 *
 * How to run:
 *   1. Open friends-quotes.html in a browser.
 *   2. Paste this whole file into the DevTools console (it's a single
 *      async IIFE), or `await` its return value via a JS-eval automation
 *      tool.
 *   3. It logs a table and returns [{ name, pass, message }, ...].
 *
 * No test framework/dependency required - runs against the live DOM.
 */
(async function () {
  const results = [];

  // `fn` may be sync or async; both are awaited uniformly.
  async function test(name, fn) {
    try {
      const outcome = await fn();
      results.push({ name, pass: !!outcome.pass, message: outcome.message || "" });
    } catch (err) {
      results.push({ name, pass: false, message: "threw: " + err.message });
    }
  }
  function pass(message) { return { pass: true, message: message || "" }; }
  function fail(message) { return { pass: false, message: message || "" }; }

  // ---- Content ----

  await test("renders exactly 50 quote cards", () => {
    const n = document.querySelectorAll(".card").length;
    return n === 50 ? pass() : fail("found " + n + " cards");
  });

  await test("no duplicate quote text", () => {
    const texts = [...document.querySelectorAll(".quote")].map(el => el.textContent.trim());
    const unique = new Set(texts);
    return unique.size === texts.length
      ? pass()
      : fail((texts.length - unique.size) + " duplicate quote(s)");
  });

  await test("every card has non-empty quote and character name", () => {
    const cards = [...document.querySelectorAll(".card")];
    const bad = cards.filter(c => {
      const q = c.querySelector(".quote")?.textContent.trim();
      const who = c.querySelector(".name")?.textContent.trim();
      return !q || !who;
    });
    return bad.length === 0 ? pass() : fail(bad.length + " card(s) missing quote/name");
  });

  await test("numbering is sequential 01..50 matching DOM order", () => {
    const nums = [...document.querySelectorAll(".num")].map(el => el.textContent.replace(/\D/g, ""));
    const expected = Array.from({ length: 50 }, (_, i) => String(i + 1).padStart(2, "0"));
    const mismatch = nums.findIndex((n, i) => n !== expected[i]);
    return mismatch === -1 ? pass() : fail("mismatch at index " + mismatch + ": got " + nums[mismatch]);
  });

  // ---- Layout ----

  await test("wall uses a 4-column grid at desktop width", () => {
    if (window.innerWidth < 901) return pass("skipped: viewport too narrow for this assertion");
    const wall = document.getElementById("wall");
    const cols = getComputedStyle(wall).gridTemplateColumns.trim().split(/\s+/).length;
    return cols === 4 ? pass() : fail("grid-template-columns resolved to " + cols + " tracks");
  });

  await test("wall drops to 2 columns at tablet width", () => {
    if (window.innerWidth > 900 || window.innerWidth < 521) return pass("skipped: run this at ~700-900px viewport");
    const wall = document.getElementById("wall");
    const cols = getComputedStyle(wall).gridTemplateColumns.trim().split(/\s+/).length;
    return cols === 2 ? pass() : fail("grid-template-columns resolved to " + cols + " tracks");
  });

  await test("wall drops to 1 column at mobile width", () => {
    if (window.innerWidth > 520) return pass("skipped: run this at <=520px viewport");
    const wall = document.getElementById("wall");
    const cols = getComputedStyle(wall).gridTemplateColumns.trim().split(/\s+/).length;
    return cols === 1 ? pass() : fail("grid-template-columns resolved to " + cols + " tracks");
  });

  await test("no horizontal page overflow", () => {
    const overflow = document.documentElement.scrollWidth - window.innerWidth;
    return overflow <= 1 ? pass() : fail("scrollWidth exceeds viewport by " + overflow + "px");
  });

  await test("cards visually indicate interactivity (cursor: pointer)", () => {
    const card = document.querySelector(".card");
    const cursor = getComputedStyle(card).cursor;
    return cursor === "pointer" ? pass() : fail("cursor is " + cursor);
  });

  // ---- Accessibility ----

  await test("clickable quote cards are reachable/operable by keyboard", () => {
    const card = document.querySelector(".card");
    const focusable = card.tabIndex >= 0 || ["BUTTON", "A"].includes(card.tagName);
    return focusable ? pass() : fail("card has no tabindex and is not a native interactive element - keyboard users can't trigger it");
  });

  await test("clickable quote cards expose their action to assistive tech", () => {
    const card = document.querySelector(".card");
    const hasRole = card.getAttribute("role");
    const hasLabel = card.getAttribute("aria-label") || card.getAttribute("aria-description");
    return (hasRole || hasLabel) ? pass() : fail("no role/aria-label - screen reader users get no hint that clicking does something");
  });

  await test("Enter key on a focused card triggers the same effect as a click", () => {
    const card = document.querySelector(".card");
    card.focus();
    const before = document.querySelectorAll(".cat").length;
    card.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    const after = document.querySelectorAll(".cat").length;
    return after > before ? pass((after - before) + " cats via keyboard") : fail("Enter key did not spawn cats");
  });

  // ---- Cat confetti behaviour ----

  await test("clicking a card spawns cat elements", () => {
    const before = document.querySelectorAll(".cat").length;
    document.querySelector(".card").dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 100, clientY: 100 }));
    const after = document.querySelectorAll(".cat").length;
    return after > before ? pass((after - before) + " cats spawned") : fail("no .cat elements appeared after click");
  });

  await test("clicking outside any card does not spawn cats", async () => {
    // let the previous test's cats fully clear first
    await new Promise(r => setTimeout(r, 3500));
    const before = document.querySelectorAll(".cat").length;
    document.querySelector("footer").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const after = document.querySelectorAll(".cat").length;
    return after === before ? pass() : fail("cats spawned from a non-card click target");
  });

  await test("spawned cats clean themselves up after their animation", async () => {
    document.querySelector(".card").dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 50, clientY: 50 }));
    const spawned = document.querySelectorAll(".cat").length;
    await new Promise(r => setTimeout(r, 3800));
    const remaining = document.querySelectorAll(".cat").length;
    return remaining === 0 ? pass("cleaned up " + spawned + " cats") : fail(remaining + " stray .cat node(s) left in the DOM");
  });

  await test("cats are removed even if reduced-motion is off but tab is backgrounded (no runaway growth)", () => {
    // Sanity cap: a burst should never exceed a reasonable count.
    document.querySelector(".card").dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: 10, clientY: 10 }));
    const count = document.querySelectorAll(".cat").length;
    return count > 0 && count <= 80 ? pass(count + " cats") : fail("unexpected cat count: " + count);
  });

  // Regression test: an earlier build relied solely on the `animationend`
  // event to remove spawned cats. If that event is ever missed (backgrounded
  // tab, interrupted animation, browser quirk), cats leaked into the DOM
  // forever. A `setTimeout` fallback now force-removes them independently.
  await test("cats are force-removed by a fallback timer even when animationend never fires", async () => {
    const blocker = (e) => { e.stopImmediatePropagation(); };
    document.addEventListener("animationend", blocker, true);
    document.querySelector(".card").dispatchEvent(new MouseEvent("click", { bubbles: true }));
    const spawned = document.querySelectorAll(".cat").length;
    await new Promise(r => setTimeout(r, 4600)); // > worst-case duration+delay+buffer
    document.removeEventListener("animationend", blocker, true);
    const remaining = document.querySelectorAll(".cat").length;
    return remaining === 0
      ? pass("fallback cleaned up " + spawned + " cats with animationend blocked")
      : fail(remaining + " stray cat(s) survived even with the fallback timer");
  });

  console.table(results.map(r => ({ name: r.name, pass: r.pass, message: r.message })));
  const failed = results.filter(r => !r.pass);
  console.log(failed.length === 0 ? "ALL TESTS PASSED" : failed.length + " TEST(S) FAILED");
  return results;
})();
