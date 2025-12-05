from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import Base, engine, get_db, Book
from utils import fetch_book_data
import requests
import os

# Initialize Database
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Home Library API")

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from datetime import datetime

# Pydantic Models
class BookCreate(BaseModel):
    isbn: str
    title: Optional[str] = None
    authors: Optional[str] = None
    publisher: Optional[str] = None
    published_date: Optional[str] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None
    status: Optional[str] = "unread"
    location: Optional[str] = None
    series_title: Optional[str] = None
    label: Optional[str] = None
    purchased_date: Optional[datetime] = None
    reading_start_date: Optional[datetime] = None
    reading_end_date: Optional[datetime] = None
    rating: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None
    lent_to: Optional[str] = None
    lent_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    volume_number: Optional[int] = None
    is_series_representative: Optional[bool] = False

class BookUpdate(BaseModel):
    title: Optional[str] = None
    authors: Optional[str] = None
    publisher: Optional[str] = None
    published_date: Optional[str] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    series_title: Optional[str] = None
    label: Optional[str] = None
    purchased_date: Optional[datetime] = None
    reading_start_date: Optional[datetime] = None
    reading_end_date: Optional[datetime] = None
    rating: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None
    lent_to: Optional[str] = None
    lent_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    volume_number: Optional[int] = None
    is_series_representative: Optional[bool] = None

class BookResponse(BaseModel):
    isbn: str
    title: str
    authors: Optional[str] = None
    publisher: Optional[str] = None
    published_date: Optional[str] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None
    status: str
    location: Optional[str] = None
    series_title: Optional[str] = None
    label: Optional[str] = None
    created_at: datetime
    purchased_date: Optional[datetime] = None
    reading_start_date: Optional[datetime] = None
    reading_end_date: Optional[datetime] = None
    rating: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None
    lent_to: Optional[str] = None
    lent_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    volume_number: Optional[float] = None
    is_series_representative: Optional[bool] = None

    class Config:
        from_attributes = True

def get_existing_series(db: Session) -> list:
    """Get list of distinct series titles from the database."""
    series_rows = db.query(Book.series_title).filter(
        Book.series_title.isnot(None),
        Book.series_title != ''
    ).distinct().all()
    
    return [s[0] for s in series_rows if s[0]]

