from django.core.mail import send_mail
from django.conf import settings
from twilio.rest import Client

def send_email(to_email, subject, message):
    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER,
        [to_email],
        fail_silently=False,
    )

def send_sms(to_phone, message):
    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    client.messages.create(
        body=message,
        from_=settings.TWILIO_PHONE_NUMBER,
        to=to_phone
    )

def notify_user(user, title, message, email=True, sms=True):
    # Save to Notification model
    from .models import Notification
    Notification.objects.create(
        user=user,
        title=title,
        message=message
    )
    
    if email and user.email:
        send_email(user.email, title, message)
    
    if sms and user.phone:
        send_sms(user.phone, message)
