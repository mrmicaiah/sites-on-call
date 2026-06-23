// Navigation scroll effect
const nav = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

// Mobile menu toggle
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.getElementById('navLinks');
mobileToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

// Close mobile menu when clicking a link
navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// FAQ accordion
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

// Scroll reveal animation
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ============================================
// GA4 EVENT TRACKING
// ============================================

// Safe wrapper - won't throw if gtag isn't loaded yet
function trackEvent(eventName, params = {}) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, params);
  }
}

// Track all SMS link clicks (tap-to-text on the phone number)
document.querySelectorAll('a[href^="sms:"]').forEach(link => {
  link.addEventListener('click', () => {
    trackEvent('sms_click', {
      phone_number: link.getAttribute('href').replace('sms:', ''),
      link_text: link.textContent.trim().slice(0, 50),
      link_location: link.closest('section')?.id || 'unknown'
    });
  });
});

// Track founding client button clicks
document.querySelectorAll('.founding-banner-cta, .founding-cta-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    trackEvent('founding_client_click', {
      button_location: btn.closest('section')?.id || 'banner'
    });
  });
});


// ============================================
// PRICING SYSTEM: Site Size + Monthly/Annual
// ============================================

// State
let selectedSiteSize = 'standard'; // 'standard', 'large', 'custom'
let currentPlan = 'monthly'; // 'monthly', 'annual'

// Pricing data
const PRICING = {
  standard: {
    pages: '10',
    addon: 0,
    starter: 1788,
    standard: 3588,
    growth: 5388
  },
  large: {
    pages: '20',
    addon: 750,
    starter: 2538,
    standard: 4338,
    growth: 6138
  }
};

// DOM elements
const buildCards = document.querySelectorAll('.build-card');
const pricingToggle = document.getElementById('pricingToggle');
const monthlyPricing = document.getElementById('monthlyPricing');
const annualPricing = document.getElementById('annualPricing');
const customSiteMessage = document.getElementById('customSiteMessage');
const annualToggleBtn = pricingToggle?.querySelector('[data-plan="annual"]');

// Format number with commas
function formatPrice(num) {
  return num.toLocaleString('en-US');
}

// Update annual card prices and text based on site size
function updateAnnualCards() {
  if (selectedSiteSize === 'custom') return; // Don't update for custom
  
  const pricing = PRICING[selectedSiteSize];
  const pages = pricing.pages;
  
  // Update each annual card
  annualPricing.querySelectorAll('.pricing-card').forEach(card => {
    const plan = card.dataset.plan;
    const newPrice = pricing[plan];
    
    // Update price
    const priceEl = card.querySelector('.annual-price');
    if (priceEl) priceEl.textContent = formatPrice(newPrice);
    
    // Update description
    const descEl = card.querySelector('.annual-desc');
    if (descEl) {
      descEl.textContent = descEl.textContent.replace(/\d+-page/, pages + '-page');
    }
    
    // Update feature list item
    const featureEl = card.querySelector('.annual-site-feature');
    if (featureEl) {
      featureEl.textContent = `Includes ${pages}-page website FREE`;
    }
  });
}

// Handle site size selection
function selectSiteSize(size) {
  selectedSiteSize = size;
  
  // Update build card UI
  buildCards.forEach(card => {
    const isSelected = card.dataset.size === size;
    card.classList.toggle('selected', isSelected);
    const cta = card.querySelector('.build-cta');
    if (cta) {
      cta.textContent = isSelected ? 'Selected ✓' : 'Select & Continue ↓';
    }
  });
  
  // Handle custom site special case
  if (size === 'custom') {
    // If currently on annual, switch to monthly
    if (currentPlan === 'annual') {
      switchToMonthly();
    }
    // Disable annual toggle
    if (annualToggleBtn) {
      annualToggleBtn.disabled = true;
      annualToggleBtn.title = 'Annual prepay not available for custom sites';
    }
  } else {
    // Enable annual toggle
    if (annualToggleBtn) {
      annualToggleBtn.disabled = false;
      annualToggleBtn.title = '';
    }
    // Update annual cards with new pricing
    updateAnnualCards();
  }
  
  // Track site size selection
  trackEvent('site_size_select', { size: size });
}

