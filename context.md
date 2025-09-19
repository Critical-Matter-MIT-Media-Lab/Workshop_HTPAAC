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
- **2.1 Sensor**: 3 states (Analog → MEMS with real images → Additional types)
- **2.2 Actuator**: 3 states (Electromagnetic → Photo → Additional types)
- **2.3 Biometric**: 2 states (overview image ↔ sensor list)
- **3.1 Kit**: 2 states (kit image ↔ form/details)

#### Image Layout System

- **Consistent Heights**: Top images 220px, bottom images 280px for visual hierarchy
- **Aspect Ratio Preservation**: object-fit: contain prevents distortion
- **Grouped Alignment**: image-group-wrapper ensures consistent baseline alignment
- **MEMS Integration**: Real MEMS0-3 images from img/ folder properly displayed

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





## Presentation

0 **Intro** - Title slide
- Structure: Three lines of text
- Title: "HOW TO PROTOTYPE (ALMOST) ANY CIRCUIT"
- Subtitle: "from the perspective of designer and maker"
- Author: “by Yuxiang Cheng"
Notes: I’ll be talking about how we should be unapologetically unprofessional in dealing with electronics.

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
- State 2: Use title “and Modules”. The four units(wraps) in the matrix are: Eval.jpg and Eval.gif with name “Evaluation Board";  with name “Connector"

  1.3 **Laws** - quick intro of related physics
- Structure: Iceberg Chart

  1.4 **MCU** - quick intro of microcontrollers
- Structure: image collage (state 1) and description (state 2)

  1.5 **Prototyping** - prototyping methods and tools
- Structure: list with images on the left and text on the right 

  1.6 **Production** - methods to design production-ready and robust circuits
- Structure: list with images on the left and text on the right 

  1.7 **Software** - programming environments and tools for hardware
- Structure: list with images on the left and text on the right 

  1.8 **Protocol** - signal/communication protocols and method
- Structure: list with images on the left and text on the right 

  1.9 **Networking** - methods to (wirelessly) interconnect hardware
- Structure: list with images on the left and text on the right 


  2.0 **Part 2** - Part 2 Cover
- Structure: cover page
- Title: “Part 2: Meet the Sensors and Actuators"
- Subtitle: “and the cybernetic systems we rely on"

  2.1 **Sensor** - intro to sensors
- Structure: organized text of items (in the middle) and images (top and bottom) with title (state 1, 2, 3)
- State 1 is titled “Analog Sensors”, subtitled “basically family of weird resistors"
  State 1 items:
  Thin-Film: FSR(Force), Strain Gauge, Soft Potentiometer, Soft Piezo, and more.
  Actual 
  
- State 2 is titled “MEMS Sensors”, subtitled (Micro-Electro-Mechanical Systems), put MEMS0 and MEMS1 at the bottom, put MEMS3 and MEMS 4 on the top.
  State 2 items:

  2.2 **Actuator** - intro to actuators
- Structure: organized text of items (in the middle) and images (top and bottom) with title (state 1, 2, 3)
- State 1 is titled “Electromagnetic Actuators”, subtitled “move and actuate"
  State 1 items: 
- State 2 is titled “Photo Actuators”, subtitled "show and display"
  State 2 items:

  2.3 **Biometric** - highlighting the biometric sensors
- Structure: image (state 1) and list of sensors (state 2)
- Image: /img/biometrics.png


  3.0 **Part 3** - Part 3 Cover
- Structure: cover page
- Title: “Part 3: Get ready for the Workshop"

  3.1 **Kit** - introducing the kit
- Structure: image (state 1) and form (state 2)

  3.3 **System Diagram** - Hardware-web system and signal flow
- Structure: image (state 1) and form (state 2)
