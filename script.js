// Load saved slide position or default to 0
let currentSlide = parseInt(localStorage.getItem("htpaac-current-slide")) || 0;
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

// Slide State Management (SSM) - handles internal slide interactions
let slideStates =
  JSON.parse(localStorage.getItem("htpaac-slide-states")) ||
  new Array(17).fill(0); // Track state for each slide (17 slides total)
let maxSlideStates = new Array(17).fill(1); // Max states per slide (default 1)

// Gamepad support
let gamepadIndex = -1;
let gamepadConnected = false;
let lastGamepadState = {};

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
  "Software", // 1.7
  "Protocol", // 1.8
  "Networking", // 1.9
  "Part 2", // 2.0
  "Sensor", // 2.1
  "Actuator", // 2.2
  "Biometric", // 2.3
  "Part 3", // 3.0
  "Kit", // 3.1
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
  "1.7", // Software
  "1.8", // Protocol
  "1.9", // Networking
  "2.0", // Part 2
  "2.1", // Sensor
  "2.2", // Actuator
  "2.3", // Biometric
  "3.0", // Part 3
  "3.1", // Kit
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
  const glowDetectionWidth = 200; // Much larger detection area for glow effect
  const slideshowContainer = document.querySelector(".slideshow-container");

  // Show navigation buttons when near edges
  if (mouseX < edgeThreshold || mouseX > screenWidth - edgeThreshold) {
    showNavigationButtons();
  }

  // Control edge zone glow based on mouse position (larger detection area)
  if (slideshowContainer) {
    // Remove all edge classes first
    slideshowContainer.classList.remove(
      "left-edge-active",
      "right-edge-active"
    );

    // Add appropriate class based on mouse position (using larger detection area)
    if (mouseX < glowDetectionWidth) {
      slideshowContainer.classList.add("left-edge-active");
    } else if (mouseX > screenWidth - glowDetectionWidth) {
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

  // Save current slide position
  localStorage.setItem("htpaac-current-slide", currentSlide.toString());

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

  // Configure slide states
  setSlideMaxStates(3, 2); // Slide 1.2 (Parts) has 2 states: image view and text view
  setSlideMaxStates(5, 2); // Slide 1.4 (MCU) has 2 states: image collage and description
  setSlideMaxStates(12, 3); // Slide 2.1 (Sensor) has 3 states: analog, MEMS1, MEMS2
  setSlideMaxStates(13, 3); // Slide 2.2 (Actuator) has 3 states: electromagnetic, photo, etc
  setSlideMaxStates(14, 2); // Slide 2.3 (Biometric) has 2 states: image and list
  setSlideMaxStates(15, 2); // Slide 3.1 (Kit) has 2 states: image and form

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

// Slide State Management (SSM) Functions
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
  if (slideIndex === 3) {
    // Slide 1.2 (Parts)
    handlePartsSlideState(0);
  } else if (slideIndex === 5) {
    // Slide 1.4 (MCU)
    handleMCUSlideState(0);
  } else if (slideIndex === 12) {
    // Slide 2.1 (Sensor)
    handleSensorSlideState(0);
  } else if (slideIndex === 13) {
    // Slide 2.2 (Actuator)
    handleActuatorSlideState(0);
  } else if (slideIndex === 14) {
    // Slide 2.3 (Biometric)
    handleBiometricSlideState(0);
  } else if (slideIndex === 15) {
    // Slide 3.1 (Kit)
    handleKitSlideState(0);
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
  if (slideIndex === 3) {
    // Slide 1.2 (Parts)
    handlePartsSlideState(newState);
  } else if (slideIndex === 5) {
    // Slide 1.4 (MCU)
    handleMCUSlideState(newState);
  } else if (slideIndex === 12) {
    // Slide 2.1 (Sensor)
    handleSensorSlideState(newState);
  } else if (slideIndex === 13) {
    // Slide 2.2 (Actuator)
    handleActuatorSlideState(newState);
  } else if (slideIndex === 14) {
    // Slide 2.3 (Biometric)
    handleBiometricSlideState(newState);
  } else if (slideIndex === 15) {
    // Slide 3.1 (Kit)
    handleKitSlideState(newState);
  }

  // Dispatch custom event for external listeners
  const event = new CustomEvent("slideStateChange", {
    detail: { slideIndex, newState, maxStates: maxSlideStates[slideIndex] },
  });
  document.dispatchEvent(event);
}

function handlePartsSlideState(state) {
  const partsSlide = slides[3]; // Slide 1.2 (Parts)
  const contentContainer = partsSlide.querySelector(".slide-content");

  if (!contentContainer) return;

  if (state === 0) {
    // State 0: Show image
    contentContainer.innerHTML = `
      <img src="https://www.ultralibrarian.com/wp-content/uploads/2022/06/shutterstock_7865275181.jpg" 
           alt="Electronic Components" 
           class="centered-image" 
           style="max-width: 80%; height: auto; margin: 40px auto 0 auto; display: block; border-radius: 10px; box-shadow: 0 10px 30px rgba(255, 255, 255, 0.1);" 
           onerror="this.src='https://via.placeholder.com/800x600/333/fff?text=Electronic+Components'">
    `;
  } else if (state === 1) {
    // State 1: Show text content
    contentContainer.innerHTML = `
      <div class="features" style="margin-top: 40px;">
        <div class="feature-box">
          <h3>🔌 Passive Components</h3>
          <p>Resistors, capacitors, inductors - control current, voltage, and frequency</p>
        </div>
        <div class="feature-box">
          <h3>🧠 Active Components</h3>
          <p>Transistors, diodes, ICs - amplify, switch, and process signals</p>
        </div>
        <div class="feature-box">
          <h3>🔗 Connectors</h3>
          <p>Headers, sockets, terminals - connect and interface components</p>
        </div>
      </div>
      <div style="margin-top: 30px;">
        <ul>
          <li>⚡ Power Management: Regulators, converters, protection circuits</li>
          <li>📡 Communication: Transceivers, antennas, crystals</li>
          <li>🔧 Mechanical: Switches, potentiometers, displays</li>
          <li>🛡️ Protection: Fuses, TVS diodes, ferrite beads</li>
        </ul>
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

  // Initialize Sensor slide (index 12)
  handleSensorSlideState(slideStates[12] || 0);

  // Initialize Actuator slide (index 13)
  handleActuatorSlideState(slideStates[13] || 0);

  // Initialize Biometric slide (index 14)
  handleBiometricSlideState(slideStates[14] || 0);

  // Initialize Kit slide (index 15)
  handleKitSlideState(slideStates[15] || 0);
}

// Additional slide state handlers
function handleMCUSlideState(state) {
  const mcuSlide = slides[5]; // Slide 1.4 (MCU)
  const contentContainer = mcuSlide.querySelector(".slide-content");

  if (!contentContainer) return;

  if (state === 0) {
    contentContainer.innerHTML = `
      <p style="margin-top: 60px; font-size: 1.4em; color: #ddd;">
        [Placeholder: MCU image collage]<br>
        Various microcontrollers and development boards
      </p>
    `;
  } else if (state === 1) {
    contentContainer.innerHTML = `
      <div style="margin-top: 40px;">
        <ul>
          <li>🧠 ARM Cortex-M series: STM32, NXP, Atmel</li>
          <li>🔧 Arduino ecosystem: Uno, Nano, ESP32</li>
          <li>🚀 High performance: Raspberry Pi, BeagleBone</li>
          <li>⚡ Low power: MSP430, Nordic nRF</li>
        </ul>
      </div>
    `;
  }
}

function handleSensorSlideState(state) {
  console.log(`Handling SENSOR slide state: ${state}`);
  const sensorSlide = slides[12]; // Slide 2.1 (Sensor)
  const contentContainer = sensorSlide.querySelector(".slide-content");

  if (!contentContainer) {
    console.error("Sensor slide content container not found");
    return;
  }

  if (state === 0) {
    // State 1: Analog Sensors
    contentContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px;">
        <div class="image-group-wrapper" style="display: flex; gap: 30px; margin-bottom: 20px; justify-content: center; align-items: flex-end;">
          <div style="height: 280px; width: auto; min-width: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);">
            <p style="color: #ddd; text-align: center;">[Placeholder: Analog Sensor Image 1]</p>
          </div>
          <div style="height: 280px; width: auto; min-width: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);">
            <p style="color: #ddd; text-align: center;">[Placeholder: Analog Sensor Image 2]</p>
          </div>
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <h2 style="color: #FF1493; margin-bottom: 10px;">Analog Sensors</h2>
          <p style="color: #ddd; font-size: 1.2em;">basically family of weird resistors</p>
          <div style="margin-top: 20px;">
            <p>[Placeholder: State 1 items - organized text in middle]</p>
          </div>
        </div>
        <div class="image-group-wrapper" style="display: flex; gap: 30px; margin-top: 20px; justify-content: center; align-items: flex-end;">
          <div style="height: 280px; width: auto; min-width: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);">
            <p style="color: #ddd; text-align: center;">[Placeholder: Analog Sensor Image 3]</p>
          </div>
          <div style="height: 280px; width: auto; min-width: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);">
            <p style="color: #ddd; text-align: center;">[Placeholder: Analog Sensor Image 4]</p>
          </div>
        </div>
      </div>
    `;
  } else if (state === 1) {
    // State 2: MEMS Sensors
    contentContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px;">
        <div class="image-group-wrapper" style="display: flex; gap: 30px; margin-bottom: 20px; justify-content: center; align-items: flex-end;">
          <img src="img/MEMS3.png" alt="MEMS3" style="height: 220px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);"            onerror="this.src='https://via.placeholder.com/280x220/333/fff?text=MEMS3'">
          <img src="img/MEMS2.jpg" alt="MEMS2" style="height: 220px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/280x220/333/fff?text=MEMS2'">
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <h2 style="color: #FF1493; margin-bottom: 10px;">MEMS Sensors</h2>
          <p style="color: #ddd; font-size: 1.2em;">Micro-Electro-Mechanical Systems</p>
          <div style="margin-top: 20px;">
            <p>[Placeholder: State 2 items - organized text in middle]</p>
          </div>
        </div>
        <div class="image-group-wrapper" style="display: flex; gap: 30px; margin-top: 20px; justify-content: center; align-items: flex-end;">
          <img src="img/MEMS0.jpg" alt="MEMS0" style="height: 280px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/350x280/333/fff?text=MEMS0'">
          <img src="img/MEMS1.webp" alt="MEMS1" style="height: 280px; width: auto; object-fit: contain; border-radius: 10px; box-shadow: 0 5px 15px rgba(255, 255, 255, 0.1);" onerror="this.src='https://via.placeholder.com/350x280/333/fff?text=MEMS1'">
        </div>
      </div>
    `;
  } else if (state === 2) {
    // State 3: Additional sensor types
    contentContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px;">
        <div style="display: flex; gap: 30px; margin-bottom: 20px; justify-content: center;">
          <div style="max-width: 250px; max-height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <p style="color: #ddd; text-align: center;">[Placeholder: Additional Sensor Image 1]</p>
          </div>
          <div style="max-width: 250px; max-height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <p style="color: #ddd; text-align: center;">[Placeholder: Additional Sensor Image 2]</p>
          </div>
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <h2 style="color: #FF1493; margin-bottom: 10px;">Additional Sensors</h2>
          <p style="color: #ddd; font-size: 1.2em;">[Placeholder: subtitle]</p>
          <div style="margin-top: 20px;">
            <p>[Placeholder: State 3 items - organized text in middle]</p>
          </div>
        </div>
        <div style="display: flex; gap: 30px; margin-top: 20px; justify-content: center;">
          <div style="max-width: 250px; max-height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <p style="color: #ddd; text-align: center;">[Placeholder: Additional Sensor Image 3]</p>
          </div>
          <div style="max-width: 250px; max-height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <p style="color: #ddd; text-align: center;">[Placeholder: Additional Sensor Image 4]</p>
          </div>
        </div>
      </div>
    `;
  }
}

function handleActuatorSlideState(state) {
  console.log(`Handling ACTUATOR slide state: ${state}`);
  const actuatorSlide = slides[13]; // Slide 2.2 (Actuator)
  const contentContainer = actuatorSlide.querySelector(".slide-content");

  if (!contentContainer) {
    console.error("Actuator slide content container not found");
    return;
  }

  if (state === 0) {
    // State 1: Electromagnetic Actuators
    contentContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px;">
        <div style="display: flex; gap: 30px; margin-bottom: 20px; justify-content: center;">
          <div style="max-width: 250px; max-height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <p style="color: #ddd; text-align: center;">[Placeholder: Electromagnetic Actuator Image 1]</p>
          </div>
          <div style="max-width: 250px; max-height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <p style="color: #ddd; text-align: center;">[Placeholder: Electromagnetic Actuator Image 2]</p>
          </div>
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <h2 style="color: #FF1493; margin-bottom: 10px;">Electromagnetic Actuators</h2>
          <p style="color: #ddd; font-size: 1.2em;">move and actuate</p>
          <div style="margin-top: 20px;">
            <p>[Placeholder: State 1 items - organized text in middle]</p>
          </div>
        </div>
        <div style="display: flex; gap: 30px; margin-top: 20px; justify-content: center;">
          <div style="max-width: 250px; max-height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <p style="color: #ddd; text-align: center;">[Placeholder: Electromagnetic Actuator Image 3]</p>
          </div>
          <div style="max-width: 250px; max-height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <p style="color: #ddd; text-align: center;">[Placeholder: Electromagnetic Actuator Image 4]</p>
          </div>
        </div>
      </div>
    `;
  } else if (state === 1) {
    // State 2: Photo Actuators
    contentContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px;">
        <div style="display: flex; gap: 30px; margin-bottom: 20px; justify-content: center;">
          <div style="max-width: 250px; max-height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <p style="color: #ddd; text-align: center;">[Placeholder: Photo Actuator Image 1]</p>
          </div>
          <div style="max-width: 250px; max-height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <p style="color: #ddd; text-align: center;">[Placeholder: Photo Actuator Image 2]</p>
          </div>
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <h2 style="color: #FF1493; margin-bottom: 10px;">Photo Actuators</h2>
          <p style="color: #ddd; font-size: 1.2em;">show and display</p>
          <div style="margin-top: 20px;">
            <p>[Placeholder: State 2 items - organized text in middle]</p>
          </div>
        </div>
        <div style="display: flex; gap: 30px; margin-top: 20px; justify-content: center;">
          <div style="max-width: 250px; max-height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <p style="color: #ddd; text-align: center;">[Placeholder: Photo Actuator Image 3]</p>
          </div>
          <div style="max-width: 250px; max-height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <p style="color: #ddd; text-align: center;">[Placeholder: Photo Actuator Image 4]</p>
          </div>
        </div>
      </div>
    `;
  } else if (state === 2) {
    // State 3: Additional actuator types
    contentContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px;">
        <div style="display: flex; gap: 30px; margin-bottom: 20px; justify-content: center;">
          <div style="max-width: 250px; max-height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <p style="color: #ddd; text-align: center;">[Placeholder: Additional Actuator Image 1]</p>
          </div>
          <div style="max-width: 250px; max-height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <p style="color: #ddd; text-align: center;">[Placeholder: Additional Actuator Image 2]</p>
          </div>
        </div>
        <div style="text-align: center; margin: 20px 0;">
          <h2 style="color: #FF1493; margin-bottom: 10px;">Additional Actuators</h2>
          <p style="color: #ddd; font-size: 1.2em;">[Placeholder: subtitle]</p>
          <div style="margin-top: 20px;">
            <p>[Placeholder: State 3 items - organized text in middle]</p>
          </div>
        </div>
        <div style="display: flex; gap: 30px; margin-top: 20px; justify-content: center;">
          <div style="max-width: 250px; max-height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <p style="color: #ddd; text-align: center;">[Placeholder: Additional Actuator Image 3]</p>
          </div>
          <div style="max-width: 250px; max-height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 20px;">
            <p style="color: #ddd; text-align: center;">[Placeholder: Additional Actuator Image 4]</p>
          </div>
        </div>
      </div>
    `;
  }
}

function handleBiometricSlideState(state) {
  console.log(`Handling BIOMETRIC slide state: ${state}`);
  const biometricSlide = slides[14]; // Slide 2.3 (Biometric)
  const contentContainer = biometricSlide.querySelector(".slide-content");

  if (!contentContainer) {
    console.error("Biometric slide content container not found");
    return;
  }

  if (state === 0) {
    contentContainer.innerHTML = `
      <img src="img/biometrics.png" alt="Biometric Sensors" class="centered-image" 
           style="max-width: 70%; height: auto; margin: 40px auto 0 auto; display: block; border-radius: 10px; box-shadow: 0 10px 30px rgba(255, 255, 255, 0.1);" 
           onerror="this.src='https://via.placeholder.com/800x600/333/fff?text=Biometric+Sensors'">
    `;
  } else if (state === 1) {
    contentContainer.innerHTML = `
      <div style="margin-top: 40px;">
        <ul>
          <li>👆 Fingerprint sensors: Capacitive, optical, ultrasonic</li>
          <li>👁️ Iris/retina scanners: High security applications</li>
          <li>📷 Facial recognition: Camera-based systems</li>
          <li>❤️ Heart rate monitors: PPG, ECG sensors</li>
          <li>🧬 DNA analysis: Lab-on-chip systems</li>
          <li>🗣️ Voice recognition: MEMS microphones + AI</li>
        </ul>
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

  // Reset the new slide's state when navigating to it
  resetSlideState(currentSlide);

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

    // Reset the new slide's state when navigating to it
    resetSlideState(currentSlide);

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
  } else if (event.key === "r" || event.key === "R") {
    // Reset presentation state
    localStorage.removeItem("htpaac-current-slide");
    localStorage.removeItem("htpaac-slide-states");
    location.reload();
  } else if (event.key === "l" || event.key === "L") {
    toggleSlideState();
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

// Gamepad connection events
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
    // Middle area - trigger slide state management (SSM)
    else {
      toggleSlideState();
    }
  }
});

console.log("Slideshow initialized. Controls:");
console.log("- Arrow keys: Fast click = instant, hold 1sec = fast flip");
console.log("- Gamepad: D-pad/stick for navigation, L/L2 buttons for SSM");
console.log("- L key: Toggle Slide State (SSM)");
console.log("- Space/Enter: Next slide");
console.log("- Number keys: Jump to slide");
console.log("- P: Toggle auto-play");
console.log("- Escape: Return to first slide");
console.log("- R key: Reset presentation state and reload");
console.log("- Click/Tap: Edge zones (navigation) or center (SSM)");
console.log("- Swipe: Navigate on mobile");
