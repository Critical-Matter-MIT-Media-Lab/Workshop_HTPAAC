# HOW TO PROTOTYPE (ALMOST) ANY CIRCUIT

## Project Context & Overview

### Project Description

This is an interactive web-based slideshow presentation system titled "HOW TO PROTOTYPE (ALMOST) ANY CIRCUIT" with the subtitle "from the perspective of designer and maker".

### Technology Stack

- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Fonts**: Local Terminess Nerd Font Propo with Google Fonts fallback
- **Performance**: Lazy loading system for images and resources
- **State Management**: SSM (Slide State Management) for multi-state slides
- **Input Support**: Keyboard, mouse, touch, and gamepad controls
- **Special Feature**: Unique "revolver-style" progress indicator
- **Navigation**: Multiple input methods with smart edge detection
- **Loading**: Smooth loading overlay with spinner animation
- **Persistence**: LocalStorage-based state memory across sessions

### File Structure

```
HTPAAC/
├── index.html          # Main HTML file containing 16 slides
├── script.js           # JavaScript control logic with SSM and gamepad support
├── styles.css          # CSS styling with responsive design and animations
├── context.md          # This document - project context
├── img/                # Image assets directory
│   ├── biometrics.png  # Biometric sensors overview
│   ├── MEMS0.jpg       # MEMS sensor example 1
│   ├── MEMS1.webp      # MEMS sensor example 2
│   ├── MEMS2.jpg       # MEMS sensor example 3
│   └── MEMS3.png       # MEMS sensor example 4
├── Terminus/           # Local font files directory
│   ├── TerminessNerdFontPropo-Regular.ttf
│   ├── TerminessNerdFontPropo-Bold.ttf
│   ├── TerminessNerdFontPropo-Italic.ttf
│   └── TerminessNerdFontPropo-BoldItalic.ttf
├── README.md           # Project readme
└── LICENSE             # License file
```

### Design Features

#### Visual Design

