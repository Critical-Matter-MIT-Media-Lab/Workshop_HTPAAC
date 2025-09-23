#!/usr/bin/env python3
"""
PDF generation using space key to change states
Much simpler approach!
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


def capture_states_simple():
    """Generate PDF with all slide states using space key"""

    # Map slides to their state counts
    slide_config = [
        (0, 'slide-0', 'Intro', 1),
        (1, 'slide-1.0', 'Part 1', 1),
        (2, 'slide-1.1', 'Arduino', 1),
        (3, 'slide-1.2', 'Laws', 1),
        (4, 'slide-1.3', 'Parts', 2),
        (5, 'slide-1.4', 'MCU', 2),
        (6, 'slide-1.5', 'Fabrication', 2),
        (7, 'slide-1.6', 'Software', 1),
        (8, 'slide-1.7', 'Protocol', 1),
        (9, 'slide-1.8', 'Networking', 1),
        (10, 'slide-2.0', 'Part 2', 1),
        (11, 'slide-2.1', 'Actuator', 3),
        (12, 'slide-2.2', 'Sensor', 3),
        (13, 'slide-2.3', 'Biometric', 2),
        (14, 'slide-3.0', 'Part 3', 1),
        (15, 'slide-3.1', 'Your Kit', 2),
        (16, 'slide-3.2', 'Warm-up', 3),
        (17, 'slide-3.3', 'Hard Mode', 3),
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
        page.wait_for_timeout(3000)

        # Hide navigation elements
        page.evaluate('''
            () => {
                const nav = document.querySelector('.navigation');
                if (nav) nav.style.display = 'none';

                const progress = document.querySelector('.progress-container');
                if (progress) progress.style.display = 'none';

                const note = document.querySelector('.slide-note');
                if (note) note.style.display = 'none';
            }
        ''')

        screenshots = []
        screenshot_counter = 0

        for slide_index, slide_id, slide_name, num_states in slide_config:
            print(f"\nSlide {slide_index + 1}: {slide_name} ({num_states} state(s))")

            # Navigate to slide using arrow keys
            # First go to beginning
            page.keyboard.press('Home')
            page.wait_for_timeout(500)

            # Then navigate to target slide
            for _ in range(slide_index):
                page.keyboard.press('ArrowRight')
                page.wait_for_timeout(200)

            # Capture each state
            for state in range(num_states):
                if state > 0:
                    # Press space to change state
                    print(f"  Pressing space to go to state {state + 1}...")
                    page.keyboard.press('Space')
                    page.wait_for_timeout(1500)  # Wait for transition

                # Take screenshot
                if num_states > 1:
                    screenshot_path = f'slide_{screenshot_counter:03d}_{slide_name.replace(" ", "_")}_state{state + 1}.png'
                    print(f"  State {state + 1}/{num_states}: {screenshot_path}")
                else:
                    screenshot_path = f'slide_{screenshot_counter:03d}_{slide_name.replace(" ", "_")}.png'
                    print(f"  Single state: {screenshot_path}")

                page.screenshot(path=screenshot_path, full_page=False)
                screenshots.append(screenshot_path)
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
        print(f"  ✓ Processed: {screenshot_path}")

    if not images:
        print("ERROR: No images were loaded!")
        return False

    # Save as PDF
    output_file = 'HTPAAC_Final.pdf'
    print(f"\nGenerating PDF...")

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

    # Optional: Clean up screenshots
    # print("\nCleaning up screenshots...")
    # for screenshot_path in screenshots:
    #     try:
    #         os.remove(screenshot_path)
    #     except:
    #         pass

    return True


if __name__ == "__main__":
    success = capture_states_simple()
    if not success:
        print("\n❌ PDF generation failed!")
        exit(1)