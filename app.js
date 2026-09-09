const API_BASE_URL = "https://api.pioneerlegacyworks.com";
const BUSINESS_UNIT_SLUG = "pioneer-outdoor-services";
const PARENT_SITE_KEY = "pioneer-legacy-works";
const DEDICATED_SITE_KEY = "pioneer-outdoor-services";

let activeSiteKey = PARENT_SITE_KEY;

function loadResponsiveStyles() {
  if (document.querySelector('link[data-mobile-styles="true"]')) return;

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "mobile.css";
  stylesheet.dataset.mobileStyles = "true";
  document.head.append(stylesheet);
}

loadResponsiveStyles();

const businessNameNodes = document.querySelectorAll("[data-business-name]");
const businessDescriptionNode = document.querySelector("[data-business-description]");
const contactDetails = document.querySelector("#contact-details");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector("#main-nav");
const yearNode = document.querySelector("#year");
const requestForm = document.querySelector("#service-request-form");
const formStatus = document.querySelector("#form-status");
const priceEstimate = document.querySelector("#price-estimate");

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

  const closeMenu = () => {
    navToggle.setAttribute("aria-expanded", "false");
    navMenu.classList.remove("is-open");
    document.body.classList.remove("nav-open");
  };

  const openMenu = () => {
    navToggle.setAttribute("aria-expanded", "true");
    navMenu.classList.add("is-open");
    document.body.classList.add("nav-open");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navMenu.classList.contains("is-open")) {
      closeMenu();
      navToggle.focus();
    }
  });

  document.addEventListener("click", (event) => {
    if (!navMenu.classList.contains("is-open")) return;
    if (navMenu.contains(event.target) || navToggle.contains(event.target)) return;
    closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) {
      closeMenu();
    }
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
    address: String(data.get("address") || "").trim(),
    city: String(data.get("city") || "").trim(),
    zip: String(data.get("zip") || "").trim(),
    drivewaySize: String(data.get("drivewaySize") || "").trim(),
    frequency: String(data.get("frequency") || "").trim(),
    sidewalk: String(data.get("sidewalk") || "No").trim(),
    salting: String(data.get("salting") || "No").trim(),
    notes: String(data.get("notes") || "").trim(),
    website: String(data.get("website") || "").trim(),
  };
}

function validateRequest(values) {
  if (!values) return "Unable to read the service request form.";
  if (!values.name) return "Please enter your name.";
  if (!values.phone && !values.email) return "Please provide a phone number or email address.";
  if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) return "Please enter a valid email address.";
  if (!values.address) return "Please enter the property street address.";
  if (!values.city) return "Please enter the property city.";
  if (!/^\d{5}(?:-\d{4})?$/.test(values.zip)) return "Please enter a valid ZIP code.";
  if (!values.drivewaySize) return "Please select a driveway size.";
  if (!values.frequency) return "Please select one-time or recurring service.";
  if (values.drivewaySize === "No driveway / sidewalk only" && values.sidewalk !== "Yes") {
    return "Please select sidewalk clearing for a sidewalk-only request.";
  }
  return null;
}

function calculateStartingPrice(values) {
  if (!values?.drivewaySize) {
    return { amount: null, label: "Choose a driveway size to see the estimated starting price." };
  }

  if (values.drivewaySize === "Larger / custom driveway") {
    return { amount: null, label: "Estimated starting price: custom quote required." };
  }

  if (values.drivewaySize === "No driveway / sidewalk only") {
    return { amount: null, label: "Estimated starting price: quote required for sidewalk-only service." };
  }

  let amount = values.drivewaySize === "Two-car driveway" ? 50 : 40;

  if (values.sidewalk === "Yes") amount += 20;
  if (values.salting === "Yes") amount += 20;

  const suffix = values.frequency === "Recurring winter service" ? " per clearing" : "";
  return {
    amount,
    label: `Estimated starting price${suffix}: $${amount}. Final price is confirmed before service.`,
  };
}

function updatePriceEstimate() {
  if (!priceEstimate || !requestForm) return;

  const values = getFormValues();
  const estimate = calculateStartingPrice(values);
  priceEstimate.textContent = estimate.label;
}

function buildServiceRequestMessage(values) {
  const estimate = calculateStartingPrice(values);
  const lines = [
    "Pioneer Outdoor Services service request",
    "",
    `Property address: ${values.address}, ${values.city}, OH ${values.zip}`,
    `Driveway size: ${values.drivewaySize}`,
    `Service frequency: ${values.frequency}`,
    `Sidewalk clearing: ${values.sidewalk}`,
    `Salting: ${values.salting}`,
    `Estimated starting price: ${estimate.amount === null ? "Quote required" : `$${estimate.amount}`}`,
  ];

  if (values.notes) {
    lines.push("", "Customer notes:", values.notes);
  }

  return lines.join("\n");
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

  try {
    await getJson(`${API_BASE_URL}/api/public/sites/${activeSiteKey}/contact`, {
      method: "POST",
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        phone: values.phone,
        subject: `Service request: ${values.drivewaySize} | ${values.frequency}`,
        message: buildServiceRequestMessage(values),
        businessUnitSlug: BUSINESS_UNIT_SLUG,
        sourcePath: window.location.pathname || "/",
        website: values.website,
      }),
    });

    requestForm.reset();
    updatePriceEstimate();
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
  requestForm.addEventListener("change", updatePriceEstimate);
  updatePriceEstimate();
}

setupNavigation();
loadBackendContent();
