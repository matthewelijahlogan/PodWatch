import datetime

def format_date(date_str, fmt_in='%Y-%m-%d', fmt_out='%b %d, %Y'):
    """Convert a date string from one format to another."""
    try:
        dt = datetime.datetime.strptime(date_str, fmt_in)
        return dt.strftime(fmt_out)
    except Exception:
        return date_str

def slugify(text):
    """Simple slug generator for URLs."""
    return text.lower().replace(' ', '-').replace('.', '').replace(',', '')

# Add more helpers as needed