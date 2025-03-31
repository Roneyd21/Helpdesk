import sqlite3

def get_db():
    conexion = sqlite3.connect('TicketsTio.db')
    return conexion