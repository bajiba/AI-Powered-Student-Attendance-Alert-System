from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta
import random
import string
import json
import requests
import ipaddress
from functools import wraps

from .models import User, Course, CourseSession, Attendance, VerificationLog, AlertLog, UserRole
from . import db, bcrypt

# Create blueprints
main_bp = Blueprint('main', __name__)
auth_bp = Blueprint('auth', __name__)
attendance_bp = Blueprint('attendance', __name__)
admin_bp = Blueprint('admin', __name__)

# Helper functions
def role_required(role):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            current_user_id = get_jwt_identity()
            user = User.query.get(current_user_id)
            if not user or user.role != role:
                return jsonify({"msg": "Unauthorized access"}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

def generate_verification_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def is_ip_in_campus_network(ip_address):
    # Example: Check if IP is in campus network range (replace with actual campus IP ranges)
    campus_networks = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16']
    ip = ipaddress.ip_address(ip_address)
    
    for network in campus_networks:
        if ip in ipaddress.ip_network(network):
            return True
    return False

def is_within_geofence(latitude, longitude):
    # Example: Check if coordinates are within campus geofence
    # Replace with actual campus boundaries
    campus_boundaries = {
        'min_lat': 37.420,
        'max_lat': 37.430,
        'min_lng': -122.090,
        'max_lng': -122.080
    }
    
    return (campus_boundaries['min_lat'] <= float(latitude) <= campus_boundaries['max_lat'] and
            campus_boundaries['min_lng'] <= float(longitude) <= campus_boundaries['max_lng'])

# Main routes
@main_bp.route('/')
def index():
    return jsonify({"message": "Welcome to the AI Attendance System API"})

# Auth routes
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Username already exists"}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already exists"}), 400
    
    # Default to student role unless specified
    role = UserRole.STUDENT
    if 'role' in data and data['role'] in [r.value for r in UserRole]:
        role = UserRole(data['role'])
    
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    new_user = User(
        username=data['username'],
        email=data['email'],
        password_hash=hashed_password,
        role=role,
        phone_number=data.get('phone_number')
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User registered successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not bcrypt.check_password_hash(user.password_hash, data['password']):
        return jsonify({"error": "Invalid username or password"}), 401
    
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    access_token = create_access_token(identity=user.id)
    return jsonify(access_token=access_token, user_role=user.role.value), 200

# Attendance routes
@attendance_bp.route('/generate-code/<int:session_id>', methods=['POST'])
@jwt_required()
@role_required(UserRole.TEACHER)
def generate_code(session_id):
    session = CourseSession.query.get_or_404(session_id)
    
    # Check if teacher is assigned to the course
    teacher_id = get_jwt_identity()
    course = Course.query.get(session.course_id)
    if course.teacher_id != teacher_id:
        return jsonify({"error": "Unauthorized to generate code for this session"}), 403
    
    # Generate a new verification code
    verification_code = generate_verification_code()
    session.verification_code = verification_code
    session.code_expiry = datetime.utcnow() + timedelta(minutes=5)  # Code expires in 5 minutes
    
    db.session.commit()
    
    return jsonify({
        "code": verification_code,
        "expires_at": session.code_expiry.isoformat()
    }), 200

@attendance_bp.route('/mark', methods=['POST'])
@jwt_required()
def mark_attendance():
    student_id = get_jwt_identity()
    data = request.get_json()
    
    session_id = data.get('session_id')
    verification_code = data.get('verification_code')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    
    session = CourseSession.query.get_or_404(session_id)
    
    # Validate the verification code
    if not session.verification_code or session.verification_code != verification_code:
        return jsonify({"error": "Invalid verification code"}), 400
    
    # Check if code has expired
    if session.code_expiry and session.code_expiry < datetime.utcnow():
        return jsonify({"error": "Verification code has expired"}), 400
    
    # Check time window
    now = datetime.utcnow()
    if now < session.start_time or now > session.end_time:
        return jsonify({"error": "Attendance can only be marked during the session time"}), 400
    
    # Get client IP address
    client_ip = request.remote_addr
    
    # Check IP restrictions
    if not is_ip_in_campus_network(client_ip):
        return jsonify({"error": "You must be connected to the campus network"}), 403
    
    # Check geofence if coordinates provided
    if latitude and longitude:
        if not is_within_geofence(latitude, longitude):
            return jsonify({"error": "You must be physically present on campus"}), 403
    
    # Check if already marked attendance for this session
    existing_attendance = Attendance.query.filter_by(
        student_id=student_id,
        session_id=session_id
    ).first()
    
    if existing_attendance:
        return jsonify({"error": "Attendance already marked for this session"}), 400
    
    # Create attendance record
    attendance = Attendance(
        student_id=student_id,
        session_id=session_id,
        verification_method='qr+gps+ip',
        ip_address=client_ip,
        gps_coordinates=f"{latitude},{longitude}" if latitude and longitude else None
    )
    
    db.session.add(attendance)
    
    # Create verification log
    verification_log = VerificationLog(
        user_id=student_id,
        verification_type='qr+location',
        details=json.dumps({
            'ip': client_ip,
            'gps': f"{latitude},{longitude}" if latitude and longitude else None,
            'time': datetime.utcnow().isoformat()
        })
    )
    
    db.session.add(verification_log)
    db.session.commit()
    
    # Connect verification log to attendance (now that attendance has an ID)
    verification_log.attendance_id = attendance.id
    db.session.commit()
    
    return jsonify({"message": "Attendance marked successfully"}), 201

@attendance_bp.route('/verify-session/<int:session_id>', methods=['GET'])
@jwt_required()
@role_required(UserRole.TEACHER)
def verify_session(session_id):
    teacher_id = get_jwt_identity()
    session = CourseSession.query.get_or_404(session_id)
    
    # Check if teacher is assigned to the course
    course = Course.query.get(session.course_id)
    if course.teacher_id != teacher_id:
        return jsonify({"error": "Unauthorized to verify this session"}), 403
    
    # Get all attendance records for this session
    attendances = Attendance.query.filter_by(session_id=session_id).all()
    students = []
    
    for attendance in attendances:
        student = User.query.get(attendance.student_id)
        students.append({
            'id': student.id,
            'username': student.username,
            'email': student.email,
            'timestamp': attendance.timestamp.isoformat(),
            'verification_method': attendance.verification_method,
            'verified': attendance.verified_by_teacher
        })
    
    return jsonify(students), 200

@attendance_bp.route('/teacher-verify/<int:attendance_id>', methods=['POST'])
@jwt_required()
@role_required(UserRole.TEACHER)
def teacher_verify(attendance_id):
    teacher_id = get_jwt_identity()
    attendance = Attendance.query.get_or_404(attendance_id)
    
    # Check if teacher is assigned to the course
    session = CourseSession.query.get(attendance.session_id)
    course = Course.query.get(session.course_id)
    
    if course.teacher_id != teacher_id:
        return jsonify({"error": "Unauthorized to verify this attendance"}), 403
    
    attendance.verified_by_teacher = True
    db.session.commit()
    
    return jsonify({"message": "Attendance verified successfully"}), 200

# Admin routes
@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@role_required(UserRole.ADMIN)
def list_users():
    users = User.query.all()
    result = []
    
    for user in users:
        result.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role.value,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'last_login': user.last_login.isoformat() if user.last_login else None
        })
    
    return jsonify(result), 200

@admin_bp.route('/courses', methods=['GET', 'POST'])
@jwt_required()
@role_required(UserRole.ADMIN)
def manage_courses():
    if request.method == 'GET':
        courses = Course.query.all()
        result = []
        
        for course in courses:
            teacher = User.query.get(course.teacher_id)
            result.append({
                'id': course.id,
                'code': course.code,
                'name': course.name,
                'description': course.description,
                'teacher': teacher.username,
                'created_at': course.created_at.isoformat()
            })
        
        return jsonify(result), 200
    
    elif request.method == 'POST':
        data = request.get_json()
        
        # Check if course code already exists
        if Course.query.filter_by(code=data['code']).first():
            return jsonify({"error": "Course code already exists"}), 400
        
        # Check if teacher exists and is a teacher
        teacher = User.query.get(data['teacher_id'])
        if not teacher or teacher.role != UserRole.TEACHER:
            return jsonify({"error": "Invalid teacher ID"}), 400
        
        new_course = Course(
            code=data['code'],
            name=data['name'],
            description=data.get('description', ''),
            teacher_id=data['teacher_id']
        )
        
        db.session.add(new_course)
        db.session.commit()
        
        return jsonify({"message": "Course created successfully", "id": new_course.id}), 201 