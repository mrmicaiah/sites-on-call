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
    });
  });
}

// Initialize: ensure first card is selected
selectSiteSize('standard');


// ============================================
// CONTACT MODAL
// ============================================

const modal = document.getElementById('contactModal');

// Generic toggle handler
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
  
  toggle.addEventListener('click', (e) => {
    if (e.target === checkbox) return;
    checkbox.checked = !checkbox.checked;
    updateState();
  });
  
  checkbox.addEventListener('change', updateState);
  
  return { toggle, checkbox, fields, updateState };
}

// Setup toggles
const snapshotToggle = setupFormToggle('snapshotToggle', 'cf-snapshot');
const scheduleToggle = setupFormToggle('scheduleToggle', 'cf-schedule', 'scheduleFields');

function openContactModal(precheckSnapshot = false) {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  navLinks.classList.remove('open');
  
  // Pre-check snapshot if requested (e.g., from article CTA)
  if (precheckSnapshot && snapshotToggle) {
    snapshotToggle.checkbox.checked = true;
    snapshotToggle.updateState();
  }
  
  setTimeout(() => document.getElementById('cf-name').focus(), 200);
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
  const LEAD_TRACKER_URL = 'https://script.google.com/macros/s/AKfycbxhOwJ6Yb9pWj4q-7ZUXEjAAO557TZWZzsJHhPz8sJG7L7-936te-RQhAD51XTwVALrkQ/exec';
  
  // Map package values to Lead Tracker format
  function mapPackageInterest(pkg) {
    if (!pkg) return 'Not Sure';
    if (pkg.includes('starter')) return 'Starter';
    if (pkg.includes('standard')) return 'Standard';
    if (pkg.includes('growth')) return 'Growth';
    if (pkg === 'website-only') return 'Not Sure';
    return 'Not Sure';
  }
  
  // Send to Lead Tracker Google Sheet
  async function sendToLeadTracker(formData) {
    const payload = {
      businessName: formData.business || '',
      ownerName: formData.name || '',
      phone: formData.phone || '',
      email: formData.email || '',
      industry: '', // Not collected in form
      city: '', // Not collected in form
      preferredCallDate: formData.call_date || '',
      preferredCallTime: formData.call_time || '',
      packageInterest: mapPackageInterest(formData.package),
      notes: formData.message || '',
      wantsSnapshot: formData.wants_snapshot ? 'Yes' : 'No',
      wantsCall: formData.wants_call ? 'Yes' : 'No'
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
      // Don't block form submission if Lead Tracker fails
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
    if (hasError) return;
    
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
        document.getElementById('formContent').style.display = 'none';
        const success = document.getElementById('formSuccess');
        success.style.display = 'block';
        success.classList.add('show');
      } else {
        throw new Error(data.error || CONFIG.errorMessage);
      }
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
      alert(err.message || CONFIG.errorMessage);
    }
  });
})();
