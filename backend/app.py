from flask import Flask, request, jsonify, make_response, render_template, flash, redirect, url_for
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import hashlib
from datetime import datetime, timedelta
import bcrypt 
import jwt 
import os
from functools import wraps
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = Flask(__name__, static_folder='../frontend', template_folder='../frontend', static_url_path='')

# Configurar CORS de manera simple y efectiva
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Cache-Control"]
    }
})

@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Cache-Control'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

# Endpoint específico para manejar todas las solicitudes OPTIONS
@app.route('/<path:path>', methods=['OPTIONS'])
@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path=None):
    response = make_response('', 200)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Cache-Control'
    response.headers['Access-Control-Max-Age'] = '86400'
    return response

# ----------------- CONEXIÓN A BD (Clever Cloud) -----------------
db_config = {
    'host': 'byqbrxggs03hpqm4gc2f-mysql.services.clever-cloud.com',
    'user': 'uodyolqrobt57fuf',
    'password': 'cI4A6wuIFcd8Ur4MswP',  # ⚠️ pon la contraseña real de Clever Cloud
    'database': 'byqbrxggs03hpqm4gc2f',
    'port': 21763
}

def get_db_connection():
    try:
        connection = mysql.connector.connect(**db_config)
        if connection.is_connected():
            print("✅ Conexión exitosa a Clever Cloud")
        return connection
    except Error as e:
        print(f"❌ Error conectando a MySQL en Clever Cloud: {e}")
        return None

# Email configuration
# Configuración de email
email_config = {
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 587,
    'email': 'c13cardenas27@gmail.com',
    'password': 'vgui bqrq lbbz ahms',
    'sender_name': 'Armony Stetic'
}

# Diccionario temporal para almacenar códigos de verificación
verification_codes = {}

# Diccionario temporal para almacenar códigos de recuperación de contraseña
password_reset_codes = {}

# Diccionario para almacenar datos de registro temporal
temp_registration_data = {}

# Variables globales para control de intentos fallidos
failed_login_attempts = {}
MAX_LOGIN_ATTEMPTS = 3
LOCKOUT_DURATION = 15 * 60  # 15 minutos en segundos

def generate_verification_code():
    """Genera un código de verificación de 6 dígitos"""
    return str(random.randint(100000, 999999))

def is_account_locked(email):
    """Verifica si una cuenta está bloqueada por intentos fallidos"""
    if email not in failed_login_attempts:
        return False
    
    attempt_data = failed_login_attempts[email]
    current_time = datetime.now()
    
    # Si ha pasado el tiempo de bloqueo, resetear intentos
    if current_time >= attempt_data['lockout_until']:
        del failed_login_attempts[email]
        return False
    
    return True

def get_remaining_lockout_time(email):
    """Obtiene el tiempo restante de bloqueo en minutos"""
    if email not in failed_login_attempts:
        return 0
    
    attempt_data = failed_login_attempts[email]
    current_time = datetime.now()
    
    if current_time >= attempt_data['lockout_until']:
        return 0
    
    remaining_seconds = (attempt_data['lockout_until'] - current_time).total_seconds()
    return max(1, int(remaining_seconds / 60))

def record_failed_attempt(email):
    """Registra un intento fallido de login"""
    current_time = datetime.now()
    
    if email not in failed_login_attempts:
        failed_login_attempts[email] = {
            'attempts': 1,
            'last_attempt': current_time,
            'lockout_until': None
        }
    else:
        failed_login_attempts[email]['attempts'] += 1
        failed_login_attempts[email]['last_attempt'] = current_time
    
    # Si se alcanza el máximo de intentos, bloquear cuenta
    if failed_login_attempts[email]['attempts'] >= MAX_LOGIN_ATTEMPTS:
        failed_login_attempts[email]['lockout_until'] = current_time + timedelta(seconds=LOCKOUT_DURATION)
        return True  # Cuenta bloqueada
    
    return False  # No bloqueada aún

def reset_failed_attempts(email):
    """Resetea los intentos fallidos para un email"""
    if email in failed_login_attempts:
        del failed_login_attempts[email]

def send_verification_email(email, code, nombre="Usuario"):
    """Envía un email con el código de verificación"""
    print(f"\n[DEBUG] Iniciando envío de email...")
    print(f"[DEBUG] Email: {email}")
    print(f"[DEBUG] Código: {code}")
    print(f"[DEBUG] Nombre: {nombre}")
    
    try:
        # Envío real por SMTP
        msg = MIMEMultipart()
        msg['From'] = f"{email_config['sender_name']} <{email_config['email']}>"
        msg['To'] = email
        msg['Subject'] = "Código de verificación - Armony Stetic"
        
        # Cuerpo del email en HTML
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #70e1f0 0%, #50c1d0 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Armony Stetic</h1>
                <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Código de Verificación</p>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
                <p style="color: #333; text-align: center; margin-bottom: 10px;">Hola <strong>{nombre}</strong>,</p>
                <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Tu código de verificación</h2>
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #70e1f0;">
                    <span style="font-size: 32px; font-weight: bold; color: #50c1d0; letter-spacing: 5px;">{code}</span>
                </div>
                <p style="color: #666; text-align: center; margin: 20px 0;">Este código es válido por <strong>10 minutos</strong>.</p>
                <p style="color: #666; text-align: center; font-size: 14px;">Si no solicitaste este código, puedes ignorar este email.</p>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html_body, 'html'))
        
        # Conectar al servidor SMTP
        server = smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port'])
        server.starttls()
        server.login(email_config['email'], email_config['password'])
        
        # Enviar email
        text = msg.as_string()
        server.sendmail(email_config['email'], email, text)
        server.quit()
        
        print(f"Email enviado exitosamente a {email}")
        return True
        
    except Exception as e:
        print(f"Error enviando email: {e}")
        return False

def send_appointment_confirmation_email(email, nombre_cliente, fecha, hora, tratamiento):
    """Envia un email de confirmacion de cita"""
    print(f"\n[DEBUG] Enviando confirmacion de cita...")
    print(f"[DEBUG] Email: {email}")
    print(f"[DEBUG] Cliente: {nombre_cliente}")
    print(f"[DEBUG] Fecha recibida: {fecha} (tipo: {type(fecha)})")
    print(f"[DEBUG] Hora recibida: {hora} (tipo: {type(hora)})")
    print(f"[DEBUG] Tratamiento: {tratamiento}")
    
    try:
        # Envío real por SMTP
        msg = MIMEMultipart()
        msg['From'] = f"{email_config['sender_name']} <{email_config['email']}>"
        msg['To'] = email
        msg['Subject'] = "Cita Confirmada - Armony Stetic"
        
        # Debug del template antes de crear el HTML
        print(f"[DEBUG] Variables para template HTML:")
        print(f"[DEBUG] nombre_cliente para template: '{nombre_cliente}'")
        print(f"[DEBUG] fecha para template: '{fecha}'")
        print(f"[DEBUG] hora para template: '{hora}'")
        print(f"[DEBUG] tratamiento para template: '{tratamiento}'")
        
        # Cuerpo del email en HTML
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #70e1f0 0%, #50c1d0 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Armony Stetic</h1>
                <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Tu cita ha sido confirmada</p>
            </div>
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">Hola {nombre_cliente}!</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">Nos complace informarte que tu cita ha sido <strong style="color: #70e1f0;">confirmada</strong>.</p>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">Detalles de tu cita:</h3>
                    <p style="margin: 8px 0;"><strong>Fecha:</strong> {fecha}</p>
                    <p style="margin: 8px 0;"><strong>Hora:</strong> {hora}</p>
                    <p style="margin: 8px 0;"><strong>Tratamiento:</strong> {tratamiento}</p>
                </div>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6;">Por favor, llega 10 minutos antes de tu cita. Si necesitas cancelar o reprogramar, contactanos con al menos 24 horas de anticipacion.</p>
                
                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #999; font-size: 12px;">Te esperamos en Armony Stetic!</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html_body, 'html'))
        
        # Conectar al servidor SMTP
        server = smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port'])
        server.starttls()
        server.login(email_config['email'], email_config['password'])
        
        # Enviar email
        text = msg.as_string()
        server.sendmail(email_config['email'], email, text)
        server.quit()
        
        print(f"Email de confirmacion enviado exitosamente a {email}")
        return True
        
    except Exception as e:
        print(f"Error enviando email de confirmacion: {e}")
        return False

