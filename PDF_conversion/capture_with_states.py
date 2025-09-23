#!/usr/bin/env python3
"""
PDF generation that properly captures all slide states
by triggering the JavaScript state handlers
"""

import os
from pathlib import Path
from PIL import Image

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Error: Playwright is required")
    print("Install with: pip install playwright && playwright install chromium")
    exit(1)


def capture_with_states():
    """Generate PDF with all slide states properly rendered"""

    # Map slide indices to their state counts
    slide_config = [
        (0, 'slide-0', 'Intro', 1),
        (1, 'slide-1.0', 'Part 1', 1),
        (2, 'slide-1.1', 'Arduino', 1),
        (3, 'slide-1.2', 'Laws', 1),
        (4, 'slide-1.3', 'Parts', 2),          # Has 2 states
        (5, 'slide-1.4', 'MCU', 2),            # Has 2 states
        (6, 'slide-1.5', 'Fabrication', 2),    # Has 2 states
        (7, 'slide-1.6', 'Software', 1),
        (8, 'slide-1.7', 'Protocol', 1),
        (9, 'slide-1.8', 'Networking', 1),
        (10, 'slide-2.0', 'Part 2', 1),
        (11, 'slide-2.1', 'Actuator', 3),      # Has 3 states
        (12, 'slide-2.2', 'Sensor', 3),        # Has 3 states
        (13, 'slide-2.3', 'Biometric', 2),     # Has 2 states
        (14, 'slide-3.0', 'Part 3', 1),
        (15, 'slide-3.1', 'Your Kit', 2),      # Has 2 states
        (16, 'slide-3.2', 'Warm-up', 3),       # Has 3 states
        (17, 'slide-3.3', 'Hard Mode', 3),     # Has 3 states
    ]

    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)

        # Create page
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            device_scale_factor=1
        )
        page = context.new_page()

        # Navigate to presentation
        file_path = Path('index.html').absolute()
        url = f'file://{file_path}'
        print(f"Opening presentation: {url}")
        page.goto(url, wait_until='networkidle')

        # Wait for initialization
        print("Waiting for presentation to load...")
        page.wait_for_timeout(5000)

        screenshots = []
        screenshot_counter = 0

        for slide_index, slide_id, slide_name, num_states in slide_config:
            print(f"\nProcessing {slide_name} (slide {slide_index}, {num_states} state(s))...")

            # Navigate to slide
            page.evaluate(f'''
                () => {{
                    // Set current slide
                    currentSlide = {slide_index};

                    // Hide all slides
                    document.querySelectorAll('.slide').forEach((s, i) => {{
                        s.classList.remove('active');
                        s.style.display = 'none';
                    }});

                    // Show current slide
                    const targetSlide = slides[{slide_index}];
                    if (targetSlide) {{
                        targetSlide.classList.add('active');
                        targetSlide.style.display = 'block';
                        targetSlide.style.opacity = '1';
                    }}

                    // Hide navigation
                    const nav = document.querySelector('.navigation');
                    if (nav) nav.style.display = 'none';

                    const progress = document.querySelector('.progress-container');
                    if (progress) progress.style.display = 'none';
                }}
            ''')

            # Capture each state
            for state in range(num_states):
                print(f"  State {state + 1}/{num_states}...")

                # Set the state
                page.evaluate(f'''
                    () => {{
                        // Reset slide state
                        slideStates[{slide_index}] = {state};

                        // Trigger the appropriate handler based on slide index
                        if ({slide_index} === 4) {{
                            // Parts slide
                            handlePartsSlideState({state});
                        }} else if ({slide_index} === 5) {{
                            // MCU slide
                            handleMCUSlideState({state});
                        }} else if ({slide_index} === 6) {{
                            // Fabrication slide
                            handleFabricationSlideState({state});
                        }} else if ({slide_index} === 11) {{
                            // Actuator slide
                            handleActuatorSlideState({state});
                        }} else if ({slide_index} === 12) {{
                            // Sensor slide
                            handleSensorSlideState({state});
                        }} else if ({slide_index} === 13) {{
                            // Biometric slide
                            handleBiometricSlideState({state});
                        }} else if ({slide_index} === 15) {{
                            // Kit slide
                            handleKitSlideState({state});
                        }} else if ({slide_index} === 16) {{
                            // Warm-up slide
                            handleWarmupSlideState({state});
                        }} else if ({slide_index} === 17) {{
                            // Hard Mode slide
                            handleHardModeSlideState({state});
                        }}

                        // Ensure images load
                        document.querySelectorAll('img[data-src]').forEach(img => {{
                            if (img.dataset.src && !img.src) {{
                                img.src = img.dataset.src;
                            }}
                        }});
                        document.querySelectorAll('img.lazy-image:not(.loaded)').forEach(img => {{
                            if (img.dataset.src && !img.src) {{
                                img.src = img.dataset.src;
                                img.classList.add('loaded');
                            }}
                        }});
                    }}
                ''')

                # Wait for content to render
                page.wait_for_timeout(2000)

                # Take screenshot
                if num_states > 1:
                    screenshot_path = f'slide_{screenshot_counter:03d}_{slide_name.replace(" ", "_")}_state{state + 1}.png'
                else:
                    screenshot_path = f'slide_{screenshot_counter:03d}_{slide_name.replace(" ", "_")}.png'

                page.screenshot(path=screenshot_path, full_page=False)
                screenshots.append(screenshot_path)
                print(f"    ✓ Captured: {screenshot_path}")
                screenshot_counter += 1

        browser.close()

    # Convert to PDF
    print(f"\n{'='*60}")
    print(f"Creating PDF from {len(screenshots)} screenshots...")
    print(f"{'='*60}\n")

    if not screenshots:
        print("ERROR: No screenshots were taken!")
        return False

    # Load all images
    images = []
    for screenshot_path in screenshots:
        if os.path.exists(screenshot_path):
            print(f"  Processing: {screenshot_path}")
            img = Image.open(screenshot_path)

            # Convert to RGB
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

    # Save as PDF
    output_file = 'HTPAAC_Complete_With_States.pdf'
    print(f"\nGenerating PDF with {len(images)} pages...")

    images[0].save(
        output_file,
        "PDF",
        save_all=True,
        append_images=images[1:] if len(images) > 1 else [],
        resolution=100.0
    )

    print(f"\n{'='*60}")
    print(f"✅ SUCCESS! PDF created: {output_file}")
    print(f"{'='*60}")
    print(f"   Total pages: {len(images)}")

    # Calculate expected pages
    expected = sum(config[3] for config in slide_config)
    print(f"   Expected pages: {expected}")

    file_size = os.path.getsize(output_file)
    print(f"   File size: {file_size:,} bytes ({file_size/1024/1024:.1f} MB)")
    print(f"{'='*60}\n")

    return True


if __name__ == "__main__":
    success = capture_with_states()
    if not success:
        print("\n❌ PDF generation failed!")
        exit(1)