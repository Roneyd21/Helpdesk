from db.db import tikectDB
from db.querys import QueryPromedios, QuerysMensuales, QuerysTop5, QueryTecnicosTop5

def get_datos_iniciales():
    conexion = tikectDB()
    cursor = conexion.cursor()

    querys = QuerysMensuales()

    cursor.execute(querys.tk_mes)
    total_del_mes = cursor.fetchone()[0]

    cursor.execute(querys.tecnico_top)
    tecnico_cantidad = cursor.fetchall()
    
    cursor.execute(querys.tiempo_promedio)
    tiempo_promedio = cursor.fetchall()

    conexion.close()
    return total_del_mes, tecnico_cantidad, tiempo_promedio

#-----------------------------------------------------------------------------
def get_top_5_tecnicos():
    conexion = tikectDB()
    cursor = conexion.cursor()

    query = QueryTecnicosTop5()

    cursor.execute(query.top)
    top_5 = cursor.fetchall()

    return top_5

#-----------------------------------------------------------------------------
def get_tops_5():
    conexion = tikectDB()
    cursor = conexion.cursor()

    querys = QuerysTop5()

    cursor.execute(querys.top_depar)
    top5_depar = cursor.fetchall()

    cursor.execute(querys.top_inci)
    top5_inci = cursor.fetchall()
    
    cursor.execute(querys.top_user)
    top5_user = cursor.fetchall()

    conexion.close()
    return top5_depar, top5_inci, top5_user

#-----------------------------------------------------------------------------
def get_promedios():
    conexion = tikectDB()
    cursor = conexion.cursor()

    query = QueryPromedios()

    cursor.execute(query.top_minutos)
    prome = cursor.fetchall()

    return prome
