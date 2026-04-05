// ===== NOTIFICACIÓN AL AGREGAR PRODUCTO =====
function addToCart(name) {
  const toast = document.createElement('div');
  toast.textContent = `✅ ${name} agregado al pedido`;
  toast.style.cssText = `
    position: fixed; bottom: 28px; right: 28px;
    background: #2d6a2d; color: white;
    padding: 14px 20px; border-radius: 6px;
    font-family: 'Lato', sans-serif; font-size: 14px; font-weight: 700;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2); z-index: 9999;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ===== ANIMACIONES AL HACER SCROLL =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.product-card, .why-card, .about-content').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// ===== BOTÓN SUSCRIPCIÓN NEWSLETTER =====
document.querySelector('.newsletter-form button').addEventListener('click', function() {
  const input = this.previousElementSibling;
  if (input.value) {
    this.textContent = '¡Suscrito! ✓';
    this.style.background = '#25D366';
    input.value = '';
  }
});
