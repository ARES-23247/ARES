import sqlite3

db = sqlite3.connect('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/b50f39d2832143fa7eaf6a5820bc2ecd2a7a0bfa314804344cf78d3ff9b5f198.sqlite')
c = db.cursor()

c.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='user_profiles'")
row = c.fetchone()
print(row[0] if row else "Table not found!")
