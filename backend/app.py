from app import create_app
import os
from flask_apscheduler import APScheduler
from app.ai_services import AlertService

app = create_app()
scheduler = APScheduler()

# Configure scheduler
scheduler.init_app(app)
scheduler.start()

# Schedule the alert generation task to run every day at midnight
@scheduler.task('cron', id='generate_alerts', hour=0)
def scheduled_alerts():
    with app.app_context():
        alert_service = AlertService()
        num_alerts = alert_service.check_and_generate_alerts()
        app.logger.info(f"Generated {num_alerts} attendance alerts")

if __name__ == '__main__':
    # Create models directory if it doesn't exist
    os.makedirs(os.path.join(os.path.dirname(__file__), 'app', 'models'), exist_ok=True)
    
    # Run the Flask app
    app.run(debug=True, host='0.0.0.0') 