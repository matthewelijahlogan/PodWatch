# podwatch_scraper.py
import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

URL = "https://podbay.fm/chart"
OUTPUT_FILE = "podcasts.json"

def scrape_top_podcasts():
    response = requests.get(URL)
    soup = BeautifulSoup(response.text, 'html.parser')

    podcast_list = []
    entries = soup.select(".chart-item")

    for i, entry in enumerate(entries[:50]):
        title = entry.select_one(".chart-item__title").get_text(strip=True)
        author = entry.select_one(".chart-item__author").get_text(strip=True)
        link = "https://podbay.fm" + entry.find("a")["href"]

        podcast_list.append({
            "rank": i + 1,
            "title": title,
            "author": author,
            "link": link,
            "timestamp": datetime.utcnow().isoformat()
        })

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(podcast_list, f, indent=2)

    print(f"✅ Top 50 podcasts scraped and saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    scrape_top_podcasts()
