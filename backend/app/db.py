import psycopg2
from . import utils

conn = psycopg2.connect(
    database=utils.ENV_VARS.DB_NAME,
    user=utils.ENV_VARS.DB_USER,
    password=utils.ENV_VARS.DB_PASS,
    host=utils.ENV_VARS.DB_HOST,
)

# TODO wait to connect/retry on failure/status on root
# TODO persistent changes with conn.commit()

def execute_sql(sql: str, args: tuple = None, column_names: bool = False, conn = conn):
    """
    Use an existing connection to open a cursor and execute the given SQL.
    
    :param sql: SQL to run. Use %s to denote an argument
    :param args: Arguments to fill inside the SQL string
    :param column_names: Return query results and column names extracted from cursor information. 
    :param conn: Open postgres connection
    """
    with conn:
        with conn.cursor() as curs:
            if args:
                curs.execute(sql, args)
            else:
                curs.execute(sql)
            
            if(column_names):
                return([desc[0] for desc in curs.description], curs.fetchall())

def execute_insert(sql: str, args: tuple = None, conn = conn, returning: bool = False):
    """
    Use an existing connection to open a cursor and execute the given SQL.
    
    :param sql: SQL to run. Use %s to denote an argument
    :param args: Arguments to fill inside the SQL string
    :param column_names: Return query results and column names extracted from cursor information. 
    :param conn: Open postgres connection
    """
    val = None
    with conn:
        with conn.cursor() as curs:
            curs.execute(sql, args if args else ())
            if returning:
                return curs.fetchone()[0]