const NAME_PATTERN = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,48}$/u;
const CITY_PATTERN = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,58}$/u;
const ADDRESS_PATTERN = /^[0-9A-Za-zÀ-ÿ][0-9A-Za-zÀ-ÿ',.\-/ ]{5,100}$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const FIELD_RULES = {
  firstName: {
    requiredMessage: "Saisissez votre prenom.",
    invalidMessage: "Le prenom n'est pas valide.",
    test: (value) => NAME_PATTERN.test(value)
  },
  lastName: {
    requiredMessage: "Saisissez votre nom.",
    invalidMessage: "Le nom n'est pas valide.",
    test: (value) => NAME_PATTERN.test(value)
  },
  address: {
    requiredMessage: "Saisissez votre adresse.",
    invalidMessage: "L'adresse n'est pas valide.",
    test: (value) => ADDRESS_PATTERN.test(value)
  },
  city: {
    requiredMessage: "Saisissez votre ville.",
    invalidMessage: "La ville n'est pas valide.",
    test: (value) => CITY_PATTERN.test(value)
  },
  email: {
    requiredMessage: "Saisissez votre e-mail.",
    invalidMessage: "Saisissez une adresse e-mail valide.",
    test: (value) => EMAIL_PATTERN.test(value)
  }
};

function normalizeValue(fieldName, value) {
  const trimmedValue = String(value || "").trim().replace(/\s+/g, " ");
  return fieldName === "email" ? trimmedValue.toLowerCase() : trimmedValue;
}

function setFieldMessage(form, fieldName, message) {
  const input = form.elements.namedItem(fieldName);
  const errorNode = form.querySelector(`[data-error-for="${fieldName}"]`);

  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  input.classList.toggle("is-invalid", Boolean(message));

  if (errorNode) {
    errorNode.textContent = message || "";
  }
}

export function collectContact(form) {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
}

export function validateField(fieldName, rawValue) {
  const rule = FIELD_RULES[fieldName];
  const normalizedValue = normalizeValue(fieldName, rawValue);

  if (!rule) {
    return { isValid: true, value: normalizedValue, message: "" };
  }

  if (!normalizedValue) {
    return { isValid: false, value: normalizedValue, message: rule.requiredMessage };
  }

  if (!rule.test(normalizedValue)) {
    return { isValid: false, value: normalizedValue, message: rule.invalidMessage };
  }

  return { isValid: true, value: normalizedValue, message: "" };
}

export function validateContact(contact) {
  const values = {};
  const errors = {};

  Object.keys(FIELD_RULES).forEach((fieldName) => {
    const result = validateField(fieldName, contact[fieldName]);
    values[fieldName] = result.value;

    if (!result.isValid) {
      errors[fieldName] = result.message;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    values,
    errors
  };
}

export function bindContactValidation(form) {
  const fields = form.querySelectorAll("[data-field]");

  fields.forEach((field) => {
    field.addEventListener("blur", () => {
      const result = validateField(field.name, field.value);
      field.value = result.value;
      setFieldMessage(form, field.name, result.message);
    });

    field.addEventListener("input", () => {
      if (field.classList.contains("is-invalid")) {
        const result = validateField(field.name, field.value);
        setFieldMessage(form, field.name, result.message);
      }
    });
  });
}

export function renderContactErrors(form, errors) {
  Object.keys(FIELD_RULES).forEach((fieldName) => {
    setFieldMessage(form, fieldName, errors[fieldName] || "");
  });
}
