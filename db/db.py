import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def tikectDB():
    try:
        conexion = psycopg2.connect(
            dbname=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT')
        )
        return conexion
    except Exception as e:
        print(f"Error conectando a la base de datos: {e}")
        return None