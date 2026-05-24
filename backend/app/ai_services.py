import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from collections import Counter
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os
import logging

from .models import User, Attendance, Course, CourseSession, AlertLog
from . import db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AttendanceAnalyzer:
    """Class for analyzing attendance patterns and identifying anomalies"""
    
    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), 'models', 'isolation_forest.pkl')
        self.model = None
        self.load_or_train_model()
    
    def load_or_train_model(self):
        """Load existing model or train a new one if none exists"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                logger.info("Loaded existing model")
            else:
                logger.info("No existing model found, will train on demand")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
    
    def save_model(self):
        """Save the trained model"""
        try:
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump(self.model, self.model_path)
            logger.info("Model saved successfully")
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
    
    def prepare_data(self, student_id=None, course_id=None, days=30):
        """Prepare attendance data for analysis"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Query to get all attendance records for the period
        query = Attendance.query.filter(Attendance.timestamp >= cutoff_date)
        
        if student_id:
            query = query.filter_by(student_id=student_id)
        
        if course_id:
            sessions = CourseSession.query.filter_by(course_id=course_id).all()
            session_ids = [session.id for session in sessions]
            query = query.filter(Attendance.session_id.in_(session_ids))
        
        attendance_records = query.all()
        
        if not attendance_records:
            return None
        
        # Convert to DataFrame
        data = []
        for record in attendance_records:
            session = CourseSession.query.get(record.session_id)
            course = Course.query.get(session.course_id)
            
            data.append({
                'student_id': record.student_id,
                'course_id': course.id,
                'timestamp': record.timestamp,
                'day_of_week': record.timestamp.weekday(),
                'hour_of_day': record.timestamp.hour,
                'is_present': 1 if record.status == 'present' else 0,
                'is_late': 1 if record.status == 'late' else 0,
                'is_verified': 1 if record.verified_by_teacher else 0
            })
        
        df = pd.DataFrame(data)
        return df
    
    def train_model(self, df):
        """Train an anomaly detection model on attendance data"""
        if df is None or len(df) < 10:
            logger.warning("Not enough data to train model")
            return False
        
        # Feature engineering
        features = df[['day_of_week', 'hour_of_day', 'is_present', 'is_late', 'is_verified']]
        
        # Standardize features
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features)
        
        # Train isolation forest model
        self.model = IsolationForest(
            n_estimators=100, 
            contamination=0.05,  # Assuming 5% of attendance records may be anomalous
            random_state=42
        )
        self.model.fit(features_scaled)
        
        # Save the trained model
        self.save_model()
        return True
    
    def detect_anomalies(self, student_id=None, course_id=None):
        """Detect anomalies in attendance patterns"""
        df = self.prepare_data(student_id, course_id)
        
        if df is None or len(df) < 5:
            logger.warning("Not enough data to detect anomalies")
            return []
        
        # If model doesn't exist, train it
        if self.model is None:
            self.train_model(self.prepare_data())
            
            # If still None, not enough data
            if self.model is None:
                return []
        
        # Feature engineering
        features = df[['day_of_week', 'hour_of_day', 'is_present', 'is_late', 'is_verified']]
        
        # Standardize features
        scaler = StandardScaler()
        features_scaled = scaler.fit_transform(features)
        
        # Predict anomalies (-1 for anomalies, 1 for normal)
        predictions = self.model.predict(features_scaled)
        
        # Extract anomalies
        anomalies = df[predictions == -1]
        return anomalies
    
    def analyze_attendance_trends(self, student_id=None, course_id=None):
        """Analyze attendance trends for a student or course"""
        df = self.prepare_data(student_id, course_id)
        
        if df is None or len(df) < 5:
            return {
                'status': 'insufficient_data',
                'message': 'Not enough data to analyze trends'
            }
        
        # Overall attendance rate
        attendance_rate = df['is_present'].mean() * 100
        
        # Attendance by day of week
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        day_counts = Counter(df['day_of_week'])
        day_attendance = {days[day]: count for day, count in day_counts.items()}
        
        # Detect frequent absences
        if student_id:
            student_data = df[df['student_id'] == student_id]
            absence_streak = self.detect_absence_streak(student_data)
        else:
            absence_streak = None
        
        # Attendance trends over time
        df['date'] = df['timestamp'].dt.date
        attendance_by_date = df.groupby('date')['is_present'].mean() * 100
        trend = attendance_by_date.tolist()
        
        return {
            'status': 'success',
            'attendance_rate': attendance_rate,
            'attendance_by_day': day_attendance,
            'absence_streak': absence_streak,
            'trend': trend
        }
    
    def detect_absence_streak(self, df):
        """Detect streaks of absences"""
        if df is None or len(df) < 3:
            return None
        
        # Sort by timestamp
        df = df.sort_values('timestamp')
        
        # Check for consecutive absences
        absences = df[df['is_present'] == 0]
        if len(absences) < 2:
            return None
        
        # Group absences by date to count consecutive dates
        absences['date'] = absences['timestamp'].dt.date
        dates = absences['date'].tolist()
        
        # Find longest streak
        longest_streak = 1
        current_streak = 1
        
        for i in range(1, len(dates)):
            prev_date = dates[i-1]
            curr_date = dates[i]
            
            if (curr_date - prev_date).days == 1:
                current_streak += 1
            else:
                current_streak = 1
                
            longest_streak = max(longest_streak, current_streak)
        
        return longest_streak

