let currentSlide = 0;
const slides = document.querySelectorAll(".slide");
const navButtons = document.querySelectorAll(".nav-btn");
const chambers = document.querySelectorAll(".chamber");
const revolverWheel = document.querySelector(".revolver-wheel");
const progressContainer = document.querySelector(".progress-container");
const slideTitleElement = document.getElementById("slide-title");
const slideNumberDisplay = document.getElementById("slide-number-display");
let hideProgressTimeout;

// Lazy loading management
const loadedImages = new Set();
const loadingImages = new Set();

// Arrow key navigation optimization
let keyHoldTimeout = null;
let isKeyHeld = false;
let keyRepeatInterval = null;
let lastKeyPressed = null;
const keyHoldWaitTime = 1000; // Wait 1 second before starting fast flip (ms)
const fastFlipInterval = 150; // Fast flip interval when held (ms)

// Slide titles (ordered by page number)
const slideTitles = [
  "Intro", // 0
  "Part 1", // 1.0
  "Arduino", // 1.1
  "Parts", // 1.2
  "Laws", // 1.3
  "MCU", // 1.4
  "Prototyping", // 1.5
  "Production", // 1.6
  "Protocol", // 1.7
  "Networking", // 1.8
  "Best Practice", // 1.9
  "Part 2", // 2.0
  "Biometric", // 2.5
  "Part 3", // 3.0
  "Workshop", // 3.1
  "Resources", // ?
  "Q&A", // ?
];

// Slide numbers as defined in markdown (ordered)
const slideNumbers = [
  "0", // Intro
  "1.0", // Part 1
  "1.1", // Arduino
  "1.2", // Parts
  "1.3", // Laws
  "1.4", // MCU
  "1.5", // Prototyping
  "1.6", // Production
  "1.7", // Protocol
  "1.8", // Networking
  "1.9", // Best Practice
  "2.0", // Part 2
  "2.5", // Biometric
  "3.0", // Part 3
  "3.1", // Workshop
  "?", // Resources
  "?", // Q&A
];

let hideButtonsTimeout;

function showNavigationButtons() {
  navButtons.forEach((btn) => btn.classList.add("visible"));

  clearTimeout(hideButtonsTimeout);
  hideButtonsTimeout = setTimeout(() => {
    navButtons.forEach((btn) => btn.classList.remove("visible"));
  }, 2000);
}

document.addEventListener("mousemove", function (event) {
  const mouseX = event.clientX;
  const mouseY = event.clientY;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const edgeThreshold = 120;
  const clickZoneWidth = 60;
  const slideshowContainer = document.querySelector(".slideshow-container");

  // Show navigation buttons when near edges
  if (mouseX < edgeThreshold || mouseX > screenWidth - edgeThreshold) {
    showNavigationButtons();
  }

  // Control edge zone glow based on mouse position
  if (slideshowContainer) {
    // Remove all edge classes first
    slideshowContainer.classList.remove(
      "left-edge-active",
      "right-edge-active"
    );

    // Add appropriate class based on mouse position
    if (mouseX < clickZoneWidth) {
      slideshowContainer.classList.add("left-edge-active");
    } else if (mouseX > screenWidth - clickZoneWidth) {
      slideshowContainer.classList.add("right-edge-active");
    }
  }

  // Show revolver on any mouse movement
  showRevolver();
});

navButtons.forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    clearTimeout(hideButtonsTimeout);
    navButtons.forEach((b) => b.classList.add("visible"));
  });

  btn.addEventListener("mouseleave", () => {
    hideButtonsTimeout = setTimeout(() => {
      navButtons.forEach((b) => b.classList.remove("visible"));
    }, 1000);
  });
});

function updateProgressBar() {
  chambers.forEach((chamber, index) => {
    if (index === currentSlide) {
      chamber.classList.add("active");
    } else {
      chamber.classList.remove("active");
    }
  });

  // Rotate the wheel to bring active chamber to top
  const rotationAngle = -currentSlide * (360 / 17); // 360/17 = 21.18 degrees per chamber
  revolverWheel.style.transform = `rotate(${rotationAngle}deg)`;

  // Update slide title and number
  if (slideTitleElement) {
    slideTitleElement.textContent = slideTitles[currentSlide];
  }
  if (slideNumberDisplay) {
    slideNumberDisplay.textContent = slideNumbers[currentSlide];
  }

  // Show progress
  showRevolver();
}

function showRevolver() {
  progressContainer.classList.add("visible");
  progressContainer.classList.remove("hidden");

  // Hide after 1 second
  clearTimeout(hideProgressTimeout);
  hideProgressTimeout = setTimeout(() => {
    progressContainer.classList.add("hidden");
    progressContainer.classList.remove("visible");
  }, 1000);
}

