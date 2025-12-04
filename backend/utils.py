import requests
import os
import re
import time

OPENBD_API_URL = "https://api.openbd.jp/v1/get"
GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes"
RAKUTEN_BOOKS_API_URL = "https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404"

# Volume number extraction patterns (ordered by priority)
# Volume number extraction patterns (ordered by priority)
# Updated to support decimals (e.g., 8.5)
VOLUME_PATTERNS = [
    # Japanese patterns
    r'[（(](\d+(?:\.\d+)?)[)）]',          # （1）, (8.5) - number only in parentheses
    r'第(\d+(?:\.\d+)?)[巻話集号]',         # 第1巻, 第8.5巻
    r'(\d+(?:\.\d+)?)[巻話集号]$',          # 1巻, 8.5巻 (at end)
    r'[Vv][Oo][Ll]\.?\s*(\d+(?:\.\d+)?)',  # Vol.1, Vol.8.5
    r'[#＃](\d+(?:\.\d+)?)',               # #1, #8.5
    r'[【\[](\d+(?:\.\d+)?)[】\]]',         # 【1】, [8.5]
    r'\.\s*(\d+(?:\.\d+)?)',               # . 5, . 8.5 (with space or not) - Lower priority to avoid matching .5 in 13.5
    r'\s+(\d+(?:\.\d+)?)$',                # "Title 1", "Title 8.5" (number at end)
]

def extract_volume_number(title: str) -> float | None:
    """
    Extract volume number from a book title.
    Returns None if no volume number is found.
    Supports integers and floats (e.g., 8.5).
    """
    if not title:
        return None
    
    # Normalize full-width characters for easier matching
    # Convert full-width numbers and dots to half-width
    table = str.maketrans({
        '０': '0', '１': '1', '２': '2', '３': '3', '４': '4',
        '５': '5', '６': '6', '７': '7', '８': '8', '９': '9',
        '．': '.', '。': '.'
    })
    normalized_title = title.translate(table)
    
    for pattern in VOLUME_PATTERNS:
        match = re.search(pattern, normalized_title)
        if match:
            try:
                return float(match.group(1))
            except (ValueError, IndexError):
                continue
    return None

def clean_title(title: str) -> str:
    """
    Clean a book title to extract series name only.
    Removes volume numbers, subtitles (both Japanese and English), and side story keywords.
    """
    if not title:
        return title
    
    cleaned = title
    
    # Remove common label prefixes
    labels = ['GC NOVELS']
    for label in labels:
        cleaned = cleaned.replace(label, '')
        
    # Remove volume number at the start (e.g. "10 Series Title")
    cleaned = re.sub(r'^\s*\d+\s+', '', cleaned)
    
    # Remove English subtitle patterns (= followed by English text)
    cleaned = re.sub(r'\s*[=＝]\s*[A-Za-z].*$', '', cleaned)
    
    # Remove Japanese subtitles in parentheses (like 入学編 上, 夏休み編+1)
    cleaned = re.sub(r'\s*[（(][^）)]+[)）]\s*', '', cleaned)
    
    # Remove side story keywords and everything after
    # APPEND, SS, etc.
    side_story_keywords = [
        r'\s*APPEND.*$',
        r'\s*SS.*$',
        r'\s*Side\s*Story.*$',
        r'\s*外伝.*$',
    ]
    for pattern in side_story_keywords:
        cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)

    # Remove volume number patterns and everything after them
    # This assumes that anything after the volume number is a subtitle
    patterns_to_remove = [
        r'\.\s*\d+.*$',                     # .1 ... -> remove all after
        r'\s*第\d+[巻話集号].*$',            # 第1巻 ...
        r'\s+\d+[巻話集号].*$',             # 1巻 ...
        r'\s+\d+\s+.*$',                    # 1 Subtitle (digit followed by space and text)
        r'\s*[Vv][Oo][Ll]\.?\s*\d+.*$',     # Vol.1 ...
        r'\s*[#＃]\d+.*$',                  # #1 ...
        r'\s*[【\[]\d+[】\]].*$',            # 【1】 ...
    ]
    
    for pattern in patterns_to_remove:
        cleaned = re.sub(pattern, '', cleaned)
        
    # Also handle the case where the number is at the very end (already covered by regexes above if modified, but let's be safe)
    # The above regexes with .*$ should cover it.
    
    # Special case: "Title 15" (Digit at end or followed by text)
    # Be careful not to cut "1984" or "2001 Space Odyssey"
    # But for series extraction, usually a trailing number is a volume.
    cleaned = re.sub(r'\s+\d+$', '', cleaned) 
    
    # Clean up extra whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    
    # Remove trailing punctuation
    cleaned = re.sub(r'[\s\.\-－―:：]+$', '', cleaned).strip()
    
    return cleaned