def crear_notificacion_automatica(mensaje, tipo='info', id_cliente=None):
    """Función auxiliar para crear notificaciones automáticas del sistema"""
    try:
        conn = get_db_connection()
        if not conn:
            return False
        
        cursor = conn.cursor()
        query = "INSERT INTO Notificaciones (mensaje, tipo, id_cliente, leida, fecha) VALUES (%s, %s, %s, %s, %s)"
        values = (
            mensaje,
            tipo,
            id_cliente,
            0,  # Nueva notificación no leída
            datetime.now()
        )
        cursor.execute(query, values)
        conn.commit()
        return True
    except Error as e:
        print(f"Error creando notificación automática: {e}")
        return False
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

def send_password_reset_email(email, code):
    """Envía un email con el código de recuperación de contraseña"""
    print(f"\n[DEBUG] Enviando email de recuperación de contraseña...")
    print(f"[DEBUG] Email: {email}")
    print(f"[DEBUG] Código: {code}")
    
    try:
        # Envío real por SMTP
        msg = MIMEMultipart()
        msg['From'] = f"{email_config['sender_name']} <{email_config['email']}>"
        msg['To'] = email
        msg['Subject'] = "Recuperación de Contraseña - Armony Stetic"
        
        # Cuerpo del email en HTML
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #70e1f0 0%, #50c1d0 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Armony Stetic</h1>
                <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Recuperación de Contraseña</p>
            </div>
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
                <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Código de Recuperación</h2>
                <p style="color: #666; text-align: center; margin-bottom: 20px;">Has solicitado restablecer tu contraseña. Usa el siguiente código:</p>
                <div style="background: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px solid #70e1f0;">
                    <h1 style="color: #50c1d0; margin: 0; font-size: 32px; letter-spacing: 5px;">{code}</h1>
                </div>
                <p style="color: #666; text-align: center; font-size: 14px;">Este código expira en 10 minutos.</p>
                <p style="color: #666; text-align: center; font-size: 14px;">Si no solicitaste este cambio, ignora este email.</p>
                <div style="text-align: center; margin-top: 30px;">
                    <p style="color: #999; font-size: 12px;">Armony Stetic - Tu centro de belleza de confianza</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(html_body, 'html'))
        
        # Conectar al servidor SMTP
        server = smtplib.SMTP(email_config['smtp_server'], email_config['smtp_port'])
        server.starttls()
        server.login(email_config['email'], email_config['password'])
        
        # Enviar email
        text = msg.as_string()
        server.sendmail(email_config['email'], email, text)
        server.quit()
        
        print(f"Email de recuperación enviado exitosamente a {email}")
        return True
        
    except Exception as e:
        print(f"Error enviando email de recuperación: {e}")
        return False

# Clientes endpoints
@app.route('/api/clientes', methods=['GET'])
def get_clientes():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id_cliente, nombre, email, telefono, direccion, estado FROM Clientes")
        clientes = cursor.fetchall()
        if not clientes:
            return jsonify({
                'success': True,
                'data': []
            })
        columns = [col[0] for col in cursor.description]
        clientes = [dict(zip(columns, row)) for row in clientes]
        return jsonify({
            'success': True,
            'data': clientes
        })
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/clientes/<int:id>', methods=['GET'])
def get_cliente(id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id_cliente, nombre, email, telefono, direccion, estado FROM Clientes WHERE id_cliente = %s", (id,))
        cliente = cursor.fetchone()
        if not cliente:
            return jsonify({'error': 'Cliente no encontrado'}), 404
        columns = [col[0] for col in cursor.description]
        cliente = dict(zip(columns, cliente))
        return jsonify(cliente)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/clientes', methods=['POST'])
def create_cliente():
    data = request.json
    
    try:
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validar campos requeridos
        required_fields = ['nombre', 'email', 'telefono', 'contrasena']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'El campo {field} es obligatorio'}), 400
        
        email = data['email']
        
        # Verificar si el email ya existe
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        cursor.execute("SELECT id_cliente FROM Clientes WHERE email = %s", (email,))
        existing_client = cursor.fetchone()
        
        if existing_client:
            return jsonify({'error': 'El email ya está registrado'}), 400
        
        # Generar código de verificación
        verification_code = generate_verification_code()
        
        # Usar email como clave para almacenar los datos
        verification_codes[email] = {
            'code': verification_code,
            'data': data,
            'timestamp': datetime.now()
        }
        
        # Enviar email de verificación
        if send_verification_email(email, verification_code):
            return jsonify({
                'message': 'Código de verificación enviado al email',
                'email': email
            }), 200
        else:
            return jsonify({'error': 'Error enviando el código de verificación'}), 500
            
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    """Endpoint para solicitar recuperación de contraseña"""
    data = request.json
    
    if not data or 'email' not in data:
        return jsonify({'success': False, 'message': 'Email es requerido'}), 400
    
    email = data['email']
    
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Verificar si el email existe en clientes
        cursor.execute("SELECT id_cliente FROM Clientes WHERE email = %s", (email,))
        client = cursor.fetchone()
        
        # También verificar en administradores
        cursor.execute("SELECT id_admin FROM Administradores WHERE email = %s", (email,))
        admin = cursor.fetchone()
        
        if not client and not admin:
            return jsonify({'success': False, 'message': 'No existe una cuenta con este email'}), 404
        
        # Generar código de recuperación
        reset_code = generate_verification_code()
        
        # Almacenar código con timestamp
        password_reset_codes[email] = {
            'code': reset_code,
            'timestamp': datetime.now(),
            'user_type': 'cliente' if client else 'admin',
            'verified': False
        }
        
        # Enviar email de recuperación
        if send_password_reset_email(email, reset_code):
            return jsonify({
                'success': True,
                'message': 'Código de recuperación enviado al email'
            }), 200
        else:
            return jsonify({'success': False, 'message': 'Error enviando el código de recuperación'}), 500
            
    except Error as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/verify-recovery-code', methods=['POST'])
def verify_recovery_code():
    """Endpoint para verificar código de recuperación de contraseña"""
    data = request.json
    
    if not data or 'email' not in data or 'code' not in data:
        return jsonify({'success': False, 'message': 'Email y código son requeridos'}), 400
    
    email = data['email']
    code = data['code']
    
    # Verificar si existe el código para este email
    if email not in password_reset_codes:
        return jsonify({'success': False, 'message': 'Código de recuperación no encontrado o expirado'}), 400
    
    stored_data = password_reset_codes[email]
    
    # Verificar si el código ha expirado (10 minutos)
    if datetime.now() - stored_data['timestamp'] > timedelta(minutes=10):
        del password_reset_codes[email]
        return jsonify({'success': False, 'message': 'Código de recuperación expirado'}), 400
    
    # Verificar si el código es correcto
    if stored_data['code'] != code:
        return jsonify({'success': False, 'message': 'Código de recuperación incorrecto'}), 400
    
    # Código correcto, marcar como verificado
    password_reset_codes[email]['verified'] = True
    
    return jsonify({
        'success': True,
        'message': 'Código verificado correctamente'
    }), 200

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    """Endpoint para restablecer contraseña después de verificar código"""
    data = request.json
    
    if not data or 'email' not in data or 'newPassword' not in data:
        return jsonify({'success': False, 'message': 'Email y nueva contraseña son requeridos'}), 400
    
    email = data['email']
    new_password = data['newPassword']
    
    # Validar longitud de contraseña
    if len(new_password) < 6:
        return jsonify({'success': False, 'message': 'La contraseña debe tener al menos 6 caracteres'}), 400
    
    # Verificar si existe el código para este email y si fue verificado
    if email not in password_reset_codes:
        return jsonify({'success': False, 'message': 'Sesión de recuperación no encontrada o expirada'}), 400
    
    stored_data = password_reset_codes[email]
    
    # Verificar si el código ha expirado (15 minutos desde la verificación)
    if datetime.now() - stored_data['timestamp'] > timedelta(minutes=15):
        del password_reset_codes[email]
        return jsonify({'success': False, 'message': 'Sesión de recuperación expirada'}), 400
    
    # Verificar si el código fue verificado previamente
    if not stored_data.get('verified', False):
        return jsonify({'success': False, 'message': 'Código no verificado'}), 400
    
    # Código verificado, actualizar contraseña
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor()
        
        # Hash de la nueva contraseña
        hashed_password = hashlib.sha256(new_password.encode()).hexdigest()
        
        # Actualizar contraseña según el tipo de usuario
        if stored_data['user_type'] == 'cliente':
            cursor.execute(
                "UPDATE Clientes SET contrasena = %s WHERE email = %s",
                (hashed_password, email)
            )
        else:
            cursor.execute(
                "UPDATE Administradores SET contrasena = %s WHERE email = %s",
                (hashed_password, email)
            )
        
        conn.commit()
        
        # Eliminar el código de recuperación usado
        del password_reset_codes[email]
        
        return jsonify({
            'success': True,
            'message': 'Contraseña actualizada exitosamente'
        }), 200
        
    except Error as e:
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/verify-code', methods=['POST'])
def verify_code():
    data = request.json
    
    if not data or 'email' not in data or 'code' not in data:
        return jsonify({'error': 'Email y código son requeridos'}), 400
    
    email = data['email']
    code = data['code']
    
    # Verificar si existe el código para este email
    if email not in verification_codes:
        return jsonify({'error': 'Código de verificación no encontrado o expirado'}), 400
    
    stored_data = verification_codes[email]
    
    # Verificar si el código ha expirado (10 minutos)
    if datetime.now() - stored_data['timestamp'] > timedelta(minutes=10):
        del verification_codes[email]
        return jsonify({'error': 'Código de verificación expirado'}), 400
    
    # Verificar si el código es correcto
    if stored_data['code'] != code:
        return jsonify({'error': 'Código de verificación incorrecto'}), 400
    
    # Código correcto, crear el cliente
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        client_data = stored_data['data']
        
        # Hash de la contraseña
        hashed_password = hashlib.sha256(client_data['contrasena'].encode()).hexdigest()
        
        # Insertar cliente en la base de datos
        cursor.execute(
            "INSERT INTO Clientes (nombre, email, telefono, contrasena, direccion, estado) VALUES (%s, %s, %s, %s, %s, %s)",
            (client_data.get('nombre', ''), client_data.get('email', ''), client_data.get('telefono', ''), 
             hashed_password, client_data.get('direccion', ''), 'activo')
        )
        
        conn.commit()
        client_id = cursor.lastrowid
        
        # Eliminar el código de verificación usado
        del verification_codes[email]
        
        # Crear notificación automática de nuevo cliente registrado
        mensaje_notificacion = f"Nuevo cliente registrado: {client_data.get('nombre', 'Sin nombre')} ({client_data.get('email', 'Sin email')})"
        crear_notificacion_automatica(mensaje_notificacion, 'success', client_id)
        
        return jsonify({
            'message': 'Cliente registrado exitosamente',
            'id': client_id
        }), 201
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/resend-code', methods=['POST'])
def resend_verification_code():
    data = request.json
    
    if not data or 'email' not in data:
        return jsonify({'error': 'Email es requerido'}), 400
    
    email = data['email']
    
    # Verificar si existe datos para este email
    if email not in verification_codes:
        return jsonify({'error': 'No hay solicitud de registro pendiente para este email'}), 400
    
    # Generar nuevo código
    new_code = generate_verification_code()
    
    # Actualizar el código y timestamp
    verification_codes[email]['code'] = new_code
    verification_codes[email]['timestamp'] = datetime.now()
    
    # Enviar nuevo código
    if send_verification_email(email, new_code):
        return jsonify({'message': 'Nuevo código de verificación enviado'}), 200
    else:
        return jsonify({'error': 'Error enviando el código de verificación'}), 500

