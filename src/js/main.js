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

// Track contact modal opens (any way it opens)
const _originalOpenContactModal = window.openContactModal;
// Will be wrapped after openContactModal is defined below — see end of file


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

// Date picker: restrict to weekdays only (Mon-Fri)
const dateInput = document.getElementById('cf-date');
if (dateInput) {
  // Set min date to today
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.min = `${yyyy}-${mm}-${dd}`;
  
  // Validate on change - if weekend selected, find next weekday
  dateInput.addEventListener('change', () => {
    const selected = new Date(dateInput.value + 'T12:00:00');
    const day = selected.getDay();
    if (day === 0) { // Sunday - move to Monday
      selected.setDate(selected.getDate() + 1);
    } else if (day === 6) { // Saturday - move to Monday
      selected.setDate(selected.getDate() + 2);
    }
    const newYyyy = selected.getFullYear();
    const newMm = String(selected.getMonth() + 1).padStart(2, '0');
    const newDd = String(selected.getDate()).padStart(2, '0');
    dateInput.value = `${newYyyy}-${newMm}-${newDd}`;
  });
}

// Contact form submission
(function() {
  const CONFIG = {
    list: 'sites-on-call-leads',
    source: 'sites-on-call',
    funnel: 'contact-form',
    formSelector: '#contactForm',
    tags: ['new-lead'],
    customFields: ['business', 'phone', 'message', 'package', 'call_date', 'call_time', 'wants_snapshot', 'wants_call'],
    successMessage: 'Thanks! We\'ll be in touch within 24 hours.',
    errorMessage: 'Something went wrong. Please try again or email us at hello@sitesoncall.com.'
  };
  
  const API_URL = 'https://email-bot-server.micaiah-tasks.workers.dev/api/subscribe';
  // Cold Call Leads Apps Script (same sheet Gloria's call tool writes to).
  // Web form rows are stamped Source = "Web Form"; cold-call rows default to "Cold Call".
  const LEAD_TRACKER_URL = 'https://script.google.com/macros/s/AKfycbySuUc1-9uz9X7XIU1a39Ydob8eaDq89XmDeUd-RakTh81idxFx0gfTfIR6fEiVplPd/exec';
  
  // Map package values to Lead Tracker format
  function mapPackageInterest(pkg) {
    if (!pkg) return 'Not Sure';
    if (pkg.includes('starter')) return 'Starter';
    if (pkg.includes('standard')) return 'Standard';
    if (pkg.includes('growth')) return 'Growth';
    if (pkg === 'website-only') return 'Not Sure';
    return 'Not Sure';
  }
  
  // Build a human-readable Notes blob from the form-only fields that the
  // Cold Call Leads sheet has no dedicated columns for (package interest,
  // scorecard/call requests, scheduling, free-text message).
  function buildSheetNotes(formData) {
    const parts = [];
    if (formData.package) parts.push('Package: ' + mapPackageInterest(formData.package));
    parts.push('Wants scorecard: ' + (formData.wants_snapshot ? 'Yes' : 'No'));
    if (formData.wants_call) {
      let callLine = 'Wants call: Yes';
      if (formData.call_date || formData.call_time) {
        callLine += ' (' + [formData.call_date, formData.call_time].filter(Boolean).join(' ') + ')';
      }
      parts.push(callLine);
    }
    if (formData.message) parts.push('Message: ' + formData.message);
    return parts.join(' | ');
  }

  // Send to the Cold Call Leads sheet (same sheet Gloria's call tool feeds).
  // Field names MUST match what the Apps Script doPost reads:
  // d.date, d.interest, d.business, d.contact, d.decisionMaker, d.phone,
  // d.email, d.trade, d.city, d.hasWebsite, d.problem, d.followUp,
  // d.notes, d.status, d.source.
  async function sendToLeadTracker(formData) {
    const payload = {
      date: new Date().toLocaleString('en-US'),
      interest: '',                              // Gloria's call-temperature field; N/A for web
      business: formData.business || '',         // Business column
      contact: formData.name || '',              // Contact column (person's name)
      decisionMaker: '',                         // Not collected on the web form
      phone: formData.phone || '',
      email: formData.email || '',
      trade: '',                                 // Not collected on the web form
      city: '',                                  // Not collected on the web form
      hasWebsite: '',                            // Not collected on the web form
      problem: '',                               // Gloria's call-observation field; N/A for web
      followUp: '',
      notes: buildSheetNotes(formData),          // Package / scorecard / call / message packed here
      status: 'New',
      source: 'Web Form'                         // Stamps the Source column (R)
    };

    try {
      await fetch(LEAD_TRACKER_URL, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script requires this
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('Lead Tracker error:', err);
      // Don't block form submission if the sheet write fails
    }
  }
  
  document.querySelector(CONFIG.formSelector)?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalHTML = btn.innerHTML;
    
    form.querySelectorAll('.form-group').forEach(g => g.classList.remove('has-error'));
    
    const email = form.querySelector('[name="email"]').value.trim();
    const name = form.querySelector('[name="name"]').value.trim();
    const business = form.querySelector('[name="business"]').value.trim();
    const phone = form.querySelector('[name="phone"]').value.trim();
    let hasError = false;
    
    if (!name) {
      form.querySelector('[name="name"]').closest('.form-group').classList.add('has-error');
      hasError = true;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      form.querySelector('[name="email"]').closest('.form-group').classList.add('has-error');
      hasError = true;
    }
    if (!business) {
      form.querySelector('[name="business"]').closest('.form-group').classList.add('has-error');
      hasError = true;
    }
    if (!phone) {
      form.querySelector('[name="phone"]').closest('.form-group').classList.add('has-error');
      hasError = true;
    }
    if (hasError) {
      trackEvent('form_validation_error', { form_name: 'contact' });
      return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Sending…';
    
    // Collect all form data
    const formData = {
      email: email,
      name: name,
      business: business,
      phone: phone,
      package: form.querySelector('[name="package"]')?.value.trim() || '',
      call_date: form.querySelector('[name="call_date"]')?.value.trim() || '',
      call_time: form.querySelector('[name="call_time"]')?.value.trim() || '',
      message: form.querySelector('[name="message"]')?.value.trim() || '',
      wants_snapshot: form.querySelector('[name="wants_snapshot"]')?.checked || false,
      wants_call: form.querySelector('[name="wants_call"]')?.checked || false
    };
    
    // Send to Lead Tracker (Google Sheet) - fire and forget
    sendToLeadTracker(formData);
    
    // Send to Courier (email system)
    const payload = {
      email: email,
      list: CONFIG.list,
      source: CONFIG.source,
      funnel: CONFIG.funnel,
      name: name,
      tags: CONFIG.tags,
      metadata: {}
    };
    
    CONFIG.customFields.forEach(field => {
      const el = form.querySelector('[name="' + field + '"]');
      if (el) {
        // Handle checkbox vs other inputs
        if (el.type === 'checkbox') {
          payload.metadata[field] = el.checked ? 'yes' : 'no';
        } else if (el.value.trim()) {
          payload.metadata[field] = el.value.trim();
        }
      }
    });
    
    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (resp.ok) {
        // Personalize the success message with the submitter's first name
        const successNameEl = document.getElementById('successName');
        if (successNameEl) {
          const firstName = name.split(/\s+/)[0];
          successNameEl.textContent = firstName ? ', ' + firstName : '';
        }
        document.getElementById('formContent').style.display = 'none';
        const success = document.getElementById('formSuccess');
        success.style.display = 'block';
        success.classList.add('show');
        
        // GA4 conversion event — generate_lead is the standard GA4 lead event
        trackEvent('generate_lead', {
          form_name: 'contact',
          package_interest: mapPackageInterest(formData.package),
          wants_snapshot: formData.wants_snapshot ? 'yes' : 'no',
          wants_call: formData.wants_call ? 'yes' : 'no'
        });
      } else {
        trackEvent('form_submit_error', { form_name: 'contact', error: data.error || 'unknown' });
        throw new Error(data.error || CONFIG.errorMessage);
      }
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
      trackEvent('form_submit_error', { form_name: 'contact', error: err.message || 'network' });
      alert(err.message || CONFIG.errorMessage);
    }
  });
})();