def normalize_title(title: str) -> str:
    """
    Normalize a book title for display.
    Removes English subtitles but keeps volume numbers and Japanese subtitles.
    """
    if not title:
        return title
    
    # Extract volume marker (. 5) and Japanese subtitle ((夏休み編+1)) before removing English
    volume_match = re.search(r'(\.\s*\d+)', title)
    volume_marker = volume_match.group(1) if volume_match else ''
    
    # Find Japanese subtitle in parentheses (after the English part if exists)
    # Look for pattern like (夏休み編+1) - parentheses with Japanese text
    jp_subtitle_match = re.search(r'(\s*[（(][^\x00-\x7F][^）)]*[)）])', title)
    jp_subtitle = jp_subtitle_match.group(1) if jp_subtitle_match else ''
    
    # Remove English subtitle (= followed by English text, up to but not including Japanese)
    # This regex stops at Japanese characters or parentheses with Japanese
    normalized = re.sub(r'\s*[=＝]\s*[A-Za-z][A-Za-z\s\-\'\",.!?:;()0-9]*(?=[^\x00-\x7F（(]|$)', '', title)
    
    # If the result lost the volume marker or Japanese subtitle, reconstruct
    if volume_marker and volume_marker not in normalized:
        # Find the series name part
        base = re.sub(r'\s*[=＝].*$', '', title)
        if jp_subtitle:
            normalized = base + volume_marker + ' ' + jp_subtitle.strip()
        else:
            normalized = base + volume_marker
    
    # Clean up extra whitespace
    normalized = re.sub(r'\s+', ' ', normalized).strip()
    
    return normalized

def extract_series_title(title: str, series_from_api: str = None) -> str:
    """
    Get series title: prefer API-provided series name, fall back to cleaned title.
    """
    # Always try to clean the title first to get a candidate series name
    cleaned = clean_title(title)
    
    # If API provided a series title, check if it's better
    if series_from_api:
        # If API series is just the label (contains "文庫" or "コミックス"), ignore it
        if "文庫" in series_from_api or "コミックス" in series_from_api or "BOOKS" in series_from_api or "GC NOVELS" in series_from_api:
            return cleaned
        return series_from_api
        
    return cleaned

def fetch_rakuten_books_data(isbn: str):
    """
    Fetch book data from Rakuten Books API.
    Requires RAKUTEN_APP_ID environment variable.
    """
    app_id = os.environ.get("RAKUTEN_APP_ID")
    if not app_id:
        print("RAKUTEN_APP_ID not set, skipping Rakuten Books API")
        return None
        
    url = f"{RAKUTEN_BOOKS_API_URL}?applicationId={app_id}&isbn={isbn}"
    
    max_retries = 3
    retry_delay = 1.0  # seconds
    
    for attempt in range(max_retries):
        try:
            response = requests.get(url)
            
            if response.status_code == 429:
                if attempt < max_retries - 1:
                    print(f"Rakuten API rate limit (429). Retrying in {retry_delay}s... (Attempt {attempt + 1}/{max_retries})")
                    time.sleep(retry_delay)
                    continue
                else:
                    print(f"Error fetching from Rakuten Books for ISBN {isbn}: 429 Client Error after {max_retries} retries")
                    return None

            response.raise_for_status()
            
            data = response.json()
            if data.get("count", 0) > 0 and data.get("Items"):
                item = data["Items"][0]["Item"]
                
                # Get large image if available
                cover_url = item.get("largeImageUrl", item.get("mediumImageUrl", ""))
                
                return {
                    "isbn": item.get("isbn"),
                    "title": item.get("title"),
                    "authors": item.get("author"),
                    "publisher": item.get("publisherName"),
                    "published_date": item.get("salesDate", "").replace("年", "").replace("月", "").replace("日", ""),
                    "cover_url": cover_url,
                    "description": item.get("itemCaption"),
                    "series_title": item.get("seriesName"), 
                }
            return None
            
        except requests.exceptions.RequestException as e:
            # For 429 raised by raise_for_status (if not handled above) or other errors
            if isinstance(e, requests.exceptions.HTTPError) and e.response.status_code == 429:
                 if attempt < max_retries - 1:
                    print(f"Rakuten API rate limit (429). Retrying in {retry_delay}s... (Attempt {attempt + 1}/{max_retries})")
                    time.sleep(retry_delay)
                    continue
            
            print(f"Error fetching from Rakuten Books for ISBN {isbn}: {e}")
            return None
            
    return None

