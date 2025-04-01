import sqlite3
import psycopg2

def get_db():
    conexion = psycopg2.connect(
        dbname="App_Tickets",
        user="postgres",
        password="Qwerty21.",
        host="localhost",
        port="5432"  # Puerto por defecto de PostgreSQL
    )
    return conexion



"""def get_db():
    conexion = sqlite3.connect('TicketsTio.db')
    return conexion"""