#!/usr/bin/env python3
"""
HTPAAC Screenshot-based PDF Generator
Takes screenshots of each slide and combines them into a PDF
"""

import os
import sys
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
    from PIL import Image
except ImportError:
    print("Error: Required libraries missing.")
    print("Install with: pip install playwright pillow")
    print("Then run: playwright install chromium")
    sys.exit(1)


def screenshot_slides_to_pdf(input_file='index.html', output_file='HTPAAC_Screenshots.pdf'):
    """Navigate through slides, take screenshots, combine into PDF"""

    if not os.path.exists(input_file):
        print(f"Error: '{input_file}' not found!")
        return False

    print(f"Creating PDF from slide screenshots...")

    screenshots = []

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Set viewport for good resolution
            page.set_viewport_size({'width': 1920, 'height': 1080})

            # Load page
            file_path = Path(input_file).resolve()
            print(f"Loading: {file_path}")
            page.goto(f'file://{file_path}', wait_until='networkidle')

            # Wait for JS
            print("Initializing...")
            page.wait_for_timeout(3000)

            # Get slide count
            slide_count = page.evaluate('''
                (() => {
                    if (typeof CONFIG !== "undefined" && CONFIG.SLIDE_COUNT) {
                        return CONFIG.SLIDE_COUNT;
                    }
                    return document.querySelectorAll('.slide').length;
                })()
            ''')
            print(f"Found {slide_count} slides")

            # Get slide info
            slide_titles = page.evaluate('window.slideTitles || []')

            # Initialize slide states and set correct max states
            max_states = page.evaluate('''
                (() => {
                    // Initialize first
                    if (typeof initializeSlideStates === "function") {
                        initializeSlideStates();
                    }

                    // Create or update maxSlideStates array
                    if (!window.maxSlideStates) {
                        window.maxSlideStates = new Array(19).fill(1);
                    }

                    // Set the correct max states based on the code
                    window.maxSlideStates[3] = 2;   // Parts - 2 states
                    window.maxSlideStates[5] = 2;   // MCU - 2 states
                    window.maxSlideStates[6] = 2;   // Fabrication - 2 states
                    window.maxSlideStates[11] = 3;  // Actuator - 3 states
                    window.maxSlideStates[12] = 3;  // Sensor - 3 states
                    window.maxSlideStates[13] = 2;  // Biometric - 2 states
                    window.maxSlideStates[15] = 2;  // Your Kit - 2 states (placeholder)
                    window.maxSlideStates[16] = 2;  // Warm-up - 2 states (placeholder)
                    window.maxSlideStates[17] = 2;  // Hard Mode - 2 states (placeholder)
                    window.maxSlideStates[18] = 2;  // System Diagram - 2 states (placeholder)

                    return window.maxSlideStates;
                })()
            ''')
            print(f"Max states per slide: {max_states}")

            # Navigate through each slide
            for slide_idx in range(slide_count):
                slide_title = slide_titles[slide_idx] if slide_idx < len(slide_titles) else f"Slide {slide_idx + 1}"

                # Go to slide
                print(f"\nSlide {slide_idx + 1}/{slide_count}: {slide_title}")
                page.evaluate(f'if (typeof goToSlide === "function") goToSlide({slide_idx})')
                page.wait_for_timeout(1000)

                # Check how many states this slide has
                states = max_states[slide_idx] if slide_idx < len(max_states) else 1

                # Capture each state
                for state in range(states):
                    if state > 0:
                        # Advance to next state
                        print(f"  State {state + 1}/{states}")
                        page.evaluate(f'''
                            if (typeof slideStates !== "undefined") {{
                                slideStates[{slide_idx}] = {state};
                            }}
                            if (typeof triggerSlideStateChange === "function") {{
                                triggerSlideStateChange({slide_idx}, {state});
                            }}
                        ''')
                        page.wait_for_timeout(500)

                    # Take screenshot
                    screenshot_path = f"temp_slide_{slide_idx}_{state}.png"
                    page.screenshot(path=screenshot_path, full_page=False)
                    screenshots.append(screenshot_path)
                    print(f"  ✓ Captured")

            browser.close()

        # Combine screenshots into PDF
        if screenshots:
            print(f"\nCombining {len(screenshots)} screenshots into PDF...")
            images = []
            for path in screenshots:
                img = Image.open(path)
                # Convert RGBA to RGB if needed
                if img.mode == 'RGBA':
                    rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                    rgb_img.paste(img, mask=img.split()[3] if len(img.split()) > 3 else None)
                    img = rgb_img
                images.append(img)

            # Save as PDF
            if images:
                images[0].save(
                    output_file,
                    "PDF",
                    save_all=True,
                    append_images=images[1:],
                    resolution=100.0
                )

            # Clean up temp files
            for path in screenshots:
                try:
                    os.remove(path)
                except:
                    pass

            print(f"\n✅ Successfully created: {output_file}")
            print(f"Size: {os.path.getsize(output_file):,} bytes")
            return True
        else:
            print("No screenshots captured!")
            return False

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

        # Clean up any temp files
        for path in screenshots:
            try:
                os.remove(path)
            except:
                pass

        return False


if __name__ == '__main__':
    screenshot_slides_to_pdf()