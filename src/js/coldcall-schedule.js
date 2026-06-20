/* ============================================================
   Sites On Call — Gloria's "Schedule a call with Irene"
   Add-on for the cold-call app (coldcall.njk).

   Loaded as a SEPARATE file so the 1,300-line app stays untouched
   except for one <script> include. It wraps globally-exposed functions:
     - openLogTouch -> also injects a scheduling section into the touch modal
     - saveTouch    -> after the touch is logged, books the call via book_call()
     - loadDashboard-> adds a "Calls scheduled" stat tile + an upcoming-calls list

   Relies on globals already defined by coldcall.njk:
     sb (Supabase client), currentLead, toast, openLogTouch, saveTouch, loadDashboard.
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
  function esc(s) {
    return (s == null ? "" : String(s)).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function dayShort(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }
  function telHref(p) { return "tel:" + (p || "").replace(/[^0-9+]/g, ""); }
  function srcBadge(source) {
    return source === "web"
      ? '<span style="font-size:11px;font-weight:600;padding:1px 7px;border-radius:999px;background:rgba(163,113,247,.16);color:#a371f7;">Web</span>'
      : '<span style="font-size:11px;font-weight:600;padding:1px 7px;border-radius:999px;background:rgba(63,185,80,.16);color:#3fb950;">Cold</span>';
  }

  /* ---------- booking UI inside the Log-a-touch modal ---------- */

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

  /* ---------- dashboard: "Calls scheduled" stat + upcoming list ---------- */

  async function renderCallStats() {
    if (typeof sb === "undefined" || !sb) return;
    var res = await sb.rpc("get_upcoming_calls", { p_days: 365 });
    if (res.error) { console.error("calls stat error", res.error); return; }
    var rows = res.data || [];

    // 1) stat tile appended to #topStats (rebuilt fresh by loadDashboard each load)
    var top = document.getElementById("topStats");
    if (top && !document.getElementById("statCalls")) {
      var tile = document.createElement("div");
      tile.className = "stat";
      tile.id = "statCalls";
      tile.style.cursor = "pointer";
      tile.title = "Open the full calls dashboard";
      tile.onclick = function () { window.open("/calls", "_blank"); };
      tile.innerHTML = '<div class="num" style="color:var(--accent)">' + rows.length + '</div><div class="lbl">Calls scheduled</div>';
      top.appendChild(tile);
    }

    // 2) "Scheduled calls" panel inserted right after #topStats
    var panel = document.getElementById("schedCallsPanel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "schedCallsPanel";
      panel.className = "panel";
      panel.style.marginBottom = "20px";
      if (top && top.parentNode) top.parentNode.insertBefore(panel, top.nextSibling);
      else { var dash = document.getElementById("dashboardView"); if (dash) dash.appendChild(panel); }
    }
    var upcoming = rows.slice(0, 12);
    var listHtml = upcoming.map(function (r) {
      var t = SLOT_LABELS[r.slot_hour] || (r.slot_hour + ":00");
      var who = r.booked_by_name ? (" · " + esc(r.booked_by_name)) : (r.source === "web" ? " · self-booked" : "");
      var phone = r.phone ? '<a href="' + telHref(r.phone) + '">' + esc(r.phone) + "</a>" : '<span style="color:var(--muted)">no phone</span>';
      return '<div class="touch-item" style="display:flex;justify-content:space-between;gap:10px;align-items:center;">' +
        '<div><strong>' + esc(dayShort(r.slot_date)) + " · " + esc(t) + "</strong> — " + esc(r.business_name) + " " + srcBadge(r.source) + who + "</div>" +
        "<div>" + phone + "</div>" +
        "</div>";
    }).join("");
    panel.innerHTML =
      '<div class="section-title" style="margin-top:0;">📞 Scheduled calls' + (rows.length ? " (" + rows.length + ")" : "") + "</div>" +
      (rows.length ? listHtml : '<div class="empty" style="padding:14px;">No calls scheduled.</div>') +
      '<div style="margin-top:10px;"><a href="/calls" target="_blank">Open full calls dashboard →</a></div>';
  }

  /* ---------- install: wrap the app's global functions ---------- */

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

    if (typeof window.loadDashboard === "function") {
      var _dash = window.loadDashboard;
      window.loadDashboard = async function () {
        var r = await _dash.apply(this, arguments);
        try { await renderCallStats(); } catch (e) { console.error("call stats", e); }
        return r;
      };
    }

    return true;
  }

  // The inline app script runs before this file (we're included after it),
  // so the functions already exist. Install immediately; retry as a safety net.
  if (!install()) {
    var tries = 0;
    var iv = setInterval(function () {
      if (install() || ++tries > 50) clearInterval(iv);
    }, 200);
  }
})();
