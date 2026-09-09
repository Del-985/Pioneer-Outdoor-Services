const API_BASE_URL = "https://api.pioneerlegacyworks.com";
const BUSINESS_UNIT_SLUG = "pioneer-outdoor-services";
const PARENT_SITE_KEY = "pioneer-legacy-works";
const DEDICATED_SITE_KEY = "pioneer-outdoor-services";
const PRIMARY_ZIP_PREFIX = "436";
const NEARBY_ZIP_PREFIX = "435";

let activeSiteKey = PARENT_SITE_KEY;
let activeSiteProfile = {};
let currentRequestId = createRequestId();

function ensureStylesheet(href, marker) {
  if (document.querySelector(`link[data-site-style="${marker}"]`)) return;
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = href;
  stylesheet.dataset.siteStyle = marker;
  document.head.append(stylesheet);
}

ensureStylesheet("mobile.css", "mobile");
ensureStylesheet("p0.css", "p0");

const businessNameNodes = document.querySelectorAll("[data-business-name]");
const businessDescriptionNode = document.querySelector("[data-business-description]");
const contactDetails = document.querySelector("#contact-details");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector("#main-nav");
const yearNode = document.querySelector("#year");
const requestForm = document.querySelector("#service-request-form");
const formStatus = document.querySelector("#form-status");
const priceEstimate = document.querySelector("#price-estimate");
const zipInput = requestForm?.querySelector('[name="zip"]') || null;

class ApiError extends Error {
  constructor(message, status = 0, code = "") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function getJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      cache: "no-store",
      ...options,
    });
  } catch (error) {
    throw new ApiError("Network connection failed. Please check your connection and try again.");
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error?.message || `Request failed with status ${response.status}.`;
    const code = payload?.error?.code || "";
    throw new ApiError(message, response.status, code);
  }

  return payload?.data;
}

function createRequestId() {
  if (globalThis.crypto?.randomUUID) {
    return `pos-${crypto.randomUUID()}`;
  }
  return `pos-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
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
  if (metaDescription) metaDescription.setAttribute("content", description);
}

function upsertMeta(property, content, useName = false) {
  if (!content) return;
  const attribute = useName ? "name" : "property";
  let tag = document.querySelector(`meta[${attribute}="${property}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, property);
    document.head.append(tag);
  }
  tag.setAttribute("content", content);
}

function enhanceSeo() {
  const canonicalUrl = new URL(window.location.href);
  canonicalUrl.hash = "";
  canonicalUrl.search = "";
  if (canonicalUrl.pathname.endsWith("/index.html")) {
    canonicalUrl.pathname = canonicalUrl.pathname.replace(/index\.html$/, "");
  }

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.append(canonical);
  }
  canonical.href = canonicalUrl.href;

  if (!document.querySelector('link[rel="icon"]')) {
    const favicon = document.createElement("link");
    favicon.rel = "icon";
    favicon.href = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='12' fill='%230b1724'/%3E%3Ccircle cx='32' cy='32' r='23' fill='none' stroke='%23c79a3b' stroke-width='4'/%3E%3Ctext x='32' y='42' text-anchor='middle' font-family='Georgia,serif' font-size='31' font-weight='700' fill='%23e4bd68'%3EP%3C/text%3E%3C/svg%3E";
    document.head.append(favicon);
  }

  const description = document.querySelector('meta[name="description"]')?.content || "Pioneer Outdoor Services provides snow and ice service in the Toledo, Ohio area.";
  upsertMeta("og:type", "website");
  upsertMeta("og:site_name", "Pioneer Outdoor Services");
  upsertMeta("og:title", document.title);
  upsertMeta("og:description", description);
  upsertMeta("og:url", canonicalUrl.href);
  upsertMeta("twitter:card", "summary", true);
  upsertMeta("twitter:title", document.title, true);
  upsertMeta("twitter:description", description, true);

  const existingSchema = document.querySelector('#pioneer-local-business-schema');
  if (existingSchema) existingSchema.remove();
  const schema = document.createElement("script");
  schema.type = "application/ld+json";
  schema.id = "pioneer-local-business-schema";
  schema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Pioneer Outdoor Services",
    url: canonicalUrl.origin + canonicalUrl.pathname.replace(/(?:services|privacy)\.html$/, ""),
    description,
    areaServed: {
      "@type": "City",
      name: "Toledo",
      addressRegion: "OH",
      addressCountry: "US",
    },
    priceRange: "$$",
    ...(activeSiteProfile.contactPhone ? { telephone: activeSiteProfile.contactPhone } : {}),
    ...(activeSiteProfile.contactEmail ? { email: activeSiteProfile.contactEmail } : {}),
  });
  document.head.append(schema);
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

  contactDetails.replaceChildren();
  if (!items.length) {
    const fallback = document.createElement("div");
    fallback.className = "contact-fallback";
    const label = document.createElement("span");
    label.textContent = "Online requests";
    const copy = document.createElement("p");
    copy.textContent = "The service request form remains available even when published contact details are unavailable.";
    fallback.append(label, copy);
    contactDetails.append(fallback);
    return;
  }

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
  activeSiteProfile = profile;
  const name = profile.brandName || site.name || "Pioneer Outdoor Services";
  updateBusinessName(name);
  if (profile.description && businessDescriptionNode) {
    businessDescriptionNode.textContent = profile.description;
    updateMetaDescription(profile.description);
  }
  renderContact(profile);
  document.title = `${name} | Toledo, Ohio`;
  enhanceSeo();
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
  enhanceSeo();
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
      renderContact({});
      enhanceSeo();
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
    isOpen ? closeMenu() : openMenu();
  });
  navMenu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
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
    if (window.innerWidth > 820) closeMenu();
  });
}

