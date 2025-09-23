#!/usr/bin/env python3
"""
HTPAAC Presentation PDF Capture
Properly captures the presentation layout using print mode
"""

import os
import sys
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Error: Playwright is required for this script.")
    print("Install with: pip install playwright && playwright install chromium")
    sys.exit(1)


def capture_presentation(input_file='index.html', output_file='HTPAAC_Presentation.pdf'):
    """
    Capture the presentation using browser's native print functionality
    """

    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found!")
        return False

    print(f"Capturing HTPAAC presentation as PDF...")
    print(f"Input: {input_file}")
    print(f"Output: {output_file}")
    print()

    try:
        with sync_playwright() as p:
            # Launch browser with specific args for better PDF generation
            browser = p.chromium.launch(
                headless=True,
                args=['--disable-dev-shm-usage', '--no-sandbox']
            )

            # Create context with print media emulation
            context = browser.new_context(
                viewport={'width': 1440, 'height': 900},
                device_scale_factor=2,
                color_scheme='dark'  # Since your presentation has dark background
            )

            page = context.new_page()

            # Add custom CSS for print mode to ensure proper layout
            page.add_style_tag(content="""
                @media print {
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #000 !important;
                    }
                    .slideshow-container {
                        display: block !important;
                    }
                    .slide {
                        page-break-after: always !important;
                        page-break-inside: avoid !important;
                        display: block !important;
                        width: 100% !important;
                        height: 100vh !important;
                        position: relative !important;
                        margin: 0 !important;
                        padding: 40px !important;
                        box-sizing: border-box !important;
                    }
                    .slide:not(.active) {
                        display: block !important;
                        opacity: 1 !important;
                    }
                    .navigation, .progress-container, .slide-note {
                        display: none !important;
                    }
                    .loading-overlay {
                        display: none !important;
                    }
                    /* Ensure images are visible */
                    img {
                        max-width: 100% !important;
                        height: auto !important;
                        display: block !important;
                    }
                    /* Fix features grid */
                    .features {
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                    }
                    .feature-box {
                        break-inside: avoid !important;
                    }
                    /* Ensure all multi-state content is visible */
                    .slide-content {
                        display: block !important;
                        opacity: 1 !important;
                    }
                    /* State indicators */
                    .state-indicators {
                        display: none !important;
                    }
                }
            """)

            # Navigate to the presentation
            file_path = Path(input_file).absolute()
            print(f"Loading presentation from: {file_path}")
            page.goto(f"file://{file_path}", wait_until='networkidle')

            # Wait for all content to load
            print("Waiting for content to fully load...")
            page.wait_for_timeout(5000)

            # Make all slides visible for printing
            page.evaluate("""
                // Remove active class handling for print
                document.querySelectorAll('.slide').forEach(slide => {
                    slide.style.display = 'block';
                    slide.style.opacity = '1';
                    slide.classList.add('active');
                });

                // Ensure all lazy-loaded images are loaded
                document.querySelectorAll('img[data-src]').forEach(img => {
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                    }
                });

                // Show all multi-state content
                document.querySelectorAll('.slide-content').forEach(content => {
                    content.style.display = 'block';
                    content.style.opacity = '1';
                });

                // Hide navigation elements
                const nav = document.querySelector('.navigation');
                if (nav) nav.style.display = 'none';

                const progress = document.querySelector('.progress-container');
                if (progress) progress.style.display = 'none';

                const note = document.querySelector('.slide-note');
                if (note) note.style.display = 'none';
            """)

            # Wait for any animations to complete
            page.wait_for_timeout(2000)

            # Emulate print media
            page.emulate_media(media='print')

            print("Generating PDF...")
            # Generate PDF with optimized settings
            page.pdf(
                path=output_file,
                format='Letter',  # Standard US Letter size
                landscape=True,   # Landscape for presentation
                print_background=True,
                margin={
                    'top': '0',
                    'right': '0',
                    'bottom': '0',
                    'left': '0'
                },
                prefer_css_page_size=True,
                scale=0.8  # Scale to fit content properly
            )

            browser.close()

            print(f"\n✅ PDF successfully created: {output_file}")
            print(f"File size: {os.path.getsize(output_file):,} bytes")
            return True

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    capture_presentation()