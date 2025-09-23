#!/usr/bin/env python3
"""
Screenshot-based PDF generation
Takes screenshots of each slide and combines them into a PDF
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

try:
    from PIL import Image
except ImportError:
    print("Error: Pillow is required")
    print("Install with: pip install Pillow")
    exit(1)


def screenshot_to_pdf():
    screenshots = []

    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)

        # Create page with good resolution
        page = browser.new_page(viewport={'width': 1920, 'height': 1080})

        # Navigate to presentation
        file_path = Path('index.html').absolute()
        url = f'file://{file_path}'
        print(f"Opening: {url}")
        page.goto(url, wait_until='networkidle')
        page.wait_for_timeout(3000)

        # Get total number of slides
        total_slides = page.evaluate('''
            () => document.querySelectorAll('.slide').length
        ''')
        print(f"Found {total_slides} slides")

        # Define slide mapping
        slide_ids = [
            'slide-0',       # Intro
            'slide-1.0',     # Part 1
            'slide-1.1',     # Arduino
            'slide-1.2',     # Laws
            'slide-1.3',     # Parts
            'slide-1.4',     # MCU
            'slide-1.5',     # Fabrication
            'slide-1.6',     # Software
            'slide-1.7',     # Protocol
            'slide-1.8',     # Networking
            'slide-2.0',     # Part 2
            'slide-2.1',     # Actuator
            'slide-2.2',     # Sensor
            'slide-2.3',     # Biometric
            'slide-3.0',     # Part 3
            'slide-3.1',     # Your Kit
            'slide-3.2',     # Warm-up
            'slide-3.3',     # Hard Mode
        ]

        # Capture each slide
        for i, slide_id in enumerate(slide_ids):
            print(f"Capturing slide {i+1}/{len(slide_ids)}: {slide_id}")

            # Show only this slide
            page.evaluate(f'''
                () => {{
                    // Hide all slides
                    document.querySelectorAll('.slide').forEach(s => {{
                        s.classList.remove('active');
                        s.style.display = 'none';
                    }});

                    // Show target slide
                    const slide = document.getElementById('{slide_id}');
                    if (slide) {{
                        slide.classList.add('active');
                        slide.style.display = 'block';
                        slide.style.opacity = '1';
                    }}

                    // Update slide index for any JS that depends on it
                    if (typeof currentSlide !== 'undefined') {{
                        currentSlide = {i};
                    }}
                }}
            ''')

            # Wait for slide to render
            page.wait_for_timeout(1000)

            # Take screenshot
            screenshot_path = f'temp_slide_{i:03d}.png'
            page.screenshot(path=screenshot_path, full_page=False)
            screenshots.append(screenshot_path)

        browser.close()

    # Convert screenshots to PDF
    print("\nConverting screenshots to PDF...")

    if screenshots:
        # Open all images
        images = []
        for path in screenshots:
            img = Image.open(path)
            # Convert RGBA to RGB if needed
            if img.mode == 'RGBA':
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[3] if len(img.split()) > 3 else None)
                images.append(rgb_img)
            else:
                images.append(img)

        # Save as PDF
        if images:
            images[0].save(
                'HTPAAC_Screenshots.pdf',
                save_all=True,
                append_images=images[1:],
                resolution=100.0,
                quality=95,
                optimize=True
            )

            print("✅ PDF created: HTPAAC_Screenshots.pdf")

            # Clean up temporary files
            for path in screenshots:
                try:
                    os.remove(path)
                except:
                    pass

            return True

    return False


if __name__ == "__main__":
    screenshot_to_pdf()