import {
  ADMIN_SESSION_KEY,
  GLOBAL_SETTINGS_KEY,
  SITE_PAGES,
  buildPagePayload,
  getGlobalEditorModel,
  getPageEditorModel,
  loadPageDocument,
  resetStoredPageContent,
  saveStoredPageContent
} from "./content-store.js";

const loginView = document.querySelector("[data-admin-auth]");
const appView = document.querySelector("[data-admin-app]");
const loginForm = document.querySelector("[data-admin-login]");
const loginError = document.querySelector("[data-admin-error]");
const navigation = document.querySelector("[data-admin-nav]");
const pageTitle = document.querySelector("[data-admin-page-title]");
const pageText = document.querySelector("[data-admin-page-text]");
const textSection = document.querySelector("[data-admin-texts]");
const sliderSection = document.querySelector("[data-admin-sliders]");
const saveButton = document.querySelector("[data-admin-save]");
const resetButton = document.querySelector("[data-admin-reset]");
const logoutButton = document.querySelector("[data-admin-logout]");
const statusNode = document.querySelector("[data-admin-status]");

let currentPageKey = SITE_PAGES[0].key;
let currentModel = null;

function setAuthenticated(isAuthenticated) {
  if (isAuthenticated) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  } else {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }

  loginView.hidden = isAuthenticated;
  appView.hidden = !isAuthenticated;
}

function isAuthenticated() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

function setStatus(message) {
  statusNode.textContent = message || "";
}

function createField(labelText, value, onInput, rows = 5) {
  const wrapper = document.createElement("label");
  wrapper.className = "admin-field";

  const label = document.createElement("span");
  label.textContent = labelText;
  wrapper.appendChild(label);

  const textarea = document.createElement("textarea");
  textarea.className = "admin-textarea";
  textarea.rows = rows;
  textarea.value = value;
  textarea.addEventListener("input", function () {
    onInput(textarea.value);
  });
  wrapper.appendChild(textarea);

  return wrapper;
}

function createInput(labelText, value, onInput, type = "text") {
  const wrapper = document.createElement("label");
  wrapper.className = "admin-field";

  const label = document.createElement("span");
  label.textContent = labelText;
  wrapper.appendChild(label);

  const input = document.createElement("input");
  input.className = "admin-input";
  input.type = type;
  input.value = value;
  input.addEventListener("input", function () {
    onInput(input.value);
  });
  wrapper.appendChild(input);

  return wrapper;
}

function readFileAsDataUrl(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();

    reader.onload = function () {
      resolve(String(reader.result || ""));
    };

    reader.onerror = function () {
      reject(new Error("Не удалось прочитать файл"));
    };

    reader.readAsDataURL(file);
  });
}

function renderTexts() {
  textSection.innerHTML = "";

  currentModel.texts.forEach(function (item) {
    const card = document.createElement("div");
    card.className = "admin-card";

    const title = document.createElement("p");
    title.className = "admin-card__title";
    title.textContent = item.label;
    card.appendChild(title);

    card.appendChild(createField("HTML или текст", item.html, function (nextValue) {
      item.html = nextValue;
    }));

    textSection.appendChild(card);
  });
}

function createImagePicker(card, cardIndex, onRemove) {
  const picker = document.createElement("div");
  picker.className = "admin-image-picker";

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.hidden = true;

  const tile = document.createElement("button");
  tile.type = "button";
  tile.className = "admin-image-picker__tile";

  const image = document.createElement("img");
  image.className = "admin-image-picker__image";
  image.alt = card.imageAlt || "";

  const placeholder = document.createElement("span");
  placeholder.className = "admin-image-picker__placeholder";
  placeholder.textContent = "+";

  const hint = document.createElement("span");
  hint.className = "admin-image-picker__hint";
  hint.textContent = "Перетащите фото или нажмите";

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "admin-image-picker__remove";
  removeButton.setAttribute("aria-label", "Удалить карточку");
  removeButton.textContent = "×";

  function syncTile() {
    const hasImage = Boolean(card.imageSrc);

    tile.classList.toggle("is-filled", hasImage);
    image.src = hasImage ? card.imageSrc : "";
    image.alt = card.imageAlt || "";
    image.hidden = !hasImage;
    placeholder.hidden = hasImage;
    removeButton.hidden = !hasImage;
  }

  async function applyFile(file) {
    if (!file) {
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    card.imageSrc = dataUrl;
    syncTile();
    setStatus("Изображение загружено в карточку " + (cardIndex + 1));
  }

  tile.addEventListener("click", function () {
    input.click();
  });

  tile.addEventListener("dragover", function (event) {
    event.preventDefault();
    tile.classList.add("is-dragover");
  });

  tile.addEventListener("dragleave", function () {
    tile.classList.remove("is-dragover");
  });

  tile.addEventListener("drop", function (event) {
    event.preventDefault();
    tile.classList.remove("is-dragover");
    const file = event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files[0] : null;
    applyFile(file);
  });

  input.addEventListener("change", function () {
    const file = input.files && input.files[0];
    applyFile(file);
  });

  removeButton.addEventListener("click", function (event) {
    event.stopPropagation();
    onRemove();
  });

  tile.appendChild(image);
  tile.appendChild(placeholder);
  tile.appendChild(removeButton);
  picker.appendChild(tile);
  picker.appendChild(hint);
  picker.appendChild(input);

  syncTile();

  return { picker, syncTile };
}

function createSliderCardEditor(slider, card, cardIndex) {
  const cardNode = document.createElement("div");
  cardNode.className = "admin-card admin-slider-card";

  const header = document.createElement("div");
  header.className = "admin-slider-card__header";

  const title = document.createElement("p");
  title.className = "admin-card__title";
  title.textContent = slider.label + " / карточка " + (cardIndex + 1);
  header.appendChild(title);

  const imagePicker = createImagePicker(card, cardIndex, function () {
    slider.cards.splice(cardIndex, 1);
    renderSliders();
  });
  header.appendChild(imagePicker.picker);
  cardNode.appendChild(header);

  cardNode.appendChild(createInput("Alt изображения", card.imageAlt, function (nextValue) {
    card.imageAlt = nextValue;
    imagePicker.syncTile();
  }));

  slider.textFields.forEach(function (field, textIndex) {
    cardNode.appendChild(createField(field.label, card.texts[textIndex] || "", function (nextValue) {
      card.texts[textIndex] = nextValue;
    }, 3));
  });
  return cardNode;
}

function createEmptyCard(slider) {
  return {
    imageSrc: "",
    imageAlt: "",
    texts: slider.textFields.map(function () {
      return "";
    })
  };
}

function createAddCardTile(slider) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "admin-slider-add";
  button.innerHTML = "<span>+</span><small>Новая карточка</small>";
  button.addEventListener("click", function () {
    slider.cards.push(createEmptyCard(slider));
    renderSliders();
  });

  return button;
}