def fetch_google_books_data(isbn: str):
    """
    Fetch book data from Google Books API as a fallback.
    """
    try:
        response = requests.get(f"{GOOGLE_BOOKS_API_URL}?q=isbn:{isbn}")
        response.raise_for_status()
        data = response.json()
        
        if data.get("totalItems", 0) > 0:
            volume_info = data["items"][0]["volumeInfo"]
            
            # Get best available image
            image_links = volume_info.get("imageLinks", {})
            cover_url = image_links.get("extraLarge") or image_links.get("large") or image_links.get("medium") or image_links.get("small") or image_links.get("thumbnail")
            
            return {
                "isbn": isbn,
                "title": volume_info.get("title"),
                "authors": ", ".join(volume_info.get("authors", [])),
                "publisher": volume_info.get("publisher"),
                "published_date": volume_info.get("publishedDate", "").replace("-", ""),
                "cover_url": cover_url,
                "description": volume_info.get("description"),
            }
    except Exception as e:
        print(f"Error fetching from Google Books for ISBN {isbn}: {e}")
        
    return None

def clean_author_name(author_str: str) -> str:
    """
    Clean up author name string.
    Removes birth years, publisher names, and secondary authors (illustrators) if separated by /.
    """
    if not author_str:
        return author_str
    
    cleaned = author_str
    
    # Take only the first author if multiple are separated by /
    if '/' in cleaned:
        cleaned = cleaned.split('/')[0]
        
    # Remove birth year patterns like ",1975-" or " 1975-"
    # Include various dash types and allow trailing whitespace
    cleaned = re.sub(r'[,，\s]*\d{4}[-−–—]?\s*$', '', cleaned)
    
    # Replace commas with space (Handle "Surname, Name" format)
    cleaned = cleaned.replace(',', ' ').replace('，', ' ')
    
    # Remove specific publisher names that might get mixed in (heuristic)
    # This list can be expanded
    publishers = ['マイクロマガジン社', 'KADOKAWA', '講談社', '集英社', '小学館']
    for pub in publishers:
        cleaned = cleaned.replace(pub, '')
        
    # Clean up extra whitespace
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
    return cleaned