@app.route('/api/clientes/<int:id>', methods=['PUT'])
def update_cliente(id):
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        update_fields = []
        values = []
        
        for key, value in data.items():
            if key in ['nombre', 'email', 'telefono', 'direccion', 'estado']:
                update_fields.append(f"{key} = %s")
                values.append(value)
            elif key in ['contrasena', 'password']:
                update_fields.append("contrasena = %s")
                values.append(hashlib.sha256(value.encode()).hexdigest())
        
        if not update_fields:
            return jsonify({'error': 'No hay campos válidos para actualizar'}), 400
        
        values.append(id)
        query = f"UPDATE Clientes SET {', '.join(update_fields)} WHERE id_cliente = %s"
        cursor.execute(query, values)
        conn.commit()
        
        # Obtener los datos actualizados del cliente
        cursor.execute("SELECT id_cliente, nombre, email, telefono, direccion, estado FROM Clientes WHERE id_cliente = %s", (id,))
        cliente = cursor.fetchone()
        
        if cliente:
            cliente_data = {
                'id_cliente': cliente[0],
                'nombre': cliente[1],
                'email': cliente[2],
                'telefono': cliente[3],
                'direccion': cliente[4],
                'estado': cliente[5]
            }
            return jsonify(cliente_data)
        else:
            return jsonify({'error': 'Cliente no encontrado'}), 404
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/clientes/<int:id>', methods=['DELETE'])
def delete_cliente(id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE Clientes SET estado = 'inactivo' WHERE id_cliente = %s", (id,))
        conn.commit()
        return jsonify({'message': 'Cliente eliminado exitosamente'})
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/clientes/<int:id>/stats', methods=['GET'])
def get_cliente_stats(id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        
        # Contar citas completadas (confirmadas)
        cursor.execute("SELECT COUNT(*) FROM Citas WHERE id_cliente = %s AND estado = 'confirmada'", (id,))
        citas_completadas = cursor.fetchone()[0]
        
        # Contar citas pendientes
        cursor.execute("SELECT COUNT(*) FROM Citas WHERE id_cliente = %s AND estado = 'pendiente'", (id,))
        citas_pendientes = cursor.fetchone()[0]
        
        # Contar tratamientos realizados (basado en citas confirmadas)
        cursor.execute("SELECT COUNT(DISTINCT id_tratamiento) FROM Citas WHERE id_cliente = %s AND estado = 'confirmada'", (id,))
        tratamientos_realizados = cursor.fetchone()[0]
        
        # Calcular gasto total (suma de pagos completados)
        cursor.execute("SELECT COALESCE(SUM(total), 0) FROM pagos WHERE id_cliente = %s AND estado_pago = 'completado'", (id,))
        gasto_total = cursor.fetchone()[0]
        
        stats = {
            'citasCompletadas': citas_completadas,
            'citasPendientes': citas_pendientes,
            'tratamientosRealizados': tratamientos_realizados,
            'gastoTotal': float(gasto_total) if gasto_total else 0.0
        }
        
        return jsonify(stats)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# Tratamientos endpoints
@app.route('/api/tratamientos', methods=['GET'])
def get_tratamientos():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Tratamientos")
        tratamientos = cursor.fetchall()
        if not tratamientos:
            return jsonify({
                'success': True,
                'data': []
            })
        columns = [col[0] for col in cursor.description]
        tratamientos = [dict(zip(columns, row)) for row in tratamientos]
        return jsonify({
            'success': True,
            'data': tratamientos
        })
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/tratamientos/<int:id>', methods=['GET'])
def get_tratamiento(id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Tratamientos WHERE id_tratamiento = %s", (id,))
        tratamiento = cursor.fetchone()
        if not tratamiento:
            return jsonify({'error': 'Tratamiento no encontrado'}), 404
        columns = [col[0] for col in cursor.description]
        tratamiento = dict(zip(columns, tratamiento))
        return jsonify(tratamiento)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/tratamientos', methods=['POST'])
def create_tratamiento():
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        cursor.execute(
            "INSERT INTO Tratamientos (nombre, descripcion, duracion, precio) VALUES (%s, %s, %s, %s)",
            (data.get('nombre', ''), data.get('descripcion', ''), data.get('duracion', 0), data.get('precio', 0))
        )
        conn.commit()
        return jsonify({'message': 'Tratamiento creado exitosamente', 'id': cursor.lastrowid}), 201
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/tratamientos/<int:id>', methods=['PUT'])
def update_tratamiento(id):
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        update_fields = []
        values = []
        for key in ['nombre', 'descripcion', 'duracion', 'precio', 'estado']:
            if key in data:
                update_fields.append(f"{key} = %s")
                values.append(data[key])
        if not update_fields:
            return jsonify({'error': 'No hay campos válidos para actualizar'}), 400
        values.append(id)
        query = f"UPDATE Tratamientos SET {', '.join(update_fields)} WHERE id_tratamiento = %s"
        cursor.execute(query, values)
        conn.commit()
        return jsonify({'message': 'Tratamiento actualizado exitosamente'})
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/tratamientos/<int:id>', methods=['DELETE'])
def delete_tratamiento(id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE Tratamientos SET estado = 'inactivo' WHERE id_tratamiento = %s", (id,))
        conn.commit()
        return jsonify({'message': 'Tratamiento eliminado exitosamente'})
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# Citas endpoints
@app.route('/api/citas', methods=['GET'])
def get_citas():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT c.*, cl.nombre as cliente_nombre, t.nombre as tratamiento_nombre
            FROM Citas c
            JOIN Clientes cl ON c.id_cliente = cl.id_cliente
            JOIN Tratamientos t ON c.id_tratamiento = t.id_tratamiento
            ORDER BY c.fecha DESC, c.hora DESC
        """)
        citas = cursor.fetchall()
        for cita in citas:
            if isinstance(cita['fecha'], datetime):
                cita['fecha'] = cita['fecha'].strftime('%Y-%m-%d')
            if isinstance(cita['hora'], timedelta):
                cita['hora'] = str(cita['hora'])
            elif isinstance(cita['hora'], datetime):
                cita['hora'] = cita['hora'].strftime('%H:%M:%S')
        return jsonify({
            'success': True,
            'data': citas
        })
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/citas/<int:id>', methods=['GET'])
def get_cita(id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.*, cl.nombre as cliente_nombre, t.nombre as tratamiento_nombre
            FROM Citas c
            JOIN Clientes cl ON c.id_cliente = cl.id_cliente
            JOIN Tratamientos t ON c.id_tratamiento = t.id_tratamiento
            WHERE c.id_cita = %s
        """, (id,))
        cita = cursor.fetchone()
        if not cita:
            return jsonify({'error': 'Cita no encontrada'}), 404
        if not hasattr(cita, 'items'):
            columns = [col[0] for col in cursor.description]
            cita = dict(zip(columns, cita))
        for key, value in cita.items():
            if isinstance(value, timedelta):
                cita[key] = str(value)
        return jsonify(cita)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/citas', methods=['POST'])
def create_cita():
    data = request.json
    required_fields = ['id_cliente', 'id_tratamiento', 'fecha', 'hora']
    for field in required_fields:
        if not data or field not in data or not data[field]:
            return jsonify({'error': f'El campo {field} es obligatorio'}), 400
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        # Validar formato de fecha y hora
        try:
            datetime.strptime(data['fecha'], '%Y-%m-%d')
            datetime.strptime(data['hora'], '%H:%M')
        except ValueError:
            return jsonify({'error': 'Formato de fecha u hora inválido. Fecha: YYYY-MM-DD, Hora: HH:MM'}), 400
        cursor.execute(
            "INSERT INTO Citas (id_cliente, id_tratamiento, fecha, hora, estado) VALUES (%s, %s, %s, %s, %s)",
            (data['id_cliente'], data['id_tratamiento'], data['fecha'], data['hora'], data.get('estado', 'pendiente'))
        )
        conn.commit()
        cita_id = cursor.lastrowid
        
        # Obtener información del cliente y tratamiento para la notificación
        cursor.execute("SELECT nombre FROM Clientes WHERE id_cliente = %s", (data['id_cliente'],))
        cliente_result = cursor.fetchone()
        cliente_nombre = cliente_result[0] if cliente_result else "Cliente desconocido"
        
        cursor.execute("SELECT nombre FROM Tratamientos WHERE id_tratamiento = %s", (data['id_tratamiento'],))
        tratamiento_result = cursor.fetchone()
        tratamiento_nombre = tratamiento_result[0] if tratamiento_result else "Tratamiento desconocido"
        
        # Crear notificación automática de nueva cita agendada
        mensaje_notificacion = f"Nueva cita agendada: {cliente_nombre} - {tratamiento_nombre} el {data['fecha']} a las {data['hora']}"
        crear_notificacion_automatica(mensaje_notificacion, 'info', data['id_cliente'])
        
        return jsonify({'message': 'Cita creada exitosamente', 'id': cita_id}), 201
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/reservar-cita', methods=['POST'])
def reservar_cita():
    data = request.json
    required_fields = ['id_cliente', 'id_tratamiento', 'fecha', 'hora']
    
    # Validar campos requeridos
    for field in required_fields:
        if not data or field not in data or not data[field]:
            return jsonify({'error': f'El campo {field} es obligatorio'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        
        # Verificar que el cliente existe
        cursor.execute("SELECT nombre, email FROM Clientes WHERE id_cliente = %s", (data['id_cliente'],))
        cliente = cursor.fetchone()
        if not cliente:
            return jsonify({'error': 'Cliente no encontrado'}), 404
        
        nombre_cliente, email_cliente = cliente
        
        # Verificar que el tratamiento existe
        cursor.execute("SELECT nombre FROM Tratamientos WHERE id_tratamiento = %s", (data['id_tratamiento'],))
        tratamiento = cursor.fetchone()
        if not tratamiento:
            return jsonify({'error': 'Tratamiento no encontrado'}), 404
        
        nombre_tratamiento = tratamiento[0]
        
        # Validar formato de fecha y hora
        try:
            datetime.strptime(data['fecha'], '%Y-%m-%d')
            datetime.strptime(data['hora'], '%H:%M')
        except ValueError:
            return jsonify({'error': 'Formato de fecha u hora inválido. Fecha: YYYY-MM-DD, Hora: HH:MM'}), 400
        
        # Verificar disponibilidad de la fecha y hora
        cursor.execute(
            "SELECT id_cita FROM Citas WHERE fecha = %s AND hora = %s AND estado != 'cancelada'",
            (data['fecha'], data['hora'])
        )
        existing_cita = cursor.fetchone()
        if existing_cita:
            return jsonify({'error': 'La fecha y hora seleccionadas no están disponibles'}), 400
        
        # Crear la cita
        cursor.execute(
            "INSERT INTO Citas (id_cliente, id_tratamiento, fecha, hora, estado) VALUES (%s, %s, %s, %s, %s)",
            (data['id_cliente'], data['id_tratamiento'], data['fecha'], data['hora'], 'pendiente')
        )
        conn.commit()
        cita_id = cursor.lastrowid
        
        # Crear notificación automática de cita reservada
        mensaje_notificacion = f"Cita reservada: {nombre_cliente} - {nombre_tratamiento} el {data['fecha']} a las {data['hora']}"
        crear_notificacion_automatica(mensaje_notificacion, 'info', data['id_cliente'])
        
        return jsonify({
            'message': 'Cita reservada exitosamente',
            'id': cita_id,
            'cliente': nombre_cliente,
            'tratamiento': nombre_tratamiento,
            'fecha': data['fecha'],
            'hora': data['hora'],
            'estado': 'pendiente'
        }), 201
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/citas/<int:id>', methods=['PUT'])
def update_cita(id):
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Obtener el estado actual de la cita
        cursor.execute("SELECT estado FROM Citas WHERE id_cita = %s", (id,))
        current_state = cursor.fetchone()
        if not current_state:
            return jsonify({'error': 'Cita no encontrada'}), 404
        
        update_fields = []
        values = []
        for key in ['id_cliente', 'id_tratamiento', 'fecha', 'hora', 'estado']:
            if key in data:
                update_fields.append(f"{key} = %s")
                values.append(data[key])
        if not update_fields:
            return jsonify({'error': 'No hay campos válidos para actualizar'}), 400
        values.append(id)
        query = f"UPDATE Citas SET {', '.join(update_fields)} WHERE id_cita = %s"
        cursor.execute(query, values)
        conn.commit()
        
        # Si el estado cambió a 'confirmada', enviar email de confirmación
        if 'estado' in data and data['estado'] == 'confirmada' and current_state[0] != 'confirmada':
            # Obtener datos completos de la cita para el email
            cursor.execute("""
                SELECT c.fecha, c.hora, cl.nombre as nombre_cliente, cl.email, t.nombre as nombre_tratamiento
                FROM Citas c
                JOIN Clientes cl ON c.id_cliente = cl.id_cliente
                JOIN Tratamientos t ON c.id_tratamiento = t.id_tratamiento
                WHERE c.id_cita = %s
            """, (id,))
            cita_data = cursor.fetchone()
            print(f"[DEBUG] Resultado de consulta cita_data: {cita_data}")
            
            if cita_data:
                print(f"[DEBUG] cita_data completa: {cita_data}")
                fecha, hora, nombre_cliente, email, tratamiento = cita_data
                print(f"[DEBUG] Datos de cita obtenidos de BD:")
                print(f"[DEBUG] fecha raw: {fecha} (tipo: {type(fecha)})")
                print(f"[DEBUG] hora raw: {hora} (tipo: {type(hora)})")
                print(f"[DEBUG] nombre_cliente: {nombre_cliente}")
                print(f"[DEBUG] email: {email}")
                print(f"[DEBUG] tratamiento: {tratamiento}")
                # Formatear fecha y hora
                if isinstance(fecha, datetime):
                    fecha_str = fecha.strftime('%Y-%m-%d')
                else:
                    fecha_str = str(fecha)
                
                if isinstance(hora, timedelta):
                    hora_str = str(hora)
                elif isinstance(hora, datetime):
                    hora_str = hora.strftime('%H:%M')
                else:
                    hora_str = str(hora)
                
                print(f"[DEBUG] Valores formateados para email:")
                print(f"[DEBUG] fecha_str: {fecha_str}")
                print(f"[DEBUG] hora_str: {hora_str}")
                
                # Enviar email de confirmación
                email_sent = send_appointment_confirmation_email(
                    email, nombre_cliente, fecha_str, hora_str, tratamiento
                )
                
                # Crear notificación automática de cita confirmada
                mensaje_notificacion = f"Cita confirmada: {nombre_cliente} - {tratamiento} el {fecha_str} a las {hora_str}"
                crear_notificacion_automatica(mensaje_notificacion, 'success', data.get('id_cliente'))
                
                if email_sent:
                    return jsonify({
                        'message': 'Cita actualizada exitosamente y email de confirmación enviado'
                    })
                else:
                    return jsonify({
                        'message': 'Cita actualizada exitosamente pero hubo un error enviando el email'
                    })
        
        return jsonify({'message': 'Cita actualizada exitosamente'})
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/citas/<int:id>', methods=['DELETE'])
def delete_cita(id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        
        # Obtener información de la cita antes de eliminarla
        cursor.execute("""
            SELECT c.id_cliente, c.fecha, c.hora, cl.nombre as nombre_cliente, t.nombre as nombre_tratamiento
            FROM Citas c
            JOIN Clientes cl ON c.id_cliente = cl.id_cliente
            JOIN Tratamientos t ON c.id_tratamiento = t.id_tratamiento
            WHERE c.id_cita = %s
        """, (id,))
        cita_info = cursor.fetchone()
        
        if not cita_info:
            return jsonify({'error': 'Cita no encontrada'}), 404
        
        id_cliente, fecha, hora, nombre_cliente, nombre_tratamiento = cita_info
        
        # Eliminar la cita
        cursor.execute("DELETE FROM Citas WHERE id_cita = %s", (id,))
        conn.commit()
        
        # Crear notificación automática de cita cancelada
        fecha_str = fecha.strftime('%Y-%m-%d') if isinstance(fecha, datetime) else str(fecha)
        hora_str = str(hora) if isinstance(hora, timedelta) else hora.strftime('%H:%M') if isinstance(hora, datetime) else str(hora)
        mensaje_notificacion = f"Cita cancelada: {nombre_cliente} - {nombre_tratamiento} del {fecha_str} a las {hora_str}"
        crear_notificacion_automatica(mensaje_notificacion, 'warning', id_cliente)
        
        return jsonify({'message': 'Cita eliminada exitosamente'})
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/citas/cliente/<int:id_cliente>', methods=['GET'])
def get_citas_by_cliente(id_cliente):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT c.*, cl.nombre as nombre_cliente, t.nombre as nombre_tratamiento, t.precio 
            FROM Citas c 
            JOIN Clientes cl ON c.id_cliente = cl.id_cliente 
            JOIN Tratamientos t ON c.id_tratamiento = t.id_tratamiento
            WHERE c.id_cliente = %s
            ORDER BY c.fecha DESC, c.hora DESC
        """, (id_cliente,))
        citas = cursor.fetchall()
        for cita in citas:
            if isinstance(cita['fecha'], datetime):
                cita['fecha'] = cita['fecha'].strftime('%Y-%m-%d')
            if isinstance(cita['hora'], timedelta):
                cita['hora'] = str(cita['hora'])
            elif isinstance(cita['hora'], datetime):
                cita['hora'] = cita['hora'].strftime('%H:%M:%S')
        return jsonify(citas)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/citas/cliente/<int:id_cliente>/historial', methods=['GET'])
def get_historial_cliente(id_cliente):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT c.*, cl.nombre as nombre_cliente, t.nombre as nombre_tratamiento, t.precio
            FROM Citas c 
            JOIN Clientes cl ON c.id_cliente = cl.id_cliente 
            JOIN Tratamientos t ON c.id_tratamiento = t.id_tratamiento
            WHERE c.id_cliente = %s
            ORDER BY c.fecha DESC, c.hora DESC
        """, (id_cliente,))
        citas = cursor.fetchall()
        for cita in citas:
            if isinstance(cita['fecha'], datetime):
                cita['fecha'] = cita['fecha'].strftime('%Y-%m-%d')
            if isinstance(cita['hora'], timedelta):
                cita['hora'] = str(cita['hora'])
            elif isinstance(cita['hora'], datetime):
                cita['hora'] = cita['hora'].strftime('%H:%M:%S')
        return jsonify(citas)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/citas/<int:id_cita>/cancelar', methods=['PUT'])
def cancelar_cita(id_cita):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        # Verificar que la cita existe y no está ya cancelada
        cursor.execute("SELECT estado FROM Citas WHERE id_cita = %s", (id_cita,))
        result = cursor.fetchone()
        
        if not result:
            return jsonify({'error': 'Cita no encontrada'}), 404
        
        if result[0] == 'cancelada':
            return jsonify({'error': 'La cita ya está cancelada'}), 400
        
        # Actualizar el estado de la cita a 'cancelada'
        cursor.execute("UPDATE Citas SET estado = 'cancelada' WHERE id_cita = %s", (id_cita,))
        conn.commit()
        
        return jsonify({'message': 'Cita cancelada exitosamente'}), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/citas/tratamiento/<int:id_tratamiento>', methods=['GET'])
def get_citas_by_tratamiento(id_tratamiento):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.*, cl.nombre as nombre_cliente, t.nombre as nombre_tratamiento 
            FROM Citas c 
            JOIN Clientes cl ON c.id_cliente = cl.id_cliente 
            JOIN Tratamientos t ON c.id_tratamiento = t.id_tratamiento
            WHERE c.id_tratamiento = %s
        """, (id_tratamiento,))
        citas = cursor.fetchall()
        return jsonify(citas)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# Administradores endpoints
@app.route('/api/administradores', methods=['GET'])
def get_administradores():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id_admin, nombre, email, telefono, estado FROM Administradores")
        administradores = cursor.fetchall()
        return jsonify(administradores)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/administradores/<int:id>', methods=['GET'])
def get_administrador(id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Administradores WHERE id_admin = %s", (id,))
        administrador = cursor.fetchone()
        if not administrador:
            return jsonify({'error': 'Administrador not found'}), 404
        columns = [col[0] for col in cursor.description]
        administrador = dict(zip(columns, administrador))
        return jsonify(administrador)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/administradores', methods=['POST'])
def create_administrador():
    data = request.json
    print('Datos recibidos:', data)
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        if 'contrasena' not in data or not data['contrasena']:
            return jsonify({'error': 'La contraseña es obligatoria'}), 400
        hashed_password = hashlib.sha256(data['contrasena'].encode()).hexdigest()
        cursor.execute(
            "INSERT INTO Administradores (nombre, email, telefono, contrasena) VALUES (%s, %s, %s, %s)",
            (data.get('nombre', ''), data.get('email', ''), data.get('telefono', ''), hashed_password)
        )
        conn.commit()
        return jsonify({'message': 'Administrador created successfully', 'id': cursor.lastrowid}), 201
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/administradores/<int:id>', methods=['PUT'])
def update_administrador(id):
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        update_fields = []
        values = []
        for key in ['nombre', 'email', 'telefono', 'estado', 'contrasena']:
            if key in data:
                if key == 'contrasena':
                    update_fields.append('contrasena = %s')
                    values.append(hashlib.sha256(data[key].encode()).hexdigest())
                else:
                    update_fields.append(f"{key} = %s")
                    values.append(data[key])
        if not update_fields:
            return jsonify({'error': 'No hay campos válidos para actualizar'}), 400
        values.append(id)
        query = f"UPDATE Administradores SET {', '.join(update_fields)} WHERE id_admin = %s"
        cursor.execute(query, values)
        conn.commit()
        return jsonify({'message': 'Administrador actualizado exitosamente'})
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/administradores/<int:id>', methods=['DELETE'])
def delete_administrador(id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Administradores WHERE id_admin = %s", (id,))
        conn.commit()
        return jsonify({'message': 'Administrador deleted successfully'})
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/administradores/login', methods=['POST'])
def login_admin():
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        hashed_password = hashlib.sha256(data['contrasena'].encode()).hexdigest()
        cursor.execute(
            "SELECT * FROM Administradores WHERE email = %s AND contrasena = %s",
            (data['email'], hashed_password)
        )
        admin = cursor.fetchone()
        if admin:
            # Generar token JWT
            token = jwt.encode({
                'user': {
                    'id': admin['id_admin'],
                    'email': admin['email'],
                    'nombre': admin['nombre']
                }
            }, 'tu_clave_secreta', algorithm='HS256')
            
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'admin': {
                    'id': admin['id_admin'],
                    'email': admin['email'],
                    'nombre': admin['nombre']
                }
            })
        return jsonify({'error': 'Invalid credentials'}), 401
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/login-cliente', methods=['OPTIONS'])
def login_cliente_options():
    """Handle preflight OPTIONS request for client login"""
    response = make_response()
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

@app.route('/login-cliente', methods=['POST'])
def login_cliente():
    """Endpoint para autenticar clientes"""
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        hashed_password = hashlib.sha256(data['password'].encode()).hexdigest()
        cursor.execute(
            "SELECT * FROM Clientes WHERE email = %s AND contrasena = %s AND estado = 'activo'",
            (data['email'], hashed_password)
        )
        cliente = cursor.fetchone()
        if cliente:
            return jsonify({
                'success': True,
                'message': 'Login exitoso',
                'cliente': {
                    'id': cliente['id_cliente'],
                    'email': cliente['email'],
                    'nombre': cliente['nombre'],
                    'telefono': cliente['telefono'],
                    'direccion': cliente['direccion']
                }
            })
        return jsonify({'success': False, 'message': 'Credenciales inválidas o cuenta inactiva'}), 401
    except Error as e:
        return jsonify({'success': False, 'message': 'Error del servidor'}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/status', methods=['GET'])
def status():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Server is running',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/login', methods=['OPTIONS'])
def login_options():
    """Handle preflight OPTIONS request for login"""
    response = make_response()
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    
    if not email:
        return jsonify({'success': False, 'error': 'Email es requerido'}), 400
    
    # Verificar si la cuenta está bloqueada
    if is_account_locked(email):
        remaining_time = get_remaining_lockout_time(email)
        return jsonify({
            'success': False, 
            'error': f'Cuenta bloqueada. Intente nuevamente en {remaining_time} minutos.',
            'locked': True,
            'remaining_minutes': remaining_time
        }), 423  # 423 Locked
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        hashed_password = hashlib.sha256(data['contrasena'].encode()).hexdigest()
        
        # Primero intentar como administrador
        cursor.execute(
            "SELECT * FROM Administradores WHERE email = %s AND contrasena = %s AND estado = 'activo'",
            (email, hashed_password)
        )
        admin = cursor.fetchone()
        if admin:
            # Login exitoso - resetear intentos fallidos
            reset_failed_attempts(email)
            
            # Generar token JWT para admin
            token = jwt.encode({
                'user': {
                    'id': admin['id_admin'],
                    'email': admin['email'],
                    'nombre': admin['nombre'],
                    'tipo': 'admin'
                }
            }, 'tu_clave_secreta', algorithm='HS256')
            
            return jsonify({
                'success': True,
                'tipo': 'admin',
                'token': token,
                'admin': {
                    'id': admin['id_admin'],
                    'email': admin['email'],
                    'nombre': admin['nombre']
                },
                'redirect': 'home.html'
            })
        
        # Si no es admin, intentar como cliente
        cursor.execute(
            "SELECT * FROM Clientes WHERE email = %s AND contrasena = %s AND estado = 'activo'",
            (email, hashed_password)
        )
        cliente = cursor.fetchone()
        if cliente:
            # Login exitoso - resetear intentos fallidos
            reset_failed_attempts(email)
            
            # Generar token JWT para cliente
            token = jwt.encode({
                'user': {
                    'id': cliente['id_cliente'],
                    'email': cliente['email'],
                    'nombre': cliente['nombre'],
                    'tipo': 'cliente'
                }
            }, 'tu_clave_secreta', algorithm='HS256')
            
            return jsonify({
                'success': True,
                'tipo': 'cliente',
                'token': token,
                'cliente': {
                    'id': cliente['id_cliente'],
                    'email': cliente['email'],
                    'nombre': cliente['nombre'],
                    'telefono': cliente['telefono'],
                    'direccion': cliente['direccion']
                },
                'redirect': 'usuario.html'
            })
        
        # Credenciales inválidas - registrar intento fallido
        is_locked = record_failed_attempt(email)
        
        if is_locked:
            return jsonify({
                'success': False, 
                'error': 'Cuenta bloqueada por 15 minutos debido a múltiples intentos fallidos.',
                'locked': True,
                'remaining_minutes': 15
            }), 423
        else:
            remaining_attempts = MAX_LOGIN_ATTEMPTS - failed_login_attempts[email]['attempts']
            return jsonify({
                'success': False, 
                'error': f'Credenciales inválidas. Le quedan {remaining_attempts} intentos antes del bloqueo.',
                'remaining_attempts': remaining_attempts
            }), 401
            
    except Error as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/register', methods=['POST'])
def register_cliente():
    """Endpoint para registro de clientes con verificación por email"""
    data = request.json
    
    try:
        if not data:
            return jsonify({'success': False, 'error': 'No se proporcionaron datos'}), 400
        
        # Validar campos requeridos
        required_fields = ['nombre', 'email', 'telefono', 'contrasena', 'direccion']
        for field in required_fields:
            if field not in data or not data[field].strip():
                return jsonify({'success': False, 'error': f'El campo {field} es obligatorio'}), 400
        
        email = data['email'].strip().lower()
        nombre = data['nombre'].strip()
        telefono = data['telefono'].strip()
        contrasena = data['contrasena']
        direccion = data['direccion'].strip()
        
        # Validar formato de email
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return jsonify({'success': False, 'error': 'Formato de email inválido'}), 400
        
        # Validar longitud de campos
        if len(nombre) < 2:
            return jsonify({'success': False, 'error': 'El nombre debe tener al menos 2 caracteres'}), 400
        if len(telefono) < 8:
            return jsonify({'success': False, 'error': 'El teléfono debe tener al menos 8 dígitos'}), 400
        if len(direccion) < 5:
            return jsonify({'success': False, 'error': 'La dirección debe tener al menos 5 caracteres'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Verificar si el email ya existe
        cursor.execute("SELECT id_cliente FROM Clientes WHERE email = %s", (email,))
        existing_client = cursor.fetchone()
        
        if existing_client:
            return jsonify({'success': False, 'error': 'El email ya está registrado'}), 400
        
        # Verificar si el teléfono ya existe
        cursor.execute("SELECT id_cliente FROM Clientes WHERE telefono = %s", (telefono,))
        existing_phone = cursor.fetchone()
        
        if existing_phone:
            return jsonify({'success': False, 'error': 'El teléfono ya está registrado'}), 400
        
        # Generar código de verificación
        verification_code = generate_verification_code()
        
        # Encriptar contraseña
        hashed_password = hashlib.sha256(contrasena.encode()).hexdigest()
        
        # Guardar datos temporalmente en sesión o base de datos temporal
        # Por simplicidad, usaremos una tabla temporal o almacenamiento en memoria
        temp_registration_data[email] = {
            'nombre': nombre,
            'email': email,
            'telefono': telefono,
            'contrasena': hashed_password,
            'direccion': direccion,
            'verification_code': verification_code,
            'timestamp': datetime.now()
        }
        
        # Enviar código de verificación por email
        try:
            send_verification_email(email, verification_code, nombre)
            return jsonify({
                'success': True,
                'message': 'Se ha enviado un código de verificación a tu email',
                'email': email,
                'step': 'verification'
            }), 200
        except Exception as e:
            return jsonify({'success': False, 'error': 'Error al enviar el email de verificación'}), 500
        
    except Error as e:
        return jsonify({'success': False, 'error': f'Error en la base de datos: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': f'Error interno: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/verify-registration', methods=['POST'])
def verify_registration():
    """Endpoint para verificar código y completar el registro"""
    data = request.json
    
    try:
        if not data or 'email' not in data or 'code' not in data:
            return jsonify({'success': False, 'error': 'Email y código son requeridos'}), 400
        
        email = data['email'].strip().lower()
        code = data['code'].strip()
        
        # Verificar si existe el registro temporal
        if email not in temp_registration_data:
            return jsonify({'success': False, 'error': 'No se encontró el registro o ha expirado'}), 400
        
        temp_data = temp_registration_data[email]
        
        # Verificar si el código ha expirado (10 minutos)
        if datetime.now() - temp_data['timestamp'] > timedelta(minutes=10):
            del temp_registration_data[email]
            return jsonify({'success': False, 'error': 'El código de verificación ha expirado'}), 400
        
        # Verificar el código
        if temp_data['verification_code'] != code:
            return jsonify({'success': False, 'error': 'Código de verificación incorrecto'}), 400
        
        # Código correcto, proceder con el registro
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Error de conexión a la base de datos'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Insertar nuevo cliente
        cursor.execute(
            "INSERT INTO Clientes (nombre, email, telefono, contrasena, direccion, estado) VALUES (%s, %s, %s, %s, %s, 'activo')",
            (temp_data['nombre'], temp_data['email'], temp_data['telefono'], temp_data['contrasena'], temp_data['direccion'])
        )
        
        conn.commit()
        
        # Limpiar datos temporales
        del temp_registration_data[email]
        
        return jsonify({
            'success': True,
            'message': 'Registro completado exitosamente. Ahora puedes iniciar sesión.',
            'redirect': 'login.html'
        }), 201
        
    except Error as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'error': f'Error en la base de datos: {str(e)}'}), 500
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({'success': False, 'error': f'Error interno: {str(e)}'}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# Función para verificar el token
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token no proporcionado'}), 401
        try:
            # Verificar si el token comienza con 'Bearer '
            if token.startswith('Bearer '):
                token = token.split(' ')[1]
            data = jwt.decode(token, 'tu_clave_secreta', algorithms=['HS256'])
            current_user = data['user']
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token inválido'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# Reportes endpoints
@app.route('/api/reportes', methods=['GET'])
def get_reportes():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute('''
            SELECT r.*, a.nombre as nombre_admin 
            FROM Reportes r 
            LEFT JOIN Administradores a ON r.id_admin = a.id_admin
            ORDER BY r.fecha_reporte DESC
        ''')
        reportes = cursor.fetchall()
        # Convertir fechas a formato string para JSON
        for reporte in reportes:
            if isinstance(reporte['fecha_reporte'], datetime):
                reporte['fecha_reporte'] = reporte['fecha_reporte'].strftime('%Y-%m-%d')
        return jsonify({
            'success': True,
            'data': reportes
        })
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/reportes/<int:id>', methods=['GET'])
def get_reporte(id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT r.*, a.nombre as nombre_admin
            FROM Reportes r
            LEFT JOIN Administradores a ON r.id_admin = a.id_admin
            WHERE r.id_reporte = %s
        ''', (id,))
        reporte = cursor.fetchone()
        if not reporte:
            return jsonify({'error': 'Reporte no encontrado'}), 404
        if not hasattr(reporte, 'items'):
            columns = [col[0] for col in cursor.description]
            reporte = dict(zip(columns, reporte))
        return jsonify(reporte)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/reportes', methods=['POST'])
def create_reporte():
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO Reportes (titulo, descripcion, tipo, id_admin)
            VALUES (%s, %s, %s, %s)
        ''', (
            data['titulo'],
            data['descripcion'],
            data['tipo'],
            data['id_admin']
        ))
        conn.commit()
        return jsonify({'message': 'Reporte created successfully', 'id': cursor.lastrowid}), 201
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/reportes/<int:id>', methods=['PUT'])
def update_reporte(id):
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        update_fields = []
        values = []
        for key, value in data.items():
            if key in ['titulo', 'descripcion', 'tipo', 'id_admin']:
                update_fields.append(f"{key} = %s")
                values.append(value)
        
        if not update_fields:
            return jsonify({'error': 'No valid fields to update'}), 400
        
        values.append(id)
        query = f"UPDATE Reportes SET {', '.join(update_fields)} WHERE id_reporte = %s"
        cursor.execute(query, values)
        conn.commit()
        return jsonify({'message': 'Reporte updated successfully'})
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/reportes/<int:id>', methods=['DELETE'])
def delete_reporte(id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Reportes WHERE id_reporte = %s", (id,))
        conn.commit()
        return jsonify({'message': 'Reporte deleted successfully'})
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/reportes/admin/<int:id_admin>', methods=['GET'])
def get_reportes_by_admin(id_admin):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT r.*, a.nombre as nombre_admin 
            FROM Reportes r 
            LEFT JOIN Administradores a ON r.id_admin = a.id_admin
            WHERE r.id_admin = %s
            ORDER BY r.fecha_reporte DESC
        ''', (id_admin,))
        reportes = cursor.fetchall()
        return jsonify(reportes)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/reportes/stats', methods=['GET'])
@token_required
def get_reporte_stats(current_user):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        # Total de reportes
        cursor.execute('SELECT COUNT(*) as total FROM Reportes')
        total_result = cursor.fetchone()
        total = total_result['total'] if total_result else 0
        
        # Reportes por tipo
        cursor.execute('''
            SELECT tipo, COUNT(*) as count 
            FROM Reportes 
            GROUP BY tipo
        ''')
        tipos = cursor.fetchall()
        
        stats = {
            'total': total,
            'por_tipo': {tipo['tipo']: tipo['count'] for tipo in tipos}
        }
        
        return jsonify(stats)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/notificaciones', methods=['GET'])
def get_notificaciones():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id_notificacion, mensaje, fecha, leida, tipo, id_admin, id_cliente FROM Notificaciones ORDER BY fecha DESC")
        notificaciones = cursor.fetchall()
        if not notificaciones:
            return jsonify([])
        return jsonify(notificaciones)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/notificaciones/<int:id>/marcar-leida', methods=['PUT'])
def marcar_notificacion_leida(id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE Notificaciones SET leida = 1 WHERE id_notificacion = %s", (id,))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({'error': 'Notificación no encontrada'}), 404
        return jsonify({'message': 'Notificación marcada como leída'})
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/notificaciones', methods=['POST'])
def crear_notificacion():
    data = request.get_json()
    if not data or 'mensaje' not in data:
        return jsonify({'error': 'Mensaje es requerido'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor()
        query = "INSERT INTO Notificaciones (mensaje, tipo, id_admin, id_cliente, leida) VALUES (%s, %s, %s, %s, %s)"
        values = (
            data['mensaje'],
            data.get('tipo', 'info'),
            data.get('id_admin'),
            data.get('id_cliente'),
            0  # Nueva notificación no leída
        )
        cursor.execute(query, values)
        conn.commit()
        return jsonify({
            'message': 'Notificación creada exitosamente',
            'id': cursor.lastrowid
        }), 201
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# Rutas para visualizar datos en formato JSON en el navegador
@app.route('/dashboard')
def dashboard():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Dashboard - Visualización de Datos</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
            h2 { color: #333; }
            a { color: #007bff; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .json-viewer { background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <h1>Dashboard - Visualización de Datos JSON</h1>
        
        <div class="section">
            <h2>📊 Datos de Pagos</h2>
            <a href="/pagos/json" target="_blank">Ver Pagos en JSON</a>
        </div>
        
        <div class="section">
            <h2>👥 Clientes</h2>
            <a href="/api/clientes" target="_blank">Ver Clientes en JSON</a>
        </div>
        
        <div class="section">
            <h2>💆 Tratamientos</h2>
            <a href="/api/tratamientos" target="_blank">Ver Tratamientos en JSON</a>
        </div>
        
        <div class="section">
            <h2>📅 Citas</h2>
            <a href="/api/citas" target="_blank">Ver Citas en JSON</a>
        </div>
        
        <div class="section">
            <h2>👨‍💼 Administradores</h2>
            <a href="/api/administradores" target="_blank">Ver Administradores en JSON</a>
        </div>
        
        <div class="section">
            <h2>📋 Reportes</h2>
            <a href="/api/reportes" target="_blank">Ver Reportes en JSON</a>
        </div>
        
        <div class="section">
            <h2>🔔 Notificaciones</h2>
            <a href="/api/notificaciones" target="_blank">Ver Notificaciones en JSON</a>
        </div>
        
        <div class="section">
            <h2>📈 Estadísticas</h2>
            <p>Para ver estadísticas, necesitas autenticarte con un token JWT.</p>
            <a href="/api/reportes/stats" target="_blank">Ver Estadísticas (requiere autenticación)</a>
        </div>
    </body>
    </html>
    """

@app.route('/resumen')
def resumen():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Contar total de registros en cada tabla
        cursor.execute("SELECT COUNT(*) as total FROM Clientes")
        total_clientes = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM Tratamientos")
        total_tratamientos = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM Citas")
        total_citas = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM pagos")
        total_pagos = cursor.fetchone()['total']
        
        cursor.execute("SELECT COUNT(*) as total FROM Administradores")
        total_administradores = cursor.fetchone()['total']
        
        # Obtener algunos datos recientes
        cursor.execute("SELECT * FROM pagos ORDER BY fecha_pago DESC LIMIT 5")
        pagos_recientes = cursor.fetchall()
        
        cursor.execute("SELECT * FROM Citas ORDER BY fecha DESC LIMIT 5")
        citas_recientes = cursor.fetchall()
        
        # Convertir fechas a string
        for pago in pagos_recientes:
            if isinstance(pago['fecha_pago'], datetime):
                pago['fecha_pago'] = pago['fecha_pago'].strftime('%Y-%m-%d')
        
        for cita in citas_recientes:
            if isinstance(cita['fecha'], datetime):
                cita['fecha'] = cita['fecha'].strftime('%Y-%m-%d')
        
        return jsonify({
            'success': True,
            'resumen': {
                'total_clientes': total_clientes,
                'total_tratamientos': total_tratamientos,
                'total_citas': total_citas,
                'total_pagos': total_pagos,
                'total_administradores': total_administradores
            },
            'pagos_recientes': pagos_recientes,
            'citas_recientes': citas_recientes
        })
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/pagos')
def pagos():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
        SELECT p.id_pago, t.nombre AS tratamiento, t.precio, p.fecha_pago, p.total, p.metodo_pago
        FROM pagos p
        JOIN Tratamientos t ON p.id_tratamiento = t.id_tratamiento
        ORDER BY p.fecha_pago DESC
        """)

        pagos = cursor.fetchall()

        cursor.execute("""
            SELECT id_tratamiento, nombre, precio
            FROM Tratamientos
            WHERE estado = 'activo' OR estado IS NULL
        """)
        tratamientos = cursor.fetchall()
        return render_template('pagos.html', pagos=pagos, tratamientos=tratamientos)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/pagos/json')
def pagos_json():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
        SELECT p.id_pago, t.nombre AS tratamiento, t.precio, p.fecha_pago, p.total, p.metodo_pago
        FROM pagos p
        JOIN Tratamientos t ON p.id_tratamiento = t.id_tratamiento
        ORDER BY p.fecha_pago DESC
        """)

        pagos = cursor.fetchall()
        
        # Convertir fechas a string para JSON
        for pago in pagos:
            if isinstance(pago['fecha_pago'], datetime):
                pago['fecha_pago'] = pago['fecha_pago'].strftime('%Y-%m-%d')
        
        return jsonify({
            'success': True,
            'data': pagos,
            'total': len(pagos)
        })
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/agregar_pago', methods=['POST'])
def agregar_pago():
    id_tratamiento = request.form['id_tratamiento']
    fecha_pago = request.form['fecha_pago']
    total = request.form['total']
    metodo_pago = request.form['metodo_pago']
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO pagos (id_tratamiento, fecha_pago, total, metodo_pago) VALUES (%s, %s, %s, %s)",
                    (id_tratamiento, fecha_pago, total, metodo_pago))
        conn.commit()
        
        # Obtener información del tratamiento y cliente para la notificación
        cursor.execute("""
            SELECT t.nombre, c.id_cliente, c.nombre as nombre_cliente
            FROM Tratamientos t
            JOIN Citas ci ON t.id_tratamiento = ci.id_tratamiento
            JOIN Clientes c ON ci.id_cliente = c.id_cliente
            WHERE t.id_tratamiento = %s
            LIMIT 1
        """, (id_tratamiento,))
        tratamiento_info = cursor.fetchone()
        
        if tratamiento_info:
            nombre_tratamiento, id_cliente, nombre_cliente = tratamiento_info
            # Crear notificación automática de pago registrado
            mensaje_notificacion = f"Pago registrado: {nombre_cliente} - {nombre_tratamiento} - ${total} ({metodo_pago})"
            crear_notificacion_automatica(mensaje_notificacion, 'success', id_cliente)
        
        flash("Pago registrado")
        return redirect(url_for('pagos'))
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# API endpoint para obtener pagos por cliente
@app.route('/api/pagos/cliente/<int:id_cliente>', methods=['GET'])
def get_pagos_cliente(id_cliente):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT p.id_pago, p.id_cliente, p.id_tratamiento, p.id_admin, 
                   p.fecha_pago, p.total, p.metodo_pago, p.estado_pago, 
                   p.numero_referencia, p.observaciones,
                   t.nombre as nombre_tratamiento
            FROM pagos p
            LEFT JOIN Tratamientos t ON p.id_tratamiento = t.id_tratamiento
            WHERE p.id_cliente = %s
            ORDER BY p.fecha_pago DESC
        """, (id_cliente,))
        
        pagos = cursor.fetchall()
        
        # Convertir fechas a string para JSON
        for pago in pagos:
            if isinstance(pago['fecha_pago'], datetime):
                pago['fecha_pago'] = pago['fecha_pago'].strftime('%Y-%m-%d')
        
        return jsonify(pagos)
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/factura_pago/<int:id_pago>')
def factura_pago(id_pago):
    conn = get_db_connection()
    if not conn:
        return "Error de conexión", 500
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT c.nombre, c.email, a.nombre AS trabajadora, t.nombre AS tratamiento, t.precio, 
                   ci.fecha AS fecha_servicio, ci.observaciones, p.fecha_pago, p.total, p.metodo_pago
            FROM pagos p
            JOIN Citas ci ON p.id_cita = ci.id_cita
            JOIN Clientes c ON ci.id_cliente = c.id_cliente
            JOIN Administradores a ON ci.id_administrador = a.id_administrador
            JOIN Tratamientos t ON ci.id_tratamiento = t.id_tratamiento
            WHERE p.id_pago = %s
        """, (id_pago,))
        datos = cursor.fetchone()
        return render_template('facturas.html', datos=datos)
    except Exception as e:
        return str(e), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/facturas', methods=['GET'])
def get_facturas():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Facturas")
        facturas = cursor.fetchall()
        return jsonify(facturas)
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/facturas', methods=['POST'])
def create_factura():
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO Facturas (id_pago, fecha, total, detalles) VALUES (%s, %s, %s, %s)",
            (data['id_pago'], data['fecha'], data['total'], data.get('detalles', ''))
        )
        conn.commit()
        factura_id = cursor.lastrowid
        
        # Obtener información del pago para la notificación
        cursor.execute("""
            SELECT p.id_cliente, cl.nombre
            FROM Pagos p
            JOIN Clientes cl ON p.id_cliente = cl.id_cliente
            WHERE p.id_pago = %s
        """, (data['id_pago'],))
        pago_info = cursor.fetchone()
        
        if pago_info:
            id_cliente, nombre_cliente = pago_info
            # Crear notificación automática de nueva factura
            mensaje_notificacion = f"Nueva factura generada para {nombre_cliente} - Total: ${data['total']}"
            crear_notificacion_automatica(mensaje_notificacion, 'success', id_cliente)
        
        return jsonify({'message': 'Factura creada exitosamente', 'id': factura_id}), 201
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/facturas/<int:id>', methods=['PUT'])
def update_factura(id):
    data = request.json
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        update_fields = []
        values = []
        for key, value in data.items():
            if key in ['id_pago', 'fecha', 'total', 'detalles', 'estado']:
                update_fields.append(f"{key} = %s")
                values.append(value)
        
        if not update_fields:
            return jsonify({'error': 'No hay campos válidos para actualizar'}), 400
        
        values.append(id)
        query = f"UPDATE Facturas SET {', '.join(update_fields)} WHERE id_factura = %s"
        cursor.execute(query, values)
        conn.commit()
        return jsonify({'message': 'Factura actualizada exitosamente'})
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/api/facturas/<int:id>', methods=['DELETE'])
def delete_factura(id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Facturas WHERE id_factura = %s", (id,))
        conn.commit()
        return jsonify({'message': 'Factura eliminada exitosamente'})
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/home')
def home():
    return app.send_static_file('index.html')

@app.route('/reportes')
def reportes_page():
    return app.send_static_file('reportes.html')

@app.route('/clientes')
def clientes_page():
    return app.send_static_file('clientes.html')

@app.route('/citas')
def citas_page():
    return app.send_static_file('citas.html')

@app.route('/tratamientos')
def tratamientos_page():
    return app.send_static_file('tratamientos.html')

@app.route('/administradores')
def administradores_page():
    return app.send_static_file('administradores.html')

@app.route('/servicios')
def servicios_page():
    return app.send_static_file('servicios.html')

# API endpoint para obtener todos los pagos (para facturas)
@app.route('/api/pagos', methods=['GET'])
def get_pagos():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT p.id_pago, p.id_cliente, p.id_tratamiento, p.id_admin, 
                   p.fecha_pago, p.total, p.metodo_pago, p.estado_pago, 
                   p.observaciones,
                   c.nombre as cliente_nombre,
                   t.nombre as tratamiento_nombre
            FROM pagos p
            LEFT JOIN Clientes c ON p.id_cliente = c.id_cliente
            LEFT JOIN Tratamientos t ON p.id_tratamiento = t.id_tratamiento
            ORDER BY p.fecha_pago DESC
        """)
        
        pagos = cursor.fetchall()
        
        # Convertir fechas a string para JSON
        for pago in pagos:
            if isinstance(pago['fecha_pago'], datetime):
                pago['fecha_pago'] = pago['fecha_pago'].strftime('%Y-%m-%d')
            
            # Asegurar que el cliente tenga nombre
            if not pago['cliente_nombre']:
                pago['cliente_nombre'] = 'Cliente no encontrado'
            
            # Remover campos innecesarios
            if 'cliente_apellido' in pago:
                del pago['cliente_apellido']
        
        return jsonify(pagos)
        
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

@app.route('/facturas')
def facturas_page():
    return app.send_static_file('facturas.html')

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)