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
    volume_number: Optional[int] = None
    is_series_representative: Optional[bool] = None

    class Config:
        from_attributes = True

@app.post("/books", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(book_in: BookCreate, db: Session = Depends(get_db)):
    # Check if book already exists
    existing_book = db.query(Book).filter(Book.isbn == book_in.isbn).first()
    if existing_book:
        raise HTTPException(status_code=400, detail="Book already registered")

    # Prepare book data
    book_data = book_in.dict(exclude_unset=True)
    
    # If title is missing, try to fetch from external APIs
    if not book_data.get("title"):
        fetched_data = fetch_book_data(book_in.isbn)
        if fetched_data:
            # Merge fetched data, prioritizing user input (though user input is empty here)
            # Actually, if user provided some fields, we should keep them.
            # But fetch_book_data returns a dict.
            for key, value in fetched_data.items():
                if key not in book_data or not book_data[key]:
                    book_data[key] = value
        else:
            # Fallback if fetch fails and no title provided
            if "title" not in book_data:
                book_data["title"] = "Unknown Title"

    new_book = Book(**book_data)
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book

@app.get("/books", response_model=List[BookResponse])
def read_books(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Book)
    if status:
        query = query.filter(Book.status == status)
    return query.all()

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
def lookup_isbn(isbn: str):
    """
    Lookup book information by ISBN using external APIs (Rakuten Books, Google Books)
    """
    book_data = fetch_book_data(isbn)
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
