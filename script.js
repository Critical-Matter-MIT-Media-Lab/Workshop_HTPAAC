/**
 * HTPAAC Slideshow Controller
 * Interactive presentation system with multi-state slides and multiple input methods
 */

// =============================================================================
// CONFIGURATION & STATE
// =============================================================================

const CONFIG = {
  SLIDE_COUNT: 19,
  KEY_HOLD_WAIT_TIME: 1000,
  FAST_FLIP_INTERVAL: 150,
  EDGE_THRESHOLD: 120,
  CLICK_ZONE_WIDTH: 60,
  GLOW_DETECTION_WIDTH: 200,
  BUTTON_HIDE_DELAY: 2000,
  PROGRESS_HIDE_DELAY: 500,
  NOTE_HIDE_DELAY: 3000,
};

// Global state variables
let currentSlide = parseInt(localStorage.getItem("htpaac-current-slide")) || 0;
let slideStates =
  JSON.parse(localStorage.getItem("htpaac-slide-states")) ||
  new Array(CONFIG.SLIDE_COUNT).fill(0);
let maxSlideStates = new Array(CONFIG.SLIDE_COUNT).fill(1);

// DOM elements
const slides = document.querySelectorAll(".slide");
const navButtons = document.querySelectorAll(".nav-btn");
const chambers = document.querySelectorAll(".chamber");
const revolverWheel = document.querySelector(".revolver-wheel");
const progressContainer = document.querySelector(".progress-container");
const slideTitleElement = document.getElementById("slide-title");
const slideNumberDisplay = document.getElementById("slide-number-display");
const slideNote = document.getElementById("slide-note");

// Timeout and interval management
let hideProgressTimeout, hideNoteTimeout, hideButtonsTimeout;
let keyHoldTimeout = null,
  keyRepeatInterval = null;
let isKeyHeld = false,
  lastKeyPressed = null;

// Image loading system
const loadedImages = new Set();
const loadingImages = new Set();

// Gamepad support
let gamepadIndex = -1,
  gamepadConnected = false;
let lastGamepadState = {};

// Auto-play system
let autoPlayInterval,
  isAutoPlaying = false;

// Slide titles (ordered by page number)
const slideTitles = [
  "Intro", // 0
  "Part 1", // 1.0
  "Arduino", // 1.1
  "Laws", // 1.2
  "Parts", // 1.3
  "MCU", // 1.4
  "Fabrication", // 1.5
  "Software", // 1.6
  "Protocol", // 1.7
  "Networking", // 1.8
  "Part 2", // 2.0
  "Actuator", // 2.1
  "Sensor", // 2.2
  "Biometric", // 2.3
  "Part 3", // 3.0
  "Your Kit", // 3.1
  "Warm-up", // 3.2
  "Hard Mode", // 3.3
  "System Diagram", // 3.4
];

// Slide numbers as defined in markdown (ordered)
const slideNumbers = [
  "0", // Intro
  "1.0", // Part 1
  "1.1", // Arduino
  "1.2", // Laws
  "1.3", // Parts
  "1.4", // MCU
  "1.5", // Fabrication
  "1.6", // Software
  "1.7", // Protocol
  "1.8", // Networking
  "2.0", // Part 2
  "2.1", // Actuator
  "2.2", // Sensor
  "2.3", // Biometric
  "3.0", // Part 3
  "3.1", // Your Kit
  "3.2", // Warm-up
  "3.3", // Hard Mode
  "3.4", // System Diagram
];

// =============================================================================
// NAVIGATION & UI FUNCTIONS
// =============================================================================

function showNavigationButtons() {
  navButtons.forEach((btn) => btn.classList.add("visible"));

  clearTimeout(hideButtonsTimeout);
  hideButtonsTimeout = setTimeout(() => {
    navButtons.forEach((btn) => btn.classList.remove("visible"));
  }, CONFIG.BUTTON_HIDE_DELAY);
}

// =============================================================================
// INPUT HANDLING
// =============================================================================