// Switch to monthly view
function switchToMonthly() {
  currentPlan = 'monthly';
  pricingToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  pricingToggle.querySelector('[data-plan="monthly"]').classList.add('active');
  monthlyPricing.style.display = 'grid';
  annualPricing.style.display = 'none';
  customSiteMessage.style.display = 'none';
}

// Switch to annual view
function switchToAnnual() {
  currentPlan = 'annual';
  pricingToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
  pricingToggle.querySelector('[data-plan="annual"]').classList.add('active');
  monthlyPricing.style.display = 'none';
  
  if (selectedSiteSize === 'custom') {
    // Show custom message instead of annual cards
    annualPricing.style.display = 'none';
    customSiteMessage.style.display = 'block';
  } else {
    // Show annual cards
    annualPricing.style.display = 'grid';
    customSiteMessage.style.display = 'none';
    
    // Re-observe for reveal animations
    annualPricing.querySelectorAll('.reveal').forEach(el => {
      el.classList.remove('visible');
      observer.observe(el);
    });
  }
}

// Build card click handlers
buildCards.forEach(card => {
  card.addEventListener('click', (e) => {
    e.preventDefault();
    selectSiteSize(card.dataset.size);
    // Scroll to content plans
    document.getElementById('content-plans').scrollIntoView({ behavior: 'smooth' });
  });
});

// Pricing toggle click handlers
if (pricingToggle) {
  pricingToggle.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      
      const plan = btn.dataset.plan;
      if (plan === 'annual') {
        switchToAnnual();
      } else {
        switchToMonthly();
      }
      trackEvent('pricing_plan_toggle', { plan: plan });
    });
  });
}

// Initialize: ensure first card is selected (without firing event)
(function initSiteSize() {
  selectedSiteSize = 'standard';
  buildCards.forEach(card => {
    const isSelected = card.dataset.size === 'standard';
    card.classList.toggle('selected', isSelected);
  });
})();


// ============================================
// CLOUDFLARE TURNSTILE (explicit render)
// The widget lives inside a modal that's hidden at page load, so auto-render
// fails to mount. We render explicitly when the modal opens instead.
// ============================================
const TURNSTILE_SITEKEY = "0x4AAAAAADp5EfXTrI2txHB9";
let turnstileWidgetId = null;
let turnstileApiReady = false;

function renderTurnstile() {
  if (!turnstileApiReady || turnstileWidgetId !== null || !window.turnstile) return;
  const el = document.getElementById('cf-turnstile-widget');
  if (!el) return;
  try {
    turnstileWidgetId = window.turnstile.render('#cf-turnstile-widget', { sitekey: TURNSTILE_SITEKEY });
  } catch (e) { /* not ready / already rendered */ }
}
function getTurnstileToken() {
  try {
    if (window.turnstile && turnstileWidgetId !== null) {
      return window.turnstile.getResponse(turnstileWidgetId) || '';
    }
  } catch (e) {}
  const f = document.querySelector('#contactForm [name="cf-turnstile-response"]');
  return (f && f.value) || '';
}
function resetTurnstile() {
  try {
    if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId);
  } catch (e) {}
}
// Called by the Turnstile API script once it has loaded (?onload=onTurnstileReady)
window.onTurnstileReady = function () {
  turnstileApiReady = true;
  // If the modal is already open, mount now.
  if (document.getElementById('contactModal')?.classList.contains('open')) renderTurnstile();
};


// ============================================
// CONTACT MODAL
// ============================================

const modal = document.getElementById('contactModal');

// Generic toggle handler
// The form toggles are a <label> wrapping a visually-hidden <input type="checkbox">.
// A label natively toggles its wrapped checkbox on ANY click inside it, which fires
// the checkbox 'change' event. We therefore do NOT manually flip the checkbox in JS
// (doing so double-toggles and cancels out the native flip — the bug that made the
// boxes appear dead). We only listen for 'change' and update the visual state.
function setupFormToggle(toggleId, checkboxId, fieldsId) {
  const toggle = document.getElementById(toggleId);
  const checkbox = document.getElementById(checkboxId);
  const fields = fieldsId ? document.getElementById(fieldsId) : null;
  
  if (!toggle || !checkbox) return;
  
  function updateState() {
    const isChecked = checkbox.checked;
    toggle.classList.toggle('checked', isChecked);
    if (fields) {
      fields.style.display = isChecked ? 'block' : 'none';
    }
  }
  
  // React to the real checkbox state (set by the native label click, keyboard,
  // or programmatic change). No manual flipping — let the browser do it.
  checkbox.addEventListener('change', updateState);
  
  // Sync the visual state on load in case the box starts checked.
  updateState();
  
  return { toggle, checkbox, fields, updateState };
}