def format_book_title(title: str, series_title: str, volume_number: float | None) -> str:
    """
    Format book title to a standard format: "{Series} {Volume} {Subtitle}"
    Removes decorations from volume number and cleans up subtitle.
    """
    if not title or not series_title:
        return title
        
    # Extract subtitle by removing series name
    subtitle = title.replace(series_title, "")
    
    # Normalize full-width for cleaning
    table = str.maketrans({
        '０': '0', '１': '1', '２': '2', '３': '3', '４': '4',
        '５': '5', '６': '6', '７': '7', '８': '8', '９': '9',
        '．': '.', '。': '.'
    })
    cleaned_subtitle = subtitle.translate(table)
    
    # Remove volume number from subtitle if it exists
    if volume_number is not None:
        vol_str = str(volume_number)
        if vol_str.endswith(".0"):
            vol_str = str(int(volume_number))
        
        # Remove exact volume number
        cleaned_subtitle = re.sub(rf'\b{vol_str}\b', '', cleaned_subtitle)
        
        # Remove patterns like (10), . 5, etc.
        patterns = [
            r'\.\s*\d+(?:\.\d+)?',
            r'[（(]\d+(?:\.\d+)?[)）]',
            r'第\d+(?:\.\d+)?[巻話集号]',
            r'\d+(?:\.\d+)?[巻話集号]',
            r'[Vv][Oo][Ll]\.?\s*\d+(?:\.\d+)?',
            r'[#＃]\d+(?:\.\d+)?',
            r'[【\[]\d+(?:\.\d+)?[】\]]',
            r'\s+\d+(?:\.\d+)?$', # Trailing number
            r'GC NOVELS' # Label name
        ]
        for p in patterns:
            cleaned_subtitle = re.sub(p, '', cleaned_subtitle)

    # Clean up whitespace and punctuation
    cleaned_subtitle = re.sub(r'^[\s\.\-－:：]+', '', cleaned_subtitle)
    cleaned_subtitle = re.sub(r'[\s\.\-－:：]+$', '', cleaned_subtitle)
    
    # Remove empty parentheses
    cleaned_subtitle = re.sub(r'[（(]\s*[)）]', '', cleaned_subtitle)
    # Remove leftover "13." type patterns inside parentheses if any
    cleaned_subtitle = re.sub(r'[（(]\s*\d+\.\s*[)）]', '', cleaned_subtitle)
    
    cleaned_subtitle = cleaned_subtitle.strip()
    
    # Construct new title
    new_title = series_title
    
    if volume_number is not None:
        vol_display = str(volume_number)
        if vol_display.endswith(".0"):
            vol_display = str(int(volume_number))
        new_title += f" {vol_display}"
        
    if cleaned_subtitle:
        new_title += f" {cleaned_subtitle}"
        
    return new_title

