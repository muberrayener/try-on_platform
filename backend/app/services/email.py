import smtplib
from email.message import EmailMessage
from app.core.config import settings

def send_email(to: str, subject: str, content: str):
    msg = EmailMessage(); msg["From"] = settings.smtp_from; msg["To"] = to; msg["Subject"] = subject
    msg.set_content(content)
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
        if settings.smtp_starttls: smtp.starttls()
        if settings.smtp_username: smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(msg)