function installSiteLinks() {
  const serviceGrid = document.querySelector(".service-grid");
  if (serviceGrid && !document.querySelector(".services-detail-link")) {
    const wrapper = document.createElement("div");
    wrapper.className = "services-detail-link";
    const link = document.createElement("a");
    link.className = "button button-outline";
    link.href = "services.html";
    link.textContent = "Full Service Details";
    wrapper.append(link);
    serviceGrid.insertAdjacentElement("afterend", wrapper);
  }

  const footerNav = document.querySelector(".footer-grid nav");
  if (footerNav && !footerNav.querySelector('a[href="services.html"]')) {
    const services = document.createElement("a");
    services.href = "services.html";
    services.textContent = "Service Details";
    footerNav.append(services);
  }
  if (footerNav && !footerNav.querySelector('a[href="privacy.html"]')) {
    const privacy = document.createElement("a");
    privacy.href = "privacy.html";
    privacy.textContent = "Privacy";
    footerNav.append(privacy);
  }
}

function setFormStatus(message, state = "") {
  if (!formStatus) return;
  formStatus.textContent = message;
  if (state) formStatus.dataset.state = state;
  else delete formStatus.dataset.state;
}

function clearFieldErrors() {
  if (!requestForm) return;
  requestForm.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
    field.removeAttribute("aria-invalid");
    field.removeAttribute("aria-describedby");
  });
}

