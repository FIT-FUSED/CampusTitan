import sqlite3
import os

DB_PATH = 'health_cache.sqlite3'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Create table if not exists
c.execute('''
CREATE TABLE IF NOT EXISTS health_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    date_key TEXT NOT NULL,
    result_json TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date_key)
)
''')

# Verify
c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='health_cache'")
print("Table exists:", c.fetchone())

conn.commit()
conn.close()
print("Health cache DB initialized.")

