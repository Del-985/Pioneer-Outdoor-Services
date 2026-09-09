const CMS_API_BASE_URL = "https://api.pioneerlegacyworks.com";
const CMS_SITE_KEY = "pioneer-outdoor-services";

function cmsValue(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function cmsPageHref(slug) {
  if (slug === "home") return "./";
  if (slug === "services") return "services.html";
  if (slug === "privacy") return "privacy.html";
  return `page.html?slug=${encodeURIComponent(slug)}`;
}

async function loadCmsSite() {
  const response = await fetch(`${CMS_API_BASE_URL}/api/public/sites/${CMS_SITE_KEY}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`CMS request failed with ${response.status}`);
  const payload = await response.json();
  return payload?.data || null;
}

function installCmsStyles() {
  if (document.querySelector('link[data-cms-style="true"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "cms.css";
  link.dataset.cmsStyle = "true";
  document.head.append(link);
}

function applyHomepage(homepage = {}) {
  const eyebrow = document.querySelector(".hero .eyebrow");
  const heading = document.querySelector("#hero-heading");
  const lead = document.querySelector(".hero-lead");
  const primary = document.querySelector(".hero-actions .button-primary");
  const secondary = document.querySelector(".hero-actions .button-secondary");
  const serviceAreaCopy = document.querySelector("#service-area .area-layout > div:first-child > p:not(.section-label)");
  const trust = document.querySelector("#why-pioneer .section-intro");
  const servicesIntro = document.querySelector("#services .section-heading > p");

  if (homepage.eyebrow && eyebrow) eyebrow.textContent = homepage.eyebrow;
  if (homepage.heroHeadline && heading) heading.textContent = homepage.heroHeadline;
  if (homepage.heroSubheadline && lead) lead.textContent = homepage.heroSubheadline;
  if (homepage.primaryCtaLabel && primary) primary.textContent = homepage.primaryCtaLabel;
  if (homepage.primaryCtaHref && primary) primary.href = homepage.primaryCtaHref;
  if (homepage.secondaryCtaLabel && secondary) secondary.textContent = homepage.secondaryCtaLabel;
  if (homepage.secondaryCtaHref && secondary) secondary.href = homepage.secondaryCtaHref;
  if (homepage.serviceAreaText && serviceAreaCopy) serviceAreaCopy.textContent = homepage.serviceAreaText;
  if (homepage.trustStatement && trust) trust.textContent = homepage.trustStatement;
  if (homepage.introText && servicesIntro) servicesIntro.textContent = homepage.introText;
}

function renderServices(services = []) {
  const grid = document.querySelector(".service-grid");
  if (!grid || !Array.isArray(services) || services.length === 0) return;

  const active = services
    .filter((service) => service?.active !== false && service?.name)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  if (active.length === 0) return;

  grid.replaceChildren();
  active.forEach((service) => {
    const card = document.createElement("article");
    card.className = service.featured ? "service-card featured-card" : "service-card";

    if (service.tag) {
      const tag = document.createElement("span");
      tag.className = "service-tag";
      tag.textContent = service.tag;
      card.append(tag);
    }

    const heading = document.createElement("h3");
    heading.textContent = service.name;
    card.append(heading);

    if (service.description) {
      const description = document.createElement("p");
      description.textContent = service.description;
      card.append(description);
    }

    if (service.priceLabel || service.requestable !== false) {
      const link = document.createElement("a");
      link.href = service.requestable === false ? "services.html" : "#request-service";
      link.textContent = service.priceLabel || "Request service";
      const arrow = document.createElement("span");
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = " →";
      link.append(arrow);
      card.append(link);
    }

    grid.append(card);
  });
}

function applyServiceArea(serviceArea = {}) {
  const heading = document.querySelector("#area-heading");
  const primary = document.querySelector(".area-card strong");
  const areaCardCopy = document.querySelector(".area-card p:last-child");

  if (serviceArea.primaryAreas && primary) primary.textContent = serviceArea.primaryAreas;
  if (serviceArea.primaryAreas && heading) heading.textContent = `Serving ${serviceArea.primaryAreas}.`;
  if (serviceArea.notice && areaCardCopy) areaCardCopy.textContent = serviceArea.notice;

  if (serviceArea.extendedAreas) {
    let extra = document.querySelector("#cms-extended-area");
    if (!extra && areaCardCopy) {
      extra = document.createElement("p");
      extra.id = "cms-extended-area";
      areaCardCopy.insertAdjacentElement("afterend", extra);
    }
    if (extra) extra.textContent = `Extended availability: ${serviceArea.extendedAreas}`;
  }
}

function applyAnnouncement(announcement = {}) {
  document.querySelector("#cms-announcement")?.remove();
  if (!announcement.enabled || !cmsValue(announcement.text)) return;

  const banner = document.createElement("div");
  banner.id = "cms-announcement";
  banner.className = `cms-announcement cms-announcement--${announcement.tone || "info"}`;
  banner.setAttribute("role", announcement.tone === "urgent" ? "alert" : "status");

  const shell = document.createElement("div");
  shell.className = "page-shell cms-announcement__inner";
  const message = document.createElement("p");
  message.textContent = announcement.text;
  const close = document.createElement("button");
  close.type = "button";
  close.setAttribute("aria-label", "Dismiss announcement");
  close.textContent = "×";
  close.addEventListener("click", () => banner.remove());
  shell.append(message, close);
  banner.append(shell);

  const header = document.querySelector(".site-header");
  if (header) header.insertAdjacentElement("afterend", banner);
  else document.body.prepend(banner);
}

function applyRequestSettings(requests = {}) {
  const form = document.querySelector("#service-request-form");
  if (!form) return;

  if (requests.accepting === false) {
    form.hidden = true;
    let notice = document.querySelector("#cms-request-paused");
    if (!notice) {
      notice = document.createElement("div");
      notice.id = "cms-request-paused";
      notice.className = "cms-request-paused";
      form.insertAdjacentElement("beforebegin", notice);
    }
    notice.innerHTML = "";
    const heading = document.createElement("strong");
    heading.textContent = "Online service requests are temporarily paused.";
    const copy = document.createElement("p");
    copy.textContent = requests.confirmationMessage || "Please check back soon or use the published contact information to reach us.";
    notice.append(heading, copy);
  } else {
    form.hidden = false;
    document.querySelector("#cms-request-paused")?.remove();
  }

  if (requests.confirmationMessage) {
    const observer = new MutationObserver(() => {
      const confirmation = document.querySelector("#request-confirmation:not([hidden])");
      if (!confirmation || confirmation.querySelector(".cms-confirmation-message")) return;
      const copy = document.createElement("p");
      copy.className = "cms-confirmation-message";
      copy.textContent = requests.confirmationMessage;
      confirmation.querySelector(".confirmation-next")?.insertAdjacentElement("beforebegin", copy);
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
  }
}

function applySeo(seo = {}, profile = {}) {
  const title = cmsValue(seo.defaultTitle);
  const description = cmsValue(seo.defaultDescription);
  if (title) document.title = title;
  if (description) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.append(meta);
    }
    meta.content = description;
  }

  if (profile.faviconUrl) {
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.head.append(favicon);
    }
    favicon.href = profile.faviconUrl;
  }
}

function applyBackendNavigation(navigation = []) {
  if (!Array.isArray(navigation) || navigation.length === 0) return;
  const list = document.querySelector("#main-nav .nav-links");
  if (!list) return;

  list.replaceChildren();
  navigation.forEach((page) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = cmsPageHref(page.slug);
    link.textContent = page.label || page.title;
    item.append(link);
    list.append(item);
  });
}

async function applyCms() {
  installCmsStyles();
  try {
    const site = await loadCmsSite();
    if (!site) return;
    const profile = site.profile || {};
    const cms = profile.metadata?.cms || {};

    applyHomepage(cms.homepage || {});
    renderServices(cms.services || []);
    applyServiceArea(cms.serviceArea || {});
    applyAnnouncement(cms.announcement || {});
    applyRequestSettings(cms.requests || {});
    applySeo(cms.seo || {}, profile);
    applyBackendNavigation(site.navigation || []);
  } catch (error) {
    console.info("Website CMS configuration is unavailable; static site content remains in use.", error);
  }
}

void applyCms();