class AlertService:
    """Service for generating alerts based on attendance patterns"""
    
    def __init__(self):
        self.analyzer = AttendanceAnalyzer()
    
    def check_and_generate_alerts(self):
        """Check for attendance issues and generate alerts"""
        # Get all students
        students = User.query.filter_by(role='student').all()
        alerts_generated = 0
        
        for student in students:
            # Check for absence streaks
            analysis = self.analyzer.analyze_attendance_trends(student_id=student.id)
            
            if analysis['status'] == 'success':
                # Alert for absence streak
                if analysis.get('absence_streak') and analysis['absence_streak'] >= 2:
                    self.create_absence_streak_alert(student, analysis['absence_streak'])
                    alerts_generated += 1
                
                # Alert for low attendance rate
                if analysis.get('attendance_rate') and analysis['attendance_rate'] < 75:
                    self.create_low_attendance_alert(student, analysis['attendance_rate'])
                    alerts_generated += 1
                
                # Check for anomalies
                anomalies = self.analyzer.detect_anomalies(student_id=student.id)
                if len(anomalies) > 0:
                    self.create_anomaly_alert(student, len(anomalies))
                    alerts_generated += 1
        
        return alerts_generated
    
    def create_absence_streak_alert(self, student, streak_length):
        """Create an alert for a streak of absences"""
        message = f"You have missed {streak_length} consecutive classes. Regular attendance is important for academic success."
        
        alert = AlertLog(
            user_id=student.id,
            alert_type='absence',
            message=message,
            delivery_method='email'  # or 'sms'
        )
        
        db.session.add(alert)
        db.session.commit()
        
        # In a real application, you would also send the email/SMS here
        self.send_alert(student, message, 'email')
    
    def create_low_attendance_alert(self, student, attendance_rate):
        """Create an alert for low overall attendance"""
        message = f"Your attendance rate is {attendance_rate:.1f}%, which is below the recommended 75%. Please improve your attendance."
        
        alert = AlertLog(
            user_id=student.id,
            alert_type='pattern',
            message=message,
            delivery_method='email'  # or 'sms'
        )
        
        db.session.add(alert)
        db.session.commit()
        
        # In a real application, you would also send the email/SMS here
        self.send_alert(student, message, 'email')
    
    def create_anomaly_alert(self, student, num_anomalies):
        """Create an alert for anomalous attendance patterns"""
        message = f"We've detected unusual patterns in your attendance. Please ensure you're following proper attendance procedures."
        
        alert = AlertLog(
            user_id=student.id,
            alert_type='anomaly',
            message=message,
            delivery_method='email'  # or 'sms'
        )
        
        db.session.add(alert)
        db.session.commit()
        
        # In a real application, you would also send the email/SMS here
        self.send_alert(student, message, 'email')
    
    def send_alert(self, student, message, method):
        """Send an alert via email or SMS (stub function)"""
        if method == 'email' and student.email:
            logger.info(f"Would send email to {student.email}: {message}")
            # In a real application:
            # send_email(student.email, "Attendance Alert", message)
        elif method == 'sms' and student.phone_number:
            logger.info(f"Would send SMS to {student.phone_number}: {message}")
            # In a real application:
            # send_sms(student.phone_number, message) 