- Dark theme background (#000)
- Deep pink color scheme (#FF1493)
- Glass morphism effects and smooth animations
- Responsive design for mobile devices

#### Unique Revolver Progress Indicator

- 16 chambers corresponding to 16 slides
- Displays slide numbers as defined in markdown (0, 1.0, 1.1, 1.2, etc.)
- Enhanced visual effects: glowing active chamber with pulse animation
- Responsive sizing: 280px standard, 320px large screens, 200px mobile
- Positioned dynamically: deeper on large screens (-200px), standard on others (-160px)
- Rotating animation showing current progress
- Appears on mouse movement, auto-hides after 1 second
- Clickable chambers for direct slide navigation
- Bold text display for slide numbers and titles

#### Multiple Interaction Methods

- **Optimized Arrow Keys**: Smart detection between fast clicks vs. hold (1sec delay for auto-repeat)
- **Gamepad Support**: D-pad/analog stick navigation, L/L2 buttons for SSM state switching
- **Keyboard Navigation**: Arrow keys, Space, Enter, number keys 1-9, ESC, P key, L key for SSM, R key for reset
- **Smart Mouse Navigation**: 60px edge zones for navigation, 200px detection zones for visual feedback
- **Touch Support**: Swipe gestures for slide transitions
- **Auto-play**: Toggle with P key

### Target Audience

- Electronic engineers and designers
- Makers and DIY enthusiasts
- Students and educators
- Technical professionals interested in circuit prototyping

### Content Update Policy

**Important**: All text content will be manually updated by the user. Developers should not proactively edit slide content unless explicitly requested by the user.

### Usage Instructions

1. Open `index.html` in a web browser
2. Navigate using various input methods
3. Mouse movement reveals progress indicator
4. Supports full-screen presentation mode

### Development Notes

- Maintain code maintainability
- Ensure cross-browser compatibility
- ✅ **Performance Optimized**: Lazy loading system implemented
- Preserve responsive design

### Performance Features

#### Lazy Loading System

- **Images**: Load only when slide becomes active
- **Smart Preloading**: Adjacent slides preloaded for smooth navigation
- **Memory Management**: Tracks loaded/loading states to prevent duplicates
- **Visual Feedback**: Loading states with opacity transitions
- **Error Handling**: Graceful fallback for failed image loads

#### SSM (Slide State Management) System

- **Multi-State Slides**: Support for slides with multiple internal states
- **Dynamic Content**: Complete content replacement between states
- **State Persistence**: Slide states saved in localStorage and restored on reload
- **Toggle Controls**: L key, gamepad L/L2 buttons, center-click for state switching
- **Auto-Reset**: States reset to default when navigating between slides

#### Loading Experience

- **Smooth Startup**: Loading overlay with animated spinner
- **Black Background**: Prevents white flash during font/resource loading
- **Progressive Enhancement**: Content appears after all resources loaded
- **Font Loading**: Local fonts with web font fallbacks
- **First Slide Animation**: Cascading fade-in animation for intro slide

#### Session Persistence

- **Position Memory**: Remembers current slide across browser refreshes
- **State Memory**: Preserves SSM states for multi-state slides
- **Reset Function**: R key clears all saved data and reloads

#### Text Scaling

- **Optimized for Presentation**: All text elements enlarged for better visibility
- **Hierarchy**: H1 (3.5em), P (1.6em), UL (1.5em), Code (1.3em)
- **Responsive**: Maintains readability across device sizes
- **Multi-Screen Support**: Adaptive scaling for large screens (1921px+) and ultra-wide (2560px+)

### Current Implementation Status

#### Completed Multi-State Slides (SSM-enabled)

- **1.2 Parts**: 2 states (image ↔ component categories)
- **1.4 MCU**: 2 states (image collage ↔ technical descriptions)
- **2.1 Actuator**: 3 states (Introduction → Electromagnetic → Photo-Actuators)
- **2.2 Sensor**: 3 states (Introduction → Analog → MEMS sensors with real images)
- **2.3 Biometric**: 2 states (dual image view ↔ organized sensor categories)
- **3.1 Kit**: 2 states (kit image ↔ form/details)

#### Image Layout System

- **Unified Bottom Row**: All 4 images positioned in single bottom row (200px height)
- **Aspect Ratio Preservation**: object-fit: contain prevents distortion
- **Consistent Spacing**: 20px gaps between images for optimal visual balance
- **Sequential Ordering**: Analog sensors (R1, R2, Film1, Film2), MEMS sensors (0, 1, 2, 3)
- **Responsive Design**: 1200px max-width containers with proper centering

#### Interactive Features

- **Edge Glow System**: 200px detection zones with subtle radial gradients
- **Precise Click Zones**: 60px edge zones for navigation, center area for SSM
- **Gamepad Integration**: Full D-pad, analog stick, and L/L2 button support
- **State Persistence**: Complete session memory with localStorage

#### Visual Enhancements

- **Anti-Flicker Loading**: Inline critical CSS prevents background flash
- **Favicon Integration**: #FF1493 square favicon with theme color
- **Responsive Typography**: Optimized scaling across all screen sizes
- **Smooth Transitions**: Coordinated animations throughout the interface

#### Code Organization & Architecture

- **Modular Structure**: JavaScript organized into 15 logical sections with clear dividers
- **Configuration Centralization**: CONFIG object centralizes all timing and UI parameters
- **Consistent Styling**: Template literals with inline styles for precise layout control
- **Multi-Row Content Layout**: Grid-based content organization with compact vertical spacing
- **Performance Optimized**: Lazy loading, session persistence, and efficient state management

## Presentation

0 **Intro** - Title slide

- Structure: Three lines of text
- Title: "HOW TO PROTOTYPE (ALMOST) ANY CIRCUIT"
- Subtitle: "from the perspective of designer and maker"
- Author: “by Yuxiang Cheng"
  <!-- I’ll be talking about how we should be unapologetically unprofessional in dealing with electronics.-->

  1.0 **Part 1** - Part 1 Cover

- Structure: cover page plus a quote at the bottom
- Title:”Part 1: EE Speedrun"
- Quote:”All computing is physical. —— Tom Igoe"

  1.1 **Arduino** - drawing on past experiences

- Structure: a heading and a big image
- Heading: We have all played with this
- Image: https://www.makerspaces.com/wp-content/uploads/2017/05/2-Blink-an-LED_LARGE.jpg

  1.2 **Parts** - quick intro of electric and electronic parts

- Structure: title and big image(state 1), title 2x2 named matrix of two-image units(state 2)
- State 1 image: https://www.ultralibrarian.com/wp-content/uploads/2022/06/shutterstock_7865275181.jpg
- State 1 Notes: title “Vendors”, Item: Digikey, Mouser
- State 2: Use title “and Modules”. The four units(wraps) in the matrix are: Eval.jpg and Eval.gif with name “Evaluation Board"; with name “Connector"
- State 2 Notes: title “Vendors”, Item: Adafruit, Sparkfun, Seeed Studio

  1.3 **Laws** - quick intro of related physics

- Structure: Iceberg Chart

  1.4 **MCU** - microcontroller systems and development platforms

- Structure: conceptual overview with glassmorphism design (state 1) and detailed technical comparison (state 2)
- State 1: MCU collage with floating equation
  Image: MCU.jpg collage showing various microcontroller examples
  Overlay: Pink glassmorphism text box positioned above image (-80px from top)
  Equation: "Arduino" or "microcontroller" = MCU Chip + Development Board + Peripherals
  Design: 60% opacity pink background with blur effects, white text, enhanced shadows
- State 2: Comprehensive MCU comparison matrix
  Layout: Top section (MCU Chips) with 4-column grid comparison
  MCU Types: ARM Cortex-M, ESP32/ESP8266, RISC-V, AVR architectures
  Features: Pros/cons analysis with enlarged text (1.3em headers, 1em content)
  Development Boards: Bottom section with platform examples and research citations
  Notes: Links to Seeed Studio Xiao, Adafruit QT Py, Teensy platforms

  1.5 **Prototyping** - prototyping methods and tools

- Structure: list with images on the left and text on the right

  1.6 **Software** - programming environments and tools for hardware

- Structure: list with images on the left and text on the right

  1.7 **Protocol** - signal/communication protocols and method
  Structure: list with images on the left and text on the right

  1.8 **Networking** - methods to (wirelessly) interconnect hardware

- Structure: list with images on the left and text on the right

  2.0 **Part 2** - Part 2 Cover

- Structure: cover page
- Title: “Inputs and Outputs"
- Subtitle: “and the cybernetic systems we rely on"

  2.1 **Actuator** - intro to actuators

- Structure: 3-state system with introduction, detailed categories, and specialized types
- State 0: Introduction with scope overview
  Content: "Output devices that convert electrical signals into physical actions"
  Preview lists: Covered (Motors, Electromagnets, Servo Motor, Linear Motor) vs Uncovered (Pneumatic, Hydraulic, Thermal, Piezoelectric, Shape-changing material)
- State 1: "Electromagnetic Actuators", subtitled "move and actuate"
  Layout: 一一二 pattern - 2 pink blocks (Motors, Electromagnets) + 2 stacked green blocks (Servo Motor, Linear Motor)
  Motors: AC motors, Brushed DC motors, BLDC motors
  Electromagnets: Push/Pull Solenoids, Relay Coils, \* PCB magnets
  Servo Motor: Inline description explaining system with encoder feedback
  Linear Motor: Inline description of direct linear motion design
- State 2: "Photo-Actuators", subtitled "show and display"
  Content: 2x2 grid - LED Arrays, OLED Displays, LCD Screens, E-Paper Displays
  Images: 4 placeholder images (bottom row)

  2.2 **Sensor** - intro to sensors

- Structure: 3-state system with introduction, detailed categories, and specialized types
- State 0: Introduction with scope overview
  Content: "Input devices that convert physical phenomena into electrical signals"
  Preview lists: Covered (Environmental, Thin-Film, MEMS, Biometric) vs Uncovered (LiDAR, Ultrasonic, Hall effect, Capacitive touch)
- State 1: "Analog Sensors", subtitled "basically family of weird resistors"
  Layout: 2-column grid with organized categories
  Environmental: Thermistor, Photocell, Chemresistor, Gas Sensors
  Thin-Film: FSR(Force), Strain Gauge, Soft Potentiometer, Soft Piezo, and more
  Images: R1, R2, Film1, Film2 (bottom row, 200px height)
- State 2: "MEMS Sensors", subtitled "Micro-Electro-Mechanical Systems"
  Layout: 3-column grid for comprehensive coverage
  Content: IMU (Inertia Measuring Unit), Microphone, Magnetometers, Barometric, Pressure, and many more
  Images: MEMS0, MEMS1, MEMS2, MEMS3 (bottom row, 200px height)

  2.3 **Biometric** - highlighting the biometric sensors

- Structure: dual image layout (state 1) and organized sensor categories (state 2)
- State 1: Two side-by-side images without glow effects
  Images: biometrics.png (left) + face.png (right), 45% width each
- State 2: Structured content with 2-column grid layout
  Bio-electric: GSR(Galvanic Skin Response), PPG(Photoplethysmogram), EMG(Electromyography), EEG(Electroencephalography)
  Identity & Access: Camera (Facial recognition), Microphone (Voiceprint Recognition)
  Images:

  3.0 **Part 3** - Part 3 Cover

- Structure: cover page
- Title: "Part 3: Get ready for the Workshop" (enlarged text - 2.8em)

  3.1 **Your Kit** - introducing the kit

- Structure: image (state 1) and form (state 2)

  3.2 **Warm-up** - initial exercise for hardware (15min)

- Structure: image (state 1) and form (state 2)

  3.3 **Hard Mode** - hard task covering many topics covered (45min)

- Structure: image (state 1) and form (state 2)

  3.4 **System Diagram** - Hardware-web system and signal flow

- Structure: image (state 1) and form (state 2)
