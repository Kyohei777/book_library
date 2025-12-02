import sqlite3
import os

def migrate_db():
    # Inside container, DB is at /data/library.db
    db_path = '/data/library.db'
    print(f"Connecting to database at {db_path}...")
    
    if not os.path.exists(db_path):
        print(f"Error: Database file not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column exists first to avoid error
        cursor.execute("PRAGMA table_info(books)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if 'series_title' in columns:
            print("Column 'series_title' already exists.")
        else:
            cursor.execute("ALTER TABLE books ADD COLUMN series_title VARCHAR")
            conn.commit()
            print("Successfully added series_title column.")
            
    except sqlite3.OperationalError as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_db()
