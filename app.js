const API_BASE_URL = "https://api.pioneerlegacyworks.com";
const BUSINESS_UNIT_SLUG = "pioneer-outdoor-services";
const PARENT_SITE_KEY = "pioneer-legacy-works";
const DEDICATED_SITE_KEY = "pioneer-outdoor-services";

let activeSiteKey = PARENT_SITE_KEY;

const businessNameNodes = document.querySelectorAll("[data-business-name]");
const businessDescriptionNode = document.querySelector("[data-business-description]");
const contactDetails = document.querySelector("#contact-details");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector("#main-nav");
const yearNode = document.querySelector("#year");
const requestForm = document.querySelector("#service-request-form");
const formStatus = document.querySelector("#form-status");

async function getJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    cache: "no-store",
    ...options,
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error?.message || `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return payload?.data;
}

function updateBusinessName(name) {
  if (!name) return;

  businessNameNodes.forEach((node) => {
    node.textContent = name;
  });
}

function updateMetaDescription(description) {
  if (!description) return;

  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute("content", description);
  }
}

function renderContact(profile = {}) {
  if (!contactDetails) return;

  const items = [];

  if (profile.contactPhone) {
    items.push({
      label: "Phone",
      text: profile.contactPhone,
      href: `tel:${profile.contactPhone.replace(/[^+\d]/g, "")}`,
    });
  }

  if (profile.contactEmail) {
    items.push({
      label: "Email",
      text: profile.contactEmail,
      href: `mailto:${profile.contactEmail}`,
    });
  }

  if (!items.length) return;

  contactDetails.replaceChildren();

  items.forEach((item) => {
    const wrapper = document.createElement("div");
    wrapper.className = "contact-detail";

    const label = document.createElement("span");
    label.textContent = item.label;

    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.text;

    wrapper.append(label, link);
    contactDetails.append(wrapper);
  });
}

function renderDedicatedSite(site) {
  if (!site) return;

  const profile = site.profile || {};
  const name = profile.brandName || site.name || "Pioneer Outdoor Services";

  updateBusinessName(name);

  if (profile.description && businessDescriptionNode) {
    businessDescriptionNode.textContent = profile.description;
    updateMetaDescription(profile.description);
  }

  renderContact(profile);
  document.title = `${name} | Toledo, Ohio`;
}

function renderParentBusinessUnit(unit) {
  if (!unit) return;

  const name = unit.name || "Pioneer Outdoor Services";
  updateBusinessName(name);

  if (unit.description && businessDescriptionNode) {
    businessDescriptionNode.textContent = unit.description;
    updateMetaDescription(unit.description);
  }

  document.title = `${name} | Toledo, Ohio`;
}

async function loadDedicatedSite() {
  return getJson(`${API_BASE_URL}/api/public/sites/${DEDICATED_SITE_KEY}`);
}

async function loadParentBusinessUnit() {
  const units = await getJson(`${API_BASE_URL}/api/public/sites/${PARENT_SITE_KEY}/business-units`);

  if (!Array.isArray(units)) return null;
  return units.find((unit) => unit.slug === BUSINESS_UNIT_SLUG) || null;
}

async function loadBackendContent() {
  let dedicatedSite = null;

  try {
    dedicatedSite = await loadDedicatedSite();
    activeSiteKey = DEDICATED_SITE_KEY;
    renderDedicatedSite(dedicatedSite);
  } catch (error) {
    console.info("Dedicated Outdoor Services site profile is not available yet.", error);
  }

  if (!dedicatedSite) {
    try {
      const businessUnit = await loadParentBusinessUnit();
      renderParentBusinessUnit(businessUnit);
    } catch (error) {
      console.warn("Unable to load Outdoor Services business-unit data.", error);
    }
  }
}

function setupNavigation() {
  if (!navToggle || !navMenu) return;

  navToggle.addEventListener("click", () => {
    const open = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!open));
    navMenu.classList.toggle("is-open", !open);
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      navMenu.classList.remove("is-open");
    });
  });
}

function setFormStatus(message, state = "") {
  if (!formStatus) return;

  formStatus.textContent = message;

  if (state) {
    formStatus.dataset.state = state;
  } else {
    delete formStatus.dataset.state;
  }
}

function getFormValues() {
  if (!requestForm) return null;

  const data = new FormData(requestForm);

  return {
    name: String(data.get("name") || "").trim(),
    phone: String(data.get("phone") || "").trim(),
    email: String(data.get("email") || "").trim(),
    service: String(data.get("service") || "General inquiry").trim(),
    details: String(data.get("details") || "").trim(),
    website: String(data.get("website") || "").trim(),
  };
}

function validateRequest(values) {
  if (!values.name) return "Please enter your name.";
  if (!values.phone && !values.email) return "Please provide a phone number or email address.";
  if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) return "Please enter a valid email address.";
  if (values.details.length < 5) return "Please tell us a little more about the service you need.";
  return null;
}

async function submitServiceRequest(event) {
  event.preventDefault();

  if (!requestForm) return;

  const values = getFormValues();
  const validationError = validateRequest(values);

  if (validationError) {
    setFormStatus(validationError, "error");
    return;
  }

  const submitButton = requestForm.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  setFormStatus("Sending your request…");

  const message = [
    `Requested service: ${values.service}`,
    "",
    values.details,
  ].join("\n");

  try {
    await getJson(`${API_BASE_URL}/api/public/sites/${activeSiteKey}/contact`, {
      method: "POST",
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        phone: values.phone,
        subject: `Service request: ${values.service}`,
        message,
        businessUnitSlug: BUSINESS_UNIT_SLUG,
        sourcePath: window.location.pathname || "/",
        website: values.website,
      }),
    });

    requestForm.reset();
    setFormStatus("Request received. Pioneer Outdoor Services will follow up using the contact information you provided.", "success");
  } catch (error) {
    console.error("Service request submission failed.", error);
    setFormStatus(error.message || "We could not send your request. Please try again.", "error");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

if (requestForm) {
  requestForm.addEventListener("submit", submitServiceRequest);
}

setupNavigation();
loadBackendContent();
