#!/usr/bin/env python3
"""
HTPAAC Clean PDF Export
Captures presentation with proper layout preservation
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


def export_clean_pdf(input_file='index.html', output_file='HTPAAC_Clean.pdf'):
    """
    Export presentation with clean layout
    """

    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found!")
        return False

    print(f"Exporting HTPAAC presentation...")
    print(f"Input: {input_file}")
    print(f"Output: {output_file}")
    print()

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)

            # Create a page with presentation dimensions
            page = browser.new_page(
                viewport={'width': 1920, 'height': 1080},
                device_scale_factor=1
            )

            # Navigate to presentation
            file_path = Path(input_file).absolute()
            page.goto(f"file://{file_path}")

            print("Preparing presentation for export...")
            page.wait_for_timeout(3000)

            # Inject CSS to prepare for PDF export
            page.evaluate("""
                // Create a print-friendly version
                const style = document.createElement('style');
                style.textContent = `
                    /* Reset for clean export */
                    * {
                        animation: none !important;
                        transition: none !important;
                    }

                    body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* Hide UI elements */
                    .navigation,
                    .progress-container,
                    .slide-note,
                    .loading-overlay,
                    .state-indicators {
                        display: none !important;
                    }

                    /* Each slide on its own page */
                    .slideshow-container {
                        display: block !important;
                        width: 100% !important;
                        height: auto !important;
                    }

                    .slide {
                        display: block !important;
                        width: 100vw !important;
                        height: 100vh !important;
                        page-break-after: always !important;
                        page-break-inside: avoid !important;
                        position: relative !important;
                        background: #000 !important;
                        color: #fff !important;
                        padding: 60px !important;
                        box-sizing: border-box !important;
                        margin: 0 !important;
                        opacity: 1 !important;
                        visibility: visible !important;
                        overflow: visible !important;
                    }

                    .slide h1 {
                        color: #fff !important;
                        margin-top: 0 !important;
                    }

                    .slide h2, .slide h3 {
                        color: #FF1493 !important;
                    }

                    /* Ensure images are visible */
                    img {
                        max-width: 90% !important;
                        height: auto !important;
                        display: block !important;
                        margin: 20px auto !important;
                    }

                    /* Fix grid layouts */
                    .features {
                        display: grid !important;
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 20px !important;
                        width: 100% !important;
                    }

                    .feature-box {
                        background: rgba(255, 255, 255, 0.1) !important;
                        padding: 20px !important;
                        border-radius: 10px !important;
                        break-inside: avoid !important;
                    }

                    /* Handle multi-state slides */
                    .slide-content {
                        display: none !important;
                    }

                    .slide-content:first-of-type {
                        display: block !important;
                    }

                    /* Links */
                    a {
                        color: #4CAF50 !important;
                        text-decoration: underline !important;
                    }
                `;
                document.head.appendChild(style);

                // Show all slides
                document.querySelectorAll('.slide').forEach((slide, index) => {
                    slide.style.display = 'block';
                    slide.style.opacity = '1';

                    // For multi-state slides, only show the first state
                    const contents = slide.querySelectorAll('.slide-content');
                    if (contents.length > 1) {
                        contents.forEach((content, i) => {
                            content.style.display = i === 0 ? 'block' : 'none';
                        });
                    }
                });

                // Load all lazy images
                document.querySelectorAll('img[data-src]').forEach(img => {
                    if (img.dataset.src && !img.src) {
                        img.src = img.dataset.src;
                    }
                });

                // Remove any blur effects
                document.querySelectorAll('*').forEach(el => {
                    el.style.filter = 'none';
                });
            """)

            # Wait for images to load
            page.wait_for_timeout(3000)

            print("Generating PDF...")

            # Generate PDF
            pdf_buffer = page.pdf(
                format='A4',
                landscape=True,
                print_background=True,
                margin={'top': '10mm', 'bottom': '10mm', 'left': '10mm', 'right': '10mm'},
                scale=0.7,
                display_header_footer=False,
                prefer_css_page_size=False
            )

            # Write PDF to file
            with open(output_file, 'wb') as f:
                f.write(pdf_buffer)

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
    export_clean_pdf()