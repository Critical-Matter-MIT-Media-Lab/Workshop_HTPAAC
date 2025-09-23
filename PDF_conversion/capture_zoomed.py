#!/usr/bin/env python3
"""
High-resolution zoomed-in image capture for all slides
"""

import os
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Error: Playwright is required")
    print("Install with: pip install playwright && playwright install chromium")
    exit(1)


def capture_zoomed():
    """Generate zoomed-in high-resolution images for all slides"""

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

        # Create page with high resolution and zoom
        # Using 2560x1440 with 2x device scale for very high quality
        context = browser.new_context(
            viewport={'width': 2560, 'height': 1440},
            device_scale_factor=2.0  # 2x scaling for higher quality
        )
        page = context.new_page()

        # Navigate to presentation
        file_path = Path('../index.html').absolute()
        url = f'file://{file_path}'
        print(f"Opening presentation: {url}")
        print(f"Resolution: 2560x1440 @ 2x scale (zoomed)")
        page.goto(url, wait_until='networkidle')

        # Wait for initialization
        print("Waiting for presentation to load...")
        page.wait_for_timeout(3000)

        # Inject CSS for proper centering and slight zoom
        page.evaluate('''
            () => {
                // Remove any existing transforms and apply fresh centering
                const style = document.createElement('style');
                style.textContent = `
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }

                    body {
                        width: 100vw;
                        height: 100vh;
                        overflow: hidden;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background: #000;
                    }

                    .slideshow-container {
                        width: 100%;
                        height: 100vh;
                        display: flex !important;
                        justify-content: center !important;
                        align-items: center !important;
                        position: relative;
                        transform: scale(1.1);  /* Slight zoom */
                        transform-origin: center center;
                    }

                    .slide {
                        position: absolute !important;
                        top: 50% !important;
                        left: 50% !important;
                        transform: translate(-50%, -50%) !important;
                        width: 90%;
                        max-width: 1600px;
                        display: flex !important;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        text-align: center;
                    }

                    .slide.active {
                        display: flex !important;
                        opacity: 1 !important;
                    }

                    .slide h1, .slide h2, .slide h3 {
                        margin: 20px auto;
                        width: 100%;
                    }

                    .slide img {
                        image-rendering: -webkit-optimize-contrast;
                        image-rendering: crisp-edges;
                        max-width: 100%;
                        height: auto;
                        margin: 0 auto;
                    }

                    /* Hide navigation elements */
                    .navigation, .progress-container, .slide-note {
                        display: none !important;
                    }
                `;
                document.head.appendChild(style);

                // Force recalculation of layout
                document.body.offsetHeight;
            }
        ''')

        # Take screenshots
        screenshot_counter = 0
        total_images = 0

        # Create output directory
        output_dir = "slides_zoomed"
        os.makedirs(output_dir, exist_ok=True)
        print(f"📁 Output directory: {output_dir}/")

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
                        img.style.imageRendering = '-webkit-optimize-contrast';
                    }});
                }}
            ''')

            # Wait for slide to render
            page.wait_for_timeout(1500)

            # Capture states
            for state in range(num_states):
                if state == 0:
                    print(f"  Capturing state 1/{num_states} (zoomed)...")
                else:
                    print(f"  Capturing state {state + 1}/{num_states} (zoomed)...")

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

                # Take high-resolution zoomed screenshot
                if num_states > 1:
                    screenshot_path = f'{output_dir}/slide_{screenshot_counter:03d}_{slide_name}_state{state + 1}.png'
                else:
                    screenshot_path = f'{output_dir}/slide_{screenshot_counter:03d}_{slide_name}.png'

                page.screenshot(
                    path=screenshot_path,
                    full_page=False,
                    type='png'
                )

                # Get file size for verification
                file_size = os.path.getsize(screenshot_path)
                print(f"    ✅ Saved {os.path.basename(screenshot_path)} ({file_size/1024:.1f} KB)")
                screenshot_counter += 1
                total_images += 1

        browser.close()

    print(f"\n" + "="*60)
    print(f"✅ Successfully captured {total_images} zoomed high-res images!")
    print(f"="*60)
    print(f"\n📁 Images saved in '{output_dir}/' directory:")
    print(f"   Resolution: 2560x1440 @ 2x scale")
    print(f"   Zoom level: 110% scale with absolute centering")

    # List all generated images
    import glob
    images = sorted(glob.glob(f"{output_dir}/slide_*.png"))
    for img in images:
        size = os.path.getsize(img) / 1024
        print(f"   • {os.path.basename(img)} ({size:.1f} KB)")

    print(f"\n💡 Total size: {sum(os.path.getsize(img) for img in images) / 1024 / 1024:.2f} MB")

    return True


if __name__ == "__main__":
    success = capture_zoomed()
    if not success:
        print("\n❌ Image capture failed!")
        exit(1)