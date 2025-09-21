#!/usr/bin/env python3
"""
HTPAAC Complete Slideshow Capture
Navigates through each slide and captures all states to create a comprehensive PDF
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


def capture_all_slides(input_file='index.html', output_file='HTPAAC_AllSlides.pdf'):
    """
    Navigate through all slides and capture each one with all states
    """

    if not os.path.exists(input_file):
        print(f"Error: File '{input_file}' not found!")
        return False

    print(f"Capturing all slides from HTPAAC presentation...")
    print(f"Input: {input_file}")
    print(f"Output: {output_file}")

    try:
        with sync_playwright() as p:
            # Launch browser
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # Set large viewport
            page.set_viewport_size({'width': 1920, 'height': 1080})

            # Load the page
            file_path = Path(input_file).resolve()
            url = f'file://{file_path}'
            print(f"Loading: {url}")
            page.goto(url, wait_until='networkidle')

            # Wait for initial load
            print("Waiting for JavaScript to initialize...")
            page.wait_for_timeout(3000)

            # Get total number of slides
            slide_count = page.evaluate('typeof CONFIG !== "undefined" && CONFIG.SLIDE_COUNT ? CONFIG.SLIDE_COUNT : document.querySelectorAll(".slide").length')
            print(f"Found {slide_count} slides")

            # Get slide information
            slide_titles = page.evaluate('slideTitles || []')
            slide_numbers = page.evaluate('slideNumbers || []')

            # Create a container for all captured content
            all_slides_html = []

            # Navigate through each slide
            for slide_index in range(slide_count):
                print(f"\nProcessing slide {slide_index + 1}/{slide_count}: {slide_titles[slide_index] if slide_index < len(slide_titles) else 'Slide ' + str(slide_index)}")

                # Go to this slide
                page.evaluate(f'goToSlide({slide_index})')
                page.wait_for_timeout(1000)  # Wait for slide transition

                # Get the current slide element
                slide_id = page.evaluate(f'''
                    (() => {{
                        const slides = document.querySelectorAll('.slide');
                        return slides[{slide_index}] ? slides[{slide_index}].id : null;
                    }})()
                ''')

                # Check if this slide has multiple states
                max_states = page.evaluate(f'maxSlideStates[{slide_index}] || 1')

                slide_content_parts = []

                # Capture each state of the slide
                for state in range(max_states):
                    print(f"  - Capturing state {state + 1}/{max_states}")

                    # Set the slide state
                    if state > 0:
                        page.evaluate(f'''
                            slideStates[{slide_index}] = {state};
                            triggerSlideStateChange({slide_index}, {state});
                        ''')
                        page.wait_for_timeout(500)

                    # Capture the current content
                    slide_html = page.evaluate(f'''
                        (() => {{
                            const slide = document.querySelectorAll('.slide')[{slide_index}];
                            if (!slide) return '<p>Slide not found</p>';

                            // Clone the slide to avoid modifying the original
                            const slideClone = slide.cloneNode(true);

                            // Make sure it's visible in the clone
                            slideClone.style.display = 'block';
                            slideClone.style.opacity = '1';

                            // Get the content
                            const contentContainer = slideClone.querySelector('.content-container');
                            if (contentContainer) {{
                                return contentContainer.innerHTML;
                            }}
                            return slideClone.innerHTML;
                        }})()
                    ''')

                    # Create state header if multiple states
                    if max_states > 1:
                        state_header = f'<h3 style="color: #FF1493; margin-top: 30px;">State {state + 1}</h3>'
                        slide_content_parts.append(state_header + slide_html)
                    else:
                        slide_content_parts.append(slide_html)

                # Combine all states for this slide
                slide_title = slide_titles[slide_index] if slide_index < len(slide_titles) else f"Slide {slide_index + 1}"
                slide_number = slide_numbers[slide_index] if slide_index < len(slide_numbers) else str(slide_index)

                combined_slide_html = f'''
                <div style="page-break-after: always; min-height: 100vh; padding: 40px; background: white; color: black;">
                    <h1 style="color: #FF1493; border-bottom: 2px solid #FF1493; padding-bottom: 10px; margin-bottom: 30px;">
                        {slide_number}. {slide_title}
                    </h1>
                    <div>
                        {''.join(slide_content_parts)}
                    </div>
                </div>
                '''

                all_slides_html.append(combined_slide_html)

            print("\nCreating final PDF with all slides...")

            # Create a new page with all content
            page.evaluate('''
                document.body.style.margin = '0';
                document.body.style.padding = '0';
                document.body.style.background = 'white';
            ''')

            # Set all the captured content
            full_html = f'''
                <html>
                <head>
                    <style>
                        body {{
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                            margin: 0;
                            padding: 0;
                            background: white;
                            color: black;
                        }}
                        img {{
                            max-width: 100%;
                            height: auto;
                        }}
                        h1 {{
                            font-size: 2.5em;
                        }}
                        h2 {{
                            font-size: 2em;
                            color: #FF1493;
                        }}
                        h3 {{
                            font-size: 1.5em;
                        }}
                        .content-container {{
                            padding: 20px;
                        }}
                        pre {{
                            background: #f5f5f5;
                            padding: 10px;
                            border-radius: 5px;
                            overflow-x: auto;
                        }}
                        code {{
                            background: #f5f5f5;
                            padding: 2px 4px;
                            border-radius: 3px;
                        }}
                    </style>
                </head>
                <body>
                    {''.join(all_slides_html)}
                </body>
                </html>
            '''

            # Navigate to a data URL with our content
            import base64
            html_bytes = full_html.encode('utf-8')
            base64_html = base64.b64encode(html_bytes).decode('utf-8')
            data_url = f'data:text/html;base64,{base64_html}'
            page.goto(data_url)
            page.wait_for_timeout(2000)

            # Generate PDF
            print("Generating PDF...")
            page.pdf(
                path=output_file,
                format='A4',
                print_background=True,
                margin={
                    'top': '20mm',
                    'right': '15mm',
                    'bottom': '20mm',
                    'left': '15mm'
                },
                display_header_footer=False
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
    capture_all_slides()