// Setup toggles
const snapshotToggle = setupFormToggle('snapshotToggle', 'cf-snapshot');
const scheduleToggle = setupFormToggle('scheduleToggle', 'cf-schedule', 'scheduleFields');

// Capture original submit button HTML so we can restore it when a returning
// submitter sends another request from the same modal session.
const cfSubmitBtn = document.getElementById('cfSubmit');
const originalSubmitBtnHTML = cfSubmitBtn ? cfSubmitBtn.innerHTML : '';

// Reset the form for a follow-up request from the same person, keeping their
// contact info (name/email/business/phone) so they don't have to retype it.
function submitAnotherRequest() {
  const form = document.getElementById('contactForm');
  const formContent = document.getElementById('formContent');
  const formSuccess = document.getElementById('formSuccess');
  if (!form || !formContent || !formSuccess) return;
  
  // Clear request-specific fields only (preserve identity fields)
  ['package', 'message', 'call_date', 'call_time'].forEach(name => {
    const el = form.querySelector('[name="' + name + '"]');
    if (el) el.value = '';
  });
  
  // Reset the scorecard + schedule toggles
  if (snapshotToggle) {
    snapshotToggle.checkbox.checked = false;
    snapshotToggle.updateState();
  }
  if (scheduleToggle) {
    scheduleToggle.checkbox.checked = false;
    scheduleToggle.updateState();
  }
  
  // Clear any leftover validation error state
  form.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
  if (typeof setSlotMsg === 'function') setSlotMsg('');

  // Fresh Turnstile token for the next submission
  resetTurnstile();
  
  // Restore the submit button (it was left in the "Sending…" disabled state)
  if (cfSubmitBtn) {
    cfSubmitBtn.disabled = false;
    cfSubmitBtn.innerHTML = originalSubmitBtnHTML;
  }
  
  // Swap the success card back out for the form
  formSuccess.style.display = 'none';
  formSuccess.classList.remove('show');
  formContent.style.display = 'block';
  
  // Drop the user on the package selector — first field they actually need to set
  setTimeout(() => {
    const pkg = document.getElementById('cf-package');
    if (pkg) pkg.focus();
  }, 100);
  
  trackEvent('submit_another_request', { form_name: 'contact' });
}

window.submitAnotherRequest = submitAnotherRequest;

function openContactModal(precheckSnapshot = false) {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  navLinks.classList.remove('open');

  // Mount the Turnstile widget now that its container is visible.
  renderTurnstile();
  
  // If the previous submission's success card is still showing (because the
  // user closed and reopened the modal), reset the form for another request
  // while keeping their contact info intact.
  const formSuccess = document.getElementById('formSuccess');
  if (formSuccess && formSuccess.style.display === 'block') {
    submitAnotherRequest();
  }
  
  // Pre-check snapshot if requested (e.g., from article CTA)
  if (precheckSnapshot && snapshotToggle) {
    snapshotToggle.checkbox.checked = true;
    snapshotToggle.updateState();
  }
  
  // Track modal open
  trackEvent('contact_modal_open', {
    pre_check_snapshot: precheckSnapshot ? 'yes' : 'no'
  });
  
  // If contact info is already filled in (returning submitter), skip past it
  // to the package selector. Otherwise focus the name field as usual.
  setTimeout(() => {
    const nameField = document.getElementById('cf-name');
    if (nameField && nameField.value.trim()) {
      const pkg = document.getElementById('cf-package');
      (pkg || nameField).focus();
    } else if (nameField) {
      nameField.focus();
    }
  }, 200);
}

function closeContactModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