document.addEventListener("mousemove", function (event) {
  const mouseX = event.clientX;
  const mouseY = event.clientY;
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const slideshowContainer = document.querySelector(".slideshow-container");

  // Show navigation buttons when near edges
  if (
    mouseX < CONFIG.EDGE_THRESHOLD ||
    mouseX > screenWidth - CONFIG.EDGE_THRESHOLD
  ) {
    showNavigationButtons();
  }

  // Control edge zone glow based on mouse position
  if (slideshowContainer) {
    slideshowContainer.classList.remove(
      "left-edge-active",
      "right-edge-active"
    );

    if (mouseX < CONFIG.GLOW_DETECTION_WIDTH) {
      slideshowContainer.classList.add("left-edge-active");
    } else if (mouseX > screenWidth - CONFIG.GLOW_DETECTION_WIDTH) {
      slideshowContainer.classList.add("right-edge-active");
    }
  }

  // Don't show revolver on mouse movement anymore
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

// =============================================================================
// PROGRESS & NAVIGATION SYSTEM
// =============================================================================

function updateProgressBar() {
  chambers.forEach((chamber, index) => {
    if (index === currentSlide) {
      chamber.classList.add("active");
    } else {
      chamber.classList.remove("active");
    }
  });

  // Rotate the wheel to bring active chamber to top
  const rotationAngle = -currentSlide * (360 / 20); // 360/20 = 18 degrees per chamber
  revolverWheel.style.transform = `rotate(${rotationAngle}deg)`;

  // Update slide title and number
  if (slideTitleElement) {
    slideTitleElement.textContent = slideTitles[currentSlide];
  }
  if (slideNumberDisplay) {
    slideNumberDisplay.textContent = slideNumbers[currentSlide];
  }

  // Save current slide position
  localStorage.setItem("htpaac-current-slide", currentSlide.toString());

  // Update slide note
  updateSlideNote(currentSlide, slideStates[currentSlide] || 0);

  // Show progress
  showRevolver();
}

function showRevolver() {
  progressContainer.classList.add("visible");
  progressContainer.classList.remove("hidden");

  // Hide after configured delay
  clearTimeout(hideProgressTimeout);
  hideProgressTimeout = setTimeout(() => {
    progressContainer.classList.add("hidden");
    progressContainer.classList.remove("visible");
  }, CONFIG.PROGRESS_HIDE_DELAY);
}

// =============================================================================
// STATE INDICATORS SYSTEM
// =============================================================================
function generateStateIndicators(currentState, totalStates) {
  if (totalStates <= 1) return "";

  let indicators =
    '<div class="state-indicators" style="display: flex; gap: 8px;">';

  for (let i = 0; i < totalStates; i++) {
    const isActive = i === currentState;
    const dotStyle = isActive
      ? "width: 10px; height: 10px; border-radius: 50%; background-color: #FF1493; box-shadow: 0 0 10px rgba(255, 20, 147, 0.6);"
      : "width: 10px; height: 10px; border-radius: 50%; background-color: rgba(255, 255, 255, 0.3);";

    indicators += `<div class="state-dot${
      isActive ? " active" : ""
    }" style="${dotStyle}"></div>`;
  }

  indicators += "</div>";
  return indicators;
}

function wrapTitleWithStateIndicators(title, currentState, totalStates) {
  const stateIndicators = generateStateIndicators(currentState, totalStates);
  if (!stateIndicators) return `<h1>${title}</h1>`;

  return `
    <div style="display: flex; align-items: center; justify-content: center; gap: 1vw; margin-bottom: 30px;">
      <h1 style="margin: 0; text-align: center;">${title}</h1>
      ${stateIndicators}
    </div>
  `;
}

// =============================================================================
// NOTES SYSTEM
// =============================================================================
function showNote(content) {
  if (slideNote) {
    slideNote.querySelector(".note-content").innerHTML = content;
    slideNote.classList.add("visible");

    // Clear any existing timeout but don't set a new one
    clearTimeout(hideNoteTimeout);
  }
}

function hideNote() {
  if (slideNote) {
    slideNote.classList.remove("visible");
  }
}

function updateSlideNote(slideIndex, state = 0) {
  // Show notes for specific slides
  if (slideIndex === 4) {
    // Slide 1.3 (Parts)
    if (state === 0) {
      showNote(`
        <h4>Vendors</h4>
        <p>• <a href="https://www.digikey.com" target="_blank">Digikey</a></p>
        <p>• <a href="https://www.mouser.com" target="_blank">Mouser</a></p>
      `);
    } else if (state === 1) {
      showNote(`
        <h4>Vendors</h4>
        <p>• <a href="https://www.adafruit.com" target="_blank">Adafruit</a></p>
        <p>• <a href="https://www.sparkfun.com" target="_blank">Sparkfun</a></p>
        <p>• <a href="https://www.seeedstudio.com" target="_blank">Seeed Studio</a></p>
      `);
    }
  } else if (slideIndex === 5) {
    // Slide 1.4 (MCU)
    if (state === 1) {
      showNote(`
        <p>• <a href="https://www.seeedstudio.com/xiao-series-page" target="_blank">Seeed Studio Xiao</a></p>
        <p>• <a href="https://www.adafruit.com/product/4600" target="_blank">Adafruit QT Py</a></p>
        <p>• <a href="https://www.pjrc.com/teensy/" target="_blank">Teensy</a></p>
      `);
    } else {
      hideNote();
    }
  } else if (slideIndex === 6) {
    // Slide 1.5 (Fabrication)
    if (state === 0) {
      showNote(`
        <p>• <a href="https://fritzing.org/" target="_blank">Fritzing</a></p>
        <p>• <a href="https://learn.adafruit.com/introducing-adafruit-stemma-qt/technical-specs?gad_campaignid=21079267614&gbraid=0AAAAADx9JvRYeeNItDfT3zTLKzO7O0Wyd" target="_blank">Adafruit STEMMA QT</a></p>
        <p>• <a href="https://www.makerspaces.com/how-to-solder/" target="_blank">Soldering Basics</a></p>
      `);
    } else if (state === 1) {
      showNote(`
        <p>• <a href="https://jlcpcb.com/" target="_blank">JLCPCB</a></p>
        <p>• <a href="https://www.pcbway.com/" target="_blank">PCBWay</a></p>
        <p>• <a href="https://www.pcbway.com/blog/Engineering_Technical/Printed_Circuit_Board_Art.html" target="_blank">PCB Art</a></p>
      `);
    } else {
      hideNote();
    }
  } else {
    // Hide note for slides without references
    hideNote();
  }
}

// =============================================================================
// INITIALIZATION & SETUP
// =============================================================================

document.addEventListener("DOMContentLoaded", function () {
  updateProgressBar();

  // Add click handlers to chambers
  chambers.forEach((chamber, index) => {
    chamber.addEventListener("click", () => goToSlide(index));
  });

  // Configure slide states
  setSlideMaxStates(4, 2); // Slide 1.3 (Parts) has 2 states: image view and text view
  setSlideMaxStates(5, 2); // Slide 1.4 (MCU) has 2 states: image collage and description
  setSlideMaxStates(6, 2); // Slide 1.5 (Fabrication) has 2 states: fabrication methods and production
  setSlideMaxStates(11, 3); // Slide 2.1 (Actuator) has 3 states: intro, electromagnetic, photo
  setSlideMaxStates(12, 3); // Slide 2.2 (Sensor) has 3 states: intro, analog, MEMS
  setSlideMaxStates(13, 2); // Slide 2.3 (Biometric) has 2 states: image and list
  setSlideMaxStates(15, 2); // Slide 3.1 (Your Kit) has 2 states: image and form
  setSlideMaxStates(16, 2); // Slide 3.2 (Warm-up) has 2 states: image and form
  setSlideMaxStates(17, 2); // Slide 3.3 (Hard Mode) has 2 states: image and form
  setSlideMaxStates(18, 2); // Slide 3.4 (System Diagram) has 2 states: image and form

  // Restore saved slide position
  if (currentSlide > 0 && currentSlide < slides.length) {
    // Remove active class from first slide and set correct slide as active
    slides[0].classList.remove("active");
    slides[currentSlide].classList.add("active");

    // Handle first slide fade-in if we're on the first slide
    if (currentSlide === 0) {
      setTimeout(() => {
        slides[currentSlide].classList.add("fade-in");
      }, 50);
    }
  }

  // Initialize all multi-state slides to their saved states
  setTimeout(() => {
    initializeSlideStates();
  }, 100);

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

// =============================================================================
// SLIDE STATE MANAGEMENT (SSM)
// =============================================================================

function toggleSlideState() {
  const currentState = slideStates[currentSlide];
  const maxState = maxSlideStates[currentSlide];

  if (maxState <= 1) {
    console.log(`SSM: Slide ${currentSlide} has no additional states`);
    return false;
  }

  // Toggle between states (cycle through all states)
  slideStates[currentSlide] = (currentState + 1) % maxState;

  console.log(
    `SSM: Toggled slide ${currentSlide} to state ${slideStates[currentSlide]}`
  );

  // Save slide states
  localStorage.setItem("htpaac-slide-states", JSON.stringify(slideStates));

  triggerSlideStateChange(currentSlide, slideStates[currentSlide]);

  // Update note for new state
  updateSlideNote(currentSlide, slideStates[currentSlide]);

  return true;
}

// Keep the old function name as alias for compatibility
function advanceSlideState() {
  return toggleSlideState();
}

function resetSlideState(slideIndex) {
  slideStates[slideIndex] = 0;
  console.log(`SSM: Reset slide ${slideIndex} to state 0`);

  // Reset slide content to initial state
  if (slideIndex === 4) {
    // Slide 1.3 (Parts)
    handlePartsSlideState(0);
    updateSlideNote(slideIndex, 0);
  } else if (slideIndex === 5) {
    // Slide 1.4 (MCU)
    handleMCUSlideState(0);
    updateSlideNote(slideIndex, 0);
  } else if (slideIndex === 6) {
    // Slide 1.5 (Fabrication)
    handleFabricationSlideState(0);
  } else if (slideIndex === 11) {
    // Slide 2.1 (Actuator)
    handleActuatorSlideState(0);
  } else if (slideIndex === 12) {
    // Slide 2.2 (Sensor)
    handleSensorSlideState(0);
  } else if (slideIndex === 13) {
    // Slide 2.3 (Biometric)
    handleBiometricSlideState(0);
  } else if (slideIndex === 15) {
    // Slide 3.1 (Your Kit)
    handleKitSlideState(0);
  } else if (slideIndex === 16) {
    // Slide 3.2 (Warm-up)
    handleWarmupSlideState(0);
  } else if (slideIndex === 17) {
    // Slide 3.3 (Hard Mode)
    handleHardModeSlideState(0);
  } else if (slideIndex === 18) {
    // Slide 3.4 (System Diagram)
    handleSystemDiagramSlideState(0);
  }
}

function setSlideMaxStates(slideIndex, maxStates) {
  maxSlideStates[slideIndex] = maxStates;
  console.log(`SSM: Set slide ${slideIndex} max states to ${maxStates}`);
}

function triggerSlideStateChange(slideIndex, newState) {
  // This function will be called when a slide's internal state changes
  // You can add specific logic here for each slide's state transitions
  console.log(
    `SSM: Triggering state change for slide ${slideIndex}, new state: ${newState}`
  );

  // Handle specific slide state changes
  if (slideIndex === 4) {
    // Slide 1.3 (Parts)
    handlePartsSlideState(newState);
  } else if (slideIndex === 5) {
    // Slide 1.4 (MCU)
    handleMCUSlideState(newState);
  } else if (slideIndex === 6) {
    // Slide 1.5 (Fabrication)
    handleFabricationSlideState(newState);
  } else if (slideIndex === 11) {
    // Slide 2.1 (Actuator)
    handleActuatorSlideState(newState);
  } else if (slideIndex === 12) {
    // Slide 2.2 (Sensor)
    handleSensorSlideState(newState);
  } else if (slideIndex === 13) {
    // Slide 2.3 (Biometric)
    handleBiometricSlideState(newState);
  } else if (slideIndex === 15) {
    // Slide 3.1 (Your Kit)
    handleKitSlideState(newState);
  } else if (slideIndex === 16) {
    // Slide 3.2 (Warm-up)
    handleWarmupSlideState(newState);
  } else if (slideIndex === 17) {
    // Slide 3.3 (Hard Mode)
    handleHardModeSlideState(newState);
  } else if (slideIndex === 18) {
    // Slide 3.4 (System Diagram)
    handleSystemDiagramSlideState(newState);
  }

  // Dispatch custom event for external listeners
  const event = new CustomEvent("slideStateChange", {
    detail: { slideIndex, newState, maxStates: maxSlideStates[slideIndex] },
  });
  document.dispatchEvent(event);
}

function handlePartsSlideState(state) {
  const partsSlide = slides[4]; // Slide 1.3 (Parts)
  const contentContainer = partsSlide.querySelector(".slide-content");

  if (!contentContainer) return;

  if (state === 0) {
    // State 1: Show "Parts" title and big image
    contentContainer.innerHTML = `
      ${wrapTitleWithStateIndicators("Parts", 0, 2)}
      <img src="https://www.ultralibrarian.com/wp-content/uploads/2022/06/shutterstock_7865275181.jpg" 
           alt="Electronic Components" 
           class="centered-image" 
           style="max-width: 80%; height: auto; margin: 40px auto 0 auto; display: block; border-radius: 10px; box-shadow: 0 10px 30px rgba(255, 255, 255, 0.1);" 
           onerror="this.src='https://via.placeholder.com/800x600/333/fff?text=Electronic+Components'">
    `;
  } else if (state === 1) {
    // State 2: Show 2x2 named matrix of two-image units
    contentContainer.innerHTML = `
      ${wrapTitleWithStateIndicators("and Modules", 1, 2)}
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); gap: 15px 10px; margin-top: 30px; max-width: 1200px; margin-left: auto; margin-right: auto;">
        <div style="text-align: center;">
          <h3 style="color: #FF1493; margin-bottom: 12px; font-size: 1.6em;">Evaluation Board</h3>
          <div style="display: flex; gap: 3px; justify-content: center;">
            <img src="img/Eval.jpg" alt="Evaluation Board" style="height: 200px; width: auto; object-fit: contain; border-radius: 12px; box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2);" onerror="this.src='https://via.placeholder.com/260x200/333/fff?text=Eval+Board'">
            <img src="img/Eval.gif" alt="Evaluation Board Demo" style="height: 200px; width: auto; object-fit: contain; border-radius: 12px; box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2);" onerror="this.src='https://via.placeholder.com/260x200/333/fff?text=Eval+Demo'">
          </div>
        </div>
        <div style="text-align: center;">
          <h3 style="color: #FF1493; margin-bottom: 12px; font-size: 1.6em;">Connector</h3>
          <div style="display: flex; gap: 3px; justify-content: center;">
            <img src="img/connector.jpg" alt="Connector" style="height: 200px; width: auto; object-fit: contain; border-radius: 12px; box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2);" onerror="this.src='https://via.placeholder.com/260x200/333/fff?text=Connector'">
            <img src="img/otherConn.jpg" alt="Other Connector" style="height: 200px; width: auto; object-fit: contain; border-radius: 12px; box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2);" onerror="this.src='https://via.placeholder.com/260x200/333/fff?text=Other+Connector'">
          </div>
        </div>
        <div style="text-align: center;">
          <h3 style="color: #FF1493; margin-bottom: 12px; font-size: 1.6em;">Power</h3>
          <div style="display: flex; gap: 3px; justify-content: center;">
            <img src="img/Pwr1.jpg" alt="Power Module 1" style="height: 200px; width: auto; object-fit: contain; border-radius: 12px; box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2);" onerror="this.src='https://via.placeholder.com/260x200/333/fff?text=Pwr1'">
            <img src="img/Pwr2.webp" alt="Power Module 2" style="height: 200px; width: auto; object-fit: contain; border-radius: 12px; box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2);" onerror="this.src='https://via.placeholder.com/260x200/333/fff?text=Pwr2'">
          </div>
        </div>
        <div style="text-align: center;">
          <h3 style="color: #FF1493; margin-bottom: 12px; font-size: 1.6em;">Actuator</h3>
          <div style="display: flex; gap: 3px; justify-content: center;">
            <img src="img/act1.jpg" alt="Actuator 1" style="height: 200px; width: auto; object-fit: contain; border-radius: 12px; box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2);" onerror="this.src='https://via.placeholder.com/260x200/333/fff?text=Act1'">
            <a href="https://www.youtube.com/watch?v=tgTY2wmgIA4" target="_blank" style="display: inline-block; text-decoration: none;">
              <img src="img/act4.webp" alt="Actuator 4" style="height: 200px; width: auto; object-fit: contain; border-radius: 12px; box-shadow: 0 6px 20px rgba(255, 255, 255, 0.2); cursor: pointer; transition: transform 0.2s ease;" onerror="this.src='https://via.placeholder.com/260x200/333/fff?text=Act4'" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            </a>
          </div>
        </div>
      </div>
    `;
  }
}

// Initialize all slide states from saved data
function initializeSlideStates() {
  console.log("Initializing slide states:", slideStates);

  // Initialize Parts slide (index 3)
  handlePartsSlideState(slideStates[3] || 0);

  // Initialize MCU slide (index 5)
  handleMCUSlideState(slideStates[5] || 0);

  // Initialize Actuator slide (index 11)
  handleActuatorSlideState(slideStates[11] || 0);

  // Initialize Sensor slide (index 12)
  handleSensorSlideState(slideStates[12] || 0);

  // Initialize Biometric slide (index 13)
  handleBiometricSlideState(slideStates[13] || 0);

  // Initialize Fabrication slide (index 6)
  handleFabricationSlideState(slideStates[6] || 0);

  // Initialize Kit slide (index 15)
  handleKitSlideState(slideStates[15] || 0);

  // Initialize new Part 3 slides
  handleWarmupSlideState(slideStates[16] || 0);
  handleHardModeSlideState(slideStates[17] || 0);
  handleSystemDiagramSlideState(slideStates[18] || 0);
}

// Additional slide state handlers
function handleFabricationSlideState(state) {
  const fabricationSlide = slides[6]; // Slide 1.5 (Fabrication)
  const contentContainer = fabricationSlide.querySelector(".slide-content");

  if (!contentContainer) return;

  if (state === 0) {
    // State 1: Show fabrication methods
    contentContainer.innerHTML = `
      ${wrapTitleWithStateIndicators("Fabrication", 0, 2)}
      <div style="margin-top: 40px; position: relative; max-width: 1000px; margin-left: auto; margin-right: auto;">
        <!-- Difficulty arrow indicator -->
        <div style="position: absolute; left: -80px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; align-items: center;">
          <div style="color: #4CAF50; font-size: 1.1em; font-weight: bold; margin-bottom: 20px;">Easy</div>
          <!-- Arrow shaft spanning full list height -->
          <div style="position: relative; width: 4px; height: 320px; background: linear-gradient(180deg, #4CAF50 0%, #8BC34A 25%, #FF9800 50%, #f44336 75%, #D32F2F 100%); border-radius: 2px;">
            <!-- Arrow head -->
            <div style="position: absolute; bottom: -15px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 12px solid transparent; border-right: 12px solid transparent; border-top: 20px solid #f44336;"></div>
          </div>
          <div style="color: #f44336; font-size: 1.1em; font-weight: bold; margin-top: 20px;">Hard</div>
        </div>
        
        <!-- Prototyping methods text content -->
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; max-width: 800px; margin-left: auto; margin-right: auto;">
          <div style="background: rgba(76, 175, 80, 0.1); border-left: 4px solid #4CAF50; padding: 8px 25px; border-radius: 8px;">
            <h3 style="color: #4CAF50; font-size: 1.3em; margin-bottom: 6px; text-align: left;">1. Connectors</h3>
            <p style="color: #ddd; font-size: 1em; line-height: 1.3; text-align: left; margin: 0;">
              Plug-and-play modules with standard connectors. No soldering required. Perfect for quick concept validation and system testing.
              </p>
            </div>
          <div style="background: rgba(76, 175, 80, 0.08); border-left: 4px solid #8BC34A; padding: 8px 25px; border-radius: 8px;">
            <h3 style="color: #8BC34A; font-size: 1.3em; margin-bottom: 6px; text-align: left;">2. Breadboards</h3>
            <p style="color: #ddd; font-size: 1em; line-height: 1.3; text-align: left; margin: 0;">
              Solderless prototyping with jumper wires. Rapid iteration and circuit testing. Great for learning and experimenting.
              </p>
            </div>
          <div style="background: rgba(255, 152, 0, 0.1); border-left: 4px solid #FF9800; padding: 8px 25px; border-radius: 8px;">
            <h3 style="color: #FF9800; font-size: 1.3em; margin-bottom: 6px; text-align: left;">3. Proto & Perf Boards</h3>
            <p style="color: #ddd; font-size: 1em; line-height: 1.3; text-align: left; margin: 0;">
              Perforated boards for permanent prototypes. Proto boards have some traces, perf boards are blank. Requires soldering skills.
              </p>
            </div>
          
          <!-- First three images after perf board text -->
          <div class="image-group-wrapper" style="display: flex; gap: 15px; justify-content: center; align-items: flex-end;">
            <img src="img/connector.jpg" alt="Connector" style="height: 180px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/180x180/333/fff?text=Connector'">
            <img src="img/breadboard.jpeg" alt="Breadboard" style="height: 180px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/180x180/333/fff?text=Breadboard'">
            <img src="img/perf.webp" alt="Perf Board" style="height: 180px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/180x180/333/fff?text=Perf+Board'">
            </div>
          
          <!-- Mystery section with inline images -->
          <div style="display: flex; align-items: stretch; gap: 20px;">
            <div style="flex: 1; background: rgba(244, 67, 54, 0.15); border-left: 4px solid #f44336; padding: 12px 25px; border-radius: 8px; box-shadow: 0 0 15px rgba(244, 67, 54, 0.3);">
              <h3 style="color: #f44336; font-size: 1.3em; margin-bottom: 8px; text-align: left;">4. ?????</h3>
              <p style="color: #ddd; font-size: 1em; line-height: 1.4; text-align: left; margin: 0;">
                Something cool and mysterious... 🔥
              </p>
            </div>
            <div style="display: flex; gap: 15px; align-items: center;">
              <img src="img/%3F%3F%3F.jpg" alt="Mystery 1" style="height: 140px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 0 15px rgba(244, 67, 54, 0.5);" onerror="this.src='https://via.placeholder.com/140x140/333/fff?text=Mystery+1'">
              <img src="img/%3F%3F%3F%3F%3F.jpg" alt="Mystery 2" style="height: 140px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 0 15px rgba(244, 67, 54, 0.5);" onerror="this.src='https://via.placeholder.com/140x140/333/fff?text=Mystery+2'">
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (state === 1) {
    // State 2: Show production/PCB design knowledge
    contentContainer.innerHTML = `
      ${wrapTitleWithStateIndicators("Production", 1, 2)}
      <div style="margin-top: 30px; max-width: 1200px; margin-left: auto; margin-right: auto;">
        
        <!-- 2x2 Matrix Layout -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; gap: 20px;">
          
          <!-- Top Left: EDA Tools Image -->
          <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; display: flex; align-items: center; justify-content: center; min-height: 290px;">
            <img src="img/EDAhard.png" alt="EDA Tools" 
                 style="width: 90%; height: auto; max-height: 250px; border-radius: 12px; box-shadow: 0 10px 30px rgba(255, 255, 255, 0.1); cursor: pointer;" 
                 onclick="this.src = this.src.includes('EDAhard.png') ? 'img/EDAeasy.jpg' : 'img/EDAhard.png'"
                 onerror="this.src='https://via.placeholder.com/400x250/333/fff?text=EDA+Tools'">
          </div>
          
          <!-- Top Right: EDA Tool Cards -->
          <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px 20px 0 20px; display: flex; flex-direction: column; justify-content: center; min-height: 290px;">
            <!-- Three EDA tool cards -->
            <div style="display: flex; flex-direction: column; gap: 0;">
              <div style="background: rgba(255, 193, 7, 0.1); border-left: 4px solid #FFC107; padding: 12px; border-radius: 8px; text-align: left; display: flex; align-items: center; gap: 15px;">
                <div style="flex: 1;">
                  <h3 style="color: #FFC107; font-size: 1.2em; margin-bottom: 6px;">Eagle</h3>
                  <p style="color: #ddd; font-size: 1em; line-height: 1.3;">Included in Fusion 360. Great 3D/CAD compatibility. Easy to use interface.</p>
                </div>
                <img src="img/eagle.jpeg" alt="Eagle" style="width: 80px; height: 60px; object-fit: contain; border-radius: 4px; flex-shrink: 0; box-shadow: none !important;" onerror="this.src='https://via.placeholder.com/80x60/FFC107/fff?text=Eagle'">
              </div>
              <div style="background: rgba(255, 152, 0, 0.1); border-left: 4px solid #FF9800; padding: 12px; border-radius: 8px; text-align: left; display: flex; align-items: center; gap: 15px;">
                <div style="flex: 1;">
                  <h3 style="color: #FF9800; font-size: 1.2em; margin-bottom: 6px;">EasyEDA</h3>
                  <p style="color: #ddd; font-size: 1em; line-height: 1.3;">Developed by JLCPCB. Convenient library access and direct Gerber file submission to JLC for fabrication.</p>
                </div>
                <img src="img/EasyEDA.jpg" alt="EasyEDA" style="width: 80px; height: 60px; object-fit: contain; border-radius: 4px; flex-shrink: 0; box-shadow: none !important;" onerror="this.src='https://via.placeholder.com/80x60/FF9800/fff?text=EasyEDA'">
              </div>
              <div style="background: rgba(76, 175, 80, 0.1); border-left: 4px solid #4CAF50; padding: 12px; border-radius: 8px; text-align: left; display: flex; align-items: center; gap: 15px;">
                <div style="flex: 1;">
                  <h3 style="color: #4CAF50; font-size: 1.2em; margin-bottom: 6px;">Altium Designer</h3>
                  <p style="color: #ddd; font-size: 1em; line-height: 1.3;">Very advanced professional tool. Used to design very complicated circuits and systems.</p>
                </div>
                <img src="img/altium.jpg" alt="Altium" style="width: 80px; height: 60px; object-fit: contain; border-radius: 4px; flex-shrink: 0; box-shadow: none !important;" onerror="this.src='https://via.placeholder.com/80x60/4CAF50/fff?text=Altium'">
              </div>
            </div>
          </div>

          <!-- Bottom Left: Production Video -->
          <div style="background: rgba(0, 0, 0, 0.3); border-radius: 12px; padding: 15px; min-height: 180px;">
            <iframe src="https://www.youtube.com/embed/ljOoGyCso8s" 
                    style="width: 100%; height: 100%; border: none; border-radius: 8px;" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
            </iframe>
          </div>
          
          <!-- Bottom Right: PCB Image -->
          <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 290px;">
            <img src="img/pcb.png" alt="PCB Production" 
                 style="width: 90%; height: auto; max-height: 250px; object-fit: contain; border-radius: 10px; box-shadow: 0 8px 25px rgba(255, 255, 255, 0.1);" 
                 onerror="this.src='https://via.placeholder.com/300x250/333/fff?text=PCB+Production'">
          </div>
        </div>

      </div>
    `;
  }
}
function handleMCUSlideState(state) {
  const mcuSlide = slides[5]; // Slide 1.4 (MCU)
  const contentContainer = mcuSlide.querySelector(".slide-content");

  if (!contentContainer) return;

  if (state === 0) {
    // State 1: image collage with text on top
    contentContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px;">
        ${wrapTitleWithStateIndicators("MCU", 0, 2)}
        <div style="text-align: center; margin-bottom: 20px; width: 90%;">
          <p style="color: #ddd; font-size: 1.2em; margin-bottom: 15px; font-style: italic;">
            Integrated circuit with CPU, memory, and I/O peripherals on a single chip
          </p>
          <p style="color: #fff; font-size: 1.4em; background: rgba(255, 20, 147, 0.6); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border: 1px solid rgba(255, 20, 147, 0.7); padding: 15px 30px; border-radius: 12px; margin: 0; box-shadow: 0 8px 32px rgba(255, 20, 147, 0.4);">
            "Arduino" or "microcontroller" = MCU Chip + Development Board + Peripherals
          </p>
        </div>
        <img src="img/MCU.jpg" alt="MCU Collage" class="centered-image" 
             style="max-width: 80%; height: auto; border-radius: 10px; box-shadow: 0 10px 30px rgba(255, 255, 255, 0.1);" 
             onerror="this.src='https://via.placeholder.com/800x500/333/fff?text=MCU+Collage'">
      </div>
    `;
  } else if (state === 1) {
    // State 2: selection - cut in half with MCUs top and Dev boards bottom
    contentContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px;">
        ${wrapTitleWithStateIndicators("MCU", 1, 2)}
        <div style="max-width: 100vw; width: 100%; padding: 0 5vw;">
          <!-- Container without background -->
          <div style="display: flex; gap: 20px;">
            <!-- Left side: MCU Chips -->
            <div style="flex: 0.7; text-align: left; background: rgba(255, 20, 147, 0.1); border-radius: 10px; padding: 20px;">
              <h3 style="color: #FF1493; margin-bottom: 20px; font-size: 1.5em;">MCU Chips</h3>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
                <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 10px;">
                  <h4 style="color: #FF1493; font-size: 1.2em; margin-bottom: 8px;">ARM Cortex-M</h4>
                  <p style="color: #4CAF50; font-size: 0.9em; margin-bottom: 5px;">✓ Industry standard</p>
                  <p style="color: #4CAF50; font-size: 0.9em; margin-bottom: 5px;">✓ Excellent tools</p>
                  <p style="color: #4CAF50; font-size: 0.9em; margin-bottom: 8px;">✓ Wide ecosystem</p>
                  <p style="color: #f44336; font-size: 0.9em; margin-bottom: 4px;">✗ Complex setup</p>
                  <p style="color: #f44336; font-size: 0.9em;">✗ Higher cost</p>
                </div>
                <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 10px;">
                  <h4 style="color: #FF1493; font-size: 1.2em; margin-bottom: 8px;">ESP32/ESP8266</h4>
                  <p style="color: #4CAF50; font-size: 0.9em; margin-bottom: 5px;">✓ Built-in Wi-Fi/BT</p>
                  <p style="color: #4CAF50; font-size: 0.9em; margin-bottom: 5px;">✓ Low cost</p>
                  <p style="color: #4CAF50; font-size: 0.9em; margin-bottom: 8px;">✓ Easy to use</p>
                  <p style="color: #f44336; font-size: 0.9em; margin-bottom: 4px;">✗ Power hungry</p>
                  <p style="color: #f44336; font-size: 0.9em;">✗ Limited I/O</p>
                </div>
                <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 10px;">
                  <h4 style="color: #FF1493; font-size: 1.2em; margin-bottom: 8px;">RISC-V</h4>
                  <p style="color: #4CAF50; font-size: 0.9em; margin-bottom: 5px;">✓ Open source</p>
                  <p style="color: #4CAF50; font-size: 0.9em; margin-bottom: 5px;">✓ Future-proof</p>
                  <p style="color: #4CAF50; font-size: 0.9em; margin-bottom: 8px;">✓ Customizable</p>
                  <p style="color: #f44336; font-size: 0.9em; margin-bottom: 4px;">✗ Limited tools</p>
                  <p style="color: #f44336; font-size: 0.9em;">✗ Smaller ecosystem</p>
                </div>
                <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 10px;">
                  <h4 style="color: #FF1493; font-size: 1.2em; margin-bottom: 8px;">AVR</h4>
                  <p style="color: #4CAF50; font-size: 0.9em; margin-bottom: 5px;">✓ Simple & reliable</p>
                  <p style="color: #4CAF50; font-size: 0.9em; margin-bottom: 5px;">✓ Arduino compatible</p>
                  <p style="color: #4CAF50; font-size: 0.9em; margin-bottom: 8px;">✓ Low power</p>
                  <p style="color: #f44336; font-size: 0.9em; margin-bottom: 4px;">✗ Limited performance</p>
                  <p style="color: #f44336; font-size: 0.9em;">✗ 8-bit architecture</p>
                </div>
              </div>
            </div>
            
            <!-- Right side: Development Boards -->
            <div style="flex: 2; text-align: left; display: flex; align-items: center;">
              <div style="width: 100%; margin: auto; border: 1px solid rgba(255, 20, 147, 0.3); border-radius: 8px; padding: 15px;">
                <h3 style="color: #FF1493; margin-bottom: 20px; font-size: 1.5em;">Development Boards</h3>
                <div style="display: grid; grid-template-columns: 1fr; grid-template-rows: auto auto; gap: 15px;">
                  <!-- Top row: Seeed Studio Xiao with left text and right images -->
                  <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 15px; min-height: 280px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: center; height: 100%;">
                      <!-- Left: Text -->
                      <div style="padding: 12px;">
                        <h4 style="color: #FF1493; font-size: 1.4em; margin-bottom: 10px;">Seeed Studio Xiao</h4>
                        <p style="color: #ddd; font-size: 1.1em; line-height: 1.4; margin-bottom: 8px;">
                          • Xiǎo 小, small!
                        </p>
                       <p style="color: #ddd; font-size: 1.1em; line-height: 1.4; margin-bottom: 8px;">
                          • Various MCU choices
                        </p>
                        <p style="color: #ddd; font-size: 1.1em; line-height: 1.4;">
                          • Researcher's favorite
                        </p>
                      </div>
                      <!-- Right: Images with overlaid citations -->
                      <div style="display: flex; justify-content: center; align-items: stretch; height: 250px; margin: 0; padding: 0; border: none;">
                        <div style="position: relative; margin-right: 2px; width: 180px; height: 100%; border: none; padding: 0;">
                          <img src="img/Retnanto et al., 2024.jpg" alt="Retnanto et al., 2024" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; display: block; margin: 0; padding: 0; border: none;" onerror="this.src='https://via.placeholder.com/180x250/333/fff?text=Retnanto+2024'">
                          <div style="position: absolute; bottom: 8px; left: 8px; right: 8px; background: linear-gradient(45deg, rgba(0,0,0,0.9), rgba(0,0,0,0.7)); color: #fff; font-size: 0.6em; padding: 6px 10px; border-radius: 4px; margin: 0; text-align: center;">Retnanto et al., 2024</div>
                        </div>
                        <div style="position: relative; margin: 0 2px; width: 180px; height: 100%; border: none; padding: 0;">
                          <img src="img/Brooks et al., 2024.png" alt="Brooks et al., 2024" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; display: block; margin: 0; padding: 0; border: none;" onerror="this.src='https://via.placeholder.com/180x250/333/fff?text=Brooks+2024'">
                          <div style="position: absolute; bottom: 8px; left: 8px; right: 8px; background: linear-gradient(45deg, rgba(0,0,0,0.9), rgba(0,0,0,0.7)); color: #fff; font-size: 0.6em; padding: 6px 10px; border-radius: 4px; margin: 0; text-align: center;">Brooks et al., 2024</div>
                        </div>
                        <div style="position: relative; margin-left: 2px; width: 180px; height: 100%; border: none; padding: 0;">
                          <img src="img/Kong et al., 2024.png" alt="Kong et al., 2024" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; display: block; margin: 0; padding: 0; border: none;" onerror="this.src='https://via.placeholder.com/180x250/333/fff?text=Kong+2024'">
                          <div style="position: absolute; bottom: 8px; left: 8px; right: 8px; background: linear-gradient(45deg, rgba(0,0,0,0.9), rgba(0,0,0,0.7)); color: #fff; font-size: 0.6em; padding: 6px 10px; border-radius: 4px; margin: 0; text-align: center;">Kong et al., 2024</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- Bottom row: two items -->
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px;">
                      <!-- Thin line of text on top, left-aligned -->
                      <h4 style="color: #FF1493; font-size: 1.4em; font-weight: bold; line-height: 1; margin: 0 0 8px 0; padding: 0; text-align: left;">
                        Teensy & High Performance
                      </h4>
                      <!-- Image left-aligned and properly wrapped -->
                      <div style="position: relative; display: inline-block; margin: 0; padding: 0;">
                        <img src="img/DeVrio & Harrison., 2025.jpg" alt="Teensy" style="max-width: 100%; height: auto; object-fit: contain; border-radius: 8px; display: block; margin: 0; padding: 0;" onerror="this.src='https://via.placeholder.com/250x160/333/fff?text=Teensy'">
                        <div style="position: absolute; bottom: 8px; left: 8px; right: 8px; background: linear-gradient(45deg, rgba(0,0,0,0.9), rgba(0,0,0,0.7)); color: #fff; font-size: 0.6em; padding: 6px 10px; border-radius: 4px; margin: 0; text-align: center;">DeVrio & Harrison., 2025</div>
                      </div>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.05); border-radius: 8px; padding: 12px;">
                      <!-- Thin line of text on top, left-aligned -->
                      <h4 style="color: #FF1493; font-size: 1.4em; font-weight: bold; line-height: 1; margin: 0 0 8px 0; padding: 0; text-align: left;">
                        Specialty Boards
                      </h4>
                      <!-- Image left-aligned and properly wrapped -->
                      <div style="position: relative; display: inline-block; margin: 0; padding: 0;">
                        <img src="img/lilypad.png" alt="Lilypad" style="max-width: 100%; height: auto; object-fit: contain; border-radius: 8px; display: block; margin: 0; padding: 0;" onerror="this.src='https://via.placeholder.com/250x160/333/fff?text=Lilypad'">
                        <div style="position: absolute; bottom: 8px; left: 8px; right: 8px; background: linear-gradient(45deg, rgba(0,0,0,0.9), rgba(0,0,0,0.7)); color: #fff; font-size: 0.6em; padding: 6px 10px; border-radius: 4px; margin: 0; text-align: center;">Lilypad Arduino</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

function handleSensorSlideState(state) {
  console.log(`Handling SENSOR slide state: ${state}`);
  const sensorSlide = slides[12]; // Slide 2.2 (Sensor)
  const contentContainer = sensorSlide.querySelector(".slide-content");

  if (!contentContainer) {
    console.error("Sensor slide content container not found");
    return;
  }

  if (state === 0) {
    // State 0: Sensor Introduction
    contentContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px;">
        ${wrapTitleWithStateIndicators("Sensor", 0, 3)}
        <div style="text-align: center; max-width: 1200px;">
          <p style="color: #ddd; font-size: 1.6em; line-height: 1.5; margin-bottom: 40px;">
            Input devices that convert physical phenomena into electrical signals
          </p>
          <div style="display: flex; justify-content: center; gap: 40px; margin-top: 15px;">
            <div style="text-align: left;">
              <div style="color: #FF1493; font-size: 1.2em; margin-bottom: 8px;">• Environmental</div>
              <div style="color: #FF1493; font-size: 1.2em; margin-bottom: 8px;">• Thin-Film</div>
              <div style="color: #FF1493; font-size: 1.2em; margin-bottom: 8px;">• MEMS</div>
              <div style="color: #FF1493; font-size: 1.2em; margin-bottom: 8px;">• Biometric</div>
          </div>
            <div style="text-align: left;">
              <div style="color: #888; font-size: 1.1em; margin-bottom: 8px;">• LiDAR sensors</div>
              <div style="color: #888; font-size: 1.1em; margin-bottom: 8px;">• Ultrasonic sensors</div>
              <div style="color: #888; font-size: 1.1em; margin-bottom: 8px;">• Hall effect sensors</div>
              <div style="color: #888; font-size: 1.1em; margin-bottom: 8px;">• Capacitive touch sensors</div>
          </div>
        </div>
        </div>
      </div>
    `;
  } else if (state === 1) {
    // State 1: Analog Sensors
    contentContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px;">
        ${wrapTitleWithStateIndicators("Analog Sensors", 1, 3)}
        <div style="text-align: center; margin: 20px 0;">
          <p style="color: #ddd; font-size: 1.2em;">basically family of weird resistors</p>
          <div style="margin-top: 30px; max-width: 1200px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; text-align: left;">
              <div style="background: rgba(255, 20, 147, 0.1); border-left: 4px solid #FF1493; padding: 25px; border-radius: 10px;">
                <h4 style="color: #FF1493; font-size: 1.4em; margin-bottom: 15px;">Environmental</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div style="color: #ddd; font-size: 1.1em; line-height: 1.5;">
                    <div style="margin-bottom: 8px;">• Thermistor</div>
                    <div style="margin-bottom: 8px;">• Photocell</div>
          </div>
                  <div style="color: #ddd; font-size: 1.1em; line-height: 1.5;">
                    <div style="margin-bottom: 8px;">• Chemresistor</div>
                    <div style="margin-bottom: 8px;">• Gas Sensors</div>
        </div>
          </div>
          </div>
              <div style="background: rgba(255, 20, 147, 0.1); border-left: 4px solid #FF1493; padding: 25px; border-radius: 10px;">
                <h4 style="color: #FF1493; font-size: 1.4em; margin-bottom: 15px;">Thin-Film</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div style="color: #ddd; font-size: 1.1em; line-height: 1.5;">
                    <div style="margin-bottom: 8px;">• FSR (Force)</div>
                    <div style="margin-bottom: 8px;">• Strain Gauge</div>
                    <div style="margin-bottom: 8px;">• Soft Potentiometer</div>
        </div>
                  <div style="color: #ddd; font-size: 1.1em; line-height: 1.5;">
                    <div style="margin-bottom: 8px;">• Soft Piezo</div>
                    <div style="margin-bottom: 8px; font-style: italic; color: #FF1493;">• and more</div>
      </div>
        </div>
          </div>
        </div>
          </div>
        </div>
        <div class="image-group-wrapper" style="display: flex; gap: 20px; margin-top: 30px; justify-content: center; align-items: flex-end;">
          <img src="img/R1.jpeg" alt="R1" style="height: 200px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/200x200/333/fff?text=R1'">
          <img src="img/R2.jpg" alt="R2" style="height: 200px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/200x200/333/fff?text=R2'">
          <img src="img/Film1.jpg" alt="Film1" style="height: 200px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/200x200/333/fff?text=Film1'">
          <img src="img/Film2.png" alt="Film2" style="height: 200px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/200x200/333/fff?text=Film2'">
        </div>
      </div>
    `;
  } else if (state === 2) {
    // State 2: MEMS Sensors
    contentContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px;">
        ${wrapTitleWithStateIndicators("MEMS Sensors", 2, 3)}
        <div style="text-align: center; margin: 20px 0;">
          <p style="color: #ddd; font-size: 1.2em;">Micro-Electro-Mechanical Systems</p>
          <div style="margin-top: 30px; max-width: 1200px;">
            <div style="background: rgba(255, 20, 147, 0.1); border-left: 4px solid #FF1493; padding: 30px; border-radius: 10px; text-align: left;">
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                <div style="color: #ddd; font-size: 1.2em; line-height: 1.5;">
                  <div style="margin-bottom: 10px;">• IMU (Inertia Measuring Unit)</div>
                  <div style="margin-bottom: 10px;">• Microphone</div>
          </div>
                <div style="color: #ddd; font-size: 1.2em; line-height: 1.5;">
                  <div style="margin-bottom: 10px;">• Magnetometers</div>
                  <div style="margin-bottom: 10px;">• Barometric</div>
          </div>
                <div style="color: #ddd; font-size: 1.2em; line-height: 1.5;">
                  <div style="margin-bottom: 10px;">• Pressure</div>
                  <div style="margin-bottom: 10px; font-weight: bold; color: #FF1493;">• and many more</div>
        </div>
          </div>
        </div>
          </div>
          </div>
        <div class="image-group-wrapper" style="display: flex; gap: 20px; margin-top: 30px; justify-content: center; align-items: flex-end;">
          <img src="img/MEMS0.jpg" alt="MEMS0" style="height: 200px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/200x200/333/fff?text=MEMS0'">
          <img src="img/MEMS1.webp" alt="MEMS1" style="height: 200px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/200x200/333/fff?text=MEMS1'">
          <img src="img/MEMS2.jpg" alt="MEMS2" style="height: 200px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/200x200/333/fff?text=MEMS2'">
          <img src="img/MEMS3.png" alt="MEMS3" style="height: 200px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/200x200/333/fff?text=MEMS3'">
        </div>
      </div>
    `;
  }
}

function handleActuatorSlideState(state) {
  console.log(`Handling ACTUATOR slide state: ${state}`);
  const actuatorSlide = slides[11]; // Slide 2.1 (Actuator)
  const contentContainer = actuatorSlide.querySelector(".slide-content");

  if (!contentContainer) {
    console.error("Actuator slide content container not found");
    return;
  }

  if (state === 0) {
    // State 0: Actuator Introduction
    contentContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px;">
        ${wrapTitleWithStateIndicators("Actuator", 0, 3)}
        <div style="text-align: center; max-width: 1200px;">
          <p style="color: #ddd; font-size: 1.6em; line-height: 1.5; margin-bottom: 40px;">
            Output devices that convert electrical signals into physical actions
          </p>
          <div style="display: flex; justify-content: center; gap: 40px; margin-top: 15px;">
            <div style="text-align: left;">
              <div style="color: #FF1493; font-size: 1.2em; margin-bottom: 8px;">• Motors</div>
              <div style="color: #FF1493; font-size: 1.2em; margin-bottom: 8px;">• Electromagnets</div>
              <div style="color: #4CAF50; font-size: 1.2em; margin-bottom: 8px;">• Servo Motor</div>
              <div style="color: #4CAF50; font-size: 1.2em; margin-bottom: 8px;">• Linear Motor</div>
          </div>
            <div style="text-align: left;">
              <div style="color: #888; font-size: 1.1em; margin-bottom: 8px;">• Pneumatic actuators</div>
              <div style="color: #888; font-size: 1.1em; margin-bottom: 8px;">• Hydraulic systems</div>
              <div style="color: #888; font-size: 1.1em; margin-bottom: 8px;">• Thermal actuators</div>
              <div style="color: #888; font-size: 1.1em; margin-bottom: 8px;">• Piezoelectric actuators</div>
              <div style="color: #888; font-size: 1.1em; margin-bottom: 8px;">• Shape-changing material</div>
          </div>
          </div>
        </div>
      </div>
    `;
  } else if (state === 1) {
    // State 1: Electromagnetic Actuators
    contentContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px;">
        ${wrapTitleWithStateIndicators("Electromagnetic Actuators", 1, 3)}
        <div style="text-align: center; margin: 20px 0;">
          <p style="color: #ddd; font-size: 1.2em;">move and actuate</p>
          <div style="margin-top: 30px; max-width: 900px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr 0.8fr; gap: 20px; text-align: left;">
              <!-- Pink blocks (horizontal) -->
              <div style="background: rgba(255, 20, 147, 0.1); border-left: 4px solid #FF1493; padding: 25px; border-radius: 10px;">
                <h4 style="color: #FF1493; font-size: 1.4em; margin-bottom: 15px;">Motors</h4>
                <div style="color: #ddd; font-size: 1.1em; line-height: 1.5;">
                  <div style="margin-bottom: 8px;">• AC motors</div>
                  <div style="margin-bottom: 8px;">• Brushed DC motors</div>
                  <div style="margin-bottom: 8px;">• BLDC motors</div>
                  <div style="margin-bottom: 8px;">• Linear motors</div>
          </div>
          </div>
              <div style="background: rgba(255, 20, 147, 0.1); border-left: 4px solid #FF1493; padding: 25px; border-radius: 10px;">
                <h4 style="color: #FF1493; font-size: 1.4em; margin-bottom: 15px;">Electromagnets</h4>
                <div style="color: #ddd; font-size: 1.1em; line-height: 1.5;">
                  <div style="margin-bottom: 8px;">• Push/Pull Solenoids</div>
                  <div style="margin-bottom: 8px;">• Relay Coils</div>
                  <div style="margin-bottom: 8px;">* PCB magnets</div>
        </div>
          </div>
              <!-- Green block (single) -->
              <div style="background: rgba(76, 175, 80, 0.1); border-left: 4px solid #4CAF50; padding: 12px 20px; border-radius: 10px;">
                <h4 style="color: #4CAF50; font-size: 1.2em; margin-bottom: 8px;">Servo Motor</h4>
                <div style="color: #ddd; font-size: 0.6em; line-height: 1.2;">
                  <p style="margin: 0;">A servo motor is not just a motor, but a complete system that combines a motor with an encoder to provide feedback for precise position control.</p>
        </div>
          </div>
          </div>
          </div>
        </div>
        <div class="image-group-wrapper" style="display: flex; gap: 20px; margin-top: 30px; justify-content: center; align-items: flex-end;">
          <img src="img/act1.jpg" alt="Act1" style="height: 280px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/280x280/333/fff?text=Act1'">
          <img src="img/act2.gif" alt="Act2" style="height: 280px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/280x280/333/fff?text=Act2'">
          <img src="img/act3.gif" alt="Act3" style="height: 280px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/280x280/333/fff?text=Act3'">
          <a href="https://www.youtube.com/watch?v=tgTY2wmgIA4" target="_blank" style="display: inline-block; text-decoration: none;">
            <img src="img/act4.webp" alt="Act4" style="height: 280px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1); cursor: pointer; transition: transform 0.2s ease;" onerror="this.src='https://via.placeholder.com/280x280/333/fff?text=Act4'" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          </a>
        </div>
      </div>
    `;
  } else if (state === 2) {
    // State 2: Photo Actuators
    contentContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px;">
        ${wrapTitleWithStateIndicators("Photo-Actuators", 2, 3)}
        <div style="text-align: center; margin: 20px 0;">
          <p style="color: #ddd; font-size: 1.2em;">show and display</p>
          <div style="margin-top: 30px; max-width: 1200px;">
            <div style="background: rgba(255, 20, 147, 0.1); border-left: 4px solid #FF1493; padding: 30px; border-radius: 10px; text-align: left;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                <div style="color: #ddd; font-size: 1.2em; line-height: 1.5;">
                  <div style="margin-bottom: 10px;">• LED Arrays</div>
                  <div style="margin-bottom: 10px;">• OLED Displays</div>
          </div>
                <div style="color: #ddd; font-size: 1.2em; line-height: 1.5;">
                  <div style="margin-bottom: 10px;">• LCD Screens</div>
                  <div style="margin-bottom: 10px;">• E-Paper Displays</div>
          </div>
        </div>
          </div>
        </div>
          </div>
        <div class="image-group-wrapper" style="display: flex; gap: 20px; margin-top: 30px; justify-content: center; align-items: flex-end;">
          <img src="img/Photo1.gif" alt="Photo1" style="height: 200px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/200x200/333/fff?text=Photo1'">
          <img src="img/Photo2.gif" alt="Photo2" style="height: 200px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/200x200/333/fff?text=Photo2'">
          <img src="img/Photo3.gif" alt="Photo3" style="height: 200px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/200x200/333/fff?text=Photo3'">
          <img src="img/Photo4.jpg" alt="Photo4" style="height: 200px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/200x200/333/fff?text=Photo4'">
        </div>
      </div>
    `;
  }
}

function handleBiometricSlideState(state) {
  console.log(`Handling BIOMETRIC slide state: ${state}`);
  const biometricSlide = slides[13]; // Slide 2.3 (Biometric)
  const contentContainer = biometricSlide.querySelector(".slide-content");

  if (!contentContainer) {
    console.error("Biometric slide content container not found");
    return;
  }

  if (state === 0) {
    contentContainer.innerHTML = `
      ${wrapTitleWithStateIndicators("Biometric", 0, 2)}
      <div style="display: flex; gap: 30px; justify-content: center; align-items: center; margin-top: 40px;">
        <img src="img/biometrics.png" alt="Biometric Sensors" 
             style="max-width: 45%; height: auto; border-radius: 10px; box-shadow: none !important;" 
             onerror="this.src='https://via.placeholder.com/600x400/333/fff?text=Biometric+Sensors'">
        <img src="img/face.png" alt="Face Recognition" 
             style="max-width: 45%; height: auto; border-radius: 10px; box-shadow: none !important;" 
             onerror="this.src='https://via.placeholder.com/600x400/333/fff?text=Face+Recognition'">
      </div>
    `;
  } else if (state === 1) {
    contentContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px;">
        ${wrapTitleWithStateIndicators("Biometric Sensors", 1, 2)}
        <div style="text-align: center; margin: 20px 0;">
          <p style="color: #ddd; font-size: 1.2em;">identity verification and health monitoring</p>
          <div style="margin-top: 30px; max-width: 1200px;">
            <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 30px; text-align: left;">
              <div style="background: rgba(255, 20, 147, 0.1); border-left: 4px solid #FF1493; padding: 25px; border-radius: 10px;">
                <h4 style="color: #FF1493; font-size: 1.4em; margin-bottom: 15px;">Bio-electric</h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                  <div style="color: #ddd; font-size: 1.1em; line-height: 1.5;">
                    <div style="margin-bottom: 8px;">• GSR (Galvanic Skin Response)</div>
                    <div style="margin-bottom: 8px;">• PPG (Photoplethysmogram)</div>
                  </div>
                  <div style="color: #ddd; font-size: 1.1em; line-height: 1.5;">
                    <div style="margin-bottom: 8px;">• EMG (Electromyography)</div>
                    <div style="margin-bottom: 8px;">• EEG (Electroencephalography)</div>
                  </div>
                </div>
              </div>
              <div style="background: rgba(255, 20, 147, 0.1); border-left: 4px solid #FF1493; padding: 25px; border-radius: 10px;">
                <h4 style="color: #FF1493; font-size: 1.4em; margin-bottom: 15px;">Identity & Access</h4>
                <div style="color: #ddd; font-size: 1.1em; line-height: 1.5;">
                  <div style="margin-bottom: 8px;">• Camera (Facial recognition)</div>
                  <div style="margin-bottom: 8px;">• Microphone (Voiceprint Recognition)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="image-group-wrapper" style="display: flex; gap: 20px; margin-top: 30px; justify-content: center; align-items: flex-end;">
          <img src="img/bio1.jpg" alt="Bio1" style="height: 200px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/200x200/333/fff?text=Bio1'">
          <img src="img/bio2.jpg" alt="Bio2" style="height: 200px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/200x200/333/fff?text=Bio2'">
          <img src="img/bio3.jpg" alt="Bio3" style="height: 200px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/200x200/333/fff?text=Bio3'">
          <img src="img/bio4.png" alt="Bio4" style="height: 200px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/200x200/333/fff?text=Bio4'">
          <img src="img/bio5.webp" alt="Bio5" style="height: 200px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/200x200/333/fff?text=Bio5'">
        </div>
      </div>
    `;
  }
}

function handleKitSlideState(state) {
  const kitSlide = slides[15]; // Slide 3.1 (Kit)
  const contentContainer = kitSlide.querySelector(".slide-content");

  if (!contentContainer) return;

  if (state === 0) {
    contentContainer.innerHTML = `
      <p style="margin-top: 60px; font-size: 1.4em; color: #ddd;">
        [Placeholder: Kit image]<br>
        Workshop kit overview and contents
      </p>
    `;
  } else if (state === 1) {
    contentContainer.innerHTML = `
      <div style="margin-top: 40px;">
        <p style="font-size: 1.4em; color: #ddd;">
          [Placeholder: Kit form/details]<br>
          Detailed kit specifications and usage instructions
        </p>
      </div>
    `;
  }
}

function handleWarmupSlideState(state) {
  const warmupSlide = slides[16]; // Slide 3.2 (Warm-up)
  const contentContainer = warmupSlide.querySelector(".slide-content");
  if (!contentContainer) return;

  if (state === 0) {
    contentContainer.innerHTML = `
      <p style="margin-top: 60px; font-size: 1.4em; color: #ddd;">
        [Placeholder: Warm-up exercise image]<br>
        Initial hardware exercise (15 minutes)
      </p>
    `;
  } else if (state === 1) {
    contentContainer.innerHTML = `
      <div style="margin-top: 40px;">
        <p style="font-size: 1.4em; color: #ddd;">
          [Placeholder: Warm-up exercise form/details]<br>
          Step-by-step instructions and requirements
        </p>
      </div>
    `;
  }
}

function handleHardModeSlideState(state) {
  const hardModeSlide = slides[17]; // Slide 3.3 (Hard Mode)
  const contentContainer = hardModeSlide.querySelector(".slide-content");
  if (!contentContainer) return;

  if (state === 0) {
    contentContainer.innerHTML = `
      <p style="margin-top: 60px; font-size: 1.4em; color: #ddd;">
        [Placeholder: Hard Mode challenge image]<br>
        Advanced challenge covering multiple topics (45 minutes)
      </p>
    `;
  } else if (state === 1) {
    contentContainer.innerHTML = `
      <div style="margin-top: 40px;">
        <p style="font-size: 1.4em; color: #ddd;">
          [Placeholder: Hard Mode challenge form/details]<br>
          Comprehensive project requirements and guidelines
        </p>
      </div>
    `;
  }
}

function handleSystemDiagramSlideState(state) {
  const systemDiagramSlide = slides[18]; // Slide 3.4 (System Diagram)
  const contentContainer = systemDiagramSlide.querySelector(".slide-content");
  if (!contentContainer) return;

  if (state === 0) {
    contentContainer.innerHTML = `
      <p style="margin-top: 60px; font-size: 1.4em; color: #ddd;">
        [Placeholder: System diagram image]<br>
        Hardware-web system and signal flow
      </p>
    `;
  } else if (state === 1) {
    contentContainer.innerHTML = `
      <div style="margin-top: 40px;">
        <p style="font-size: 1.4em; color: #ddd;">
          [Placeholder: System diagram form/details]<br>
          Technical specifications and implementation details
        </p>
      </div>
    `;
  }
}

// =============================================================================
// IMAGE LOADING SYSTEM
// =============================================================================

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

// =============================================================================
// SLIDE NAVIGATION
// =============================================================================

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

  // Reset the new slide's state when navigating to it
  resetSlideState(currentSlide);

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

    // Reset the new slide's state when navigating to it
    resetSlideState(currentSlide);

    updateProgressBar();

    // Load images for current slide and preload adjacent slides
    loadImagesForSlide(currentSlide);
    preloadAdjacentSlides(currentSlide);
  }
}

// =============================================================================
// KEYBOARD INPUT HANDLING
// =============================================================================

document.addEventListener("keydown", function (event) {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    handleArrowKeyPress(-1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    handleArrowKeyPress(1);
  } else if (event.key === " ") {
    event.preventDefault();
    toggleSlideState();
  } else if (event.key === "Enter") {
    event.preventDefault();
    changeSlide(1);
  } else if (event.key === "Escape") {
    goToSlide(0);
  } else if (event.key === "r" || event.key === "R") {
    // Reset presentation state
    localStorage.removeItem("htpaac-current-slide");
    localStorage.removeItem("htpaac-slide-states");
    location.reload();
  } else if (event.key === "l" || event.key === "L") {
    toggleSlideState();
  } else if (event.key === "n" || event.key === "N") {
    // Toggle note visibility manually
    if (slideNote.classList.contains("visible")) {
      hideNote();
    } else {
      updateSlideNote(currentSlide, slideStates[currentSlide] || 0);
    }
  } else if (event.key >= "1" && event.key <= "9") {
    const slideNumber = parseInt(event.key) - 1;
    if (slideNumber < slides.length) {
      goToSlide(slideNumber);
    }
  } else if (event.key === "Tab") {
    // Prevent Tab key from causing focus changes and layout shifts
    // This prevents the slideshow from shifting left when Tab is pressed
    event.preventDefault();
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
      }, CONFIG.FAST_FLIP_INTERVAL);
    }, CONFIG.KEY_HOLD_WAIT_TIME);
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

// =============================================================================
// TOUCH INPUT HANDLING
// =============================================================================

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

// =============================================================================
// AUTO-PLAY SYSTEM
// =============================================================================

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

// =============================================================================
// GAMEPAD SUPPORT
// =============================================================================

window.addEventListener("gamepadconnected", function (event) {
  console.log("Gamepad connected:", event.gamepad.id);
  gamepadIndex = event.gamepad.index;
  gamepadConnected = true;
  startGamepadPolling();
});

window.addEventListener("gamepaddisconnected", function (event) {
  console.log("Gamepad disconnected:", event.gamepad.id);
  gamepadConnected = false;
  gamepadIndex = -1;
});

function startGamepadPolling() {
  if (!gamepadConnected) return;

  const gamepad = navigator.getGamepads()[gamepadIndex];
  if (gamepad) {
    // Check D-pad left (button 14)
    if (
      gamepad.buttons[14] &&
      gamepad.buttons[14].pressed &&
      !lastGamepadState.left
    ) {
      console.log("Gamepad: D-pad left pressed");
      changeSlide(-1);
      lastGamepadState.left = true;
    } else if (!gamepad.buttons[14] || !gamepad.buttons[14].pressed) {
      lastGamepadState.left = false;
    }

    // Check D-pad right (button 15)
    if (
      gamepad.buttons[15] &&
      gamepad.buttons[15].pressed &&
      !lastGamepadState.right
    ) {
      console.log("Gamepad: D-pad right pressed");
      changeSlide(1);
      lastGamepadState.right = true;
    } else if (!gamepad.buttons[15] || !gamepad.buttons[15].pressed) {
      lastGamepadState.right = false;
    }

    // Check left analog stick (axes 0)
    const leftStickX = gamepad.axes[0];
    if (leftStickX < -0.7 && !lastGamepadState.stickLeft) {
      console.log("Gamepad: Left stick left");
      changeSlide(-1);
      lastGamepadState.stickLeft = true;
    } else if (leftStickX > -0.5) {
      lastGamepadState.stickLeft = false;
    }

    if (leftStickX > 0.7 && !lastGamepadState.stickRight) {
      console.log("Gamepad: Left stick right");
      changeSlide(1);
      lastGamepadState.stickRight = true;
    } else if (leftStickX < 0.5) {
      lastGamepadState.stickRight = false;
    }

    // Check L button (button 4 - left shoulder button)
    if (
      gamepad.buttons[4] &&
      gamepad.buttons[4].pressed &&
      !lastGamepadState.lButton
    ) {
      console.log("Gamepad: L button pressed");
      toggleSlideState();
      lastGamepadState.lButton = true;
    } else if (!gamepad.buttons[4] || !gamepad.buttons[4].pressed) {
      lastGamepadState.lButton = false;
    }

    // Check L2 button (button 6 - left trigger)
    if (
      gamepad.buttons[6] &&
      gamepad.buttons[6].pressed &&
      !lastGamepadState.l2Button
    ) {
      console.log("Gamepad: L2 trigger pressed");
      toggleSlideState();
      lastGamepadState.l2Button = true;
    } else if (!gamepad.buttons[6] || !gamepad.buttons[6].pressed) {
      lastGamepadState.l2Button = false;
    }
  }

  // Continue polling
  if (gamepadConnected) {
    requestAnimationFrame(startGamepadPolling);
  }
}

// =============================================================================
// MOUSE CLICK HANDLING
// =============================================================================

document.addEventListener("click", function (event) {
  // Only allow navigation clicks in very narrow edge zones
  if (
    !event.target.closest(".navigation") &&
    !event.target.closest(".slide-indicators") &&
    !event.target.closest(".revolver-progress") &&
    !event.target.closest(".slide-note")
  ) {
    const clickX = event.clientX;
    const windowWidth = window.innerWidth;

    // Left edge zone for previous slide
    if (clickX < CONFIG.CLICK_ZONE_WIDTH) {
      changeSlide(-1);
    }
    // Right edge zone for next slide
    else if (clickX > windowWidth - CONFIG.CLICK_ZONE_WIDTH) {
      changeSlide(1);
    }
    // Middle area - only trigger SSM if clicking blank area
    else {
      // Check if clicked on content elements or blank areas
      const clickedElement = event.target;
      const isBlankArea =
        clickedElement.classList.contains("slide") ||
        clickedElement.classList.contains("slideshow-container") ||
        clickedElement.classList.contains("slide-content") ||
        (clickedElement.tagName === "DIV" &&
          !clickedElement.querySelector(
            "img, h1, h2, h3, p, ul, li, a, code, pre"
          )) ||
        // Include elements that are primarily spacing/layout containers
        (clickedElement.tagName === "DIV" &&
          (clickedElement.style.margin ||
            clickedElement.style.padding ||
            clickedElement.style.marginTop ||
            clickedElement.style.marginBottom ||
            clickedElement.style.paddingTop ||
            clickedElement.style.paddingBottom) &&
          !clickedElement.querySelector("img, a, button, input"));

      if (isBlankArea) {
        toggleSlideState();
      }
      // If clicked on content (images, text, etc.), do nothing
    }
  }
});

// =============================================================================
// INITIALIZATION COMPLETE
// =============================================================================

console.log("HTPAAC Slideshow initialized. Available controls:");
console.log("- Arrow keys: Instant navigation, hold 1sec for fast flip");
console.log(
  "- Gamepad: D-pad/analog stick navigation, L/L2 for state switching"
);
console.log(
  "- Keyboard: L/Space (SSM), Enter (next), Numbers (jump), P (auto-play), R (reset)"
);
console.log(
  "- Mouse: Edge zones (navigation), center area (SSM), hover for UI"
);
console.log("- Touch: Swipe gestures for navigation");

// Initialize image preloading
window.addEventListener("load", preloadImages);
