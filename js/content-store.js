export const CMS_STORAGE_KEY = "nomos.cms.content";
export const ADMIN_SESSION_KEY = "nomos.cms.session";
export const GLOBAL_SETTINGS_KEY = "__global__";

export const SITE_PAGES = [
  { key: GLOBAL_SETTINGS_KEY, title: "Глобальные настройки", path: "" },
  { key: "index.html", title: "Главная", path: "index.html" },
  { key: "about.html", title: "О компании", path: "about.html" },
  { key: "cases.html", title: "Кейсы", path: "cases.html" },
  { key: "contacts.html", title: "Контакты", path: "contacts.html" },
  { key: "services-citizens.html", title: "Услуги для граждан", path: "services-citizens.html" },
  { key: "services-business.html", title: "Услуги для бизнеса", path: "services-business.html" },
  { key: "service-real-estate.html", title: "Недвижимость", path: "service-real-estate.html" },
  { key: "service-construction.html", title: "Строительство", path: "service-construction.html" }
];

const PAGE_TEXT_SELECTOR = [
  "main h1",
  "main h2",
  "main h3",
  "main p",
  "main .section-label",
  "main a.btn"
].join(", ");

const GLOBAL_TEXT_SELECTOR = [
  "header .nav__link",
  "header .nav-dropdown__link",
  "header .header-phone span",
  "header .header-phone small",
  "footer .footer-contact",
  "footer .footer-socials a",
  "footer .footer__logo",
  "footer .footer-col h3",
  "footer .footer-col a",
  "footer .footer-col p"
].join(", ");

function readStorage() {
  try {
    return JSON.parse(localStorage.getItem(CMS_STORAGE_KEY) || "{}");
  } catch (error) {
    return {};
  }
}

function writeStorage(data) {
  localStorage.setItem(CMS_STORAGE_KEY, JSON.stringify(data));
}

function getPageRoot(doc) {
  return doc.querySelector(".page");
}

function getNodeIndex(node) {
  if (!node.parentElement) {
    return 0;
  }

  return Array.from(node.parentElement.children).indexOf(node);
}

function getNodePath(node, root) {
  const parts = [];
  let current = node;

  while (current && current !== root) {
    parts.unshift(getNodeIndex(current));
    current = current.parentElement;
  }

  return parts.join(".");
}

function getNodeByPath(root, path) {
  if (!root || !path) {
    return null;
  }

  return path.split(".").reduce(function (parent, part) {
    if (!parent) {
      return null;
    }

    return parent.children[Number(part)] || null;
  }, root);
}

function getSectionLabel(element) {
  const section = element.closest("section");

  if (!section) {
    if (element.closest("header")) {
      return "Шапка";
    }

    if (element.closest("footer")) {
      return "Подвал";
    }

    return "Страница";
  }

  const title = section.querySelector("h1, h2, h3");

  if (title) {
    return sanitizeText(title.textContent) || "Секция";
  }

  return section.className || "Секция";
}

function sanitizeText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function shouldSkipTextElement(element) {
  if (element.closest("[data-slider-track]")) {
    return true;
  }

  if (element.closest(".contact-modal")) {
    return true;
  }

  if (!sanitizeText(element.textContent) && element.querySelector("img, svg, picture")) {
    return true;
  }

  return !sanitizeText(element.textContent);
}

function getTextFieldLabel(element, index) {
  const text = sanitizeText(element.textContent);
  const tag = element.tagName.toLowerCase();
  const section = getSectionLabel(element);
  const excerpt = text ? text.slice(0, 60) : tag;

  return section + " / " + tag + " / " + excerpt + " [" + (index + 1) + "]";
}

export function getPageKeyFromLocation(locationPathname = window.location.pathname) {
  const match = SITE_PAGES.find(function (page) {
    return locationPathname.endsWith("/" + page.path) || locationPathname.endsWith(page.path);
  });

  return match ? match.key : "index.html";
}

export function getStoredPageContent(pageKey) {
  const storage = readStorage();

  return storage[pageKey] || { texts: {}, sliders: {} };
}

export function getStoredGlobalContent() {
  return getStoredPageContent(GLOBAL_SETTINGS_KEY);
}

export function saveStoredPageContent(pageKey, content) {
  const storage = readStorage();
  storage[pageKey] = content;
  writeStorage(storage);
}

export function resetStoredPageContent(pageKey) {
  const storage = readStorage();
  delete storage[pageKey];
  writeStorage(storage);
}

function extractTextEntriesBySelector(doc, selector) {
  const root = getPageRoot(doc);

  if (!root) {
    return [];
  }

  return Array.from(root.querySelectorAll(selector))
    .filter(function (element) {
      return !shouldSkipTextElement(element);
    })
    .map(function (element, index) {
      return {
        id: getNodePath(element, root),
        label: getTextFieldLabel(element, index),
        html: element.innerHTML.trim()
      };
    });
}

export function extractPageTextEntries(doc) {
  return extractTextEntriesBySelector(doc, PAGE_TEXT_SELECTOR);
}

export function extractGlobalTextEntries(doc) {
  return extractTextEntriesBySelector(doc, GLOBAL_TEXT_SELECTOR);
}

