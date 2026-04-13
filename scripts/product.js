import { formatPrice, getFurnitureById } from "./api.js";
import { addToCart, syncCartCount } from "./cart.js";

const productStageElement = document.querySelector("[data-product-stage]");
const productStatusElement = document.querySelector("[data-product-status]");

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

function setStatus(message, type = "") {
  if (!productStatusElement) {
    return;
  }

  productStatusElement.textContent = message;
  productStatusElement.className = `page-status${type ? ` page-status--${type}` : ""}`;
  productStatusElement.hidden = !message;
}

function buildProductTemplate(product) {
  const optionsMarkup = product.varnish
    .map(
      (finish, index) => `
        <label class="option-pill">
          <input type="radio" name="varnish" value="${escapeHtml(finish)}" ${index === 0 ? "checked" : ""} />
          <span>${escapeHtml(finish)}</span>
        </label>
      `
    )
    .join("");

  return `
    <div class="product-layout">
      <figure class="product-media">
        <img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}" />
      </figure>

      <div class="product-panel">
        <h1 class="product-panel__title">${escapeHtml(product.name)}</h1>
        <p class="product-panel__price">${formatPrice(product.price)}</p>
        <p class="product-panel__description">${escapeHtml(product.description)}</p>

        <form class="product-form" data-product-form novalidate>
          <div class="product-form__group">
            <p class="product-form__label">Choisir une finition</p>
            <div class="option-grid">${optionsMarkup}</div>
            <input type="hidden" name="quantity" value="1" />
            <p class="form-feedback" data-varnish-feedback></p>
          </div>

          <div class="product-form__actions">
            <button class="button button--primary" type="submit">
              Ajouter au panier
            </button>
            <p class="form-feedback" data-product-feedback></p>
          </div>
        </form>
      </div>
    </div>
  `;
}

function bindProductInteractions(product) {
  const form = document.querySelector("[data-product-form]");
  const quantityInput = form?.elements.namedItem("quantity");
  const feedbackElement = form?.querySelector("[data-product-feedback]");
  const varnishFeedbackElement = form?.querySelector("[data-varnish-feedback]");

  if (!form || !(quantityInput instanceof HTMLInputElement)) {
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const selectedOption = form.querySelector('input[name="varnish"]:checked');
    const quantity = 1;
    quantityInput.value = "1";

    if (!selectedOption) {
      if (varnishFeedbackElement) {
        varnishFeedbackElement.textContent = "Choisir une finition.";
        varnishFeedbackElement.className = "form-feedback form-feedback--error";
      }
      return;
    }

    if (varnishFeedbackElement) {
      varnishFeedbackElement.textContent = "";
      varnishFeedbackElement.className = "form-feedback";
    }

    try {
      addToCart(product, selectedOption.value, quantity);
      syncCartCount();

      if (feedbackElement) {
        feedbackElement.textContent =
          quantity > 1 ? `${quantity} articles ajoutes au panier.` : "Produit ajoute au panier.";
        feedbackElement.className = "form-feedback form-feedback--success";
      }
    } catch (error) {
      if (feedbackElement) {
        feedbackElement.textContent = error.message;
        feedbackElement.className = "form-feedback form-feedback--error";
      }
    }
  });
}

async function init() {
  setCurrentYear();
  syncCartCount();

  const productId = new URLSearchParams(window.location.search).get("id");

  if (!productId) {
    setStatus("Produit introuvable.", "error");
    return;
  }

  try {
    const product = await getFurnitureById(productId);
    document.title = `Atelier Orme | ${product.name}`;

    if (productStageElement) {
      productStageElement.innerHTML = buildProductTemplate(product);
      productStageElement.hidden = false;
    }

    setStatus("", "");
    bindProductInteractions(product);
  } catch (error) {
    setStatus(error.message, "error");
  }
}

init();
