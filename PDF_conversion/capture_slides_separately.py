#!/usr/bin/env python3
"""
HTPAAC Slide Capture - Alternative approach
Generates PDF by processing slides individually
"""

import os
import sys
from pathlib import Path
from PyPDF2 import PdfMerger

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Error: Playwright is required for this script.")
    print("Install with: pip install playwright && playwright install chromium")
    sys.exit(1)


def capture_all_slides(input_file='index.html', output_file='HTPAAC_MacBook.pdf'):
    """
    Navigate through all slides and capture each one separately
    """

    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found!")
        return False

    print(f"Capturing slides from HTPAAC presentation...")
    print(f"Input: {input_file}")
    print(f"Output: {output_file}")
    print()

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Set viewport to MacBook Pro-like resolution
            # Using effective resolution of MacBook Pro 14" (1512x982)
            page.set_viewport_size({"width": 1512, "height": 982})

            # Set device scale factor for Retina-like quality
            browser.close()
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(device_scale_factor=2)  # Retina display simulation
            page.set_viewport_size({"width": 1512, "height": 982})

            # Navigate to the presentation
            file_path = Path(input_file).absolute()
            page.goto(f"file://{file_path}")

            print("Waiting for JavaScript to initialize...")
            page.wait_for_timeout(3000)

            # Find all slides
            slides = page.query_selector_all('.slide')
            total_slides = len(slides)
            print(f"Found {total_slides} slides\n")

            # Temporary PDFs for each slide
            temp_pdfs = []

            # Process each slide
            for i in range(total_slides):
                slide_id = page.eval_on_selector(
                    f'.slide:nth-child({i+1})',
                    'el => el.id'
                )

                # Extract slide number and title
                slide_num = slide_id.replace('slide-', '')

                # Determine slide title based on ID
                if slide_num == '0': title = 'Intro'
                elif slide_num == '1.0': title = 'Part 1'
                elif slide_num == '1.1': title = 'Arduino'
                elif slide_num == '1.2': title = 'Laws'
                elif slide_num == '1.3': title = 'Parts'
                elif slide_num == '1.4': title = 'MCU'
                elif slide_num == '1.5': title = 'Fabrication'
                elif slide_num == '1.6': title = 'Software'
                elif slide_num == '1.7': title = 'Protocol'
                elif slide_num == '1.8': title = 'Networking'
                elif slide_num == '2.0': title = 'Part 2'
                elif slide_num == '2.1': title = 'Actuator'
                elif slide_num == '2.2': title = 'Sensor'
                elif slide_num == '2.3': title = 'Biometric'
                elif slide_num == '3.0': title = 'Part 3'
                elif slide_num == '3.1': title = 'Your Kit'
                elif slide_num == '3.2': title = 'Warm-up'
                elif slide_num == '3.3': title = 'Hard Mode'
                else: title = f'Slide {slide_num}'

                print(f"Processing slide {i+1}/{total_slides}: {title}")

                # Navigate to this slide (escape dots in selector)
                escaped_slide_num = slide_num.replace('.', '\\\\.')
                page.evaluate(f'''
                    document.querySelectorAll('.slide').forEach(s => {{
                        s.classList.remove('active');
                    }});
                    document.querySelector('#slide-{escaped_slide_num}').classList.add('active');
                    currentSlide = {i};
                ''')

                # Wait for transitions
                page.wait_for_timeout(500)

                # Generate PDF for this slide
                # Using custom size to better match MacBook Pro aspect ratio (16:10)
                temp_pdf_path = f'/tmp/slide_{i:03d}.pdf'
                page.pdf(
                    path=temp_pdf_path,
                    width='11in',  # Letter width for better screen fit
                    height='8.5in',  # Landscape orientation
                    print_background=True,
                    margin={
                        'top': '10mm',
                        'right': '10mm',
                        'bottom': '10mm',
                        'left': '10mm'
                    },
                    landscape=False,
                    scale=0.9  # Slightly scale down to ensure all content fits
                )
                temp_pdfs.append(temp_pdf_path)

            browser.close()

            # Merge all PDFs
            print(f"\nMerging {len(temp_pdfs)} PDFs into final document...")
            merger = PdfMerger()

            for pdf_path in temp_pdfs:
                merger.append(pdf_path)

            # Write the final PDF
            merger.write(output_file)
            merger.close()

            # Clean up temp files
            for pdf_path in temp_pdfs:
                try:
                    os.unlink(pdf_path)
                except:
                    pass

            print(f"\n✅ PDF successfully created: {output_file}")
            print(f"File size: {os.path.getsize(output_file):,} bytes")
            return True

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    capture_all_slides()