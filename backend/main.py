from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import Base, engine, get_db, Book
from utils import fetch_book_data

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

from datetime import datetime

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
