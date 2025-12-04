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
        print(f"Existing columns: {columns}")

        # Add all new columns
        new_columns = {
            'purchased_date': 'DATETIME',
            'reading_start_date': 'DATETIME',
            'reading_end_date': 'DATETIME',
            'rating': 'VARCHAR',
            'notes': 'TEXT',
            'tags': 'VARCHAR',
            'lent_to': 'VARCHAR',
            'lent_date': 'DATETIME',
            'due_date': 'DATETIME'
        }

        for col_name, col_type in new_columns.items():
            if col_name not in columns:
                cursor.execute(f"ALTER TABLE books ADD COLUMN {col_name} {col_type}")
                print(f"✅ Added '{col_name}' column.")
            else:
                print(f"⏭️  Column '{col_name}' already exists.")

        conn.commit()
        print("\n🎉 Migration completed successfully!")

    except sqlite3.OperationalError as e:
        print(f"❌ Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_db()
