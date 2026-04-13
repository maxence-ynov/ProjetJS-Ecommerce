import { formatPrice, getFurnitureById } from "./api.js";
import { addToCart, syncCartCount } from "./cart.js";
import { escapeHtml, setCurrentYear } from "./ui.js";

const productStageElement = document.querySelector("[data-product-stage]");
const productStatusElement = document.querySelector("[data-product-status]");

function setStatus(message, type = "") {
  if (!productStatusElement) {
    return;
  }

  productStatusElement.textContent = message;
  productStatusElement.className = `page-status${type ? ` page-status--${type}` : ""}`;
  productStatusElement.hidden = !message;
}

function buildProductTemplate(product) {
  const finishes = Array.isArray(product.varnish) ? product.varnish : [];
  const noFinishMessage =
    finishes.length === 0 ? "Aucune finition disponible pour ce produit." : "";
  const optionsMarkup = finishes
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
            <p
              class="form-feedback${noFinishMessage ? " form-feedback--error" : ""}"
              data-varnish-feedback
              aria-live="polite"
            >${noFinishMessage}</p>
          </div>

          <div class="product-form__actions">
            <button class="button button--primary" type="submit" ${finishes.length === 0 ? "disabled" : ""}>
              Ajouter au panier
            </button>
            <p class="form-feedback" data-product-feedback aria-live="polite" role="status"></p>
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
  let feedbackTimeoutId = null;

  if (!form || !(quantityInput instanceof HTMLInputElement)) {
    return;
  }

  const clearFeedback = () => {
    if (feedbackTimeoutId) {
      window.clearTimeout(feedbackTimeoutId);
      feedbackTimeoutId = null;
    }

    if (feedbackElement) {
      feedbackElement.textContent = "";
      feedbackElement.className = "form-feedback";
    }
  };

  form.addEventListener("change", () => {
    if (varnishFeedbackElement) {
      varnishFeedbackElement.textContent = "";
      varnishFeedbackElement.className = "form-feedback";
    }

    clearFeedback();
  });

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
      clearFeedback();

      if (feedbackElement) {
        feedbackElement.textContent = "Produit ajoute au panier.";
        feedbackElement.className = "form-feedback form-feedback--success";
        feedbackTimeoutId = window.setTimeout(clearFeedback, 2500);
      }
    } catch (error) {
      clearFeedback();

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