// Expose modal functions globally for onclick handlers
window.openContactModal = openContactModal;
window.closeContactModal = closeContactModal;

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeContactModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('open')) closeContactModal();
});

// ============================================
// SUPABASE-BACKED SCHEDULING + LEAD CAPTURE
// Leads/bookings live in Supabase. Submission goes through the Turnstile-gated
// submit-lead edge function; availability is a read-only anon RPC.
// ============================================
const SUPABASE_URL = "https://fvnuzyexrzkzugqpzkot.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2bnV6eWV4cnprenVncXB6a290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwODc3MjksImV4cCI6MjA5NjY2MzcyOX0.-K934pgNlMoe3khevOjE_1FCZFLxuDvIE_IBy-Mj3oo";
const SUBMIT_URL = "https://fvnuzyexrzkzugqpzkot.supabase.co/functions/v1/submit-lead";
const sb = (window.supabase && typeof window.supabase.createClient === 'function')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// Hour (24h, Central) -> display label for the time dropdown
const SLOT_LABELS = { 9:'9:00 AM', 10:'10:00 AM', 11:'11:00 AM', 13:'1:00 PM', 14:'2:00 PM', 15:'3:00 PM', 16:'4:00 PM' };

// availabilityByDate: { 'YYYY-MM-DD': [9,10,...] } of OPEN hours (booked + buffered already excluded server-side)
let availabilityByDate = {};
let availabilityLoaded = false;

const dateInput = document.getElementById('cf-date');
const timeSelect = document.getElementById('cf-time');
const slotMsg = document.getElementById('cf-slot-msg');

function setSlotMsg(text) {
  if (!slotMsg) return;
  slotMsg.textContent = text || '';
  slotMsg.style.display = text ? 'block' : 'none';
}

function populateTimes() {
  if (!timeSelect) return;
  if (!dateInput || !dateInput.value) {
    timeSelect.innerHTML = '<option value="">Select a date first…</option>';
    return;
  }
  const hours = (availabilityByDate[dateInput.value] || []).slice().sort((a, b) => a - b);
  if (!hours.length) {
    timeSelect.innerHTML = '<option value="">No times open that day</option>';
    return;
  }
  timeSelect.innerHTML = '<option value="">Select a time…</option>' +
    hours.map(h => `<option value="${h}">${SLOT_LABELS[h] || (h + ':00')}</option>`).join('');
}

async function loadAvailability() {
  if (!sb) {
    setSlotMsg('Scheduling is briefly unavailable — submit the form and Irene will reach out to set a time.');
    return;
  }
  setSlotMsg('Loading available times…');
  const { data, error } = await sb.rpc('get_available_slots', { p_source: 'web', p_days: 21 });
  if (error) {
    availabilityLoaded = false;
    setSlotMsg('Couldn\'t load times right now — submit anyway and we\'ll sort out a time.');
    return;
  }
  availabilityByDate = {};
  (data || []).forEach(row => {
    (availabilityByDate[row.slot_date] = availabilityByDate[row.slot_date] || []).push(row.slot_hour);
  });
  availabilityLoaded = true;

  const dates = Object.keys(availabilityByDate).sort();
  if (dateInput && dates.length) {
    dateInput.min = dates[0];
    dateInput.max = dates[dates.length - 1];
    if (dateInput.value && !availabilityByDate[dateInput.value]) dateInput.value = '';
  }
  populateTimes();
  setSlotMsg(dates.length ? '' : 'No open times in the next few weeks — submit the form and Irene will reach out.');
}

if (dateInput) {
  dateInput.addEventListener('change', () => {
    if (availabilityLoaded && dateInput.value && !availabilityByDate[dateInput.value]) {
      setSlotMsg('That day has no open times — pick another weekday (Mon–Fri).');
    } else {
      setSlotMsg('');
    }
    populateTimes();
  });
}

// Load availability the first time the "Schedule a phone call" toggle is switched on.
const _scheduleCheckbox = document.getElementById('cf-schedule');
if (_scheduleCheckbox) {
  _scheduleCheckbox.addEventListener('change', () => {
    if (_scheduleCheckbox.checked && !availabilityLoaded) loadAvailability();
  });
}

