from flask import Flask, render_template, request, jsonify
from db.db import tikectDB
from models.admin import get_admin_dashboard_data, get_stats
from models.mails import configure_mail, send_ticket_email
from models.tops import get_datos_iniciales, get_top_5_tecnicos, get_tops_5, get_promedios
from datetime import datetime
from werkzeug.utils import secure_filename
import pytz
import os

app = Flask(__name__)

# Configuración
configure_mail(app)
caracas_tz = pytz.timezone('America/Caracas')
app.config['UPLOAD_FOLDER'] = 'static/uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

#-------------------------------------------------------
@app.route('/')
def form():
    return render_template('formulario.html')

#------------------------------------------------------------------------
@app.route('/admin')
def admin():
    pendientes, proceso, resueltas, tickets = get_admin_dashboard_data()
    return render_template('admin.html', 
                           pendientes=pendientes, proceso=proceso, 
                           resueltas=resueltas, tickets=tickets)

#------------------------------------------------------------------------
@app.route('/stats')
def stats():
    todo = get_stats()
    return render_template('stats.html', todo=todo)

#------------------------------------------------------------------------
@app.route('/tops')
def tops():
    return render_template('tops.html')

#------------------------------------------------------------------------
@app.route('/agre/ticket', methods=['POST'])
def agregar_ticket():
    try:
        data = request.form
        foto = request.files.get('foto')
        nombre_foto = None

        if foto:   #-- Esta logica de la foto todavia no la vamos a dejar activa
            nombre_foto = secure_filename(f"{datetime.now().timestamp()}_{foto.filename}")
            foto.save(os.path.join(app.config['UPLOAD_FOLDER'], nombre_foto))

        ahora = datetime.now(caracas_tz)
        
        conexion = tikectDB()
        cursor = conexion.cursor()
        
        insert_query = '''
            INSERT INTO Tickets (Nombre, Correo, Departamento, Incidencia, Status, Fecha, HoraSolicitada, descri)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        '''

        cursor.execute(insert_query, (
            data.get('nombreape'), 
            data.get('correo'), 
            data.get('departamento'), 
            data.get('incidencia'), 
            'Pendiente', 
            ahora.strftime('%Y-%m-%d'), 
            ahora.strftime('%H:%M:%S'), 
            data.get('descri') # Este es el octavo valor
        ))
        
        numero_ticket = cursor.fetchone()[0]
        # print("Prueba de numero de Ticket: ", numero_ticket)
        conexion.commit()
        conexion.close()

        # Descomenta cuando quieras usarlo:
        # send_ticket_email(data.get('correo'), numero_ticket)

        return jsonify({'message': 'Datos agregados exitosamente. '}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

#---------------------------------------------------------------------------------------------------------------------------------
@app.route('/update-status/<int:ticket_id>', methods=['POST'])
def update_status(ticket_id):
    try:
        data = request.get_json()
        status = data.get("status")
        tecnico = data.get("technician")
        hora_ahora = datetime.now(caracas_tz).strftime('%H:%M:%S')

        conexion = tikectDB()
        cursor = conexion.cursor()

        if status == "En Proceso":
            cursor.execute("UPDATE Tickets SET Status = %s, Tecnico = %s WHERE id = %s", (status, tecnico, ticket_id))
        else:
            cursor.execute("UPDATE Tickets SET Status = %s, HoraTerminada = %s WHERE id = %s", (status, hora_ahora, ticket_id))

        conexion.commit()
        conexion.close()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

#---------------------------------------------------------------------------------------------------------------------------------
@app.route('/get-description/<int:ticket_id>')
def get_description(ticket_id):
    try:
        conexion = tikectDB()
        cursor = conexion.cursor()
        cursor.execute("SELECT descri FROM Tickets WHERE id = %s", (ticket_id,))
        res = cursor.fetchone()
        conexion.close()
        
        # Si es None o está vacío, devolvemos "Sin descripción"
        descripcion = res[0] if res and res[0] else "Sin Descripción"
        return jsonify({"description": descripcion}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#---------------------------------------------------------------------------------------------------------------------------------
@app.route('/get-ini')
def get_iniciales():
    try:
        total_del_mes, tecnico_cantidad, tiempo_promedio = get_datos_iniciales()

        # tecnico_cantidad es una lista de tuplas: [(tecnico, cantidad)]
        tecnico_info = None
        if tecnico_cantidad:
            tecnico_info = {
                "tecnico": tecnico_cantidad[0][0],
                "cantidad_tickets": tecnico_cantidad[0][1]
            }

        # tiempo_promedio es una lista de tuplas: [(nombre_tecnico, mejor_tiempo_minutos, promedio_minutos)]
        tiempo_info = None
        if tiempo_promedio:
            tiempo_info = {
                "nombre_tecnico": tiempo_promedio[0][0],
                "mejor_tiempo_minutos": float(tiempo_promedio[0][1]) if tiempo_promedio[0][1] else None,
                "promedio_minutos": float(tiempo_promedio[0][2]) if tiempo_promedio[0][2] else None
            }

        return jsonify({
            "tk_mes": total_del_mes,
            "tecnico_top_mes": tecnico_info,
            "tiempo_promedio_top": tiempo_info
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

#---------------------------------------------------------------------------------------------------------------------------------
@app.route('/top5-tecnicos')
def top_5_tecnicos():
    try:
        resultados = get_top_5_tecnicos()
        # resultados es lista de tuplas: (nombre_tecnico, tickets_tecnico, promedio_minutos, porcentaje_del_mes)
        data = []
        for row in resultados:
            data.append({
                "nombre_tecnico": row[0],
                "tickets_tecnico": row[1],
                "promedio_minutos": float(row[2]) if row[2] else None,
                "porcentaje_del_mes": float(row[3]) if row[3] else None
            })
        return jsonify({"top_5_tecnicos": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#---------------------------------------------------------------------------------------------------------------------------------
@app.route('/tops5')
def tops_5():
    try:
        top5_depar, top5_inci, top5_user = get_tops_5()

        def convertir(lista_tuplas):
            return [dict(zip(["nombre", "tickets", "porcentaje"] if len(t) == 3 else ["nombre", "tickets"], t)) for t in lista_tuplas]

        # top5_depar: (Depar, Ticket)
        # top5_inci: (Inci, Ticket)
        # top5_user: (nombre, Ticket, Porcentaje)
        
        return jsonify({
            "top5_departamentos": [{"departamento": d[0], "tickets": d[1]} for d in top5_depar],
            "top5_incidencias": [{"incidencia": i[0], "tickets": i[1]} for i in top5_inci],
            "top5_usuarios": [{"nombre": u[0], "tickets": u[1], "porcentaje": float(u[2]) if u[2] else None} for u in top5_user]
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

#---------------------------------------------------------------------------------------------------------------------------------
@app.route('/promedios')
def promedios():
    try:
        resultados = get_promedios()
        # resultados: lista de (nombre_tecnico, mejor_tiempo_minutos, promedio_minutos)
        data = []
        for row in resultados:
            data.append({
                "nombre_tecnico": row[0],
                "mejor_tiempo_minutos": float(row[1]) if row[1] else None,
                "promedio_minutos": float(row[2]) if row[2] else None
            })
        return jsonify({"promedios_tecnicos": data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
#---------------------------------------------------------------------------------------------------------------------------------    
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5001, debug=True)