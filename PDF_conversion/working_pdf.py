#!/usr/bin/env python3
"""
Working PDF generation - captures all slides properly
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


def generate_working_pdf():
    """Generate a PDF with all slides"""

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
        file_path = Path('index.html').absolute()
        url = f'file://{file_path}'
        print(f"Opening presentation: {url}")
        page.goto(url, wait_until='networkidle')

        # Wait for initialization
        print("Waiting for presentation to load...")
        page.wait_for_timeout(5000)

        # Get all slide IDs
        slide_ids = page.evaluate('''
            () => {
                const slides = document.querySelectorAll('.slide');
                return Array.from(slides).map(s => s.id);
            }
        ''')

        print(f"Found {len(slide_ids)} slides")

        # Take screenshots
        screenshots = []
        for i, slide_id in enumerate(slide_ids):
            print(f"Capturing {i+1}/{len(slide_ids)}: {slide_id}")

            # Navigate to slide
            page.evaluate(f'''
                (slideId) => {{
                    // Hide all slides
                    document.querySelectorAll('.slide').forEach(s => {{
                        s.classList.remove('active');
                        s.style.display = 'none';
                        s.style.opacity = '0';
                    }});

                    // Show target slide
                    const targetSlide = document.getElementById(slideId);
                    if (targetSlide) {{
                        targetSlide.classList.add('active');
                        targetSlide.style.display = 'block';
                        targetSlide.style.opacity = '1';
                        targetSlide.style.visibility = 'visible';

                        // Ensure images are loaded
                        targetSlide.querySelectorAll('img[data-src]').forEach(img => {{
                            if (img.dataset.src) {{
                                img.src = img.dataset.src;
                            }}
                        }});
                    }}

                    // Hide UI elements
                    const nav = document.querySelector('.navigation');
                    if (nav) nav.style.display = 'none';

                    const progress = document.querySelector('.progress-container');
                    if (progress) progress.style.display = 'none';
                }}
            ''', slide_id)

            # Wait for render
            page.wait_for_timeout(1500)

            # Take screenshot
            screenshot_path = f'slide_{i:03d}.png'
            page.screenshot(path=screenshot_path, full_page=False)
            screenshots.append(screenshot_path)
            print(f"  ✓ Saved {screenshot_path}")

        browser.close()

    # Convert to PDF using ImageMagick if available, otherwise use Pillow
    print("\nCreating PDF from screenshots...")

    # Check if we have screenshots
    if not screenshots:
        print("ERROR: No screenshots were taken!")
        return False

    # Use Pillow to create PDF
    from PIL import Image

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
        else:
            print(f"  WARNING: {screenshot_path} not found!")

    if not images:
        print("ERROR: No images were loaded!")
        return False

    # Save as multi-page PDF
    output_file = 'HTPAAC_Complete.pdf'
    print(f"\nSaving PDF with {len(images)} pages...")

    # Save first image and append rest
    images[0].save(
        output_file,
        "PDF",
        save_all=True,
        append_images=images[1:] if len(images) > 1 else [],
        resolution=100.0
    )

    print(f"✅ PDF created: {output_file}")
    print(f"   Total pages: {len(images)}")

    # Verify file size
    file_size = os.path.getsize(output_file)
    print(f"   File size: {file_size:,} bytes")

    # Clean up screenshots (optional - comment out to keep them)
    # print("\nCleaning up temporary files...")
    # for screenshot_path in screenshots:
    #     try:
    #         os.remove(screenshot_path)
    #         print(f"  Removed {screenshot_path}")
    #     except:
    #         pass

    return True


if __name__ == "__main__":
    success = generate_working_pdf()
    if not success:
        print("\n❌ PDF generation failed!")
        exit(1)