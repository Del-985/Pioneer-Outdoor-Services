const API_BASE_URL = "https://api.pioneerlegacyworks.com";
const BUSINESS_UNIT_SLUG = "pioneer-outdoor-services";
const PARENT_SITE_KEY = "pioneer-legacy-works";
const DEDICATED_SITE_KEY = "pioneer-outdoor-services";

const businessNameNodes = document.querySelectorAll("[data-business-name]");
const businessDescriptionNode = document.querySelector("[data-business-description]");
const contactCard = document.querySelector("#contact-card");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector("#main-nav");
const yearNode = document.querySelector("#year");

async function getJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Backend request failed with status ${response.status}`);
  }

  const payload = await response.json();
  return payload.data;
}

async function getDedicatedSiteProfile() {
  return getJson(`${API_BASE_URL}/api/public/sites/${DEDICATED_SITE_KEY}`);
}

async function getParentBusinessUnitProfile() {
  const units = await getJson(`${API_BASE_URL}/api/public/sites/${PARENT_SITE_KEY}/business-units`);

  if (!Array.isArray(units)) {
    return null;
  }

  return units.find((unit) => unit.slug === BUSINESS_UNIT_SLUG) || null;
}

function renderBusinessUnit(unit) {
  if (!unit) return;

  const name = unit.name || "Pioneer Outdoor Services";
  const description = unit.description;

  businessNameNodes.forEach((node) => {
    node.textContent = name;
  });

  if (description && businessDescriptionNode) {
    businessDescriptionNode.textContent = description;
  }

  document.title = name;
}

function renderSiteProfile(site) {
  if (!site) return;

  const profile = site.profile || {};
  const name = profile.brandName || site.name || "Pioneer Outdoor Services";

  businessNameNodes.forEach((node) => {
    node.textContent = name;
  });

  if (profile.description && businessDescriptionNode) {
    businessDescriptionNode.textContent = profile.description;
  }

  renderContact(profile);
  document.title = name;
}

function renderContact(profile = {}) {
  if (!contactCard) return;

  const details = [];

  if (profile.contactPhone) {
    details.push({
      label: "Phone",
      text: profile.contactPhone,
      href: `tel:${profile.contactPhone.replace(/[^+\d]/g, "")}`,
    });
  }

  if (profile.contactEmail) {
    details.push({
      label: "Email",
      text: profile.contactEmail,
      href: `mailto:${profile.contactEmail}`,
    });
  }

  if (!details.length) {
    return;
  }

  contactCard.replaceChildren();

  details.forEach((detail) => {
    const wrapper = document.createElement("div");
    wrapper.className = "contact-detail";

    const label = document.createElement("span");
    label.textContent = detail.label;

    const link = document.createElement("a");
    link.href = detail.href;
    link.textContent = detail.text;

    wrapper.append(label, link);
    contactCard.append(wrapper);
  });
}

async function loadBackendContent() {
  let dedicatedSite = null;

  try {
    dedicatedSite = await getDedicatedSiteProfile();
    renderSiteProfile(dedicatedSite);
  } catch (error) {
    console.info("Dedicated Outdoor Services site profile is not available yet.", error);
  }

  try {
    const businessUnit = await getParentBusinessUnitProfile();

    if (!dedicatedSite) {
      renderBusinessUnit(businessUnit);
    }
  } catch (error) {
    console.warn("Unable to load Outdoor Services business-unit data.", error);
  }
}

function setupNavigation() {
  if (!navToggle || !navLinks) return;

  navToggle.addEventListener("click", () => {
    const open = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!open));
    navLinks.classList.toggle("is-open", !open);
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navToggle.setAttribute("aria-expanded", "false");
      navLinks.classList.remove("is-open");
    });
  });
}

if (yearNode) {
  yearNode.textContent = String(new Date().getFullYear());
}

setupNavigation();
loadBackendContent();
