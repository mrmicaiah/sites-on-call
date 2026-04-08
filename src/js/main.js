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

// Pricing toggle (Monthly / Annual)
const pricingToggle = document.getElementById('pricingToggle');
const monthlyPricing = document.getElementById('monthlyPricing');
const annualPricing = document.getElementById('annualPricing');

if (pricingToggle) {
  pricingToggle.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const plan = btn.dataset.plan;
      pricingToggle.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      if (plan === 'annual') {
        monthlyPricing.style.display = 'none';
        annualPricing.style.display = 'grid';
      } else {
        monthlyPricing.style.display = 'grid';
        annualPricing.style.display = 'none';
      }
      
      // Re-observe for reveal animations on the newly visible cards
      annualPricing.querySelectorAll('.reveal').forEach(el => {
        el.classList.remove('visible');
        observer.observe(el);
      });
      monthlyPricing.querySelectorAll('.reveal').forEach(el => {
        el.classList.remove('visible');
        observer.observe(el);
      });
    });
  });
}

// Contact modal
const modal = document.getElementById('contactModal');

function openContactModal() {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  navLinks.classList.remove('open');
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
    customFields: ['business', 'phone', 'message', 'package', 'call_date', 'call_time'],
    successMessage: 'Thanks! We\'ll be in touch within 24 hours.',
    errorMessage: 'Something went wrong. Please try again or email us at hello@sitesoncall.com.'
  };
  
  const API_URL = 'https://email-bot-server.micaiah-tasks.workers.dev/api/subscribe';
  
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
      if (el && el.value.trim()) payload.metadata[field] = el.value.trim();
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