// Initialize progress bar on DOM ready
document.addEventListener("DOMContentLoaded", function () {
  updateProgressBar();

  // Add click handlers to chambers
  chambers.forEach((chamber, index) => {
    chamber.addEventListener("click", () => goToSlide(index));
  });

  // Load images for initial slide and preload next slides
  loadImagesForSlide(currentSlide);
  preloadAdjacentSlides(currentSlide);
});

// Show slideshow after all resources (including fonts/images) are loaded
window.addEventListener("load", function () {
  console.log("Page fully loaded");

  // Add a small delay to ensure everything is rendered
  setTimeout(() => {
    const slideshowContainer = document.querySelector(".slideshow-container");
    const loadingOverlay = document.querySelector(".loading-overlay");
    const firstSlide = document.querySelector(".slide:first-of-type");

    console.log("Slideshow container:", slideshowContainer);
    console.log("Loading overlay:", loadingOverlay);

    if (slideshowContainer) {
      slideshowContainer.classList.add("loaded");
      console.log("Added loaded class to slideshow");
    }

    if (loadingOverlay) {
      loadingOverlay.classList.add("fade-out");
      console.log("Added fade-out class to loading overlay");
      // Remove loading overlay from DOM after animation
      setTimeout(() => {
        loadingOverlay.remove();
        console.log("Removed loading overlay");
      }, 500);
    }

    // Start first slide fade-in animation after loading overlay begins to fade
    setTimeout(() => {
      if (firstSlide && firstSlide.classList.contains("active")) {
        firstSlide.classList.add("fade-in");
        console.log("Started first slide fade-in animation");
      }
    }, 300); // Start fade-in while loading overlay is still fading out
  }, 100);
});

// Lazy loading functions
function loadImagesForSlide(slideIndex) {
  const slide = slides[slideIndex];
  if (!slide) return;

  const lazyImages = slide.querySelectorAll(".lazy-image[data-src]");

  lazyImages.forEach((img) => {
    const src = img.getAttribute("data-src");
    if (src && !loadedImages.has(src) && !loadingImages.has(src)) {
      loadImage(img, src);
    }
  });
}

function loadImage(imgElement, src) {
  if (loadingImages.has(src)) return;

  loadingImages.add(src);
  imgElement.classList.add("loading");

  const tempImg = new Image();

  tempImg.onload = function () {
    imgElement.src = src;
    imgElement.removeAttribute("data-src");
    imgElement.classList.remove("loading");
    imgElement.classList.add("loaded");
    loadedImages.add(src);
    loadingImages.delete(src);
    console.log("Loaded image:", src);
  };

  tempImg.onerror = function () {
    imgElement.classList.remove("loading");
    loadingImages.delete(src);
    console.error("Failed to load image:", src);
    // Trigger the existing onerror handler if present
    if (imgElement.onerror) {
      imgElement.onerror();
    }
  };

  tempImg.src = src;
}

function preloadAdjacentSlides(slideIndex) {
  // Preload previous and next slide
  const prevIndex = slideIndex - 1 >= 0 ? slideIndex - 1 : slides.length - 1;
  const nextIndex = slideIndex + 1 < slides.length ? slideIndex + 1 : 0;

  // Small delay to prioritize current slide
  setTimeout(() => {
    loadImagesForSlide(prevIndex);
    loadImagesForSlide(nextIndex);
  }, 100);
}

function changeSlide(direction) {
  slides[currentSlide].classList.remove("active");
  // Remove fade-in class from previous slide if it was the first slide
  if (currentSlide === 0) {
    slides[currentSlide].classList.remove("fade-in");
  }

  currentSlide = currentSlide + direction;

  if (currentSlide >= slides.length) {
    currentSlide = 0;
  } else if (currentSlide < 0) {
    currentSlide = slides.length - 1;
  }

  slides[currentSlide].classList.add("active");

  // Special handling for first slide
  if (currentSlide === 0) {
    setTimeout(() => {
      slides[currentSlide].classList.add("fade-in");
    }, 50);
  }

  updateProgressBar();

  // Load images for current slide and preload adjacent slides
  loadImagesForSlide(currentSlide);
  preloadAdjacentSlides(currentSlide);
}

function goToSlide(slideIndex) {
  if (slideIndex >= 0 && slideIndex < slides.length) {
    slides[currentSlide].classList.remove("active");
    // Remove fade-in class from previous slide if it was the first slide
    if (currentSlide === 0) {
      slides[currentSlide].classList.remove("fade-in");
    }

    currentSlide = slideIndex;
    slides[currentSlide].classList.add("active");

    // Special handling for first slide
    if (currentSlide === 0) {
      setTimeout(() => {
        slides[currentSlide].classList.add("fade-in");
      }, 50);
    }

    updateProgressBar();

    // Load images for current slide and preload adjacent slides
    loadImagesForSlide(currentSlide);
    preloadAdjacentSlides(currentSlide);
  }
}

