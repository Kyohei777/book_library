import sqlite3
import re
import os

def extract_volume_number(title):
    """タイトルから巻数を抽出"""
    if not title:
        return None

    # パターン1: (1), （1）
    match = re.search(r'[\(（](\d+)[\)）]', title)
    if match:
        return int(match.group(1))

    # パターン2: 第1巻, 第1話, 第1集
    match = re.search(r'第(\d+)[巻話集号]', title)
    if match:
        return int(match.group(1))

    # パターン3: Vol.1, vol 1, VOL.1
    match = re.search(r'vol\.?\s*(\d+)', title, re.IGNORECASE)
    if match:
        return int(match.group(1))

    return None

db_path = os.getenv("DATABASE_PATH", "./db/library.db")
print(f"Connecting to database at {db_path}...")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 既存のカラムを確認
cursor.execute("PRAGMA table_info(books)")
columns = [column[1] for column in cursor.fetchall()]
print(f"Existing columns: {columns}")

# volume_numberカラムを追加
if 'volume_number' not in columns:
    print("Adding 'volume_number' column...")
    cursor.execute("ALTER TABLE books ADD COLUMN volume_number INTEGER")
    conn.commit()
    print("✅ Added 'volume_number' column.")
else:
    print("'volume_number' column already exists.")

# is_series_representativeカラムを追加
if 'is_series_representative' not in columns:
    print("Adding 'is_series_representative' column...")
    cursor.execute("ALTER TABLE books ADD COLUMN is_series_representative BOOLEAN DEFAULT 0")
    conn.commit()
    print("✅ Added 'is_series_representative' column.")
else:
    print("'is_series_representative' column already exists.")

# 既存の本のvolume_numberを自動設定
print("\nExtracting volume numbers from titles...")
cursor.execute("SELECT isbn, title FROM books")
books = cursor.fetchall()

updated_count = 0
for isbn, title in books:
    volume = extract_volume_number(title)
    if volume is not None:
        cursor.execute("UPDATE books SET volume_number = ? WHERE isbn = ?", (volume, isbn))
        updated_count += 1
        print(f"  {title} → Vol.{volume}")

conn.commit()
print(f"\n✅ Updated {updated_count} books with volume numbers.")

# シリーズごとに代表を設定（最小巻数の本）
print("\nSetting series representatives...")
cursor.execute("""
    SELECT series_title, MIN(volume_number), isbn
    FROM books
    WHERE series_title IS NOT NULL AND series_title != 'Other' AND volume_number IS NOT NULL
    GROUP BY series_title
""")
representatives = cursor.fetchall()

for series_title, min_vol, isbn in representatives:
    cursor.execute("""
        UPDATE books
        SET is_series_representative = 1
        WHERE series_title = ? AND volume_number = ?
        LIMIT 1
    """, (series_title, min_vol))
    print(f"  {series_title}: Vol.{min_vol} → Representative")

conn.commit()
print(f"\n✅ Set {len(representatives)} series representatives.")

conn.close()
print("\n🎉 Migration completed successfully!")
