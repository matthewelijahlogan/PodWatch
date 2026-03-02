# daily_runner.py
import schedule
import time
from backend.scraper.podwatch_scraper import scrape_top_podcasts

schedule.every().day.at("00:00").do(scrape_top_podcasts)

while True:
    schedule.run_pending()
    time.sleep(60)
