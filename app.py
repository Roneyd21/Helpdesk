from flask import Flask, render_template, request, jsonify
from database import get_db
from flask_mail import Mail, Message
from datetime import datetime

app = Flask(__name__)

app.config['MAIL_SERVER'] = 'matrix.panelautomatizado.com'  # Servidor SMTP
app.config['MAIL_PORT'] = 465  # Puerto SMTP de salida (si es Entrada es 933)
app.config['MAIL_USE_TLS'] = False # Seguridad TLS
app.config['MAIL_USE_SSL'] = True  # Se usa SSL en el puerto 465
app.config['MAIL_USERNAME'] = 'soporte@tioammi.com.ve'  # Tu correo de envío
app.config['MAIL_PASSWORD'] = 'Tioammi.01'  # Tu contraseña o App Password
app.config['MAIL_DEFAULT_SENDER'] = 'soporte@tioammi.com.ve'  # Correo remitente

mail = Mail(app)

@app.route('/admin')
def admin():
    # Conectar a la base de datos
    conexion = get_db()
    cursor = conexion.cursor()

    # Consultas
    pen = "SELECT COUNT(*) AS total FROM Tickets WHERE Status = 'Pendiente'"
    pro = "SELECT COUNT(*) AS total FROM Tickets WHERE Status = 'En Proceso'"
    res = "SELECT COUNT(*) AS total FROM Tickets WHERE Status = 'Finalizado'"
    todo = "SELECT * FROM Tickets WHERE Status IN ('Pendiente', 'En Proceso')"

    cursor.execute(pen)
    pendientes = cursor.fetchone()[0]

    cursor.execute(pro)
    proceso = cursor.fetchone()[0]

    cursor.execute(res)
    resueltas = cursor.fetchone()[0]

    cursor.execute(todo)
    tickets = cursor.fetchall()  # Obtener todos los tickets pendientes

    # Cerrar conexión
    conexion.close()

    return render_template('admin.html',
                           pendientes=pendientes, proceso=proceso, 
                           resueltas=resueltas, tickets=tickets)  # Pasamos toda la lista
#-----------------------------------------------------------------------------------
@app.route('/stats')
def stats():
    # Conectar a la base de datos
    conexion = get_db()
    cursor = conexion.cursor()

    # Obtener la fecha actual
    fecha_actual = datetime.now().strftime('%d-%m-%Y')  # Formato: DD-MM-YYYY

    # Incidencia más repetida en la tabla Tickets
    cursor.execute("""
        SELECT Incidencia, COUNT(*) AS total 
        FROM Tickets 
        GROUP BY Incidencia 
        ORDER BY total DESC 
        LIMIT 1
    """)
    top_problem_result = cursor.fetchone()
    top_problem = top_problem_result[0] if top_problem_result else 'N/A'

    # Calcular el promedio de minutos entre HoraSolicitada y HoraAtendida para tickets resueltos
    cursor.execute("""
        SELECT AVG(EXTRACT(EPOCH FROM (HoraTerminada::timestamp - HoraSolicitada::timestamp)) / 60) 
        FROM Tickets 
        WHERE Status = 'Finalizado'
    """)
    # PostgreSQL no tiene julianday(). Se usa EXTRACT(EPOCH FROM timestamp) 
    # julianday() convierte la fecha/hora en un número decimal con días como unidad.
    average_time = cursor.fetchone()[0]
    average_time = round(average_time, 2) if average_time else 0

    # Departamento más repetido en la tabla Tickets
    cursor.execute("""
        SELECT Departamento, COUNT(*) AS total 
        FROM Tickets 
        GROUP BY Departamento 
        ORDER BY total DESC 
        LIMIT 1
    """)
    top_department_result = cursor.fetchone()
    top_department = top_department_result[0] if top_department_result else 'N/A'

    # Obtener los tickets solo del día actual
    cursor.execute("""
        SELECT 
            id,
            Nombre, 
            Incidencia, 
            HoraSolicitada, 
            HoraTerminada, 
            Tecnico
        FROM Tickets
        WHERE Fecha = %s
        ORDER BY HoraSolicitada DESC
    """, (fecha_actual,))
    ticket_rows = cursor.fetchall()
    
    # Convertir los resultados en una lista de diccionarios para la plantilla
    tickets = [
        {
            'id': row[0],
            'Nombre': row[1],
            'Incidencia': row[2],
            'HoraSolicitada': row[3],
            'HoraTerminada': row[4] if row[4] else 'Pendiente',
            'Tecnico': row[5] if row[5] else 'Pendiente'
        } for row in ticket_rows
    ]

    return render_template('stats.html', 
        top_problem=top_problem,
        average_time=average_time,
        top_department=top_department,
        tickets=tickets
    )

