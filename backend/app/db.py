import psycopg2

# TODO env vars
conn = psycopg2.connect(
    database="mydb",
    user="user",
    password="password",
    host="postgres"
)
cur = conn.cursor()

def selectTest():
    cur.execute("SELECT * FROM sensors;")
    return cur.fetchone()