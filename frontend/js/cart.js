/**
 * cart.js
 * Lógica del carrito de compras.
 * Integra con WhatsApp para el envío del pedido.
 */

// Estado del carrito en memoria
let cart = JSON.parse(localStorage.getItem('granja_cart') || '[]');

/**
 * Abre/cierra el panel lateral del carrito.
 */
function toggleCart() {
  const panel = document.getElementById('cart-panel');
  const overlay = document.getElementById('cart-overlay');
  panel.classList.toggle('open');
  overlay.classList.toggle('open');
}

/**
 * Agrega un producto al carrito.
 * @param {number} id - ID del producto
 * @param {string} name - Nombre
 * @param {number} price - Precio
 * @param {string} imgUrl - URL de la imagen
 */
function addToCart(id, name, price, imgUrl) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, imgUrl, qty: 1 });
  }
  saveCart();
  renderCartItems();
  updateCartCount();
  showToast(`✅ ${name} agregado al pedido`);

  // Abrir carrito automáticamente
  const panel = document.getElementById('cart-panel');
  if (!panel.classList.contains('open')) toggleCart();
}

/**
 * Cambia la cantidad de un ítem.
 */
function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCartItems();
  updateCartCount();
}

/**
 * Elimina un ítem del carrito.
 */
function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCartItems();
  updateCartCount();
}

/**
 * Guarda el carrito en localStorage.
 */
function saveCart() {
  localStorage.setItem('granja_cart', JSON.stringify(cart));
}

/**
 * Renderiza los ítems dentro del panel del carrito.
 */
function renderCartItems() {
  const container = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total-price');

  if (cart.length === 0) {
    container.innerHTML = `<p class="cart-empty">Tu carrito está vacío.<br>¡Agrega productos frescos!</p>`;
    totalEl.textContent = 'COP $0';
    return;
  }

  let total = 0;
  container.innerHTML = cart.map(item => {
    const itemTotal = item.price * item.qty;
    total += itemTotal;
    const img = item.imgUrl
      ? `<img src="${item.imgUrl}" class="cart-item-img" onerror="this.style.display='none'">`
      : `<div class="cart-item-img-placeholder">🧀</div>`;

    return `
      <div class="cart-item">
        ${img}
        <div class="cart-item-info">
          <p class="cart-item-name">${item.name}</p>
          <p class="cart-item-price">COP $${item.price.toLocaleString('es-CO')}</p>
          <div class="cart-item-controls">
            <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
            <button class="cart-item-remove" onclick="removeFromCart(${item.id})" title="Eliminar">🗑️</button>
          </div>
        </div>
        <div style="font-weight:700;font-size:13px;color:#1a6b4a;min-width:80px;text-align:right">
          COP $${itemTotal.toLocaleString('es-CO')}
        </div>
      </div>
    `;
  }).join('');

  totalEl.textContent = `COP $${total.toLocaleString('es-CO')}`;
}

/**
 * Actualiza el badge de cantidad en el navbar.
 */
function updateCartCount() {
  const countEl = document.getElementById('cart-count');
  if (!countEl) return;
  const total = cart.reduce((sum, i) => sum + i.qty, 0);
  countEl.textContent = total;
  countEl.style.display = total > 0 ? 'inline' : 'inline';
}

/**
 * Abre el modal de checkout con resumen del pedido.
 */
function openCheckout() {
  if (cart.length === 0) {
    showToast('⚠️ Agrega productos primero');
    return;
  }
  renderOrderSummaryPreview();
  document.getElementById('checkout-modal').style.display = 'flex';
}

/**
 * Cierra el modal de checkout.
 */
function closeCheckout() {
  document.getElementById('checkout-modal').style.display = 'none';
}

/**
 * Renderiza el resumen del pedido en el modal.
 */
function renderOrderSummaryPreview() {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const preview = document.getElementById('order-summary-preview');
  if (!preview) return;

  preview.innerHTML = `
    <h4>📋 Resumen de tu pedido</h4>
    <ul>
      ${cart.map(i => `
        <li>${i.name} x${i.qty} — COP $${(i.price * i.qty).toLocaleString('es-CO')}</li>
      `).join('')}
    </ul>
    <p class="summary-total">Total: COP $${total.toLocaleString('es-CO')}</p>
  `;
}

/**
 * Construye el mensaje de WhatsApp, guarda el pedido y redirige.
 */
async function sendToWhatsApp() {
  const name = document.getElementById('customer-name').value.trim();
  const phone = document.getElementById('customer-phone').value.trim();
  const address = document.getElementById('customer-address').value.trim();

  if (!name || !phone || !address) {
    showToast('⚠️ Por favor completa todos los campos');
    return;
  }

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  // Construir mensaje de WhatsApp
  let msg = `Hola, quiero hacer este pedido:\n\n`;
  cart.forEach(i => { msg += `- ${i.name} x${i.qty}\n`; });
  msg += `\nTotal: COP $${total.toLocaleString('es-CO')}`;
  msg += `\nNombre: ${name}`;
  msg += `\nTeléfono: ${phone}`;
  msg += `\nDirección: ${address}`;

  // Guardar pedido en la DB (no bloqueante)
  const orderData = {
    customer_name: name,
    customer_phone: phone,
    address: address,
    total: total,
    items: cart.map(i => ({ product_id: i.id, quantity: i.qty })),
  };
  await saveOrder(orderData);

  // Redirigir a WhatsApp
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');

  // Limpiar carrito
  cart = [];
  saveCart();
  renderCartItems();
  updateCartCount();
  closeCheckout();

  // Cerrar panel
  const panel = document.getElementById('cart-panel');
  const overlay = document.getElementById('cart-overlay');
  panel.classList.remove('open');
  overlay.classList.remove('open');

  showToast('🎉 ¡Pedido enviado por WhatsApp!');
}

/**
 * Muestra una notificación toast.
 */
function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2800);
}

// Inicializar al cargar
window.addEventListener('DOMContentLoaded', () => {
  renderCartItems();
  updateCartCount();
});

// Cerrar modal al hacer click fuera
document.addEventListener('click', function(e) {
  const modal = document.getElementById('checkout-modal');
  if (modal && e.target === modal) closeCheckout();
});