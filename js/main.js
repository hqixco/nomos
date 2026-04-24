document.addEventListener("DOMContentLoaded", function () {
  const links = document.querySelectorAll('a[href="#"]');
  const dropdownToggles = document.querySelectorAll("[data-dropdown-toggle]");
  const sliders = document.querySelectorAll("[data-slider]");
  const sliderImages = document.querySelectorAll(".specialist-card img, .case-card img");
  const timelines = document.querySelectorAll(".timeline");
  const header = document.querySelector(".header");
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".nav");
  const navLinks = document.querySelectorAll(".nav .nav__link:not(.nav__link--dropdown), .nav-dropdown__link");
  const contactTriggers = document.querySelectorAll('a.btn[href="#"]');
  const contactModal = document.querySelector("[data-contact-modal]");
  const contactModalClose = contactModal ? contactModal.querySelector("[data-contact-modal-close]") : null;
  const contactModalBackdrop = contactModal ? contactModal.querySelector("[data-contact-modal-backdrop]") : null;
  const contactModalForm = contactModal ? contactModal.querySelector("[data-contact-form]") : null;
  const contactPhoneInput = contactModal ? contactModal.querySelector("[data-contact-phone]") : null;

  links.forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
    });
  });

  sliderImages.forEach(function (image) {
    image.setAttribute("draggable", "false");
  });

  function closeMenu() {
    if (!header || !burger) {
      return;
    }

    header.classList.remove("is-menu-open");
    burger.setAttribute("aria-expanded", "false");
  }

  function openContactModal() {
    if (!contactModal) {
      return;
    }

    contactModal.classList.add("is-open");
    contactModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");

    if (contactPhoneInput) {
      window.setTimeout(function () {
        contactPhoneInput.focus();
      }, 180);
    }
  }

  function closeContactModal() {
    if (!contactModal) {
      return;
    }

    contactModal.classList.remove("is-open");
    contactModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-modal-open");
  }

  function formatPhoneValue(value) {
    const digits = value.replace(/\D/g, "");

    if (!digits) {
      return "";
    }

    const normalized = digits.startsWith("8")
      ? "7" + digits.slice(1)
      : digits.startsWith("7")
        ? digits
        : "7" + digits;
    const trimmed = normalized.slice(0, 11);
    const parts = trimmed.split("");
    let result = "+" + (parts[0] || "");

    if (parts.length > 1) {
      result += " (" + parts.slice(1, 4).join("");
    }

    if (parts.length >= 4) {
      result += ")";
    }

    if (parts.length > 4) {
      result += " " + parts.slice(4, 7).join("");
    }

    if (parts.length > 7) {
      result += "-" + parts.slice(7, 9).join("");
    }

    if (parts.length > 9) {
      result += "-" + parts.slice(9, 11).join("");
    }

    return result;
  }

  contactTriggers.forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      openContactModal();
    });
  });

  if (contactModalClose) {
    contactModalClose.addEventListener("click", function () {
      closeContactModal();
    });
  }

  if (contactModalBackdrop) {
    contactModalBackdrop.addEventListener("click", function () {
      closeContactModal();
    });
  }

  if (contactPhoneInput) {
    contactPhoneInput.addEventListener("input", function () {
      contactPhoneInput.value = formatPhoneValue(contactPhoneInput.value);
    });
  }

  if (contactModalForm) {
    contactModalForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!contactModalForm.reportValidity()) {
        return;
      }

      contactModalForm.reset();
      closeContactModal();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && contactModal && contactModal.classList.contains("is-open")) {
      closeContactModal();
    }
  });

  if (burger && header) {
    burger.addEventListener("click", function () {
      const isOpen = header.classList.toggle("is-menu-open");
      burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      closeMenu();
    });
  });

  dropdownToggles.forEach(function (toggle) {
    toggle.addEventListener("click", function (event) {
      event.preventDefault();

      const item = toggle.closest(".nav-item");
      const isOpen = item.classList.contains("is-open");

      document.querySelectorAll(".nav-item.is-open").forEach(function (openItem) {
        openItem.classList.remove("is-open");
      });

      if (!isOpen) {
        item.classList.add("is-open");
      }
    });
  });

  document.addEventListener("click", function (event) {
    if (header && burger && nav && !event.target.closest(".header")) {
      closeMenu();
    }

    if (!event.target.closest(".nav-item--dropdown")) {
      document.querySelectorAll(".nav-item.is-open").forEach(function (openItem) {
        openItem.classList.remove("is-open");
      });
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 900) {
      closeMenu();
    }
  });

  sliders.forEach(function (slider) {
    const viewport = slider.querySelector(".specialists__viewport");
    const track = slider.querySelector("[data-slider-track]");
    const prevButton = slider.querySelector("[data-slider-prev]");
    const nextButton = slider.querySelector("[data-slider-next]");
    const slides = Array.from(track.children);
    const sliderType = slider.dataset.slider || "";
    let currentIndex = 0;
    let startX = 0;
    let startOffset = 0;
    let currentOffset = 0;
    let isDragging = false;

    function getVisibleSlides() {
      if (sliderType === "cases") {
        if (window.innerWidth <= 560) {
          return 1;
        }

        if (window.innerWidth <= 900) {
          return 2;
        }

        return 4;
      }

      if (window.innerWidth <= 560) {
        return 1;
      }

      if (window.innerWidth <= 900) {
        return 2;
      }

      return 4;
    }

    function getGap() {
      return parseFloat(window.getComputedStyle(track).gap) || 0;
    }

    function updateSlider() {
      const visibleSlides = getVisibleSlides();
      const maxIndex = Math.max(0, slides.length - visibleSlides);

      currentIndex = Math.min(currentIndex, maxIndex);
      const slideWidth = slides[0].getBoundingClientRect().width;
      const offset = currentIndex * (slideWidth + getGap());
      currentOffset = offset;
      track.style.transform = "translateX(-" + offset + "px)";
      prevButton.disabled = currentIndex === 0;
      nextButton.disabled = currentIndex >= maxIndex;
    }

    function getStepWidth() {
      return slides[0].getBoundingClientRect().width + getGap();
    }

    function getMaxOffset() {
      return Math.max(0, (slides.length - getVisibleSlides()) * getStepWidth());
    }

    function clampOffset(offset) {
      return Math.min(Math.max(offset, 0), getMaxOffset());
    }

    function stopDragging() {
      if (!isDragging) {
        return;
      }

      isDragging = false;
      viewport.classList.remove("is-dragging");
      const stepWidth = getStepWidth();
      currentIndex = Math.round(currentOffset / stepWidth);
      updateSlider();
    }

    prevButton.addEventListener("click", function () {
      if (currentIndex > 0) {
        currentIndex -= 1;
        updateSlider();
      }
    });

    nextButton.addEventListener("click", function () {
      const maxIndex = Math.max(0, slides.length - getVisibleSlides());

      if (currentIndex < maxIndex) {
        currentIndex += 1;
        updateSlider();
      }
    });

    viewport.addEventListener("pointerdown", function (event) {
      isDragging = true;
      startX = event.clientX;
      startOffset = currentOffset;
      viewport.classList.add("is-dragging");
      viewport.setPointerCapture(event.pointerId);
    });

    viewport.addEventListener("pointermove", function (event) {
      if (!isDragging) {
        return;
      }

      const deltaX = event.clientX - startX;
      currentOffset = clampOffset(startOffset - deltaX);
      track.style.transform = "translateX(-" + currentOffset + "px)";
    });

    viewport.addEventListener("pointerup", stopDragging);
    viewport.addEventListener("pointercancel", stopDragging);
    viewport.addEventListener("pointerleave", function () {
      if (isDragging) {
        stopDragging();
      }
    });

    window.addEventListener("resize", updateSlider);
    updateSlider();
  });

  timelines.forEach(function (timeline) {
    const points = timeline.querySelectorAll(".timeline__point");
    const caption = timeline.parentElement.querySelector(".timeline__caption");

    points.forEach(function (point) {
      point.addEventListener("click", function () {
        points.forEach(function (item) {
          item.classList.remove("timeline__point--active");
          item.setAttribute("aria-pressed", "false");
        });

        point.classList.add("timeline__point--active");
        point.setAttribute("aria-pressed", "true");

        if (caption && point.dataset.caption) {
          caption.textContent = point.dataset.caption;
        }
      });
    });
  });
});