@app.post("/books", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(book_in: BookCreate, db: Session = Depends(get_db)):
    from utils import normalize_title, extract_volume_number, clean_title
    import re
    
    # Check if book already exists
    existing_book = db.query(Book).filter(Book.isbn == book_in.isbn).first()
    if existing_book:
        raise HTTPException(status_code=400, detail="Book already registered")

    # Get existing series to match against
    existing_series = get_existing_series(db)
    
    # Prepare book data
    book_data = book_in.dict(exclude_unset=True)
    
    # If title is missing, try to fetch from external APIs
    if not book_data.get("title"):
        fetched_data = fetch_book_data(book_in.isbn, existing_series)
        if fetched_data:
            for key, value in fetched_data.items():
                # Save API's series_title as label (it's usually publisher label like 電撃文庫)
                if key == "series_title":
                    if value and not book_data.get("label"):
                        # Remove English part from label (e.g., "電撃文庫 = DENGEKI BUNKO" -> "電撃文庫")
                        clean_label = re.sub(r'\s*[=＝]\s*[A-Za-z].*$', '', value).strip()
                        book_data["label"] = clean_label
                    continue
                if key not in book_data or not book_data[key]:
                    book_data[key] = value
        else:
            if "title" not in book_data:
                book_data["title"] = "Unknown Title"
    
    # Always normalize title (remove English subtitles like "= The irregular...")
    if book_data.get("title"):
        book_data["title"] = normalize_title(book_data["title"])
    
    # Always extract volume number from title
    if book_data.get("title"):
        volume = extract_volume_number(book_data["title"])
        if volume:
            book_data["volume_number"] = volume
    
    # Only extract series title from title if not already provided by user
    if book_data.get("title") and not book_data.get("series_title"):
        book_data["series_title"] = clean_title(book_data["title"])
    
    # Note: Title format unification is disabled because each book may have unique subtitles
    # The series_title is used for grouping, while title preserves individual book info
    # 
    # Try to match title format with existing books in the same series
    # if book_data.get("series_title"):
    #     existing_series_books = db.query(Book).filter(
    #         Book.series_title == book_data["series_title"]
    #     ).all()
    #     
    #     if existing_series_books:
    #         # Get the title format pattern from an existing book
    #         sample_title = existing_series_books[0].title
    #         sample_volume = existing_series_books[0].volume_number
    #         
    #         if sample_title and sample_volume and book_data.get("volume_number"):
    #             # Extract the format pattern (e.g., "魔法科高校の劣等生. {num}" or "魔法科高校の劣等生 ({num})")
    #             new_volume = book_data["volume_number"]
    #             
    #             # Try different patterns to match the existing format
    #             patterns = [
    #                 (rf'\.\s*{sample_volume}(\s*\([^)]+\))?$', f'. {new_volume}'),  # "Title. 1 (Subtitle)"
    #                 (rf'[（(]{sample_volume}[)）]', f'({new_volume})'),  # "Title (1)"
    #                 (rf'第{sample_volume}[巻話集号]', f'第{new_volume}巻'),  # "Title 第1巻"
    #                 (rf'\s+{sample_volume}\s*$', f' {new_volume}'),  # "Title 1"
    #             ]
    #             
    #             for pattern, replacement in patterns:
    #                 if re.search(pattern, sample_title):
    #                     # Apply the same format to the new title
    #                     base_title = book_data["series_title"]
    #                     # Extract subtitle if exists in original
    #                     subtitle_match = re.search(rf'{sample_volume}\s*(\([^)]+\))', sample_title)
    #                     subtitle_suffix = ""
    #                     if subtitle_match:
    #                         # Try to keep the subtitle format
    #                         pass  # For now, just use the number
    #                     
    #                     new_title = re.sub(pattern, replacement, sample_title)
    #                     new_title = re.sub(rf'{sample_volume}', str(new_volume), new_title, count=1)
    #                     book_data["title"] = new_title
    #                     break

    new_book = Book(**book_data)
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book

@app.get("/books", response_model=List[BookResponse])
def read_books(status: Optional[str] = None, db: Session = Depends(get_db)):
    try:
        query = db.query(Book)
        if status:
            query = query.filter(Book.status == status)
        return query.all()
    except Exception as e:
        print(f"Error reading books: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/books/{isbn}", response_model=BookResponse)
def update_book(isbn: str, book_update: BookUpdate, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.isbn == isbn).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    update_data = book_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(book, key, value)
    
    db.commit()
    db.refresh(book)
    return book

@app.delete("/books/{isbn}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(isbn: str, db: Session = Depends(get_db)):
    book = db.query(Book).filter(Book.isbn == isbn).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    db.delete(book)
    db.commit()

@app.get("/lookup/isbn/{isbn}")
def lookup_isbn(isbn: str, db: Session = Depends(get_db)):
    """
    Lookup book information by ISBN using external APIs (Rakuten Books, Google Books)
    """
    existing_series = get_existing_series(db)
    book_data = fetch_book_data(isbn, existing_series)
    if book_data:
        return book_data
    raise HTTPException(status_code=404, detail="Book not found")

@app.get("/series")
def get_series_list(db: Session = Depends(get_db)):
    """
    Get list of unique series titles from the database.
    """
    series = db.query(Book.series_title).filter(
        Book.series_title.isnot(None),
        Book.series_title != ''
    ).distinct().all()
    
    # Extract and sort series titles
    series_list = sorted([s[0] for s in series if s[0]])
    return {"series": series_list}

@app.get("/test/compare-apis/{isbn}")
def compare_apis(isbn: str, db: Session = Depends(get_db)):
    """
    Test endpoint to compare data from all three APIs for the same ISBN.
    Useful for development and debugging.
    """
    from utils import fetch_rakuten_books_data, fetch_google_books_data, extract_volume_number, clean_title
    
    results = {
        "isbn": isbn,
        "openbd": None,
        "rakuten": None,
        "google": None,
        "merged": None
    }
    
    # 1. OpenBD
    try:
        response = requests.get(f"https://api.openbd.jp/v1/get?isbn={isbn}")
        if response.status_code == 200:
            data = response.json()
            if data and data[0]:
                book_info = data[0]['summary']
                results["openbd"] = {
                    "title": book_info.get("title"),
                    "authors": book_info.get("author"),
                    "publisher": book_info.get("publisher"),
                    "published_date": book_info.get("pubdate"),
                    "cover_url": book_info.get("cover"),
                    "series": book_info.get("series"),
                }
    except Exception as e:
        results["openbd"] = {"error": str(e)}
    
    # 2. Rakuten
    try:
        rakuten_data = fetch_rakuten_books_data(isbn)
        if rakuten_data:
            results["rakuten"] = {
                "title": rakuten_data.get("title"),
                "authors": rakuten_data.get("authors"),
                "publisher": rakuten_data.get("publisher"),
                "published_date": rakuten_data.get("published_date"),
                "cover_url": rakuten_data.get("cover_url"),
                "series": rakuten_data.get("series_title"),
            }
    except Exception as e:
        results["rakuten"] = {"error": str(e)}
    
    # 3. Google Books
    try:
        google_data = fetch_google_books_data(isbn)
        if google_data:
            results["google"] = {
                "title": google_data.get("title"),
                "authors": google_data.get("authors"),
                "publisher": google_data.get("publisher"),
                "published_date": google_data.get("published_date"),
                "cover_url": google_data.get("cover_url"),
                "series": google_data.get("series_title"),
            }
    except Exception as e:
        results["google"] = {"error": str(e)}
    
    # 4. Merged (what we actually use)
    existing_series = get_existing_series(db)
    merged = fetch_book_data(isbn, existing_series)
    if merged:
        # Check if series was matched against existing series
        series_title = merged.get("series_title")
        series_matched = series_title in existing_series if series_title else False
        
        results["merged"] = {
            "title": merged.get("title"),
            "authors": merged.get("authors"),
            "publisher": merged.get("publisher"),
            "published_date": merged.get("published_date"),
            "cover_url": merged.get("cover_url"),
            "series_title": series_title,
            "volume_number": merged.get("volume_number"),
            "series_matched": series_matched,  # True if matched existing series
        }
    
    return results

@app.get("/search/title")
def search_by_title(query: str):
    """
    Search books by title using Rakuten Books and Google Books APIs
    """
    results = []
    seen_isbns = set()

    # Rakuten Books API
    rakuten_app_id = os.getenv("RAKUTEN_APP_ID")
    if rakuten_app_id:
        try:
            rakuten_url = "https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404"
            params = {"applicationId": rakuten_app_id, "title": query, "hits": 20}
            response = requests.get(rakuten_url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                for item in data.get("Items", []):
                    book = item.get("Item", {})
                    isbn = book.get("isbn")
                    if isbn and isbn not in seen_isbns:
                        seen_isbns.add(isbn)
                        results.append({
                            "isbn": isbn,
                            "title": book.get("title", ""),
                            "authors": book.get("author", ""),
                            "publisher": book.get("publisherName", ""),
                            "cover_url": book.get("largeImageUrl", ""),
                            "description": book.get("itemCaption", "")
                        })
        except Exception as e:
            print(f"Rakuten API error: {e}")

    # Google Books API
    try:
        google_url = "https://www.googleapis.com/books/v1/volumes"
        params = {"q": query, "maxResults": 20}
        response = requests.get(google_url, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            for item in data.get("items", []):
                volume_info = item.get("volumeInfo", {})
                identifiers = volume_info.get("industryIdentifiers", [])
                isbn = None
                for identifier in identifiers:
                    if identifier.get("type") in ["ISBN_13", "ISBN_10"]:
                        isbn = identifier.get("identifier")
                        break

                title = volume_info.get("title", "")
                if isbn and isbn not in seen_isbns:
                    seen_isbns.add(isbn)
                    results.append({
                        "isbn": isbn,
                        "title": title,
                        "authors": ", ".join(volume_info.get("authors", [])),
                        "publisher": volume_info.get("publisher", ""),
                        "cover_url": volume_info.get("imageLinks", {}).get("thumbnail", ""),
                        "description": volume_info.get("description", "")
                    })
    except Exception as e:
        print(f"Google Books API error: {e}")

    return results[:30]

@app.get("/books/find-series")
def find_series(isbn: str, title: str, db: Session = Depends(get_db)):
    """
    Find books in the same series by searching Rakuten API
    """
    # Extract series name by removing volume numbers
    import re
    series_base = re.sub(r'\s*[\(（]?\d+[\)）]?\s*$', '', title)
    series_base = re.sub(r'\s*第?\d+[巻話集号]?\s*$', '', series_base)
    series_base = re.sub(r'\s*vol\.?\s*\d+.*$', '', series_base, flags=re.IGNORECASE)

    # Get owned ISBNs
    owned_isbns = {book.isbn for book in db.query(Book).all()}

    results = []
    rakuten_app_id = os.getenv("RAKUTEN_APP_ID")

    if rakuten_app_id:
        try:
            # Search for series books
            rakuten_url = "https://app.rakuten.co.jp/services/api/BooksBook/Search/20170404"
            params = {"applicationId": rakuten_app_id, "title": series_base, "hits": 50}
            response = requests.get(rakuten_url, params=params, timeout=5)
            if response.status_code == 200:
                data = response.json()
                for item in data.get("Items", []):
                    book = item.get("Item", {})
                    book_isbn = book.get("isbn")
                    book_title = book.get("title", "")

                    # Extract volume number
                    volume_match = re.search(r'[\(（]?(\d+)[\)）]?', book_title)
                    if not volume_match:
                        volume_match = re.search(r'第?(\d+)[巻話集号]', book_title)
                    if not volume_match:
                        volume_match = re.search(r'vol\.?\s*(\d+)', book_title, flags=re.IGNORECASE)

                    volume = int(volume_match.group(1)) if volume_match else 0

                    if book_isbn:
                        results.append({
                            "isbn": book_isbn,
                            "title": book_title,
                            "authors": book.get("author", ""),
                            "cover_url": book.get("largeImageUrl", ""),
                            "volume": volume,
                            "already_owned": book_isbn in owned_isbns
                        })
        except Exception as e:
            print(f"Rakuten API error: {e}")

    # Sort by volume number
    results.sort(key=lambda x: x["volume"])

    return {"books": results}
