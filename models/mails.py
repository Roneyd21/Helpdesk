from flask_mail import Mail, Message
import os

mail = Mail()

def configure_mail(app):
    app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
    app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT'))
    app.config['MAIL_USE_TLS'] = False
    app.config['MAIL_USE_SSL'] = True
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER')
    mail.init_app(app)

def send_ticket_email(correo, numero_ticket):
    """Lógica para enviar el correo cuando decidas activarlo"""
    try:
        asunto = "Ticket generado para el área de Soporte Tío Ammi"
        cuerpo = f"""
        Hola, tu número de ticket es el: {numero_ticket}.
        Se ha generado con éxito y será atendido por el Área de Soporte lo antes posible. 
        Si tiene algún comentario que añadir, hágalo saber por acá. ¡Gracias!
        """
        mensaje = Message(asunto, recipients=[correo])
        mensaje.body = cuerpo
        mail.send(mensaje)
        return True
    except Exception as e:
        print(f"Error enviando correo: {e}")
        return False