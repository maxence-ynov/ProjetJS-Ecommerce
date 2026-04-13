import { formatPrice } from "./api.js";
import { loadLastOrder, syncCartCount } from "./cart.js";

const confirmationStageElement = document.querySelector("[data-confirmation-stage]");

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

function renderMissingState() {
  if (!confirmationStageElement) {
    return;
  }

  confirmationStageElement.innerHTML = `
    <div class="confirmation-card confirmation-card--simple">
      <h2>Commande introuvable</h2>
      <p>Aucune commande n'a ete trouvee.</p>
      <a class="button button--primary" href="index.html#catalogue">Retour au catalogue</a>
    </div>
  `;
}

function renderConfirmation(order, orderIdFromUrl) {
  if (!confirmationStageElement) {
    return;
  }

  const identityMismatch =
    orderIdFromUrl && orderIdFromUrl !== order.orderId
      ? `<p class="page-status page-status--error">Cette commande ne correspond pas a la derniere enregistree.</p>`
      : "";

  confirmationStageElement.innerHTML = `
    ${identityMismatch}
    <article class="confirmation-card confirmation-card--simple">
      <h2>Merci, votre commande est enregistree.</h2>
      <p>Vous pouvez revenir au catalogue.</p>

      <div class="confirmation-info">
        <div class="confirmation-info__row">
          <span>Numero de commande</span>
          <strong class="confirmation-order-id">${escapeHtml(order.orderId)}</strong>
        </div>
        <div class="confirmation-info__row">
          <span>Total</span>
          <strong class="confirmation-total">${formatPrice(order.summary.subtotal)}</strong>
        </div>
      </div>

      <a class="button button--primary" href="index.html#catalogue">Retour au catalogue</a>
    </article>
  `;
}

function init() {
  setCurrentYear();
  syncCartCount();

  const orderIdFromUrl = new URLSearchParams(window.location.search).get("orderId");
  const lastOrder = loadLastOrder();

  if (!lastOrder || !lastOrder.orderId || !lastOrder.contact || !Array.isArray(lastOrder.cartItems)) {
    renderMissingState();
    return;
  }

  renderConfirmation(lastOrder, orderIdFromUrl);
}

init();
