import sqlite3

conn = sqlite3.connect("gamehub.db")
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS players(
    username TEXT PRIMARY KEY,
    xp INTEGER,
    level INTEGER
)
""")

cur.execute(
    """
INSERT OR REPLACE INTO players
(username, xp, level)
VALUES (?, ?, ?)
""",
    ("Player", 500, 5),
)

conn.commit()
conn.close()

print("Player saved!")
