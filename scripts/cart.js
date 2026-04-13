const CART_STORAGE_KEY = "atelier-orme-cart";
const CHECKOUT_DRAFT_STORAGE_KEY = "atelier-orme-checkout-draft";
const LAST_ORDER_STORAGE_KEY = "atelier-orme-last-order";

function readJson(key, fallback) {
  try {
    const rawValue = window.localStorage.getItem(key);

    if (!rawValue) {
      return fallback;
    }

    return JSON.parse(rawValue);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function clampQuantity(quantity) {
  const numericQuantity = Number.parseInt(quantity, 10);

  if (!Number.isFinite(numericQuantity)) {
    return 1;
  }

  return Math.max(1, Math.min(99, numericQuantity));
}

function sanitizeCartItem(item) {
  if (!item || typeof item !== "object" || !item.productId || !item.name || !item.varnish) {
    return null;
  }

  return {
    lineId: item.lineId || `${item.productId}::${item.varnish}`,
    productId: item.productId,
    name: item.name,
    price: Number(item.price) || 0,
    imageUrl: item.imageUrl || "",
    varnish: item.varnish,
    quantity: clampQuantity(item.quantity)
  };
}

export function loadCart() {
  const rawCart = readJson(CART_STORAGE_KEY, []);

  if (!Array.isArray(rawCart)) {
    return [];
  }

  return rawCart.map(sanitizeCartItem).filter(Boolean);
}

export function saveCart(cartItems) {
  writeJson(CART_STORAGE_KEY, cartItems);
}

export function addToCart(product, varnish, quantity = 1) {
  const cleanVarnish = String(varnish || "").trim();

  if (!product || !product._id || !cleanVarnish) {
    throw new Error("Impossible d'ajouter ce produit au panier.");
  }

  const lineId = `${product._id}::${cleanVarnish}`;
  const cart = loadCart();
  const existingItem = cart.find((item) => item.lineId === lineId);
  const safeQuantity = clampQuantity(quantity);

  if (existingItem) {
    existingItem.quantity = clampQuantity(existingItem.quantity + safeQuantity);
  } else {
    cart.push({
      lineId,
      productId: product._id,
      name: product.name,
      price: Number(product.price) || 0,
      imageUrl: product.imageUrl || "",
      varnish: cleanVarnish,
      quantity: safeQuantity
    });
  }

  saveCart(cart);
  return cart;
}

export function updateCartItemQuantity(lineId, quantity) {
  const cart = loadCart();
  const item = cart.find((entry) => entry.lineId === lineId);

  if (!item) {
    return cart;
  }

  item.quantity = clampQuantity(quantity);
  saveCart(cart);
  return cart;
}

export function removeCartItem(lineId) {
  const nextCart = loadCart().filter((item) => item.lineId !== lineId);
  saveCart(nextCart);
  return nextCart;
}

export function clearCart() {
  window.localStorage.removeItem(CART_STORAGE_KEY);
}

export function getCartSummary(cartItems = loadCart()) {
  return cartItems.reduce(
    (summary, item) => {
      summary.lines += 1;
      summary.count += item.quantity;
      summary.subtotal += item.price * item.quantity;
      return summary;
    },
    { lines: 0, count: 0, subtotal: 0 }
  );
}

export function getCartCount() {
  return getCartSummary().count;
}

export function buildOrderProducts(cartItems = loadCart()) {
  return cartItems.flatMap((item) =>
    Array.from({ length: clampQuantity(item.quantity) }, () => item.productId)
  );
}

export function syncCartCount(root = document) {
  const count = getCartCount();

  root.querySelectorAll("[data-cart-count]").forEach((element) => {
    element.textContent = String(count);
    element.hidden = count === 0;
  });
}

export function saveCheckoutDraft(contact) {
  writeJson(CHECKOUT_DRAFT_STORAGE_KEY, contact);
}

export function loadCheckoutDraft() {
  const draft = readJson(CHECKOUT_DRAFT_STORAGE_KEY, {});
  return draft && typeof draft === "object" ? draft : {};
}

export function clearCheckoutDraft() {
  window.localStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
}

export function saveLastOrder(orderData) {
  writeJson(LAST_ORDER_STORAGE_KEY, orderData);
}

export function loadLastOrder() {
  const order = readJson(LAST_ORDER_STORAGE_KEY, null);
  return order && typeof order === "object" ? order : null;
}