function renderSliders() {
  sliderSection.innerHTML = "";

  if (!currentModel.sliders.length) {
    const note = document.createElement("p");
    note.className = "admin-section__note";
    note.textContent = "Для этого раздела нет слайдеров.";
    sliderSection.appendChild(note);
    return;
  }

  currentModel.sliders.forEach(function (slider) {
    const section = document.createElement("div");
    section.className = "admin-card";

    const toolbar = document.createElement("div");
    toolbar.className = "admin-toolbar";

    const heading = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "admin-section__title";
    title.textContent = slider.label;
    heading.appendChild(title);

    const note = document.createElement("p");
    note.className = "admin-section__note";
    note.textContent = "Компактные карточки поддерживают click и drag-and-drop для загрузки фото.";
    heading.appendChild(note);
    toolbar.appendChild(heading);
    section.appendChild(toolbar);

    const grid = document.createElement("div");
    grid.className = "admin-slider-grid";

    slider.cards.forEach(function (card, cardIndex) {
      grid.appendChild(createSliderCardEditor(slider, card, cardIndex));
    });

    grid.appendChild(createAddCardTile(slider));
    section.appendChild(grid);
    sliderSection.appendChild(section);
  });
}

function renderPage() {
  const currentPage = SITE_PAGES.find(function (page) {
    return page.key === currentPageKey;
  });

  pageTitle.textContent = currentPage.title;
  pageText.textContent = currentPageKey === GLOBAL_SETTINGS_KEY
    ? "Изменения в этом разделе применяются ко всем страницам сайта сразу."
    : "Редактирование текстов и карточек слайдеров для страницы " + currentPage.title + ".";
  renderTexts();
  renderSliders();

  navigation.querySelectorAll(".admin-nav__button").forEach(function (button) {
    button.classList.toggle("is-active", button.dataset.pageKey === currentPageKey);
  });
}

async function loadPage(pageKey) {
  setStatus("Загружаю страницу...");
  currentPageKey = pageKey;

  if (pageKey === GLOBAL_SETTINGS_KEY) {
    const doc = await loadPageDocument("index.html");
    currentModel = getGlobalEditorModel(doc);
  } else {
    const page = SITE_PAGES.find(function (item) {
      return item.key === pageKey;
    });
    const doc = await loadPageDocument(page.path);
    currentModel = getPageEditorModel(doc, pageKey);
  }

  renderPage();
  setStatus("Страница загружена");
}

function createNavigation() {
  navigation.innerHTML = "";

  SITE_PAGES.forEach(function (page) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "admin-nav__button";
    button.dataset.pageKey = page.key;
    button.textContent = page.title;
    button.addEventListener("click", function () {
      loadPage(page.key);
    });
    navigation.appendChild(button);
  });
}

function saveCurrentPage() {
  saveStoredPageContent(currentPageKey, buildPagePayload(currentModel));
  setStatus(currentPageKey === GLOBAL_SETTINGS_KEY ? "Глобальные настройки сохранены" : "Изменения сохранены");
}

async function resetCurrentPage() {
  resetStoredPageContent(currentPageKey);
  await loadPage(currentPageKey);
  setStatus(currentPageKey === GLOBAL_SETTINGS_KEY ? "Глобальные настройки сброшены" : "Изменения страницы сброшены");
}

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const login = String(formData.get("login") || "");
  const password = String(formData.get("password") || "");

  if (login === "admin" && password === "admin") {
    loginError.textContent = "";
    setAuthenticated(true);
    createNavigation();
    loadPage(currentPageKey);
    return;
  }

  loginError.textContent = "Неверный логин или пароль";
});

saveButton.addEventListener("click", function () {
  saveCurrentPage();
});

resetButton.addEventListener("click", function () {
  resetCurrentPage();
});

logoutButton.addEventListener("click", function () {
  setAuthenticated(false);
  setStatus("");
});

if (isAuthenticated()) {
  setAuthenticated(true);
  createNavigation();
  loadPage(currentPageKey);
} else {
  setAuthenticated(false);
}
