#!/usr/bin/env python3
"""
HTPAAC Slideshow to PDF Converter
Specialized script for converting the HTPAAC interactive presentation to PDF,
capturing all slides and their multiple states.
"""

import argparse
import os
import sys
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    print("Error: Playwright is required for this script.")
    print("Install with: pip install playwright && playwright install chromium")
    sys.exit(1)


def convert_htpaac_to_pdf(input_file='index.html', output_file='HTPAAC_Complete.pdf', capture_all_states=True):
    """
    Convert HTPAAC slideshow to PDF with all dynamic content

    Args:
        input_file: Path to the HTML file
        output_file: Output PDF filename
        capture_all_states: Whether to capture all states of multi-state slides
    """

    # Ensure input file exists
    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found!")
        return False

    print(f"Converting HTPAAC presentation to PDF...")
    print(f"Input: {input_file}")
    print(f"Output: {output_file}")

    try:
        with sync_playwright() as p:
            # Launch browser
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Set large viewport for better rendering
            page.set_viewport_size({'width': 1920, 'height': 1080})

            # Load the page
            file_path = Path(input_file).resolve()
            url = f'file://{file_path}'
            print(f"Loading page: {url}")
            page.goto(url, wait_until='networkidle')

            # Wait for initial JavaScript execution
            print("Waiting for JavaScript to initialize...")
            page.wait_for_timeout(3000)

            # Execute JavaScript to prepare slides for PDF export
            print("Preparing slides for PDF export...")

            if capture_all_states:
                # Capture all states of each slide
                page.evaluate('''
                    // Store original functions
                    const originalFunctions = {
                        handleParts: typeof handlePartsSlideState === 'function' ? handlePartsSlideState : null,
                        handleFabrication: typeof handleFabricationSlideState === 'function' ? handleFabricationSlideState : null,
                        handleMCU: typeof handleMCUSlideState === 'function' ? handleMCUSlideState : null,
                        handleSensor: typeof handleSensorSlideState === 'function' ? handleSensorSlideState : null,
                        handleActuator: typeof handleActuatorSlideState === 'function' ? handleActuatorSlideState : null,
                        handleBiometric: typeof handleBiometricSlideState === 'function' ? handleBiometricSlideState : null
                    };

                    // Create container for all slide states
                    const container = document.createElement('div');
                    container.id = 'pdf-export-container';
                    container.style.cssText = 'background: #000; color: #fff; font-family: sans-serif;';

                    // Get slide information
                    const slides = document.querySelectorAll('.slide');
                    const slideTitles = window.slideTitles || [];
                    const slideNumbers = window.slideNumbers || [];

                    // Process each slide
                    slides.forEach((slide, index) => {
                        const slideWrapper = document.createElement('div');
                        slideWrapper.style.cssText = 'page-break-after: always; min-height: 100vh; padding: 40px; background: #000;';

                        // Add slide header
                        const header = document.createElement('div');
                        header.style.cssText = 'margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;';
                        header.innerHTML = `
                            <h1 style="color: #FF1493; font-size: 2.5em; margin: 0;">
                                ${slideNumbers[index] || index}. ${slideTitles[index] || `Slide ${index + 1}`}
                            </h1>
                        `;
                        slideWrapper.appendChild(header);

                        // Get content container
                        const contentDiv = document.createElement('div');
                        contentDiv.className = 'content-container';
                        contentDiv.style.cssText = 'padding: 20px;';

                        // Check for multi-state slides
                        const slideId = slide.id;
                        let hasMultipleStates = false;

                        // Special handling for known multi-state slides
                        if (slideId === 'parts' && originalFunctions.handleParts) {
                            hasMultipleStates = true;
                            // State 0
                            const state0 = document.createElement('div');
                            state0.innerHTML = '<h2 style="color: #FF1493;">State 1: Parts Overview</h2>';
                            originalFunctions.handleParts(0);
                            const content0 = document.querySelector('#parts .content-container');
                            if (content0) state0.innerHTML += content0.innerHTML;
                            contentDiv.appendChild(state0);

                            // State 1
                            const state1 = document.createElement('div');
                            state1.style.marginTop = '60px';
                            state1.innerHTML = '<h2 style="color: #FF1493;">State 2: Modules</h2>';
                            originalFunctions.handleParts(1);
                            const content1 = document.querySelector('#parts .content-container');
                            if (content1) state1.innerHTML += content1.innerHTML;
                            contentDiv.appendChild(state1);
                        }
                        else if (slideId === 'fabrication' && originalFunctions.handleFabrication) {
                            hasMultipleStates = true;
                            for (let state = 0; state <= 1; state++) {
                                const stateDiv = document.createElement('div');
                                if (state > 0) stateDiv.style.marginTop = '60px';
                                stateDiv.innerHTML = '<h2 style="color: #FF1493;">State ' + (state + 1) + '</h2>';
                                originalFunctions.handleFabrication(state);
                                const content = document.querySelector('#fabrication .content-container');
                                if (content) stateDiv.innerHTML += content.innerHTML;
                                contentDiv.appendChild(stateDiv);
                            }
                        }
                        else if (slideId === 'mcu' && originalFunctions.handleMCU) {
                            hasMultipleStates = true;
                            for (let state = 0; state <= 1; state++) {
                                const stateDiv = document.createElement('div');
                                if (state > 0) stateDiv.style.marginTop = '60px';
                                stateDiv.innerHTML = '<h2 style="color: #FF1493;">State ' + (state + 1) + '</h2>';
                                originalFunctions.handleMCU(state);
                                const content = document.querySelector('#mcu .content-container');
                                if (content) stateDiv.innerHTML += content.innerHTML;
                                contentDiv.appendChild(stateDiv);
                            }
                        }
                        else if (slideId === 'sensor' && originalFunctions.handleSensor) {
                            hasMultipleStates = true;
                            for (let state = 0; state <= 2; state++) {
                                const stateDiv = document.createElement('div');
                                if (state > 0) stateDiv.style.marginTop = '60px';
                                const stateNames = ['Introduction', 'Analog Sensors', 'MEMS Sensors'];
                                stateDiv.innerHTML = '<h2 style="color: #FF1493;">State ' + (state + 1) + ': ' + stateNames[state] + '</h2>';
                                originalFunctions.handleSensor(state);
                                const content = document.querySelector('#sensor .content-container');
                                if (content) stateDiv.innerHTML += content.innerHTML;
                                contentDiv.appendChild(stateDiv);
                            }
                        }
                        else if (slideId === 'actuator' && originalFunctions.handleActuator) {
                            hasMultipleStates = true;
                            for (let state = 0; state <= 2; state++) {
                                const stateDiv = document.createElement('div');
                                if (state > 0) stateDiv.style.marginTop = '60px';
                                const stateNames = ['Introduction', 'Electromagnetic', 'Photo-Actuators'];
                                stateDiv.innerHTML = '<h2 style="color: #FF1493;">State ' + (state + 1) + ': ' + stateNames[state] + '</h2>';
                                originalFunctions.handleActuator(state);
                                const content = document.querySelector('#actuator .content-container');
                                if (content) stateDiv.innerHTML += content.innerHTML;
                                contentDiv.appendChild(stateDiv);
                            }
                        }
                        else if (slideId === 'biometric' && originalFunctions.handleBiometric) {
                            hasMultipleStates = true;
                            for (let state = 0; state <= 1; state++) {
                                const stateDiv = document.createElement('div');
                                if (state > 0) stateDiv.style.marginTop = '60px';
                                stateDiv.innerHTML = '<h2 style="color: #FF1493;">State ' + (state + 1) + '</h2>';
                                originalFunctions.handleBiometric(state);
                                const content = document.querySelector('#biometric .content-container');
                                if (content) stateDiv.innerHTML += content.innerHTML;
                                contentDiv.appendChild(stateDiv);
                            }
                        }

                        // If no multi-state handling, just copy current content
                        if (!hasMultipleStates) {
                            const slideContent = slide.querySelector('.content-container');
                            if (slideContent) {
                                contentDiv.innerHTML = slideContent.innerHTML;
                            } else {
                                contentDiv.innerHTML = slide.innerHTML;
                            }
                        }

                        slideWrapper.appendChild(contentDiv);
                        container.appendChild(slideWrapper);
                    });

                    // Hide original content and show export container
                    document.body.style.cssText = 'margin: 0; padding: 0; background: #000;';
                    document.body.innerHTML = '';
                    document.body.appendChild(container);

                    // Ensure images are loaded
                    const images = document.querySelectorAll('img');
                    return Promise.all(Array.from(images).map(img => {
                        if (img.complete) return Promise.resolve();
                        return new Promise((resolve) => {
                            img.addEventListener('load', resolve);
                            img.addEventListener('error', resolve);
                        });
                    }));
                ''')
            else:
                # Simple export - just show all slides in current state
                page.evaluate('''
                    // Initialize slides if needed
                    if (typeof initializeSlideStates === 'function') {
                        initializeSlideStates();
                    }

                    // Make all slides visible
                    const slides = document.querySelectorAll('.slide');
                    slides.forEach((slide, index) => {
                        slide.style.display = 'block';
                        slide.style.pageBreakAfter = 'always';
                        slide.style.marginBottom = '50px';
                        slide.style.minHeight = '100vh';
                    });

                    // Hide navigation
                    const navElements = document.querySelectorAll('.nav-btn, .progress-container, .revolver-wheel');
                    navElements.forEach(el => {
                        if (el) el.style.display = 'none';
                    });
                ''')

            # Wait for content to render
            print("Waiting for content to render...")
            page.wait_for_timeout(5000)

            # Generate PDF
            print("Generating PDF...")
            page.pdf(
                path=output_file,
                format='A4',
                print_background=True,
                margin={
                    'top': '10mm',
                    'right': '10mm',
                    'bottom': '10mm',
                    'left': '10mm'
                },
                display_header_footer=False,
                prefer_css_page_size=False,
                landscape=False
            )

            browser.close()

            print(f"\n✅ PDF successfully created: {output_file}")
            print(f"File size: {os.path.getsize(output_file):,} bytes")
            return True

    except Exception as e:
        print(f"Error during conversion: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description='Convert HTPAAC interactive slideshow to PDF',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Convert with all slide states
  python convert_slides_to_pdf.py

  # Convert with custom output name
  python convert_slides_to_pdf.py -o presentation.pdf

  # Convert only current state of each slide
  python convert_slides_to_pdf.py --simple
        '''
    )

    parser.add_argument(
        '-i', '--input',
        default='index.html',
        help='Input HTML file (default: index.html)'
    )

    parser.add_argument(
        '-o', '--output',
        default='HTPAAC_Complete.pdf',
        help='Output PDF filename (default: HTPAAC_Complete.pdf)'
    )

    parser.add_argument(
        '--simple',
        action='store_true',
        help='Simple mode - capture only current state of each slide'
    )

    args = parser.parse_args()

    # Check if input file exists
    if not os.path.exists(args.input):
        print(f"Error: Input file '{args.input}' not found!")
        sys.exit(1)

    # Perform conversion
    success = convert_htpaac_to_pdf(
        args.input,
        args.output,
        capture_all_states=not args.simple
    )

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()