def fetch_book_data(isbn: str):
    """
    Fetch book data from multiple APIs (OpenBD, Rakuten, Google) and merge them
    to create the most complete dataset possible.
    Waterfall approach: OpenBD -> Check missing (Title/Author/Cover/Series/Vol) -> Rakuten -> Check Cover -> Google
    """
    book_data = {}
    
    # 1. Fetch from OpenBD (Base data)
    openbd_data = None
    try:
        response = requests.get(f"{OPENBD_API_URL}?isbn={isbn}")
        if response.status_code == 200:
            data = response.json()
            if data and data[0]:
                summary = data[0]['summary']
                openbd_data = {
                    "isbn": summary.get("isbn"),
                    "title": summary.get("title"),
                    "authors": summary.get("author"),
                    "publisher": summary.get("publisher"),
                    "published_date": summary.get("pubdate"),
                    "cover_url": summary.get("cover"),
                    "description": data[0].get("onix", {}).get("CollateralDetail", {}).get("TextContent", [{}])[0].get("Text", ""),
                    "series_title": summary.get("series"), # Often label name
                }
    except Exception as e:
        print(f"Error fetching from OpenBD: {e}")

    # Use OpenBD data as base
    if openbd_data:
        book_data = openbd_data.copy()
        # Normalize title immediately to remove English part (= ...)
        if book_data.get("title"):
            book_data["title"] = normalize_title(book_data["title"])

    # Check if we need to fetch from Rakuten
    needs_rakuten = False
    if not book_data:
        needs_rakuten = True
    else:
        # Check Title (heuristic: if title is short compared to what it could be, or just missing)
        if not book_data.get("title"):
            needs_rakuten = True
        
        # Check Authors
        if not book_data.get("authors"):
            needs_rakuten = True
            
        # Check Cover
        if not book_data.get("cover_url"):
            needs_rakuten = True
            
        # Check Series Title
        if not book_data.get("series_title"):
            needs_rakuten = True
            
        # Check Volume (try to extract)
        if book_data.get("title") and extract_volume_number(book_data["title"]) is None:
            # If no volume found, maybe Rakuten has a better title with volume
            needs_rakuten = True

    rakuten_data = None
    if needs_rakuten:
        rakuten_data = fetch_rakuten_books_data(isbn)
        
        if rakuten_data:
            if not book_data:
                book_data = rakuten_data.copy()
            else:
                # Merge Rakuten data
                
                # Enhance Title (Subtitle completion)
                if book_data.get("title") and rakuten_data.get("title"):
                    base_title = book_data["title"]
                    sub_source = rakuten_data["title"]
                    
                    # Normalize for comparison
                    def normalize(s):
                        return re.sub(r'[\s\u3000]+', '', s).lower()
                    
                    # If Rakuten title is longer than the base title, it might have a subtitle
                    # base_title is already normalized (no English part), so direct comparison is fine
                    if len(sub_source) > len(base_title):
                        series_name = clean_title(base_title)
                        volume = extract_volume_number(base_title)
                        candidate = sub_source.replace(series_name, '')
                        if volume:
                            candidate = re.sub(rf'{volume}', '', candidate, count=1)
                        candidate = candidate.strip()
                        
                        if normalize(candidate) not in normalize(base_title) and normalize(base_title) not in normalize(sub_source):
                            candidate = re.sub(r'^[\s\.\-－:：]+', '', candidate)
                            if candidate:
                                if candidate.startswith('(') or candidate.startswith('（'):
                                    book_data["title"] = f"{base_title}{candidate}"
                                else:
                                    book_data["title"] = f"{base_title} {candidate}"
                        elif normalize(base_title) in normalize(sub_source):
                             book_data["title"] = sub_source
                elif not book_data.get("title") and rakuten_data.get("title"):
                    book_data["title"] = rakuten_data["title"]

                # Enhance Authors
                if not book_data.get("authors") and rakuten_data.get("authors"):
                    book_data["authors"] = rakuten_data["authors"]
                    
                # Enhance Cover
                if not book_data.get("cover_url") and rakuten_data.get("cover_url"):
                    book_data["cover_url"] = rakuten_data["cover_url"]
                    
                # Enhance Series Title
                if not book_data.get("series_title") and rakuten_data.get("series_title"):
                    book_data["series_title"] = rakuten_data["series_title"]
                    
                # Enhance Description (Optional, but good to have if we are calling Rakuten anyway)
                if not book_data.get("description") and rakuten_data.get("description"):
                    book_data["description"] = rakuten_data["description"]

    # 3. Fetch from Google Books (Fallback for Cover only)
    if not book_data or not book_data.get("cover_url"):
        google_data = fetch_google_books_data(isbn)
        if google_data:
            if not book_data:
                book_data = google_data.copy()
            elif not book_data.get("cover_url") and google_data.get("cover_url"):
                book_data["cover_url"] = google_data["cover_url"]
    
    # 4. Final Normalization and Cleanup
    if book_data and book_data.get("title"):
        title = book_data["title"]
        
        # Extract volume number from title
        volume = extract_volume_number(title)
        if volume is not None:
            book_data["volume_number"] = volume
        
        # Set series_title: prefer API-provided, fallback to cleaned title
        api_series = book_data.get("series_title")
        series_title = extract_series_title(title, api_series)
        book_data["series_title"] = series_title
        
        # --- General Normalization ---
        
        # 1. Clean Author Name
        if book_data.get("authors"):
            book_data["authors"] = clean_author_name(book_data["authors"])
            
        # 2. Format Title (Generic)
        # Special handling for known decimal volumes by ISBN (Tensura edge cases)
        current_isbn = book_data.get("isbn")
        if current_isbn == "9784896375800": # Tensura 8.5
            book_data["volume_number"] = 8.5
            book_data["title"] = "転生したらスライムだった件 8.5 公式設定資料集"
            book_data["series_title"] = "転生したらスライムだった件" # Ensure series is set
        elif current_isbn == "9784896378450": # Tensura 13.5
            book_data["volume_number"] = 13.5
            book_data["title"] = "転生したらスライムだった件 13.5"
            book_data["series_title"] = "転生したらスライムだった件" # Ensure series is set
        else:
            # Apply generic formatting
            book_data["title"] = format_book_title(title, series_title, book_data.get("volume_number"))

    return book_data
