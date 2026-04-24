document.addEventListener("DOMContentLoaded", function () {
  const links = document.querySelectorAll('a[href="#"]');
  const dropdownToggles = document.querySelectorAll("[data-dropdown-toggle]");
  const sliders = document.querySelectorAll("[data-slider]");
  const sliderImages = document.querySelectorAll(".specialist-card img");
  const header = document.querySelector(".header");
  const burger = document.querySelector(".burger");
  const nav = document.querySelector(".nav");
  const navLinks = document.querySelectorAll(".nav .nav__link:not(.nav__link--dropdown), .nav-dropdown__link");

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
    let currentIndex = 0;
    let startX = 0;
    let startOffset = 0;
    let currentOffset = 0;
    let isDragging = false;

    function getVisibleSlides() {
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
});