document.addEventListener("keydown", function (event) {
  // Show revolver on any keyboard action
  showRevolver();

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    handleArrowKeyPress(-1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    handleArrowKeyPress(1);
  } else if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    changeSlide(1);
  } else if (event.key === "Escape") {
    goToSlide(0);
  } else if (event.key >= "1" && event.key <= "9") {
    const slideNumber = parseInt(event.key) - 1;
    if (slideNumber < slides.length) {
      goToSlide(slideNumber);
    }
  }
});

document.addEventListener("keyup", function (event) {
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    handleArrowKeyRelease();
  }
});

function handleArrowKeyPress(direction) {
  const currentKey = direction > 0 ? "ArrowRight" : "ArrowLeft";

  // If this is the very first press, or we switched keys
  if (lastKeyPressed === null || lastKeyPressed !== currentKey) {
    // Always navigate immediately on first press
    changeSlide(direction);
    lastKeyPressed = currentKey;

    // Clear any existing timeouts
    if (keyHoldTimeout) {
      clearTimeout(keyHoldTimeout);
    }
    if (keyRepeatInterval) {
      clearInterval(keyRepeatInterval);
      keyRepeatInterval = null;
    }

    // Reset hold state for new key
    isKeyHeld = false;

    // Set up hold detection - wait 2 seconds, then start fast flipping
    keyHoldTimeout = setTimeout(() => {
      isKeyHeld = true;
      // Start fast continuous flipping
      keyRepeatInterval = setInterval(() => {
        changeSlide(direction);
      }, fastFlipInterval);
    }, keyHoldWaitTime);
  }
  // If key is already being processed, ignore repeated keydown events
}

function handleArrowKeyRelease() {
  // Clear all timeouts and intervals
  if (keyHoldTimeout) {
    clearTimeout(keyHoldTimeout);
    keyHoldTimeout = null;
  }
  if (keyRepeatInterval) {
    clearInterval(keyRepeatInterval);
    keyRepeatInterval = null;
  }

  // Reset hold state
  isKeyHeld = false;
  lastKeyPressed = null;
}

// This function is no longer needed as we use setInterval instead

let touchStartX = 0;
let touchEndX = 0;

document.addEventListener("touchstart", function (event) {
  touchStartX = event.changedTouches[0].screenX;
});

document.addEventListener("touchend", function (event) {
  touchEndX = event.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  if (touchEndX < touchStartX - 50) {
    changeSlide(1);
  }
  if (touchEndX > touchStartX + 50) {
    changeSlide(-1);
  }
}

let autoPlayInterval;
let isAutoPlaying = false;

function toggleAutoPlay() {
  if (isAutoPlaying) {
    clearInterval(autoPlayInterval);
    isAutoPlaying = false;
  } else {
    autoPlayInterval = setInterval(() => {
      changeSlide(1);
    }, 5000);
    isAutoPlaying = true;
  }
}

document.addEventListener("keydown", function (event) {
  if (event.key === "p" || event.key === "P") {
    toggleAutoPlay();
  }
});

function preloadImages() {
  const imageUrls = [
    "https://via.placeholder.com/600x400/333/fff?text=Slide+1",
    "https://via.placeholder.com/600x400/444/fff?text=Slide+2",
    "https://via.placeholder.com/600x400/555/fff?text=Thank+You",
  ];

  imageUrls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
}

window.addEventListener("load", preloadImages);

document.addEventListener("click", function (event) {
  // Show revolver on any click
  showRevolver();

  // Only allow navigation clicks in very narrow edge zones
  if (
    !event.target.closest(".navigation") &&
    !event.target.closest(".slide-indicators") &&
    !event.target.closest(".revolver-progress")
  ) {
    const clickX = event.clientX;
    const windowWidth = window.innerWidth;
    const edgeZoneWidth = 60; // Very narrow click zones (60px from each edge)

    // Left edge zone for previous slide
    if (clickX < edgeZoneWidth) {
      changeSlide(-1);
    }
    // Right edge zone for next slide
    else if (clickX > windowWidth - edgeZoneWidth) {
      changeSlide(1);
    }
    // Middle area - no navigation (clicking on content won't change slides)
  }
});

console.log("Slideshow initialized. Controls:");
console.log("- Arrow keys: Fast click = instant, hold 1sec = fast flip");
console.log("- Space/Enter: Next slide");
console.log("- Number keys: Jump to slide");
console.log("- P: Toggle auto-play");
console.log("- Escape: Return to first slide");
console.log("- Click/Tap: Only in 60px edge zones (left/right)");
console.log("- Swipe: Navigate on mobile");
