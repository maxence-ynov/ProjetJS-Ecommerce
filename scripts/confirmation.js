import { formatPrice } from "./api.js";
import { loadLastOrder, syncCartCount } from "./cart.js";
import { escapeHtml, setCurrentYear } from "./ui.js";

const confirmationStageElement = document.querySelector("[data-confirmation-stage]");

function renderMissingState(message = "Aucune commande n'a ete trouvee.") {
  if (!confirmationStageElement) {
    return;
  }

  confirmationStageElement.innerHTML = `
    <div class="confirmation-card confirmation-card--simple">
      <h2>Commande introuvable</h2>
      <p>${escapeHtml(message)}</p>
      <a class="button button--primary" href="index.html#catalogue">Retour au catalogue</a>
    </div>
  `;
}

function renderConfirmation(order) {
  if (!confirmationStageElement) {
    return;
  }

  confirmationStageElement.innerHTML = `
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

  if (orderIdFromUrl && orderIdFromUrl !== lastOrder.orderId) {
    renderMissingState("Cette commande ne correspond pas a la derniere commande enregistree.");
    return;
  }

  renderConfirmation(lastOrder);
}

init();
