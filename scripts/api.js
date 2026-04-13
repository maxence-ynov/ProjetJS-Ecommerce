const DEFAULT_API_ORIGIN = "http://127.0.0.1:3000";
const REQUEST_TIMEOUT_MS = 9000;

const ERROR_MESSAGES = {
  400: "Certaines informations sont incorrectes.",
  404: "Element introuvable.",
  500: "Une erreur est survenue. Reessayez plus tard."
};

function readStoredApiOrigin() {
  try {
    return window.localStorage.getItem("atelier-orme-api-origin");
  } catch {
    return null;
  }
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function resolveApiOrigin() {
  const runtimeOverride =
    typeof window.ATELIER_API_ORIGIN === "string" ? window.ATELIER_API_ORIGIN : null;
  const storedOverride = readStoredApiOrigin();

  if (runtimeOverride) {
    return trimTrailingSlash(runtimeOverride);
  }

  if (storedOverride) {
    return trimTrailingSlash(storedOverride);
  }

  if (window.location.protocol.startsWith("http") && window.location.port === "3000") {
    return trimTrailingSlash(window.location.origin);
  }

  return DEFAULT_API_ORIGIN;
}

export const API_ORIGIN = resolveApiOrigin();
export const FURNITURE_API_URL = `${API_ORIGIN}/api/furniture`;

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
}

function buildHttpError(status, payload) {
  const error = new Error(ERROR_MESSAGES[status] || "Une erreur est survenue.");
  error.status = status;
  error.payload = payload;
  return error;
}

export async function requestJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      },
      signal: controller.signal
    });

    const payload = await parseResponse(response);

    if (!response.ok) {
      throw buildHttpError(response.status, payload);
    }

    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Impossible de charger les donnees pour le moment.");
    }

    if (error.name === "TypeError") {
      throw new Error("Impossible de se connecter au serveur.");
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function getFurnitureList() {
  return requestJson(FURNITURE_API_URL);
}

export async function getFurnitureById(productId) {
  if (!productId) {
    throw new Error("Produit introuvable.");
  }

  return requestJson(`${FURNITURE_API_URL}/${encodeURIComponent(productId)}`);
}

export async function submitOrder(orderPayload) {
  return requestJson(`${FURNITURE_API_URL}/order`, {
    method: "POST",
    body: JSON.stringify(orderPayload)
  });
}

export function formatPrice(priceInCents) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR"
  }).format(priceInCents / 100);
}
