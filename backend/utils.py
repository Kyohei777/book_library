import requests
import os

OPENBD_API_URL = "https://api.openbd.jp/v1/get"
GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes"
RAKUTEN_BOOKS_API_URL = "https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404"

def fetch_rakuten_books_data(isbn: str):
    """
    Fetch book data from Rakuten Books API.
    Requires RAKUTEN_APP_ID environment variable.
    """
    app_id = os.getenv("RAKUTEN_APP_ID")
    if not app_id:
        print("RAKUTEN_APP_ID not set, skipping Rakuten Books API")
        return None

    try:
        response = requests.get(f"{RAKUTEN_BOOKS_API_URL}?applicationId={app_id}&isbn={isbn}")
        response.raise_for_status()
        data = response.json()

        if "Items" in data and len(data["Items"]) > 0:
            item = data["Items"][0]["Item"]
            
            # Rakuten returns largeImageUrl, mediumImageUrl, smallImageUrl, etc.
            # Prioritize largeImageUrl
            cover = item.get("largeImageUrl") or item.get("mediumImageUrl") or item.get("smallImageUrl")
            
            # Convert http to https if needed
            if cover and cover.startswith("http://"):
                cover = cover.replace("http://", "https://")

            return {
                "isbn": item.get("isbn"),
                "title": item.get("title"),
                "authors": item.get("author"),
                "publisher": item.get("publisherName"),
                "published_date": item.get("salesDate"),
                "cover_url": cover,
                "description": item.get("itemCaption"),
                "series_title": item.get("seriesName"), 
            }
    except Exception as e:
        print(f"Error fetching from Rakuten Books for ISBN {isbn}: {e}")
    return None

def fetch_google_books_data(isbn: str):
    """
    Fetch book data from Google Books API as a fallback.
    """
    try:
        response = requests.get(f"{GOOGLE_BOOKS_API_URL}?q=isbn:{isbn}")
        response.raise_for_status()
        data = response.json()
        
        if "items" in data and len(data["items"]) > 0:
            volume_info = data["items"][0]["volumeInfo"]
            image_links = volume_info.get("imageLinks", {})
            
            # Get high quality image if possible
            # Google Books API returns http links, we might want to ensure they work or upgrade to https if needed (usually they redirect)
            # Prioritize larger images
            cover = (image_links.get("extraLarge") or 
                     image_links.get("large") or 
                     image_links.get("medium") or 
                     image_links.get("thumbnail") or 
                     image_links.get("smallThumbnail"))
            
            # Google Books API often returns http URLs. Convert to https to avoid mixed content warnings if possible
            if cover:
                if cover.startswith("http://"):
                    cover = cover.replace("http://", "https://")
                
                # Try to force higher resolution by modifying URL parameters
                # Remove curled edge effect
                cover = cover.replace("&edge=curl", "")
                
                # Some sources suggest changing zoom=1 to zoom=3 or similar, but it's flaky.
                # Let's try to just ensure we don't have the small thumbnail restriction if possible.
                # For now, removing edge=curl is a safe aesthetic improvement.
            
            return {
                "isbn": isbn,
                "title": volume_info.get("title"),
                "authors": ", ".join(volume_info.get("authors", [])) if volume_info.get("authors") else None,
                "publisher": volume_info.get("publisher"),
                "published_date": volume_info.get("publishedDate"),
                "cover_url": cover,
                "description": volume_info.get("description"),
                "series_title": volume_info.get("title"), # Google Books often includes series in title, hard to separate without specific field
            }
    except Exception as e:
        print(f"Error fetching from Google Books for ISBN {isbn}: {e}")
    return None

def fetch_book_data(isbn: str):
    """
    Fetch book data from OpenBD API, falling back to Rakuten Books, then Google Books API if needed.
    """
    book_data = None
    
    # 1. Try OpenBD
    try:
        response = requests.get(f"{OPENBD_API_URL}?isbn={isbn}")
        response.raise_for_status()
        data = response.json()
        
        if data and data[0]:
            book_info = data[0]['summary']
            book_data = {
                "isbn": book_info.get("isbn"),
                "title": book_info.get("title"),
                "authors": book_info.get("author"),
                "publisher": book_info.get("publisher"),
                "published_date": book_info.get("pubdate"),
                "cover_url": book_info.get("cover"),
                "description": data[0].get("onix", {}).get("CollateralDetail", {}).get("TextContent", [{}])[0].get("Text", ""),
                "series_title": book_info.get("series"),
            }
    except Exception as e:
        print(f"Error fetching from OpenBD for ISBN {isbn}: {e}")

    # 2. Fallback logic
    # If we have no data, or if we have data but no cover, try Rakuten Books
    if not book_data or not book_data.get("cover_url"):
        rakuten_data = fetch_rakuten_books_data(isbn)
        if rakuten_data:
            if not book_data:
                book_data = rakuten_data
            elif not book_data.get("cover_url") and rakuten_data.get("cover_url"):
                book_data["cover_url"] = rakuten_data["cover_url"]
                # Also try to fill other missing fields if Rakuten has them
                if not book_data.get("description") and rakuten_data.get("description"):
                    book_data["description"] = rakuten_data["description"]
                if not book_data.get("series_title") and rakuten_data.get("series_title"):
                    book_data["series_title"] = rakuten_data["series_title"]

    # 3. Fallback to Google Books if still no cover
    if not book_data or not book_data.get("cover_url"):
        google_data = fetch_google_books_data(isbn)
        if google_data:
            if not book_data:
                # Completely replace if we had nothing
                book_data = google_data
            elif not book_data.get("cover_url") and google_data.get("cover_url"):
                # Only fill in the missing cover
                book_data["cover_url"] = google_data["cover_url"]
                
    return book_data