function focusFieldError(fieldName) {
  if (!requestForm || !fieldName) return;
  const field = requestForm.elements.namedItem(fieldName);
  if (!(field instanceof HTMLElement)) return;
  field.setAttribute("aria-invalid", "true");
  if (formStatus?.id) field.setAttribute("aria-describedby", formStatus.id);
  field.focus();
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

function classifyServiceArea(zip) {
  if (!/^\d{5}(?:-\d{4})?$/.test(zip)) {
    return { state: "invalid", label: "Enter a valid ZIP code to check service-area status." };
  }
  const baseZip = zip.slice(0, 5);
  if (baseZip.startsWith(PRIMARY_ZIP_PREFIX)) {
    return { state: "primary", label: "Primary Toledo service area. Availability still depends on route capacity." };
  }
  if (baseZip.startsWith(NEARBY_ZIP_PREFIX)) {
    return { state: "review", label: "Nearby-area address. We can accept the request, but route availability must be confirmed." };
  }
  return { state: "outside", label: "This ZIP code is outside the current Toledo-area service range." };
}

function ensureServiceAreaStatus() {
  if (!requestForm || !zipInput) return null;
  let status = document.querySelector("#service-area-status");
  if (status) return status;
  status = document.createElement("p");
  status.id = "service-area-status";
  status.className = "form-hint service-area-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  zipInput.closest(".form-row")?.insertAdjacentElement("afterend", status);
  return status;
}

function updateServiceAreaStatus() {
  const status = ensureServiceAreaStatus();
  if (!status || !zipInput) return;
  const value = zipInput.value.trim();
  if (!value) {
    status.textContent = "Enter a ZIP code to check whether the property is in the current service area.";
    delete status.dataset.state;
    return;
  }
  const area = classifyServiceArea(value);
  status.textContent = area.label;
  status.dataset.state = area.state;
}

function validateRequest(values) {
  if (!values) return { message: "Unable to read the service request form." };
  if (!values.name) return { message: "Please enter your name.", field: "name" };
  if (!values.phone && !values.email) return { message: "Please provide a phone number or email address.", field: "phone" };
  if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) return { message: "Please enter a valid email address.", field: "email" };
  if (!values.address) return { message: "Please enter the property street address.", field: "address" };
  if (!values.city) return { message: "Please enter the property city.", field: "city" };
  if (!/^\d{5}(?:-\d{4})?$/.test(values.zip)) return { message: "Please enter a valid ZIP code.", field: "zip" };
  const area = classifyServiceArea(values.zip);
  if (area.state === "outside") return { message: "That ZIP code is outside the current Toledo-area service range.", field: "zip" };
  if (!values.drivewaySize) return { message: "Please select a driveway size.", field: "drivewaySize" };
  if (!values.frequency) return { message: "Please select one-time or recurring service.", field: "frequency" };
  if (values.drivewaySize === "No driveway / sidewalk only" && values.sidewalk !== "Yes") {
    return { message: "Please select sidewalk clearing for a sidewalk-only request.", field: "sidewalk" };
  }
  return null;
}

function calculateStartingPrice(values) {
  if (!values?.drivewaySize) return { amount: null, label: "Choose a driveway size to see the estimated starting price." };
  if (values.drivewaySize === "Larger / custom driveway") return { amount: null, label: "Estimated starting price: custom quote required." };
  if (values.drivewaySize === "No driveway / sidewalk only") return { amount: null, label: "Estimated starting price: quote required for sidewalk-only service." };

  let amount = values.drivewaySize === "Two-car driveway" ? 50 : 40;
  if (values.sidewalk === "Yes") amount += 20;
  if (values.salting === "Yes") amount += 20;
  const suffix = values.frequency === "Recurring winter service" ? " per clearing" : "";
  return { amount, label: `Estimated starting price${suffix}: $${amount}. Final price is confirmed before service.` };
}

function updatePriceEstimate() {
  if (!priceEstimate || !requestForm) return;
  priceEstimate.textContent = calculateStartingPrice(getFormValues()).label;
}

function buildServiceRequestMessage(values) {
  const estimate = calculateStartingPrice(values);
  const area = classifyServiceArea(values.zip);
  const lines = [
    "Pioneer Outdoor Services service request",
    "",
    `Property address: ${values.address}, ${values.city}, OH ${values.zip}`,
    `Service area: ${area.state === "primary" ? "Primary Toledo route" : "Nearby area - route confirmation required"}`,
    `Driveway size: ${values.drivewaySize}`,
    `Service frequency: ${values.frequency}`,
    `Sidewalk clearing: ${values.sidewalk}`,
    `Salting: ${values.salting}`,
    `Estimated starting price: ${estimate.amount === null ? "Quote required" : `$${estimate.amount}`}`,
  ];
  if (values.notes) lines.push("", "Customer notes:", values.notes);
  return lines.join("\n");
}

function friendlySubmissionError(error) {
  if (error?.status === 429) return "Too many requests were sent from this connection. Please wait about 15 minutes and try again.";
  if (error?.status >= 500) return "Our request system is temporarily unavailable. Your form has not been cleared; please try again shortly.";
  if (error?.status === 403) return "The request system cannot accept submissions from this website origin yet. Please try again after the site configuration is updated.";
  if (error?.status === 400) return error.message || "Please review the form and try again.";
  return error?.message || "We could not send your request. Please try again.";
}

