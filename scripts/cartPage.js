import { formatPrice, submitOrder } from "./api.js";
import {
  buildOrderProducts,
  clearCart,
  clearCheckoutDraft,
  getCartSummary,
  loadCart,
  loadCheckoutDraft,
  removeCartItem,
  saveCheckoutDraft,
  saveLastOrder,
  syncCartCount,
  updateCartItemQuantity
} from "./cart.js";
import {
  bindContactValidation,
  collectContact,
  renderContactErrors,
  validateContact
} from "./validation.js";

const cartItemsElement = document.querySelector("[data-cart-items]");
const cartStatusElement = document.querySelector("[data-cart-status]");
const cartSummaryElement = document.querySelector("[data-cart-summary]");
const checkoutForm = document.querySelector("[data-checkout-form]");
const submitButton = document.querySelector("[data-submit-order]");
const formFeedbackElement = document.querySelector("[data-form-feedback]");

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return entities[character];
  });
}

function setCurrentYear() {
  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
}

function setCartStatus(message, type = "") {
  if (!cartStatusElement) {
    return;
  }

  cartStatusElement.textContent = message;
  cartStatusElement.className = `page-status${type ? ` page-status--${type}` : ""}`;
  cartStatusElement.hidden = !message;
}

function setFormFeedback(message, type = "") {
  if (!formFeedbackElement) {
    return;
  }

  formFeedbackElement.textContent = message;
  formFeedbackElement.className = `form-feedback${type ? ` form-feedback--${type}` : ""}`;
}

function renderSummary(cart) {
  if (!cartSummaryElement) {
    return;
  }

  const summary = getCartSummary(cart);

  cartSummaryElement.innerHTML = `
    <h3>Total</h3>
    <div class="summary-list">
      <div class="summary-row">
        <span>Produits</span>
        <span>${summary.lines}</span>
      </div>
      <div class="summary-row">
        <span>Articles</span>
        <span>${summary.count}</span>
      </div>
      <div class="summary-row checkout-summary__total">
        <span>Total</span>
        <strong>${formatPrice(summary.subtotal)}</strong>
      </div>
    </div>
  `;
}

function renderCart(cart) {
  if (!cartItemsElement) {
    return;
  }

  if (cart.length === 0) {
    cartItemsElement.innerHTML = "";
    setCartStatus("Votre panier est vide.", "error");

    if (submitButton) {
      submitButton.disabled = true;
    }

    renderSummary(cart);
    return;
  }

  if (submitButton) {
    submitButton.disabled = false;
  }

  setCartStatus("", "");
  renderSummary(cart);

  cartItemsElement.innerHTML = cart
    .map(
      (item) => `
        <article class="cart-line">
          <a class="cart-line__media" href="product.html?id=${encodeURIComponent(item.productId)}">
            <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.name)}" loading="lazy" />
          </a>

          <div class="cart-line__content">
            <div class="cart-line__main">
              <h3 class="cart-line__title">${escapeHtml(item.name)}</h3>
              <p class="cart-line__meta">Finition : ${escapeHtml(item.varnish)}</p>
              <p class="cart-line__meta">Prix : ${formatPrice(item.price)}</p>
            </div>

            <div class="cart-line__actions">
              <div class="quantity-stepper">
                <button type="button" data-line-action="decrease" data-line-id="${escapeHtml(item.lineId)}" aria-label="Diminuer la quantite">-</button>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value="${item.quantity}"
                  data-line-quantity
                  data-line-id="${escapeHtml(item.lineId)}"
                  aria-label="Quantite pour ${escapeHtml(item.name)}"
                />
                <button type="button" data-line-action="increase" data-line-id="${escapeHtml(item.lineId)}" aria-label="Augmenter la quantite">+</button>
              </div>
              <button class="cart-line__remove" type="button" data-line-action="remove" data-line-id="${escapeHtml(item.lineId)}">
                Supprimer
              </button>
            </div>
          </div>

          <p class="cart-line__price">Total : ${formatPrice(item.price * item.quantity)}</p>
        </article>
      `
    )
    .join("");
}

function refreshCart() {
  const cart = loadCart();
  renderCart(cart);
  syncCartCount();
}

function hydrateDraft() {
  if (!checkoutForm) {
    return;
  }

  const draft = loadCheckoutDraft();

  Object.entries(draft).forEach(([fieldName, value]) => {
    const field = checkoutForm.elements.namedItem(fieldName);

    if (field instanceof HTMLInputElement) {
      field.value = value;
    }
  });
}

function bindCartInteractions() {
  if (!cartItemsElement) {
    return;
  }

  cartItemsElement.addEventListener("click", (event) => {
    const actionButton = event.target.closest("[data-line-action]");

    if (!actionButton) {
      return;
    }

    const lineId = actionButton.dataset.lineId;

    if (!lineId) {
      return;
    }

    const cart = loadCart();
    const currentItem = cart.find((item) => item.lineId === lineId);

    if (!currentItem) {
      return;
    }

    switch (actionButton.dataset.lineAction) {
      case "increase":
        updateCartItemQuantity(lineId, currentItem.quantity + 1);
        break;
      case "decrease":
        if (currentItem.quantity <= 1) {
          removeCartItem(lineId);
        } else {
          updateCartItemQuantity(lineId, currentItem.quantity - 1);
        }
        break;
      case "remove":
        removeCartItem(lineId);
        break;
      default:
        return;
    }

    refreshCart();
  });

  cartItemsElement.addEventListener("change", (event) => {
    const quantityInput = event.target.closest("[data-line-quantity]");

    if (!(quantityInput instanceof HTMLInputElement)) {
      return;
    }

    updateCartItemQuantity(quantityInput.dataset.lineId, quantityInput.value);
    refreshCart();
  });
}

function bindDraftPersistence() {
  if (!checkoutForm) {
    return;
  }

  checkoutForm.addEventListener("input", () => {
    saveCheckoutDraft(collectContact(checkoutForm));
  });
}

async function handleCheckout(event) {
  event.preventDefault();

  if (!checkoutForm) {
    return;
  }

  const cart = loadCart();

  if (cart.length === 0) {
    setFormFeedback("Votre panier est vide.", "error");
    return;
  }

  const validation = validateContact(collectContact(checkoutForm));
  renderContactErrors(checkoutForm, validation.errors);

  if (!validation.isValid) {
    setFormFeedback("Verifiez vos informations avant de confirmer.", "error");
    return;
  }

  const orderPayload = {
    contact: validation.values,
    products: buildOrderProducts(cart)
  };

  if (submitButton) {
    submitButton.disabled = true;
  }

  setFormFeedback("Envoi de la commande...", "success");

  try {
    const response = await submitOrder(orderPayload);

    saveLastOrder({
      orderId: response.orderId,
      contact: response.contact,
      products: response.products,
      cartItems: cart,
      summary: getCartSummary(cart),
      createdAt: new Date().toISOString()
    });

    clearCart();
    clearCheckoutDraft();
    syncCartCount();
    window.location.href = `confirmation.html?orderId=${encodeURIComponent(response.orderId)}`;
  } catch (error) {
    if (submitButton) {
      submitButton.disabled = false;
    }

    setFormFeedback(error.message, "error");
  }
}

function init() {
  setCurrentYear();
  syncCartCount();
  renderCart(loadCart());
  hydrateDraft();
  bindCartInteractions();
  bindDraftPersistence();

  if (checkoutForm) {
    bindContactValidation(checkoutForm);
    checkoutForm.addEventListener("submit", handleCheckout);
  }
}

init();
