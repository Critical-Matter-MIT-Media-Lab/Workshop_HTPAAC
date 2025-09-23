#!/usr/bin/env python3
"""
Enhanced PDF generation with proper state changes for ALL slides
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


def capture_enhanced():
    """Generate PDF with verified state changes"""

    # Define slides and their number of states
    slide_states = {
        'slide-0': 1,      # Intro
        'slide-1.0': 1,    # Part 1
        'slide-1.1': 1,    # Arduino
        'slide-1.2': 1,    # Laws
        'slide-1.3': 2,    # Parts (2 states)
        'slide-1.4': 2,    # MCU (2 states)
        'slide-1.5': 2,    # Fabrication (2 states)
        'slide-1.6': 1,    # Software
        'slide-1.7': 1,    # Protocol
        'slide-1.8': 1,    # Networking
        'slide-2.0': 1,    # Part 2
        'slide-2.1': 3,    # Actuator (3 states)
        'slide-2.2': 3,    # Sensor (3 states)
        'slide-2.3': 2,    # Biometric (2 states)
        'slide-3.0': 1,    # Part 3
        'slide-3.1': 2,    # Your Kit (2 states)
        'slide-3.2': 3,    # Warm-up (3 states)
        'slide-3.3': 3,    # Hard Mode (3 states)
    }

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

        for slide_id, num_states in slide_states.items():
            slide_name = slide_id.replace('slide-', '')

            # Navigate to the slide
            print(f"\nProcessing {slide_id} ({num_states} state(s))...")

            escaped_id = slide_id.replace('.', '\\\\.')

            # Reset any state counters before navigating
            page.evaluate('''
                () => {
                    // Reset global state counter if it exists
                    if (window.currentStateIndex !== undefined) {
                        window.currentStateIndex = 0;
                    }
                    // Reset any slide-specific state counters
                    document.querySelectorAll('.slide').forEach(slide => {
                        if (slide.dataset.stateIndex !== undefined) {
                            slide.dataset.stateIndex = '0';
                        }
                    });
                }
            ''')

            # Navigate to slide
            page.evaluate(f'''
                () => {{
                    // Hide all slides
                    document.querySelectorAll('.slide').forEach(s => {{
                        s.classList.remove('active');
                        s.style.display = 'none';
                        s.style.opacity = '0';
                    }});

                    // Show target slide
                    const targetSlide = document.querySelector('#{escaped_id}');
                    if (targetSlide) {{
                        targetSlide.classList.add('active');
                        targetSlide.style.display = 'block';
                        targetSlide.style.opacity = '1';
                        targetSlide.style.visibility = 'visible';

                        // Set focus to the slide
                        targetSlide.focus();

                        // Load images
                        targetSlide.querySelectorAll('img[data-src]').forEach(img => {{
                            if (img.dataset.src && !img.src) {{
                                img.src = img.dataset.src;
                                img.classList.add('loaded');
                            }}
                        }});

                        // Reset to first state
                        const states = targetSlide.querySelectorAll('.state, [data-state]');
                        if (states.length > 0) {{
                            states.forEach((s, idx) => {{
                                if (idx === 0) {{
                                    s.style.display = 'block';
                                    s.style.opacity = '1';
                                }} else {{
                                    s.style.display = 'none';
                                    s.style.opacity = '0';
                                }}
                            }});
                        }}
                    }}

                    // Hide navigation
                    const elements = ['.navigation', '.progress-container', '.slide-note'];
                    elements.forEach(sel => {{
                        const el = document.querySelector(sel);
                        if (el) el.style.display = 'none';
                    }});
                }}
            ''')

            # Wait for slide to render
            page.wait_for_timeout(1500)

            # Check if this slide has multiple states
            if num_states > 1:
                # Special handling for slides with known content
                if slide_id == 'slide-3.3':  # Hard Mode
                    # State 1: DANGER ZONE warning
                    screenshot_path = f'slide_{screenshot_counter:03d}_{slide_name}_state1.png'
                    page.screenshot(path=screenshot_path, full_page=False)
                    screenshots.append(screenshot_path)
                    print(f"    ✓ Saved {screenshot_path} (DANGER ZONE)")
                    screenshot_counter += 1

                    # State 2: Navigate to networking slide
                    page.keyboard.press('Space')
                    page.wait_for_timeout(2000)
                    screenshot_path = f'slide_{screenshot_counter:03d}_{slide_name}_state2.png'
                    page.screenshot(path=screenshot_path, full_page=False)
                    screenshots.append(screenshot_path)
                    print(f"    ✓ Saved {screenshot_path} (Networking)")
                    screenshot_counter += 1

                    # State 3: Show p5.js sketch
                    page.keyboard.press('Space')
                    page.wait_for_timeout(2000)
                    screenshot_path = f'slide_{screenshot_counter:03d}_{slide_name}_state3.png'
                    page.screenshot(path=screenshot_path, full_page=False)
                    screenshots.append(screenshot_path)
                    print(f"    ✓ Saved {screenshot_path} (p5.js)")
                    screenshot_counter += 1

                elif slide_id == 'slide-3.2':  # Warm-up
                    # Capture each state
                    for state in range(num_states):
                        print(f"  Capturing state {state + 1}/{num_states}")

                        if state > 0:
                            page.keyboard.press('Space')
                            page.wait_for_timeout(2000)

                        screenshot_path = f'slide_{screenshot_counter:03d}_{slide_name}_state{state + 1}.png'
                        page.screenshot(path=screenshot_path, full_page=False)
                        screenshots.append(screenshot_path)
                        print(f"    ✓ Saved {screenshot_path}")
                        screenshot_counter += 1

                else:
                    # Generic multi-state handling
                    for state in range(num_states):
                        print(f"  Capturing state {state + 1}/{num_states}")

                        if state > 0:
                            # Use multiple methods to advance state
                            page.keyboard.press('Space')
                            page.wait_for_timeout(1000)

                            # Also try arrow key as backup
                            page.keyboard.press('ArrowRight')
                            page.wait_for_timeout(1000)

                        screenshot_path = f'slide_{screenshot_counter:03d}_{slide_name}_state{state + 1}.png'
                        page.screenshot(path=screenshot_path, full_page=False)
                        screenshots.append(screenshot_path)
                        print(f"    ✓ Saved {screenshot_path}")
                        screenshot_counter += 1
            else:
                # Single state slide - just capture it
                print(f"  Capturing single state")
                screenshot_path = f'slide_{screenshot_counter:03d}_{slide_name}.png'
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

    if not images:
        print("ERROR: No images were loaded!")
        return False

    # Save as multi-page PDF
    output_file = 'HTPAAC_Enhanced.pdf'
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

    # Calculate total expected pages
    expected_pages = sum(slide_states.values())
    print(f"   Expected pages: {expected_pages}")

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
    success = capture_enhanced()
    if not success:
        print("\n❌ PDF generation failed!")
        exit(1)