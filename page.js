const PAGE_API_BASE_URL = "https://api.pioneerlegacyworks.com";
const PAGE_SITE_KEY = "pioneer-outdoor-services";

function pageHref(slug) {
  if (slug === "home") return "./";
  if (slug === "services") return "services.html";
  if (slug === "privacy") return "privacy.html";
  return `page.html?slug=${encodeURIComponent(slug)}`;
}

async function fetchData(path) {
  const response = await fetch(`${PAGE_API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error?.message || `Request failed with ${response.status}`);
  return payload?.data;
}

function renderNavigation(navigation = []) {
  const list = document.querySelector("#cms-page-nav");
  if (!list) return;
  list.replaceChildren();
  navigation.forEach((page) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = pageHref(page.slug);
    link.textContent = page.label || page.title;
    item.append(link);
    list.append(item);
  });
}

function renderBody(body) {
  const target = document.querySelector("#cms-page-body");
  if (!target) return;
  target.replaceChildren();
  const text = typeof body === "string" ? body.trim() : "";
  if (!text) {
    const empty = document.createElement("p");
    empty.textContent = "This page does not have published content yet.";
    target.append(empty);
    return;
  }

  text.split(/\n{2,}/).forEach((paragraph) => {
    const node = document.createElement("p");
    node.textContent = paragraph.trim();
    target.append(node);
  });
}

async function loadPage() {
  const slug = new URLSearchParams(window.location.search).get("slug");
  const heading = document.querySelector("#cms-page-title");
  if (!slug) {
    if (heading) heading.textContent = "Page not found";
    renderBody("No page was selected.");
    return;
  }

  try {
    const [site, page] = await Promise.all([
      fetchData(`/api/public/sites/${PAGE_SITE_KEY}`),
      fetchData(`/api/public/sites/${PAGE_SITE_KEY}/pages/${encodeURIComponent(slug)}`),
    ]);

    const brand = site?.profile?.brandName || site?.name || "Pioneer Outdoor Services";
    const brandNode = document.querySelector("#cms-page-brand");
    if (brandNode) brandNode.textContent = brand;
    renderNavigation(site?.navigation || []);

    if (heading) heading.textContent = page?.title || "Page";
    renderBody(page?.content?.body || "");

    document.title = page?.seo?.title || `${page?.title || "Page"} | ${brand}`;
    if (page?.seo?.description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.content = page.seo.description;
    }
  } catch (error) {
    console.error("Unable to load CMS page.", error);
    if (heading) heading.textContent = "Page unavailable";
    renderBody(error instanceof Error ? error.message : "This page could not be loaded.");
  }
}

void loadPage();
