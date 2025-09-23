#!/usr/bin/env python3
"""
Simple PDF generation using browser print
"""

import os
import time
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print("Error: Playwright is required")
    print("Install with: pip install playwright && playwright install chromium")
    exit(1)

def generate_pdf():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=False)  # Non-headless to see what's happening

        # Create new page
        page = browser.new_page()

        # Navigate to your presentation
        file_path = Path('index.html').absolute()
        url = f'file://{file_path}'
        print(f"Opening: {url}")
        page.goto(url)

        # Wait for page to load
        print("Waiting for page to load...")
        page.wait_for_load_state('networkidle')
        time.sleep(3)

        # Print to PDF using browser's native print
        print("Generating PDF...")
        page.pdf(
            path="HTPAAC_Simple.pdf",
            format="A4",
            landscape=True,
            print_background=True
        )

        print("PDF saved as HTPAAC_Simple.pdf")
        browser.close()

if __name__ == "__main__":
    generate_pdf()