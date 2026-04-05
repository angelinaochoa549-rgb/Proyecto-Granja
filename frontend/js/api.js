/**
 * api.js
 * Cliente para comunicarse con el backend FastAPI.
 * Configura BASE_URL según tu entorno.
 */

// ⚠️ Cambia esta URL cuando hagas deploy del backend
const API_BASE = 'http://localhost:8000';

// Número de WhatsApp del negocio (sin + ni espacios)
const WA_NUMBER = '573001234567';

/**
 * Carga los productos desde la API y renderiza la grilla.
 */
async function loadProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Error al cargar productos');
    const products = await res.json();

    if (products.length === 0) {
      grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#557a55;">
        No hay productos disponibles por ahora.</p>`;
      return;
    }

    grid.innerHTML = products.map(p => renderProductCard(p)).join('');

    // Re-aplicar animaciones del scroll (del script.js original)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.product-card').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      observer.observe(el);
    });

  } catch (err) {
    // Si no hay backend, carga productos de ejemplo (fallback)
    console.warn('Backend no disponible, usando datos de ejemplo:', err);
    loadFallbackProducts(grid);
  }
}

/**
 * Renderiza una tarjeta de producto.
 */
function renderProductCard(p) {
  const price = Number(p.price).toLocaleString('es-CO');
  const imgSrc = p.image_url || `https://via.placeholder.com/400x300/e0f2ea/1a6b4a?text=${encodeURIComponent(p.name)}`;
  const stockBadge = p.stock <= 5 && p.stock > 0
    ? `<span class="stock-badge low">⚠️ Últimas ${p.stock} unidades</span>`
    : p.stock === 0
    ? `<span class="stock-badge out">Agotado</span>`
    : '';

  return `
    <div class="product-card" data-id="${p.id}">
      <img src="${imgSrc}" alt="${p.name}" class="product-img"
           onerror="this.src='img/queso.jpg'">
      ${stockBadge}
      <div class="product-info">
        <p class="product-name">${p.name}</p>
        <p class="product-unit">${p.description || p.category || ''}</p>
        <div class="product-bottom">
          <span class="product-price">COP $${price}</span>
          <button class="product-add"
            onclick="addToCart(${p.id}, '${p.name.replace(/'/g,"\\'")}', ${p.price}, '${imgSrc}')"
            ${p.stock === 0 ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
            ${p.stock === 0 ? 'Agotado' : '+ Agregar'}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Productos de ejemplo cuando no hay backend.
 */
function loadFallbackProducts(grid) {
  const demo = [
    { id: 1, name: 'Suero Costeño', price: 6000, description: '1 Litro · Receta tradicional', image_url: 'img/suero.jpg', stock: 10, category: 'Lácteos' },
    { id: 2, name: 'Huevos de Campo', price: 9000, description: 'Docena · Gallinas libres', image_url: 'img/huevos.jpg', stock: 20, category: 'Huevos' },
    { id: 3, name: 'Queso Fresco', price: 15000, description: '500g · Hecho a mano', image_url: 'img/queso.jpg', stock: 8, category: 'Lácteos' },
  ];
  grid.innerHTML = demo.map(p => renderProductCard(p)).join('');
}

/**
 * Guarda un pedido en la base de datos.
 */
async function saveOrder(orderData) {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error('No se pudo guardar el pedido');
    return await res.json();
  } catch (err) {
    console.warn('No se pudo guardar el pedido en la DB:', err);
    return null;
  }
}

// Cargar productos al iniciar
window.addEventListener('DOMContentLoaded', loadProducts);