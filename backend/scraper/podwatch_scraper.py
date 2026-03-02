# backend/scraper/podwatch_scraper.py

from playwright.sync_api import sync_playwright
import json
import os
import requests

def download_image(url, save_path):
    try:
        response = requests.get(url, stream=True, timeout=10)
        if response.status_code == 200:
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return True
    except Exception as e:
        print(f"❌ Failed to download image {url}: {e}")
    return False

def scrape_top_podcasts():
    print("🌐 Navigating to https://podstatus.com/charts/spotify/us/top-podcasts ...")

    # Define the data directory path (relative to this script)
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
    os.makedirs(base_dir, exist_ok=True)

    # Create images folder inside data/
    images_dir = os.path.join(base_dir, "images")
    os.makedirs(images_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=50)
        context = browser.new_context()
        page = context.new_page()

        page.goto("https://podstatus.com/charts/spotify/us/top-podcasts", timeout=60000)

        # Try accepting cookies
        try:
            cookie_button = page.locator("button:has-text('Accept')")
            if cookie_button.is_visible():
                cookie_button.click()
                print("✅ Accepted cookies")
        except:
            print("⚠️ Cookie banner not found or already accepted")

        page.wait_for_selector("div.list-group-item.d-flex", timeout=30000)
        rows = page.locator("div.list-group-item.d-flex").all()
        print(f"✅ Found {len(rows)} podcast entries")

        data = []
        for i, row in enumerate(rows):
            try:
                rank = int(row.locator("span.display-4").inner_text().strip())
                title = row.locator("h4.fw-normal").inner_text().strip()
                author = row.locator("small.text-muted").inner_text().strip()

                image_element = row.locator("img.rounded")
                image_url = image_element.get_attribute("src") if image_element else ""

                local_image_path = ""
                if image_url:
                    image_ext = os.path.splitext(image_url)[-1].split("?")[0]
                    if not image_ext or len(image_ext) > 5:
                        image_ext = ".jpg"  # fallback

                    filename = f"podcast_{rank}{image_ext}"
                    full_path = os.path.join(images_dir, filename)

                    if download_image(image_url, full_path):
                        # Store path relative to data folder
                        local_image_path = f"images/{filename}"
                    else:
                        print(f"⚠️ Skipped image for rank {rank}")

                data.append({
                    "rank": rank,
                    "title": title,
                    "author": author,
                    "image": local_image_path
                })

            except Exception as e:
                print(f"⚠️ Failed to parse row {i+1}: {e}")

        # Save JSON to data folder
        json_path = os.path.join(base_dir, "top_podcasts.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        print(f"✅ Scraping complete. {len(data)} podcasts saved to {json_path}")
        browser.close()

if __name__ == "__main__":
    scrape_top_podcasts()
