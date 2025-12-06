from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import (
    User, Vehicle, LoanApplication, Document, 
    EMISchedule, Payment, Notification, ChatMessage
)

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 
                  'user_type', 'phone', 'address', 'citizenship_number', 
                  'date_of_birth', 'profile_picture', 'created_at']
        extra_kwargs = {'password': {'write_only': True}}
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'


class DocumentSerializer(serializers.ModelSerializer):
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True)
    
    class Meta:
        model = Document
        fields = '__all__'


class EMIScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = EMISchedule
        fields = '__all__'


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'


class LoanApplicationSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    vehicle_name = serializers.CharField(source='vehicle.__str__', read_only=True)
    documents = DocumentSerializer(many=True, read_only=True)
    emi_schedules = EMIScheduleSerializer(many=True, read_only=True)
    
    class Meta:
        model = LoanApplication
        fields = '__all__'
        read_only_fields = ['application_number', 'credit_score', 'fraud_risk_level', 
                           'ai_recommendation', 'verified_by', 'approved_by']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = '__all__'
