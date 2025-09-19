#!/usr/bin/env python3
"""
Website to PDF Converter Script
Converts a website (URL or local HTML file) to a well-formatted PDF
"""

import argparse
import os
import sys
from pathlib import Path
from urllib.parse import urlparse

# Try multiple PDF libraries for better compatibility
try:
    import pdfkit
    PDFKIT_AVAILABLE = True
except ImportError:
    PDFKIT_AVAILABLE = False

try:
    from weasyprint import HTML, CSS
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False

try:
    from playwright.sync_api import sync_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False


def convert_with_pdfkit(input_source, output_path, options=None):
    """Convert using pdfkit (wkhtmltopdf wrapper)"""
    if not PDFKIT_AVAILABLE:
        raise ImportError("pdfkit is not installed. Install with: pip install pdfkit")

    default_options = {
        'page-size': 'A4',
        'margin-top': '0.75in',
        'margin-right': '0.75in',
        'margin-bottom': '0.75in',
        'margin-left': '0.75in',
        'encoding': "UTF-8",
        'no-outline': None,
        'enable-local-file-access': None,
        'print-media-type': None,
        'quiet': None
    }

    if options:
        default_options.update(options)

    try:
        if input_source.startswith('http://') or input_source.startswith('https://'):
            pdfkit.from_url(input_source, output_path, options=default_options)
        else:
            pdfkit.from_file(input_source, output_path, options=default_options)
        return True
    except Exception as e:
        print(f"Error with pdfkit: {e}")
        return False


def convert_with_weasyprint(input_source, output_path):
    """Convert using WeasyPrint"""
    if not WEASYPRINT_AVAILABLE:
        raise ImportError("weasyprint is not installed. Install with: pip install weasyprint")

    try:
        if input_source.startswith('http://') or input_source.startswith('https://'):
            html = HTML(url=input_source)
        else:
            html = HTML(filename=input_source)

        # Add custom CSS for better formatting
        css = CSS(string='''
            @page {
                size: A4;
                margin: 2cm;
            }
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
            }
            img {
                max-width: 100%;
                height: auto;
            }
            pre {
                overflow-wrap: break-word;
                white-space: pre-wrap;
            }
        ''')

        html.write_pdf(output_path, stylesheets=[css])
        return True
    except Exception as e:
        print(f"Error with WeasyPrint: {e}")
        return False


def convert_with_playwright(input_source, output_path):
    """Convert using Playwright (headless browser)"""
    if not PLAYWRIGHT_AVAILABLE:
        raise ImportError("playwright is not installed. Install with: pip install playwright && playwright install chromium")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            if input_source.startswith('http://') or input_source.startswith('https://'):
                page.goto(input_source, wait_until='networkidle')
            else:
                # For local files, use file:// protocol
                file_path = Path(input_source).resolve()
                page.goto(f'file://{file_path}', wait_until='networkidle')

            # Wait for content to load
            page.wait_for_timeout(2000)

            # Generate PDF with options for better formatting
            page.pdf(
                path=output_path,
                format='A4',
                print_background=True,
                margin={
                    'top': '20mm',
                    'right': '20mm',
                    'bottom': '20mm',
                    'left': '20mm'
                }
            )

            browser.close()
        return True
    except Exception as e:
        print(f"Error with Playwright: {e}")
        return False


def convert_to_pdf(input_source, output_path=None, method='auto'):
    """
    Main conversion function that tries different methods

    Args:
        input_source: URL or path to HTML file
        output_path: Path for output PDF (optional)
        method: 'auto', 'pdfkit', 'weasyprint', or 'playwright'
    """
    # Determine output path if not specified
    if output_path is None:
        if input_source.startswith('http://') or input_source.startswith('https://'):
            parsed = urlparse(input_source)
            filename = parsed.netloc.replace('.', '_') + '.pdf'
        else:
            filename = Path(input_source).stem + '.pdf'
        output_path = filename

    # Ensure output path has .pdf extension
    if not output_path.endswith('.pdf'):
        output_path += '.pdf'

    print(f"Converting '{input_source}' to '{output_path}'...")

    # Try conversion based on method
    success = False

    if method == 'auto':
        # Try methods in order of preference
        methods = []
        if PLAYWRIGHT_AVAILABLE:
            methods.append(('Playwright', convert_with_playwright))
        if PDFKIT_AVAILABLE:
            methods.append(('pdfkit', convert_with_pdfkit))
        if WEASYPRINT_AVAILABLE:
            methods.append(('WeasyPrint', convert_with_weasyprint))

        if not methods:
            print("Error: No PDF conversion libraries are installed!")
            print("\nPlease install at least one of the following:")
            print("  1. Playwright: pip install playwright && playwright install chromium")
            print("  2. pdfkit: pip install pdfkit (also requires wkhtmltopdf)")
            print("  3. WeasyPrint: pip install weasyprint")
            return False

        for method_name, method_func in methods:
            print(f"Trying {method_name}...")
            try:
                if method_name == 'pdfkit':
                    success = method_func(input_source, output_path)
                else:
                    success = method_func(input_source, output_path)
                if success:
                    print(f"Success with {method_name}!")
                    break
            except Exception as e:
                print(f"Failed with {method_name}: {e}")
    else:
        # Use specific method
        method_map = {
            'pdfkit': convert_with_pdfkit,
            'weasyprint': convert_with_weasyprint,
            'playwright': convert_with_playwright
        }

        if method in method_map:
            try:
                success = method_map[method](input_source, output_path)
            except Exception as e:
                print(f"Error: {e}")
        else:
            print(f"Error: Unknown method '{method}'")
            return False

    if success:
        print(f"\n✅ PDF successfully created: {output_path}")
        print(f"File size: {os.path.getsize(output_path):,} bytes")
    else:
        print("\n❌ Failed to create PDF")

    return success


def main():
    parser = argparse.ArgumentParser(
        description='Convert a website or HTML file to PDF',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  # Convert a URL to PDF
  python convert_to_pdf.py https://example.com

  # Convert local HTML file
  python convert_to_pdf.py index.html

  # Specify output filename
  python convert_to_pdf.py https://example.com -o output.pdf

  # Use specific conversion method
  python convert_to_pdf.py https://example.com -m playwright
        '''
    )

    parser.add_argument(
        'input',
        help='URL or path to HTML file to convert'
    )

    parser.add_argument(
        '-o', '--output',
        help='Output PDF filename (default: auto-generated)',
        default=None
    )

    parser.add_argument(
        '-m', '--method',
        choices=['auto', 'pdfkit', 'weasyprint', 'playwright'],
        default='auto',
        help='Conversion method to use (default: auto)'
    )

    args = parser.parse_args()

    # Check if input file exists (if it's not a URL)
    if not (args.input.startswith('http://') or args.input.startswith('https://')):
        if not os.path.exists(args.input):
            print(f"Error: File '{args.input}' not found!")
            sys.exit(1)

    # Perform conversion
    success = convert_to_pdf(args.input, args.output, args.method)

    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()