// Map package values to a clean GA4 label
function mapPackageInterest(pkg) {
  if (!pkg) return 'Not Sure';
  if (pkg.includes('starter')) return 'Starter';
  if (pkg.includes('standard')) return 'Standard';
  if (pkg.includes('growth')) return 'Growth';
  return 'Not Sure';
}

// Contact form submission -> Turnstile-gated submit-lead function
(function() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const originalHTML = btn.innerHTML;
    form.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));

    const name = form.querySelector('[name="name"]').value.trim();
    const email = form.querySelector('[name="email"]').value.trim();
    const business = form.querySelector('[name="business"]').value.trim();
    const phone = form.querySelector('[name="phone"]').value.trim();
    const wantsCall = form.querySelector('[name="wants_call"]')?.checked || false;
    const wantsSnapshot = form.querySelector('[name="wants_snapshot"]')?.checked || false;
    const pkg = form.querySelector('[name="package"]')?.value.trim() || '';
    const message = form.querySelector('[name="message"]')?.value.trim() || '';
    const callDate = form.querySelector('[name="call_date"]')?.value.trim() || '';
    const callHourRaw = form.querySelector('[name="call_time"]')?.value.trim() || '';

    let hasError = false;
    function flag(sel) {
      form.querySelector(sel).closest('.form-group').classList.add('has-error');
      hasError = true;
    }
    if (!name) flag('[name="name"]');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) flag('[name="email"]');
    if (!business) flag('[name="business"]');
    if (!phone) flag('[name="phone"]');
    if (wantsCall && (!callDate || !callHourRaw)) {
      setSlotMsg('Pick a date and time for your call, or uncheck "Schedule a phone call".');
      hasError = true;
    }
    if (hasError) {
      trackEvent('form_validation_error', { form_name: 'contact' });
      return;
    }

    // Cloudflare Turnstile token (from the explicitly-rendered widget)
    const tToken = getTurnstileToken();
    if (!tToken) {
      setSlotMsg('');
      alert('Hang on a second for the verification box to finish, then tap Send again.');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Sending…';

    let data = {};
    try {
      const resp = await fetch(SUBMIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          email: email,
          phone: phone,
          business: business,
          package: pkg,
          message: message,
          wants_snapshot: wantsSnapshot,
          wants_call: wantsCall,
          call_date: (wantsCall && callDate) ? callDate : null,
          call_hour: (wantsCall && callHourRaw) ? parseInt(callHourRaw, 10) : null,
          turnstile_token: tToken
        })
      });
      data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
        resetTurnstile();
        trackEvent('form_submit_error', { form_name: 'contact', error: (data && data.error) || resp.status });
        alert(data && data.error === 'captcha_failed'
          ? 'Verification failed — please try again.'
          : 'Something went wrong. Please try again or email info@sitesoncall.com.');
        return;
      }
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
      resetTurnstile();
      trackEvent('form_submit_error', { form_name: 'contact', error: 'network' });
      alert('Something went wrong. Please try again or email info@sitesoncall.com.');
      return;
    }

    // One token per submission — refresh for any subsequent send.
    resetTurnstile();

    // Lead always saves; if the slot was grabbed first, booking comes back false.
    if (wantsCall && data && data.booked === false) {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
      trackEvent('booking_conflict', { form_name: 'contact' });
      await loadAvailability();
      setSlotMsg('That time was just taken — your details are saved. Pick another open slot and resubmit, or we\'ll reach out to you.');
      return;
    }

    // Success
    const successNameEl = document.getElementById('successName');
    if (successNameEl) {
      const firstName = name.split(/\s+/)[0];
      successNameEl.textContent = firstName ? ', ' + firstName : '';
    }
    document.getElementById('formContent').style.display = 'none';
    const success = document.getElementById('formSuccess');
    success.style.display = 'block';
    success.classList.add('show');

    trackEvent('generate_lead', {
      form_name: 'contact',
      package_interest: mapPackageInterest(pkg),
      wants_snapshot: wantsSnapshot ? 'yes' : 'no',
      wants_call: wantsCall ? 'yes' : 'no',
      booked_call: (wantsCall && data && data.booked) ? 'yes' : 'no'
    });
  });
})();
