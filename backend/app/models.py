from . import db
from datetime import datetime
from flask_jwt_extended import current_user
import enum

class UserRole(enum.Enum):
    STUDENT = 'student'
    TEACHER = 'teacher'
    ADMIN = 'admin'

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.STUDENT)
    phone_number = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    attendances = db.relationship('Attendance', backref='student', lazy=True)
    courses = db.relationship('Course', secondary='enrollment', backref='students', lazy=True)
    
    def __repr__(self):
        return f'<User {self.username}>'

# Association table for many-to-many relationship between User and Course
enrollment = db.Table('enrollment',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('course_id', db.Integer, db.ForeignKey('course.id'), primary_key=True),
    db.Column('enrollment_date', db.DateTime, default=datetime.utcnow)
)

class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    teacher = db.relationship('User', backref='teaching_courses')
    sessions = db.relationship('CourseSession', backref='course', lazy=True)
    
    def __repr__(self):
        return f'<Course {self.code}: {self.name}>'

class CourseSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('course.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    room = db.Column(db.String(50), nullable=True)
    verification_code = db.Column(db.String(10), nullable=True)
    code_expiry = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    attendances = db.relationship('Attendance', backref='session', lazy=True)
    
    def __repr__(self):
        return f'<Session {self.id} for Course {self.course_id}>'

class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    session_id = db.Column(db.Integer, db.ForeignKey('course_session.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='present')  # present, absent, late, excused
    verification_method = db.Column(db.String(20), nullable=False)  # qr, gps, bluetooth, manual
    ip_address = db.Column(db.String(50), nullable=True)
    gps_coordinates = db.Column(db.String(100), nullable=True)
    verified_by_teacher = db.Column(db.Boolean, default=False)
    
    def __repr__(self):
        return f'<Attendance {self.id}: Student {self.student_id} for Session {self.session_id}>'

class VerificationLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    attendance_id = db.Column(db.Integer, db.ForeignKey('attendance.id'), nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    verification_type = db.Column(db.String(20), nullable=False)  # qr, biometric, pin, random
    success = db.Column(db.Boolean, default=True)
    details = db.Column(db.Text, nullable=True)
    
    # Relationships
    user = db.relationship('User', backref='verification_logs')
    attendance = db.relationship('Attendance', backref='verification_logs')
    
    def __repr__(self):
        return f'<VerificationLog {self.id} for User {self.user_id}>'

class AlertLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    alert_type = db.Column(db.String(20), nullable=False)  # absence, pattern, reminder
    message = db.Column(db.Text, nullable=False)
    delivery_method = db.Column(db.String(10), nullable=False)  # email, sms
    status = db.Column(db.String(20), default='pending')  # pending, sent, failed
    
    # Relationships
    user = db.relationship('User', backref='alerts')
    
    def __repr__(self):
        return f'<AlertLog {self.id} for User {self.user_id}>' 