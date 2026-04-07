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

// Contact form submission
(function() {
  const CONFIG = {
    list: 'sites-on-call-leads',
    source: 'sites-on-call',
    funnel: 'contact-form',
    formSelector: '#contactForm',
    tags: ['new-lead'],
    customFields: ['business', 'phone', 'message'],
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
