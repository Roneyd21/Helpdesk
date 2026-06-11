
class QuerysMensuales:
    tk_mes = """
        SELECT COUNT(*) as tickets_mes_actual
        FROM tickets 
        WHERE EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE);
    """
    tecnico_top = """
        SELECT 
            tecnico,
            COUNT(*) as cantidad_tickets
        FROM tickets 
        WHERE EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
        GROUP BY tecnico
        ORDER BY cantidad_tickets DESC
        LIMIT 1;
    """
    tiempo_promedio = """
        SELECT 
            tecnico AS nombre_tecnico,
            MIN(EXTRACT(EPOCH FROM (horaterminada - horasolicitada)) / 60) AS mejor_tiempo_minutos,
            AVG(EXTRACT(EPOCH FROM (horaterminada - horasolicitada)) / 60) AS promedio_minutos
        FROM tickets
        WHERE status = 'Finalizado'
        AND horasolicitada < horaterminada
        AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
		AND tecnico IS NOT NULL
        GROUP BY tecnico
        ORDER BY promedio_minutos ASC
        LIMIT 1;
    """
#-------------------------------------------------------------------------------------------------------------------------------
class QueryTecnicosTop5:
    top = """ 
        WITH totales_mensuales AS (
            SELECT 
                TO_CHAR(fecha, 'YYYY-MM') AS mes,
                COUNT(*) AS total_tickets_mes
            FROM tickets
            WHERE status = 'Finalizado'
            GROUP BY TO_CHAR(fecha, 'YYYY-MM')
        )
        SELECT 
            t.tecnico AS nombre_tecnico,
            COUNT(*) AS tickets_tecnico,
            ROUND(AVG(EXTRACT(EPOCH FROM (t.horaterminada - t.horasolicitada)) / 60), 2) AS promedio_minutos,
            ROUND(
                (COUNT(*) * 100.0) / tm.total_tickets_mes, 
                2
            ) AS porcentaje_del_mes
        FROM tickets t
        JOIN totales_mensuales tm ON TO_CHAR(t.fecha, 'YYYY-MM') = tm.mes
        WHERE t.status = 'Finalizado'
        AND t.horasolicitada < t.horaterminada
        AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
		AND EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
        GROUP BY TO_CHAR(t.fecha, 'YYYY-MM'), t.tecnico, tm.total_tickets_mes
        ORDER BY 
            TO_CHAR(t.fecha, 'YYYY-MM') DESC,
            COUNT(*) DESC
        LIMIT 5;
    """
#-------------------------------------------------------------------------------------------------------------------------------
class QuerysTop5:
    top_depar = """ 
        SELECT 
            departamento AS Depar, 
            COUNT(*) AS Ticket
        FROM tickets 
        WHERE EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND status = 'Finalizado'
        GROUP BY departamento
        ORDER BY Ticket DESC
        LIMIT 5;
    """
    top_inci = """ 
        SELECT 
            incidencia AS Inci, 
            COUNT(*) AS Ticket
        FROM tickets 
        WHERE EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND status = 'Finalizado'
        GROUP BY incidencia
        ORDER BY Ticket DESC
        LIMIT 5;
    """
    top_user = """ 
        SELECT 
            nombre AS nombre, 
            COUNT(*) AS Ticket,
            ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) AS Porcentaje
        FROM tickets 
        WHERE EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND status = 'Finalizado'
        GROUP BY nombre
        ORDER BY Ticket DESC
        LIMIT 5;
    """
#-------------------------------------------------------------------------------------------------------------------------------
class QueryPromedios:
    top_minutos = """ 
        SELECT 
            tecnico AS nombre_tecnico,
            MIN(EXTRACT(EPOCH FROM (horaterminada - horasolicitada)) / 60) AS mejor_tiempo_minutos,
            AVG(EXTRACT(EPOCH FROM (horaterminada - horasolicitada)) / 60) AS promedio_minutos
        FROM tickets
        WHERE status = 'Finalizado'
        AND horasolicitada < horaterminada
        AND EXTRACT(YEAR FROM fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
        GROUP BY tecnico
        ORDER BY promedio_minutos ASC
        LIMIT 5;
    """