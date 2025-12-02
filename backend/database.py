from sqlalchemy import create_engine, Column, String, DateTime
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
    status = Column(String, default="unread")
    location = Column(String)
    series_title = Column(String)
    created_at = Column(DateTime, default=datetime.now)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
