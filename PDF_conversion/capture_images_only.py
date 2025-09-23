#!/usr/bin/env python3
"""
High-resolution image capture for all slides with state changes
No PDF generation - just images
"""

import os
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Error: Playwright is required")
    print("Install with: pip install playwright && playwright install chromium")
    exit(1)


def capture_images_only():
    """Generate high-resolution images for all slides"""

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

        # Create page with high resolution
        # Using 2560x1440 (QHD) with 1.5x device scale
        context = browser.new_context(
            viewport={'width': 2560, 'height': 1440},
            device_scale_factor=1.5  # 1.5x scaling for higher quality
        )
        page = context.new_page()

        # Navigate to presentation
        file_path = Path('../index.html').absolute()
        url = f'file://{file_path}'
        print(f"Opening presentation: {url}")
        print(f"Resolution: 2560x1440 @ 1.5x scale")
        page.goto(url, wait_until='networkidle')

        # Wait for initialization
        print("Waiting for presentation to load...")
        page.wait_for_timeout(3000)

        # Take screenshots
        screenshot_counter = 0
        total_images = 0

        for slide_index, slide_id, num_states, slide_name in slide_config:
            print(f"\n📸 Processing slide {slide_index} ({slide_id}) - {slide_name} ({num_states} state(s))...")

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

                    // Force high-quality image rendering
                    document.querySelectorAll('img').forEach(img => {{
                        img.style.imageRendering = 'high-quality';
                    }});
                }}
            ''')

            # Wait for slide to render
            page.wait_for_timeout(1500)

            # Capture states
            for state in range(num_states):
                if state == 0:
                    print(f"  Capturing state 1/{num_states}...")
                else:
                    print(f"  Capturing state {state + 1}/{num_states}...")

                    # Trigger state change using JavaScript
                    page.evaluate(f'''
                        () => {{
                            // Make sure we're on the right slide
                            window.currentSlide = {slide_index};

                            // Call toggleSlideState to advance to next state
                            if (window.toggleSlideState) {{
                                window.toggleSlideState();

                                // Also trigger the state change handler directly
                                if (window.triggerSlideStateChange) {{
                                    window.triggerSlideStateChange({slide_index}, {state});
                                }}
                            }}
                        }}
                    ''')

                    # Wait for state change to render
                    page.wait_for_timeout(1500)

                # Take high-resolution screenshot
                if num_states > 1:
                    screenshot_path = f'slide_{screenshot_counter:03d}_{slide_name}_state{state + 1}.png'
                else:
                    screenshot_path = f'slide_{screenshot_counter:03d}_{slide_name}.png'

                page.screenshot(
                    path=screenshot_path,
                    full_page=False,
                    type='png'
                )

                # Get file size for verification
                file_size = os.path.getsize(screenshot_path)
                print(f"    ✅ Saved {screenshot_path} ({file_size/1024:.1f} KB)")
                screenshot_counter += 1
                total_images += 1

        browser.close()

    print(f"\n" + "="*60)
    print(f"✅ Successfully captured {total_images} high-resolution images!")
    print(f"="*60)
    print("\n📁 Images saved in current directory:")
    print(f"   Resolution: 2560x1440 @ 1.5x scale")

    # List all generated images
    import glob
    images = sorted(glob.glob("slide_*.png"))
    for img in images:
        size = os.path.getsize(img) / 1024
        print(f"   • {img} ({size:.1f} KB)")

    return True


if __name__ == "__main__":
    success = capture_images_only()
    if not success:
        print("\n❌ Image capture failed!")
        exit(1)