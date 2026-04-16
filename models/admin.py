from db.db import tikectDB
from datetime import datetime, timedelta

def get_admin_dashboard_data():
    conexion = tikectDB()
    cursor = conexion.cursor()
    fecha_actual = datetime.now().strftime('%Y-%m-%d')

    queries = {
        "pen": "SELECT COUNT(*) FROM Tickets WHERE Status = 'Pendiente'",
        "pro": "SELECT COUNT(*) FROM Tickets WHERE Status = 'En Proceso'",
        "res": "SELECT COUNT(*) FROM Tickets WHERE Status = 'Finalizado' AND Fecha = %s",
        "todo": "SELECT * FROM Tickets WHERE Status IN('Pendiente', 'En Proceso')"
    }

    cursor.execute(queries["pen"])
    pendientes = cursor.fetchone()[0]

    cursor.execute(queries["pro"])
    proceso = cursor.fetchone()[0]

    cursor.execute(queries["res"], (fecha_actual,))
    resueltas = cursor.fetchone()[0]

    cursor.execute(queries["todo"])
    tickets = cursor.fetchall()

    conexion.close()
    return pendientes, proceso, resueltas, tickets
#-----------------------------------------------------------------------------
def get_stats():
    conexion = tikectDB()
    cursor = conexion.cursor()
    fecha_actual = datetime.now().strftime('%Y-%m-%d')
    hora_actual = datetime.now()

    # Incidencia Top
    cursor.execute("SELECT Incidencia, COUNT(*) AS total FROM Tickets WHERE Fecha = %s GROUP BY Incidencia ORDER BY total DESC LIMIT 1", (fecha_actual,))
    res = cursor.fetchone()
    top_problem, cantidad_problem = (res[0], res[1]) if res else ('N/A', 0)

    # Promedio de tiempo (PostgreSQL syntax)
    cursor.execute("""
        SELECT AVG(EXTRACT(EPOCH FROM (
            (Fecha || ' ' || HoraTerminada)::timestamp - (Fecha || ' ' || HoraSolicitada)::timestamp
        )) / 60)
        FROM Tickets WHERE Status = 'Finalizado' AND Fecha = %s
    """, (fecha_actual, ))
    avg_res = cursor.fetchone()[0]
    average_time = round(avg_res, 2) if avg_res else 0

    # Departamento Top
    cursor.execute("SELECT Departamento, COUNT(*) AS total FROM Tickets WHERE Fecha = %s GROUP BY Departamento ORDER BY total DESC LIMIT 1", (fecha_actual,))
    res_dept = cursor.fetchone()
    top_department, cantidad_department = (res_dept[0], res_dept[1]) if res_dept else ('N/A', 0)

    # Tickets procesados para la vista
    cursor.execute("SELECT id, Nombre, Incidencia, HoraSolicitada, HoraTerminada, Tecnico, Fecha FROM Tickets WHERE Fecha = %s ORDER BY HoraSolicitada DESC", (fecha_actual,))
    rows = cursor.fetchall()
    
    tickets_list = []
    for row in rows:
        hora_solicitada_dt = datetime.combine(row[6], row[3])
        tickets_list.append({
            'id': row[0], 'Nombre': row[1], 'Incidencia': row[2],
            'HoraSolicitada': row[3].strftime('%H:%M:%S'),
            'HoraTerminada': row[4].strftime('%H:%M:%S') if row[4] else 'Pendiente',
            'Tecnico': row[5] if row[5] else 'Pendiente',
            'Atrasado': (row[4] is None) and ((hora_actual - hora_solicitada_dt) > timedelta(hours=2))
        })

    conexion.close()
    return {
        'top_problem': top_problem, 'cantidad_problem': cantidad_problem,
        'average_time': average_time, 'top_department': top_department,
        'cantidad_department': cantidad_department, 'tickets': tickets_list
    }