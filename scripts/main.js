import { formatPrice, getFurnitureList } from "./api.js";
import { syncCartCount } from "./cart.js";

const productListElement = document.querySelector("[data-product-list]");
const loadingStatusElement = document.querySelector("[data-loading-status]");
const errorStatusElement = document.querySelector("[data-error-status]");

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

function renderProducts(products) {
  if (!productListElement) {
    return;
  }

  productListElement.innerHTML = products
    .map(
      (product) => `
        <article class="product-card">
          <a class="product-card__media" href="product.html?id=${encodeURIComponent(product._id)}">
            <img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}" loading="lazy" />
          </a>
          <div class="product-card__content">
            <h3 class="product-card__title">${escapeHtml(product.name)}</h3>
            <p class="product-card__price">${formatPrice(product.price)}</p>
            <a class="button button--neutral" href="product.html?id=${encodeURIComponent(product._id)}">
              Voir le produit
            </a>
          </div>
        </article>
      `
    )
    .join("");
}

function setLoadingState(message = "", visible = false) {
  if (!loadingStatusElement) {
    return;
  }

  loadingStatusElement.textContent = message;
  loadingStatusElement.hidden = !visible;
}

function setErrorState(message = "", visible = false) {
  if (!errorStatusElement) {
    return;
  }

  errorStatusElement.textContent = message;
  errorStatusElement.hidden = !visible;
}

async function init() {
  setCurrentYear();
  syncCartCount();
  setLoadingState("Chargement des produits...", true);
  setErrorState("", false);

  try {
    const products = await getFurnitureList();

    if (!Array.isArray(products) || products.length === 0) {
      setLoadingState("", false);
      setErrorState("Aucun produit n'est disponible pour le moment.", true);
      return;
    }

    renderProducts(products);
    setLoadingState("", false);
  } catch (error) {
    setLoadingState("", false);
    setErrorState(error.message, true);
  }
}

init();
