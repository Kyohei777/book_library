import sqlite3
import os

def migrate_db():
    db_path = os.getenv("DATABASE_URL", "sqlite:///./db/library.db").replace("sqlite:///", "")
    print(f"Connecting to database at {db_path}...")

    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}. Will be created on first run.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check existing columns
        cursor.execute("PRAGMA table_info(books)")
        columns = [info[1] for info in cursor.fetchall()]

        # Add new columns if they don't exist
        if 'purchased_date' not in columns:
            cursor.execute("ALTER TABLE books ADD COLUMN purchased_date DATETIME")
            print("Added 'purchased_date' column.")
        else:
            print("Column 'purchased_date' already exists.")

        if 'reading_start_date' not in columns:
            cursor.execute("ALTER TABLE books ADD COLUMN reading_start_date DATETIME")
            print("Added 'reading_start_date' column.")
        else:
            print("Column 'reading_start_date' already exists.")

        if 'reading_end_date' not in columns:
            cursor.execute("ALTER TABLE books ADD COLUMN reading_end_date DATETIME")
            print("Added 'reading_end_date' column.")
        else:
            print("Column 'reading_end_date' already exists.")

        conn.commit()
        print("Migration completed successfully.")

    except sqlite3.OperationalError as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_db()
