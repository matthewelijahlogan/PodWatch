from playwright.sync_api import sync_playwright

def scrape_top_podcasts():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=100)
        page = browser.new_page()
        print("🌐 Navigating to site...")
        page.goto("https://podstatus.com/charts/spotify/us/top-podcasts")

        # Optional: wait for cookies manually (if needed)
        page.wait_for_timeout(5000)

        # Print page content to debug structure
        print("📄 Printing page HTML...")
        print(page.content())

        # Try finding the table again
        print("🔍 Waiting for chart table...")
        page.wait_for_selector("table.chart-table", timeout=30000)

        # From here on, continue scraping logic
        print("✅ Chart table loaded")

        browser.close()

scrape_top_podcasts()
