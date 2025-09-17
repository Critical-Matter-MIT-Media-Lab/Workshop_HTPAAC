# HOW TO PROTOTYPE (ALMOST) ANY CIRCUIT

## Project Context & Overview

### Project Description

This is an interactive web-based slideshow presentation system titled "HOW TO PROTOTYPE (ALMOST) ANY CIRCUIT" with the subtitle "from the perspective of designer and maker".

### Technology Stack

- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Fonts**: Local Terminess Nerd Font Propo with Google Fonts fallback
- **Performance**: Lazy loading system for images and resources
- **Special Feature**: Unique "revolver-style" progress indicator
- **Navigation**: Multiple input methods (keyboard, mouse, touch)
- **Loading**: Smooth loading overlay with spinner animation

### File Structure

```
HTPAAC/
├── index.html          # Main HTML file containing 17 slides
├── script.js           # JavaScript control logic with lazy loading
├── styles.css          # CSS styling with loading animations
├── context.md          # This document - project context
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

- 17 chambers corresponding to 17 slides
- Displays slide numbers as defined in markdown (0, 1.0, 1.1, 1.2, etc.)
- Enhanced visual effects: glowing active chamber with pulse animation
- Larger size (280px) positioned near bottom of viewport
- Rotating animation showing current progress
- Appears on mouse movement, auto-hides after 1 second
- Clickable chambers for direct slide navigation
- Bold text display for slide numbers and titles

#### Multiple Interaction Methods

- **Optimized Arrow Keys**: Smart detection between fast clicks vs. hold (1sec delay for auto-repeat)
- **Keyboard Navigation**: Arrow keys, Space, Enter, number keys 1-9, ESC, P key
- **Mouse Navigation**: Click left half for previous, right half for next
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

#### Loading Experience

- **Smooth Startup**: Loading overlay with animated spinner
- **Black Background**: Prevents white flash during font/resource loading
- **Progressive Enhancement**: Content appears after all resources loaded
- **Font Loading**: Local fonts with web font fallbacks

#### Text Scaling

- **Optimized for Presentation**: All text elements enlarged for better visibility
- **Hierarchy**: H1 (3.5em), P (1.6em), UL (1.5em), Code (1.3em)
- **Responsive**: Maintains readability across device sizes

## Presentation Structure

0 **Intro** - Title slide

- Structure: Three lines of text
- Title: "HOW TO PROTOTYPE (ALMOST) ANY CIRCUIT"
- Subtitle: "from the perspective of designer and maker"
- Author: “by Yuxiang Cheng"

  1.0 **Part 1** - Part 1 Cover

- Structure: cover page plus a quote at the bottom
- Title:”Part 1: EE Speedrun"
- Quote:”All computing is physical. —— Tom Igoe"

  1.1 **Arduino** - drawing on students’ past experiences

- Structure: a heading and a big image
- Heading: We have all played with this, right?
- Image: https://www.makerspaces.com/wp-content/uploads/2017/05/2-Blink-an-LED_LARGE.jpg

  1.2 **Parts** - quick intro of electric and electronic parts

- Structure: a heading and a big image
-
- Image: https://www.ultralibrarian.com/wp-content/uploads/2022/06/shutterstock_7865275181.jpg

  1.3 **Laws** - quick intro of related physics

- Structure: Iceberg Chart

  1.4 **MCU** - quick intro of microcontrollers

- Structure:

  1.5 **Prototyping** - prototyping methods and tools

- Structure:

  1.6 **Production** - methods to design production-ready and robust circuits

- Structure:

  1.7 **Protocol** - signal/communication protocols and method

- Structure:

  1.8 **Networking** - methods to (wirelessly) interconnect hardware

- Structure:

  1.9 **Best Practice** - final notes

- Structure:

  2.0 **Part 2** - Part 2 Cover

- Structure: cover page
- Title: “Part 2: Meet the Sensors and Actuators"
- Subtitle: “and the cybernetic systems we rely on"

  2.5 **Biometric** - highlighting the biometric sensors

- Structure:

  3.0 **Part 3** - Part 3 Cover

- Structure:

  3.1 **Workshop** -

- Structure:
