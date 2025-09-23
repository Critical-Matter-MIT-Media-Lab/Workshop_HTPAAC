#!/usr/bin/env python3
"""
HTPAAC Slideshow Export - Simple and Fast
Forces all slides visible and captures them in a single PDF
"""

import os
import sys
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Error: Playwright is required.")
    print("Install with: pip install playwright && playwright install chromium")
    sys.exit(1)


def export_slides(input_file='index.html', output_file='HTPAAC_Export.pdf'):
    """Export all slides by making them visible at once"""

    if not os.path.exists(input_file):
        print(f"Error: '{input_file}' not found!")
        return False

    print(f"Exporting HTPAAC slides to PDF...")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Large viewport
            page.set_viewport_size({'width': 1920, 'height': 1080})

            # Load page
            file_path = Path(input_file).resolve()
            print(f"Loading: {file_path}")
            page.goto(f'file://{file_path}', wait_until='networkidle')

            # Wait for JS
            print("Initializing...")
            page.wait_for_timeout(3000)

            # Force ALL slides and their content to be visible
            print("Rendering all slides...")
            page.evaluate('''
                (() => {
                    // Initialize if needed
                    if (typeof initializeSlideStates === 'function') {
                        initializeSlideStates();
                    }

                    // Get all slides
                    const slides = document.querySelectorAll('.slide');
                    console.log('Found slides:', slides.length);

                    // Create a new container for all slides
                    const exportContainer = document.createElement('div');
                    exportContainer.style.cssText = 'background: white; padding: 0; margin: 0;';

                    // Process each slide
                    slides.forEach((slide, index) => {
                        console.log('Processing slide', index, slide.id);

                        // Create slide wrapper
                        const slideWrapper = document.createElement('div');
                        slideWrapper.style.cssText = `
                            page-break-after: always;
                            min-height: 100vh;
                            padding: 40px;
                            background: white;
                            margin-bottom: 20px;
                            border-bottom: 2px solid #ccc;
                        `;

                        // Add title
                        const title = document.createElement('h1');
                        title.style.cssText = 'color: #FF1493; font-size: 2.5em; margin-bottom: 30px;';
                        const slideTitle = window.slideTitles ? window.slideTitles[index] : '';
                        const slideNumber = window.slideNumbers ? window.slideNumbers[index] : index;
                        title.textContent = `${slideNumber}. ${slideTitle || 'Slide ' + (index + 1)}`;
                        slideWrapper.appendChild(title);

                        // Clone slide content
                        const slideClone = slide.cloneNode(true);
                        slideClone.style.display = 'block';
                        slideClone.style.opacity = '1';
                        slideClone.style.position = 'relative';

                        // Get content container or full slide
                        let content = slideClone.querySelector('.content-container');
                        if (!content) {
                            content = slideClone;
                        }

                        // Special handling for slides with dynamic content
                        const slideId = slide.id;

                        // Handle slides that use innerHTML for dynamic content
                        if (slideId === 'parts' && typeof handlePartsSlideState === 'function') {
                            // Create content for both states
                            const statesDiv = document.createElement('div');

                            // State 0
                            handlePartsSlideState(0);
                            const state0Content = slide.querySelector('.content-container');
                            if (state0Content) {
                                const state0 = document.createElement('div');
                                state0.innerHTML = '<h2 style="color: #FF1493;">Parts</h2>' + state0Content.innerHTML;
                                statesDiv.appendChild(state0);
                            }

                            // State 1
                            handlePartsSlideState(1);
                            const state1Content = slide.querySelector('.content-container');
                            if (state1Content) {
                                const state1 = document.createElement('div');
                                state1.style.marginTop = '50px';
                                state1.innerHTML = '<h2 style="color: #FF1493;">Modules</h2>' + state1Content.innerHTML;
                                statesDiv.appendChild(state1);
                            }

                            slideWrapper.appendChild(statesDiv);
                        }
                        else if (slideId === 'fabrication' && typeof handleFabricationSlideState === 'function') {
                            const statesDiv = document.createElement('div');

                            handleFabricationSlideState(0);
                            let state0Content = slide.querySelector('.content-container');
                            if (state0Content) {
                                const state0 = document.createElement('div');
                                state0.innerHTML = state0Content.innerHTML;
                                statesDiv.appendChild(state0);
                            }

                            handleFabricationSlideState(1);
                            let state1Content = slide.querySelector('.content-container');
                            if (state1Content) {
                                const state1 = document.createElement('div');
                                state1.style.marginTop = '50px';
                                state1.innerHTML = state1Content.innerHTML;
                                statesDiv.appendChild(state1);
                            }

                            slideWrapper.appendChild(statesDiv);
                        }
                        else if (slideId === 'mcu' && typeof handleMCUSlideState === 'function') {
                            const statesDiv = document.createElement('div');

                            for (let s = 0; s <= 1; s++) {
                                handleMCUSlideState(s);
                                let stateContent = slide.querySelector('.content-container');
                                if (stateContent) {
                                    const stateDiv = document.createElement('div');
                                    if (s > 0) stateDiv.style.marginTop = '50px';
                                    stateDiv.innerHTML = stateContent.innerHTML;
                                    statesDiv.appendChild(stateDiv);
                                }
                            }

                            slideWrapper.appendChild(statesDiv);
                        }
                        else if (slideId === 'sensor' && typeof handleSensorSlideState === 'function') {
                            const statesDiv = document.createElement('div');

                            for (let s = 0; s <= 2; s++) {
                                handleSensorSlideState(s);
                                let stateContent = slide.querySelector('.content-container');
                                if (stateContent) {
                                    const stateDiv = document.createElement('div');
                                    if (s > 0) stateDiv.style.marginTop = '50px';
                                    stateDiv.innerHTML = stateContent.innerHTML;
                                    statesDiv.appendChild(stateDiv);
                                }
                            }

                            slideWrapper.appendChild(statesDiv);
                        }
                        else if (slideId === 'actuator' && typeof handleActuatorSlideState === 'function') {
                            const statesDiv = document.createElement('div');

                            for (let s = 0; s <= 2; s++) {
                                handleActuatorSlideState(s);
                                let stateContent = slide.querySelector('.content-container');
                                if (stateContent) {
                                    const stateDiv = document.createElement('div');
                                    if (s > 0) stateDiv.style.marginTop = '50px';
                                    stateDiv.innerHTML = stateContent.innerHTML;
                                    statesDiv.appendChild(stateDiv);
                                }
                            }

                            slideWrapper.appendChild(statesDiv);
                        }
                        else if (slideId === 'biometric' && typeof handleBiometricSlideState === 'function') {
                            const statesDiv = document.createElement('div');

                            for (let s = 0; s <= 1; s++) {
                                handleBiometricSlideState(s);
                                let stateContent = slide.querySelector('.content-container');
                                if (stateContent) {
                                    const stateDiv = document.createElement('div');
                                    if (s > 0) stateDiv.style.marginTop = '50px';
                                    stateDiv.innerHTML = stateContent.innerHTML;
                                    statesDiv.appendChild(stateDiv);
                                }
                            }

                            slideWrapper.appendChild(statesDiv);
                        }
                        else {
                            // Regular slide - just copy content
                            slideWrapper.appendChild(content);
                        }

                        exportContainer.appendChild(slideWrapper);
                    });

                    // Replace body content
                    document.body.innerHTML = '';
                    document.body.style.cssText = 'margin: 0; padding: 0; background: white; font-family: -apple-system, sans-serif;';
                    document.body.appendChild(exportContainer);

                    // Hide any remaining navigation
                    const navElements = document.querySelectorAll('.nav-btn, .progress-container, .revolver-wheel, .chamber');
                    navElements.forEach(el => el.style.display = 'none');
                })();
            ''')

            # Wait for content to settle
            print("Waiting for content to render...")
            page.wait_for_timeout(5000)

            # Generate PDF
            print("Generating PDF...")
            page.pdf(
                path=output_file,
                format='A4',
                print_background=True,
                margin={
                    'top': '15mm',
                    'right': '15mm',
                    'bottom': '15mm',
                    'left': '15mm'
                }
            )

            browser.close()

            print(f"\n✅ Successfully created: {output_file}")
            print(f"Size: {os.path.getsize(output_file):,} bytes")
            return True

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    export_slides()