#-----------------------------------------------------------------------------------
@app.route('/')
def form():

    return render_template('formulario.html')

#-----------------------------------------------------------------------------------
# Ruta para agregar un ticket y enviar correo
@app.route('/agre/ticket')
def agregar_ticket():
    try:
        name = request.args.get('nombreape')
        correo = request.args.get('correo')
        departamento = request.args.get('departamento')
        incidencia = request.args.get('incidencia')
        status = 'Pendiente'

        # Obtener la fecha y hora actual
        fecha_actual = datetime.now().strftime('%d-%m-%Y')  # Formato: DD-MM-YYYY
        hora_solicitada = datetime.now().strftime('%H:%M:%S')   # Formato: HH:MM:SS

        # Validar que todos los campos están presentes
        if not all([name, correo, departamento, incidencia]):
            return jsonify({'error': 'Faltan datos para almacenar.'}), 400

        # Conectar a la base de datos
        conexion = get_db()
        cursor = conexion.cursor()

        # Consulta para insertar el ticket en la base de datos
        query = '''
            INSERT INTO Tickets 
            (Nombre, Correo, Departamento, Incidencia, Status, Fecha, HoraSolicitada)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        '''

        cursor.execute(query, (name, correo, departamento, incidencia, status, fecha_actual, hora_solicitada))
        
        # Obtener el ID del ticket recién insertado
        numero_ticket = cursor.lastrowid
        
        # Confirmar la transacción
        conexion.commit()
    
        # Enviar el correo con el número de ticket
        asunto = "Ticket generado para el área de Soporte Tío Ammi"
        cuerpo = f"""
        Hola, tu número de ticket es el: {numero_ticket}.
        Se ha generado con éxito y será atendido por el Área de Soporte lo antes posible. 
        Si tiene algún comentario que añadir, hágalo saber por acá. ¡Gracias!
        """

        mensaje = Message(asunto, recipients=[correo])
        mensaje.body = cuerpo
        mail.send(mensaje)
        
        conexion.close()
            
        # Retornar mensaje de éxito
        return jsonify({
            'message': 'Datos agregados y correo enviado exitosamente.'
        }), 201
    except Exception as e:
        # Manejar errores y retornar mensaje de error
        import traceback
        print("Error en la Creacion:", traceback.format_exc())  # Esto imprimirá el error en la consola
        return jsonify({'error': f'Ocurrió un error: {str(e)}'}), 500
    
#----------------------------------------------------------------------------
@app.route('/update-status/<int:ticket_id>', methods=['POST'])
def update_status(ticket_id):
    try:
        data = request.get_json()
        new_status = data.get("status")
        tecnico = data.get("technician")

        # Obtener la hora actual
        hora_finalizada = datetime.now().strftime('%H:%M:%S')   # Formato: HH:MM:SS

        # Validar que el estado sea correcto
        if new_status not in ["En Proceso", "Finalizado"]:
            return jsonify({"success": False, "error": "Estado inválido"}), 400

        conexion = get_db()
        cursor = conexion.cursor()

        if new_status == "En Proceso":
            cursor.execute("UPDATE Tickets SET Status = %s, Tecnico = %s WHERE id = %s", 
                        (new_status, tecnico, ticket_id))
        elif new_status == "Finalizado":
            cursor.execute("UPDATE Tickets SET Status = %s, HoraTerminada = %s WHERE id = %s", 
                        (new_status, hora_finalizada, ticket_id))

        conexion.commit()

        return jsonify({"success": True, "message": "Estado actualizado correctamente."}), 200

    except Exception as e:
        import traceback
        print("Error en la actualización:", traceback.format_exc())  # Esto imprimirá el error en la consola
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        if 'conexion' in locals():
            conexion.close()

#----------------------------------------------------------------------------
if __name__ == '__main__':

    #app.run(debug=True)
    app.run(host="0.0.0.0", port=5000) 

