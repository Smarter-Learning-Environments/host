import psycopg2
from . import utils as Utils

# TODO env vars
conn = psycopg2.connect(
    database=Utils.ENV_VARS.DB_NAME,
    user=Utils.ENV_VARS.DB_USER,
    password=Utils.ENV_VARS.DB_PASS,
    host=Utils.ENV_VARS.DB_HOST,
)
cur = conn.cursor()

def selectTest():
    cur.execute("SELECT * FROM sensors;")
    return cur.fetchone()