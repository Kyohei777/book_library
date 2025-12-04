from sqlalchemy import create_engine, Column, String, DateTime, Integer, Boolean, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./db/library.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Book(Base):
    __tablename__ = "books"

    isbn = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    authors = Column(String)
    publisher = Column(String)
    published_date = Column(String)
    description = Column(String)
    cover_url = Column(String)
    status = Column(String, default="unread")  # wishlist, ordered, purchased_unread, reading, done, paused
    location = Column(String)
    series_title = Column(String)
    label = Column(String, nullable=True)  # Publisher label (e.g., 電撃文庫)
    created_at = Column(DateTime, default=datetime.now)

    # Wishlist and reading tracking
    purchased_date = Column(DateTime, nullable=True)
    reading_start_date = Column(DateTime, nullable=True)
    reading_end_date = Column(DateTime, nullable=True)

    # Reading records
    rating = Column(String, nullable=True)  # 1-5 stars
    notes = Column(String, nullable=True)  # Reading notes/review

    # Tags
    tags = Column(String, nullable=True)  # Comma-separated tags

    # Lending management
    lent_to = Column(String, nullable=True)  # Person who borrowed the book
    lent_date = Column(DateTime, nullable=True)  # When it was lent
    due_date = Column(DateTime, nullable=True)  # When it should be returned

    # Series and bookshelf management
    volume_number = Column(Float, nullable=True)  # Volume number extracted from title (Float for 8.5 etc)
    is_series_representative = Column(Boolean, default=False)  # Display this as series cover in bookshelf view

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