function ensureConfirmationPanel() {
  if (!requestForm) return null;
  let panel = document.querySelector("#request-confirmation");
  if (panel) return panel;
  panel = document.createElement("section");
  panel.id = "request-confirmation";
  panel.className = "request-confirmation";
  panel.hidden = true;
  panel.setAttribute("tabindex", "-1");
  requestForm.insertAdjacentElement("afterend", panel);
  return panel;
}

function showConfirmation(result, values) {
  const panel = ensureConfirmationPanel();
  if (!panel) return;
  const estimate = calculateStartingPrice(values);
  const area = classifyServiceArea(values.zip);
  const receipt = String(result?.id || "").slice(0, 8).toUpperCase();
  panel.replaceChildren();

  const eyebrow = document.createElement("p");
  eyebrow.className = "confirmation-kicker";
  eyebrow.textContent = result?.duplicate ? "Request already received" : "Request received";
  const heading = document.createElement("h3");
  heading.textContent = result?.duplicate ? "We already have this service request." : "Your service request is in the Pioneer system.";
  const summary = document.createElement("p");
  summary.textContent = area.state === "review"
    ? "This address is in the nearby-area review zone. We’ll confirm route capacity and final pricing before accepting the job."
    : "We’ll confirm availability and final pricing using the contact information you provided.";

  const details = document.createElement("dl");
  const detailRows = [
    ["Reference", receipt || "Received"],
    ["Property", `${values.address}, ${values.city}, OH ${values.zip}`],
    ["Service", `${values.drivewaySize}; ${values.frequency}`],
    ["Add-ons", `Sidewalk: ${values.sidewalk} · Salting: ${values.salting}`],
    ["Starting price", estimate.amount === null ? "Quote required" : `$${estimate.amount}${values.frequency === "Recurring winter service" ? " per clearing" : ""}`],
  ];
  detailRows.forEach(([term, description]) => {
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = description;
    details.append(dt, dd);
  });

  const next = document.createElement("p");
  next.className = "confirmation-next";
  next.textContent = "Next: Pioneer Outdoor Services will review the request, confirm route availability, and contact you before service is accepted.";
  const another = document.createElement("button");
  another.type = "button";
  another.className = "button button-secondary confirmation-button";
  another.textContent = "Submit Another Request";
  another.addEventListener("click", () => {
    panel.hidden = true;
    requestForm.hidden = false;
    currentRequestId = createRequestId();
    requestForm.reset();
    if (requestForm.elements.namedItem("city")) requestForm.elements.namedItem("city").value = "Toledo";
    updatePriceEstimate();
    updateServiceAreaStatus();
    setFormStatus("");
    requestForm.querySelector('input[name="name"]')?.focus();
  });

  panel.append(eyebrow, heading, summary, details, next, another);
  requestForm.hidden = true;
  panel.hidden = false;
  panel.focus();
}

async function submitServiceRequest(event) {
  event.preventDefault();
  if (!requestForm) return;

  clearFieldErrors();
  const values = getFormValues();
  const validationError = validateRequest(values);
  if (validationError) {
    setFormStatus(validationError.message, "error");
    focusFieldError(validationError.field);
    return;
  }

  const submitButton = requestForm.querySelector('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  setFormStatus("Sending your request…");

  try {
    const result = await getJson(`${API_BASE_URL}/api/public/sites/${activeSiteKey}/contact`, {
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
        clientRequestId: currentRequestId,
      }),
    });
    setFormStatus("");
    showConfirmation(result, values);
  } catch (error) {
    console.error("Service request submission failed.", error);
    setFormStatus(friendlySubmissionError(error), "error");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

if (yearNode) yearNode.textContent = String(new Date().getFullYear());
if (requestForm) {
  requestForm.addEventListener("submit", submitServiceRequest);
  requestForm.addEventListener("change", () => {
    updatePriceEstimate();
    updateServiceAreaStatus();
  });
  zipInput?.addEventListener("input", updateServiceAreaStatus);
  updatePriceEstimate();
  updateServiceAreaStatus();
}

installSiteLinks();
setupNavigation();
enhanceSeo();
loadBackendContent();
