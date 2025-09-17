let currentSlide = 0;
const slides = document.querySelectorAll(".slide");
const navButtons = document.querySelectorAll(".nav-btn");
const chambers = document.querySelectorAll(".chamber");
const revolverWheel = document.querySelector(".revolver-wheel");
const progressContainer = document.querySelector(".progress-container");
const slideTitleElement = document.getElementById("slide-title");
const slideNumberDisplay = document.getElementById("slide-number-display");
let hideProgressTimeout;

// Arrow key navigation optimization
let keyHoldTimeout = null;
let isKeyHeld = false;
let keyRepeatInterval = null;
let lastKeyPressed = null;
const keyHoldWaitTime = 5000; // Wait 5 seconds before starting fast flip (ms)
const fastFlipInterval = 150; // Fast flip interval when held (ms)

// Slide titles
const slideTitles = [
  "Intro",
  "Why Prototype?",
  "Design Process",
  "Tools & Materials",
  "Breadboarding",
  "PCB Basics",
  "Schematic Design",
  "Layout Tips",
  "Component Selection",
  "Testing & Debug",
  "Power Design",
  "Signal Integrity",
  "Manufacturing",
  "Iteration",
  "Case Studies",
  "Resources",
  "Q&A",
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
  const edgeThreshold = 150;

  if (mouseX < edgeThreshold || mouseX > screenWidth - edgeThreshold) {
    showNavigationButtons();
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
    slideNumberDisplay.textContent = currentSlide + 1;
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

// Initialize progress bar on load
document.addEventListener("DOMContentLoaded", function () {
  updateProgressBar();

  // Add click handlers to chambers
  chambers.forEach((chamber, index) => {
    chamber.addEventListener("click", () => goToSlide(index));
  });
});

function changeSlide(direction) {
  slides[currentSlide].classList.remove("active");

  currentSlide = currentSlide + direction;

  if (currentSlide >= slides.length) {
    currentSlide = 0;
  } else if (currentSlide < 0) {
    currentSlide = slides.length - 1;
  }

  slides[currentSlide].classList.add("active");
  updateProgressBar();
}

function goToSlide(slideIndex) {
  if (slideIndex >= 0 && slideIndex < slides.length) {
    slides[currentSlide].classList.remove("active");
    currentSlide = slideIndex;
    slides[currentSlide].classList.add("active");
    updateProgressBar();
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

  // If this is the first press of this key, or we switched keys
  if (!isKeyHeld || lastKeyPressed !== currentKey) {
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

    // Set up hold detection - wait 1 second, then start fast flipping
    if (!isKeyHeld) {
      keyHoldTimeout = setTimeout(() => {
        isKeyHeld = true;
        // Start fast continuous flipping
        keyRepeatInterval = setInterval(() => {
          changeSlide(direction);
        }, fastFlipInterval);
      }, keyHoldWaitTime);
    }
  }
  // If key is already being held, ignore repeated keydown events
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

  if (
    !event.target.closest(".navigation") &&
    !event.target.closest(".slide-indicators")
  ) {
    const clickX = event.clientX;
    const windowWidth = window.innerWidth;

    if (clickX < windowWidth / 2) {
      changeSlide(-1);
    } else {
      changeSlide(1);
    }
  }
});

console.log("Slideshow initialized. Controls:");
console.log("- Arrow keys: Fast click = instant, hold 5sec = fast flip");
console.log("- Space/Enter: Next slide");
console.log("- Number keys: Jump to slide");
console.log("- P: Toggle auto-play");
console.log("- Escape: Return to first slide");
console.log("- Click/Tap: Navigate slides");
console.log("- Swipe: Navigate on mobile");
