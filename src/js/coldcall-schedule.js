/* ============================================================
   Sites On Call — Gloria's "Schedule a call with Irene"
   Add-on for the cold-call app (coldcall.njk).

   Loaded as a SEPARATE file so the 1,300-line app stays untouched
   except for one <script> include. It wraps the globally-exposed
   openLogTouch() and saveTouch() functions:
     - openLogTouch -> also injects a scheduling section into the modal
     - saveTouch    -> after the touch is logged, books the call via book_call()

   Relies on globals already defined by coldcall.njk:
     sb (Supabase client), currentLead, toast, openLogTouch, saveTouch.
   Rules (24h rolling lead time, M-F 9-5 Central, buffer, no double-book)
   are enforced server-side by book_call(); this UI only shows open slots.
   ============================================================ */
(function () {
  "use strict";

  var SLOT_LABELS = { 9: "9:00 AM", 10: "10:00 AM", 11: "11:00 AM", 13: "1:00 PM", 14: "2:00 PM", 15: "3:00 PM", 16: "4:00 PM" };
  var availabilityByDate = {};
  var availabilityLoaded = false;
  var availLoading = false;

  function notify(msg, kind) {
    if (typeof window.toast === "function") window.toast(msg, kind || "ok");
  }

  async function loadAvailability() {
    if (availLoading || typeof sb === "undefined" || !sb) return;
    availLoading = true;
    try {
      var res = await sb.rpc("get_available_slots", { p_source: "cold_call", p_days: 21 });
      if (res.error) { console.error("availability error", res.error); return; }
      availabilityByDate = {};
      (res.data || []).forEach(function (r) {
        (availabilityByDate[r.slot_date] = availabilityByDate[r.slot_date] || []).push(r.slot_hour);
      });
      availabilityLoaded = true;
    } finally {
      availLoading = false;
    }
    refreshSlotUI();
  }

  function injectSchedulingUI() {
    var modal = document.querySelector("#modalRoot .modal");
    if (!modal || modal.querySelector("#schedCallWrap")) return;
    var actions = modal.querySelector('div[style*="justify-content:flex-end"]');
    if (!actions) return;

    var wrap = document.createElement("div");
    wrap.id = "schedCallWrap";
    wrap.style.cssText = "border-top:1px solid var(--line);margin:6px 0 12px;padding-top:12px;";
    wrap.innerHTML =
      '<button type="button" id="schedToggleBtn" class="bigtoggle" style="margin-bottom:10px;">📞 Schedule a call with Irene</button>' +
      '<div id="schedFields" style="display:none;">' +
        '<div class="row2">' +
          '<div class="field"><label>Date (Mon–Fri)</label><input type="date" id="schedDate" /></div>' +
          '<div class="field"><label>Time (Central)</label><select id="schedTime"><option value="">Select a date first…</option></select></div>' +
        "</div>" +
        '<div id="schedMsg" style="font-size:12px;color:var(--muted);margin-top:4px;"></div>' +
      "</div>";
    actions.parentNode.insertBefore(wrap, actions);

    var toggle = wrap.querySelector("#schedToggleBtn");
    toggle.addEventListener("click", function () {
      toggle.classList.toggle("sel");
      var on = toggle.classList.contains("sel");
      wrap.querySelector("#schedFields").style.display = on ? "block" : "none";
      if (on && !availabilityLoaded) loadAvailability();
      else if (on) refreshSlotUI();
    });
    wrap.querySelector("#schedDate").addEventListener("change", refreshSlotUI);
  }

  function refreshSlotUI() {
    var wrap = document.getElementById("schedCallWrap");
    if (!wrap) return;
    var dateEl = wrap.querySelector("#schedDate");
    var timeEl = wrap.querySelector("#schedTime");
    var msg = wrap.querySelector("#schedMsg");

    var dates = Object.keys(availabilityByDate).sort();
    if (dates.length) { dateEl.min = dates[0]; dateEl.max = dates[dates.length - 1]; }

    if (!availabilityLoaded) { timeEl.innerHTML = '<option value="">Loading…</option>'; return; }
    if (!dateEl.value) { timeEl.innerHTML = '<option value="">Select a date first…</option>'; msg.textContent = ""; return; }
    if (!availabilityByDate[dateEl.value]) {
      timeEl.innerHTML = '<option value="">No times open that day</option>';
      msg.textContent = "No open times that day — pick another weekday (Mon–Fri).";
      return;
    }
    msg.textContent = "";
    var hours = availabilityByDate[dateEl.value].slice().sort(function (a, b) { return a - b; });
    timeEl.innerHTML = '<option value="">Select a time…</option>' +
      hours.map(function (h) { return '<option value="' + h + '">' + (SLOT_LABELS[h] || h) + "</option>"; }).join("");
  }

  // Read a pending booking from the modal BEFORE saveTouch closes it.
  function readPendingBooking() {
    var wrap = document.getElementById("schedCallWrap");
    if (!wrap) return null;
    var on = wrap.querySelector("#schedToggleBtn").classList.contains("sel");
    if (!on) return null;
    var date = wrap.querySelector("#schedDate").value;
    var hour = wrap.querySelector("#schedTime").value;
    if (!date || !hour) return { invalid: true };
    return { lead_id: (typeof currentLead !== "undefined" && currentLead) ? currentLead.id : null, date: date, hour: parseInt(hour, 10) };
  }

  function install() {
    if (typeof window.openLogTouch !== "function" || typeof window.saveTouch !== "function") return false;

    var _open = window.openLogTouch;
    window.openLogTouch = function () {
      var r = _open.apply(this, arguments);
      try { injectSchedulingUI(); } catch (e) { console.error("inject sched UI", e); }
      return r;
    };

    var _save = window.saveTouch;
    window.saveTouch = async function () {
      var pending = readPendingBooking();
      if (pending && pending.invalid) {
        notify("Pick a date and time for the call, or turn off scheduling.", "err");
        return;
      }
      await _save.apply(this, arguments); // logs the touch, closes modal, reopens lead
      if (pending && pending.lead_id) {
        try {
          var res = await sb.rpc("book_call", {
            p_lead_id: pending.lead_id,
            p_date: pending.date,
            p_hour: pending.hour,
            p_source: "cold_call"
          });
          if (res.error) notify("Call NOT scheduled: " + (res.error.message || "error"), "err");
          else { notify("📞 Call scheduled with Irene", "ok"); availabilityLoaded = false; }
        } catch (e) {
          notify("Call NOT scheduled: " + (e.message || "error"), "err");
        }
      }
    };
    return true;
  }

  // The inline app script runs before this file (we're included after it),
  // so openLogTouch/saveTouch already exist. Install immediately; retry a few
  // times only as a safety net.
  if (!install()) {
    var tries = 0;
    var iv = setInterval(function () {
      if (install() || ++tries > 50) clearInterval(iv);
    }, 200);
  }
})();
