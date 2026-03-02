import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.podchaser.com"
CHART_URL = "https://www.podchaser.com/charts/top"

HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                   "AppleWebKit/537.36 (KHTML, like Gecko) "
                   "Chrome/115.0.0.0 Safari/537.36"),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "Referer": "https://www.google.com/",
    "Connection": "keep-alive"
}

def scrape_top_podcast_urls():
    session = requests.Session()
    session.headers.update(HEADERS)

    # First get the homepage to set cookies
    home_resp = session.get(BASE_URL)
    home_resp.raise_for_status()

    # Now request chart page with cookies
    resp = session.get(CHART_URL)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, 'html.parser')

    podcast_links = []
    cards = soup.select("a.styles__PodcastTitle-sc-1o8t26b-3")

    for a_tag in cards[:50]:
        href = a_tag.get('href')
        if href and href.startswith('/podcasts/'):
            podcast_links.append(BASE_URL + href)

    return podcast_links

if __name__ == "__main__":
    urls = scrape_top_podcast_urls()
    print(f"Found {len(urls)} podcast URLs")
    for url in urls:
        print(url)
