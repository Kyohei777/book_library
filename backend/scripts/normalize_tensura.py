import sys
import os
import re

# Add backend directory to path to import modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, Book, DATABASE_URL
from utils import extract_volume_number, clean_title

def normalize_tensura():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        # Get all Tensura books
        books = session.query(Book).filter(Book.title.like("%転生したらスライムだった件%")).all()
        
        print(f"Found {len(books)} Tensura books.")
        
        for book in books:
            original_title = book.title
            original_volume = book.volume_number
            isbn = book.isbn
            
            series_name = "転生したらスライムだった件"
            new_author = "伏瀬"
            
            # Special handling for known decimal volumes by ISBN
            if isbn == "9784896375800": # 8.5
                new_volume = 8.5
                new_title = f"{series_name} 8.5 公式設定資料集"
            elif isbn == "9784896378450": # 13.5
                new_volume = 13.5
                new_title = f"{series_name} 13.5"
            else:
                # 1. Re-extract volume number (now supports floats)
                # Use the current title to extract, but be careful if it was already messed up
                # If it was messed up (e.g. "Title 1"), extract_volume_number should still find "1"
                new_volume = extract_volume_number(original_title)
                
                # 2. Re-construct title
                # Format: "転生したらスライムだった件 {volume} {subtitle}"
                
                # Extract subtitle
                # Remove series name
                subtitle = original_title.replace(series_name, "")
                
                # Normalize full-width for cleaning
                table = str.maketrans({
                    '０': '0', '１': '1', '２': '2', '３': '3', '４': '4',
                    '５': '5', '６': '6', '７': '7', '８': '8', '９': '9',
                    '．': '.', '。': '.'
                })
                cleaned_subtitle = subtitle.translate(table)
                
                # Remove volume number (e.g. "15", "8.5")
                if new_volume is not None:
                    vol_str = str(new_volume)
                    if vol_str.endswith(".0"):
                        vol_str = str(int(new_volume))
                    
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
                        r'\s+\d+(?:\.\d+)?$' # Trailing number
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
                if new_volume is not None:
                    vol_display = str(new_volume)
                    if vol_display.endswith(".0"):
                        vol_display = str(int(new_volume))
                    
                    if cleaned_subtitle:
                        new_title = f"{series_name} {vol_display} {cleaned_subtitle}"
                    else:
                        new_title = f"{series_name} {vol_display}"
                else:
                    # If no volume, keep original or just series + subtitle
                    if cleaned_subtitle:
                        new_title = f"{series_name} {cleaned_subtitle}"
                    else:
                        new_title = original_title # Fallback

            # Update DB
            print(f"Updating: {original_title} (ISBN: {isbn})")
            print(f"  -> Vol: {original_volume} -> {new_volume}")
            print(f"  -> Title: {new_title}")
            print(f"  -> Author: {book.authors} -> {new_author}")
            
            book.volume_number = new_volume
            book.title = new_title
            book.series_title = series_name
            book.authors = new_author
            
        session.commit()
        print("Migration completed successfully.")
        
    except Exception as e:
        session.rollback()
        print(f"Error during migration: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    normalize_tensura()
