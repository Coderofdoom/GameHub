import sqlite3

conn = sqlite3.connect("gamehub.db")
cur = conn.cursor()

cur.execute("SELECT username, xp, level FROM players")

players = cur.fetchall()

for player in players:
    print(player)

conn.close()
