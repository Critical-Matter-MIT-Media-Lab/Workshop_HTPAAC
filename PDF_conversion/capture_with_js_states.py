#!/usr/bin/env python3
"""
PDF generation using JavaScript state management directly
"""

import os
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Error: Playwright is required")
    print("Install with: pip install playwright && playwright install chromium")
    exit(1)

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is required")
    print("Install with: pip install Pillow")
    exit(1)


def capture_with_js_states():
    """Generate PDF by directly calling JavaScript state functions"""

    # Map slide indices to their IDs and states
    slide_config = [
        (0, 'slide-0', 1, 'Intro'),
        (1, 'slide-1.0', 1, 'Part_1'),
        (2, 'slide-1.1', 1, 'Arduino'),
        (3, 'slide-1.2', 1, 'Laws'),
        (4, 'slide-1.3', 2, 'Parts'),
        (5, 'slide-1.4', 2, 'MCU'),
        (6, 'slide-1.5', 2, 'Fabrication'),
        (7, 'slide-1.6', 1, 'Software'),
        (8, 'slide-1.7', 1, 'Protocol'),
        (9, 'slide-1.8', 1, 'Networking'),
        (10, 'slide-2.0', 1, 'Part_2'),
        (11, 'slide-2.1', 3, 'Actuator'),
        (12, 'slide-2.2', 3, 'Sensor'),
        (13, 'slide-2.3', 2, 'Biometric'),
        (14, 'slide-3.0', 1, 'Part_3'),
        (15, 'slide-3.1', 2, 'Your_Kit'),
        (16, 'slide-3.2', 3, 'Warm-up'),
        (17, 'slide-3.3', 3, 'Hard_Mode'),
    ]

    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)

        # Create page with HD resolution
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            device_scale_factor=1
        )
        page = context.new_page()

        # Navigate to presentation
        file_path = Path('../index.html').absolute()
        url = f'file://{file_path}'
        print(f"Opening presentation: {url}")
        page.goto(url, wait_until='networkidle')

        # Wait for initialization
        print("Waiting for presentation to load...")
        page.wait_for_timeout(5000)

        # Take screenshots
        screenshots = []
        screenshot_counter = 0

        for slide_index, slide_id, num_states, slide_name in slide_config:
            print(f"\nProcessing slide {slide_index} ({slide_id}) - {slide_name} ({num_states} state(s))...")

            # Navigate to slide using JavaScript directly
            page.evaluate(f'''
                () => {{
                    // Reset slide state for this slide
                    if (window.slideStates) {{
                        window.slideStates[{slide_index}] = 0;
                    }}

                    // Navigate to the slide
                    if (window.goToSlide) {{
                        window.goToSlide({slide_index});
                    }} else {{
                        // Fallback: manually set currentSlide and update display
                        window.currentSlide = {slide_index};

                        // Hide all slides
                        document.querySelectorAll('.slide').forEach(s => {{
                            s.classList.remove('active');
                            s.style.display = 'none';
                        }});

                        // Show the target slide
                        const targetSlide = document.querySelectorAll('.slide')[{slide_index}];
                        if (targetSlide) {{
                            targetSlide.classList.add('active');
                            targetSlide.style.display = 'block';
                            targetSlide.style.opacity = '1';
                        }}
                    }}

                    // Hide navigation UI
                    const elements = ['.navigation', '.progress-container', '.slide-note'];
                    elements.forEach(sel => {{
                        const el = document.querySelector(sel);
                        if (el) el.style.display = 'none';
                    }});
                }}
            ''')

            # Wait for slide to render
            page.wait_for_timeout(2000)

            # Capture states
            for state in range(num_states):
                if state == 0:
                    print(f"  Capturing state 1/{num_states}")
                else:
                    print(f"  Capturing state {state + 1}/{num_states}")

                    # Trigger state change using JavaScript
                    result = page.evaluate(f'''
                        () => {{
                            // Make sure we're on the right slide
                            window.currentSlide = {slide_index};

                            // Call toggleSlideState to advance to next state
                            if (window.toggleSlideState) {{
                                const success = window.toggleSlideState();
                                console.log('State toggle result:', success);

                                // Also trigger the state change handler directly if needed
                                if (window.triggerSlideStateChange) {{
                                    window.triggerSlideStateChange({slide_index}, {state});
                                }}

                                return {{
                                    success: success,
                                    currentState: window.slideStates ? window.slideStates[{slide_index}] : -1
                                }};
                            }}
                            return {{ success: false, currentState: -1 }};
                        }}
                    ''')

                    print(f"    State change result: {result}")

                    # Wait for state change to render
                    page.wait_for_timeout(2000)

                # Take screenshot
                screenshot_path = f'slide_{screenshot_counter:03d}_{slide_name}_state{state + 1}.png' if num_states > 1 else f'slide_{screenshot_counter:03d}_{slide_name}.png'
                page.screenshot(path=screenshot_path, full_page=False)
                screenshots.append(screenshot_path)
                print(f"    ✓ Saved {screenshot_path}")
                screenshot_counter += 1

        browser.close()

    # Convert to PDF
    print(f"\nCreating PDF from {len(screenshots)} screenshots...")

    if not screenshots:
        print("ERROR: No screenshots were taken!")
        return False

    # Load all images
    images = []
    for screenshot_path in screenshots:
        if os.path.exists(screenshot_path):
            print(f"  Loading {screenshot_path}")
            img = Image.open(screenshot_path)

            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'RGBA':
                    rgb_img.paste(img, mask=img.split()[3])
                else:
                    rgb_img.paste(img)
                images.append(rgb_img)
            else:
                images.append(img)

    if not images:
        print("ERROR: No images were loaded!")
        return False

    # Save as multi-page PDF
    output_file = 'HTPAAC_JSStates.pdf'
    print(f"\nSaving PDF with {len(images)} pages...")

    images[0].save(
        output_file,
        "PDF",
        save_all=True,
        append_images=images[1:] if len(images) > 1 else [],
        resolution=100.0
    )

    print(f"✅ PDF created: {output_file}")
    print(f"   Total pages: {len(images)}")

    # File size
    file_size = os.path.getsize(output_file)
    print(f"   File size: {file_size:,} bytes")

    # Clean up temporary screenshots
    print("\nCleaning up screenshots...")
    for screenshot_path in screenshots:
        if os.path.exists(screenshot_path):
            os.remove(screenshot_path)
    print("✅ Cleanup complete")

    return True


if __name__ == "__main__":
    success = capture_with_js_states()
    if not success:
        print("\n❌ PDF generation failed!")
        exit(1)