function buildTextFieldTemplate(cardElement) {
  return Array.from(cardElement.children)
    .filter(function (child) {
      return child.tagName.toLowerCase() !== "img";
    })
    .map(function (child, index) {
      return {
        tagName: child.tagName.toLowerCase(),
        className: child.className || "",
        label: child.tagName.toLowerCase() + " " + (index + 1)
      };
    });
}

function serializeSliderCard(cardElement) {
  const image = cardElement.querySelector("img");
  const textElements = Array.from(cardElement.children).filter(function (child) {
    return child.tagName.toLowerCase() !== "img";
  });

  return {
    imageSrc: image ? image.getAttribute("src") || "" : "",
    imageAlt: image ? image.getAttribute("alt") || "" : "",
    texts: textElements.map(function (element) {
      return element.innerHTML.trim();
    })
  };
}

export function extractSliderEntries(doc) {
  const root = getPageRoot(doc);

  if (!root) {
    return [];
  }

  return Array.from(root.querySelectorAll("[data-slider]")).map(function (slider, index) {
    const track = slider.querySelector("[data-slider-track]");
    const firstCard = track ? track.firstElementChild : null;
    const pageTitle = slider.closest("section")?.querySelector("h2, h3");

    if (!track || !firstCard) {
      return null;
    }

    return {
      id: getNodePath(slider, root),
      label: (pageTitle ? sanitizeText(pageTitle.textContent) : "Слайдер") + " [" + (index + 1) + "]",
      cardTagName: firstCard.tagName.toLowerCase(),
      cardClassName: firstCard.className || "",
      textFields: buildTextFieldTemplate(firstCard),
      cards: Array.from(track.children).map(serializeSliderCard)
    };
  }).filter(Boolean);
}

export async function loadPageDocument(pagePath) {
  const response = await fetch(pagePath, { cache: "no-store" });
  const html = await response.text();
  const parser = new DOMParser();

  return parser.parseFromString(html, "text/html");
}

export function getPageEditorModel(doc, pageKey) {
  const defaults = getStoredPageContent(pageKey);
  const texts = extractPageTextEntries(doc).map(function (entry) {
    return {
      id: entry.id,
      label: entry.label,
      html: Object.prototype.hasOwnProperty.call(defaults.texts, entry.id) ? defaults.texts[entry.id] : entry.html
    };
  });

  const sliders = extractSliderEntries(doc).map(function (slider) {
    const storedSlider = defaults.sliders[slider.id];

    return {
      id: slider.id,
      label: slider.label,
      cardTagName: slider.cardTagName,
      cardClassName: slider.cardClassName,
      textFields: slider.textFields,
      cards: storedSlider && Array.isArray(storedSlider.cards) ? storedSlider.cards : slider.cards
    };
  });

  return { texts, sliders };
}

export function getGlobalEditorModel(doc) {
  const defaults = getStoredGlobalContent();
  const texts = extractGlobalTextEntries(doc).map(function (entry) {
    return {
      id: entry.id,
      label: entry.label,
      html: Object.prototype.hasOwnProperty.call(defaults.texts, entry.id) ? defaults.texts[entry.id] : entry.html
    };
  });

  return { texts, sliders: [] };
}

export function buildPagePayload(model) {
  return {
    texts: model.texts.reduce(function (accumulator, item) {
      accumulator[item.id] = item.html;
      return accumulator;
    }, {}),
    sliders: model.sliders.reduce(function (accumulator, item) {
      accumulator[item.id] = {
        cards: item.cards
      };
      return accumulator;
    }, {})
  };
}

function createSliderCard(doc, sliderEntry, cardData) {
  const card = doc.createElement(sliderEntry.cardTagName);
  card.className = sliderEntry.cardClassName;

  const image = doc.createElement("img");
  image.setAttribute("src", cardData.imageSrc || "");
  image.setAttribute("alt", cardData.imageAlt || "");
  card.appendChild(image);

  sliderEntry.textFields.forEach(function (field, index) {
    const element = doc.createElement(field.tagName);

    if (field.className) {
      element.className = field.className;
    }

    element.innerHTML = cardData.texts[index] || "";
    card.appendChild(element);
  });

  return card;
}

export function applyStoredContent(doc = document, pageKey = getPageKeyFromLocation()) {
  const root = getPageRoot(doc);

  if (!root) {
    return;
  }

  const globalContent = getStoredGlobalContent();
  const pageContent = getStoredPageContent(pageKey);

  extractGlobalTextEntries(doc).forEach(function (entry) {
    const override = globalContent.texts[entry.id];
    const element = getNodeByPath(root, entry.id);

    if (typeof override === "string" && element) {
      element.innerHTML = override;
    }
  });

  extractPageTextEntries(doc).forEach(function (entry) {
    const override = pageContent.texts[entry.id];
    const element = getNodeByPath(root, entry.id);

    if (typeof override === "string" && element) {
      element.innerHTML = override;
    }
  });

  extractSliderEntries(doc).forEach(function (sliderEntry) {
    const sliderNode = getNodeByPath(root, sliderEntry.id);
    const track = sliderNode ? sliderNode.querySelector("[data-slider-track]") : null;
    const override = pageContent.sliders[sliderEntry.id];

    if (!track || !override || !Array.isArray(override.cards)) {
      return;
    }

    track.innerHTML = "";
    override.cards.forEach(function (cardData) {
      track.appendChild(createSliderCard(doc, sliderEntry, cardData));
    });
  });
}
