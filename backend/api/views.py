from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, timedelta
from decimal import Decimal
import math

from .models import (
    User, Vehicle, LoanApplication, Document, 
    EMISchedule, Payment, Notification
)
from .serializers import (
    UserSerializer, VehicleSerializer, LoanApplicationSerializer,
    DocumentSerializer, EMIScheduleSerializer, PaymentSerializer,
    NotificationSerializer
)
from ai_engine.credit_scorer import CreditScorer


# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """User Registration"""
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """User Login"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    """Get User Profile"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update User Profile"""
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# Vehicle ViewSet
class VehicleViewSet(viewsets.ModelViewSet):
    """Vehicle CRUD Operations"""
    queryset = Vehicle.objects.filter(is_available=True)
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'brand', 'model', 'vehicle_type']
    ordering_fields = ['price', 'created_at']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def filter_by_type(self, request):
        vehicle_type = request.query_params.get('type')
        vehicles = self.queryset.filter(vehicle_type=vehicle_type)
        serializer = self.get_serializer(vehicles, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def filter_by_price(self, request):
        min_price = request.query_params.get('min_price', 0)
        max_price = request.query_params.get('max_price', 999999999)
        vehicles = self.queryset.filter(price__gte=min_price, price__lte=max_price)
        serializer = self.get_serializer(vehicles, many=True)
        return Response(serializer.data)


# Loan Application ViewSet
class LoanApplicationViewSet(viewsets.ModelViewSet):
    """Loan Application CRUD Operations"""
    serializer_class = LoanApplicationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'customer':
            return LoanApplication.objects.filter(customer=user)
        elif user.user_type in ['sales_rep', 'finance_manager', 'admin']:
            return LoanApplication.objects.all()
        return LoanApplication.objects.none()
    
    def perform_create(self, serializer):
        loan = serializer.save(customer=self.request.user, status='submitted', submitted_at=timezone.now())
        # Calculate EMI
        self.calculate_emi(loan)
        # Create notification
        Notification.objects.create(
            user=loan.customer,
            title='Loan Application Submitted',
            message=f'Your loan application {loan.application_number} has been submitted successfully.'
        )
    
    def calculate_emi(self, loan):
        """Calculate Monthly EMI"""
        P = float(loan.loan_amount)
        r = float(loan.interest_rate) / (12 * 100)  # Monthly interest rate
        n = loan.tenure_months
        
        # EMI Formula: P * r * (1+r)^n / ((1+r)^n - 1)
        emi = P * r * math.pow(1 + r, n) / (math.pow(1 + r, n) - 1)
        loan.monthly_emi = round(Decimal(emi), 2)
        loan.save()
        
        # Generate EMI Schedule
        self.generate_emi_schedule(loan)
    
    def generate_emi_schedule(self, loan):
        """Generate EMI Schedule"""
        remaining_balance = float(loan.loan_amount)
        monthly_rate = float(loan.interest_rate) / (12 * 100)
        emi_amount = float(loan.monthly_emi)
        
        for i in range(1, loan.tenure_months + 1):
            interest = remaining_balance * monthly_rate
            principal = emi_amount - interest
            remaining_balance -= principal
            
            due_date = timezone.now().date() + timedelta(days=30 * i)
            
            EMISchedule.objects.create(
                application=loan,
                emi_number=i,
                due_date=due_date,
                emi_amount=loan.monthly_emi,
                principal_amount=round(Decimal(principal), 2),
                interest_amount=round(Decimal(interest), 2),
                remaining_balance=max(round(Decimal(remaining_balance), 2), Decimal(0))
            )
    
    @action(detail=True, methods=['post'])
    def verify_documents(self, request, pk=None):
        """Verify Documents by Sales Rep"""
        loan = self.get_object()
        if request.user.user_type != 'sales_rep':
            return Response({'error': 'Only sales representatives can verify documents'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        loan.status = 'documents_verified'
        loan.verified_by = request.user
        loan.verified_at = timezone.now()
        loan.save()
        
        Notification.objects.create(
            user=loan.customer,
            title='Documents Verified',
            message=f'Your documents for application {loan.application_number} have been verified.'
        )
        
        return Response({'message': 'Documents verified successfully'})
    
    @action(detail=True, methods=['post'])
    def ai_score(self, request, pk=None):
        """Generate AI Credit Score"""
        loan = self.get_object()
        
        # Prepare data for AI scoring
        scorer = CreditScorer()
        score, risk_level, recommendation = scorer.score_application(loan)
        
        loan.credit_score = score
        loan.fraud_risk_level = risk_level
        loan.ai_recommendation = recommendation
        loan.save()
        
        return Response({
            'credit_score': score,
            'risk_level': risk_level,
            'recommendation': recommendation
        })
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve Loan Application"""
        loan = self.get_object()
        if request.user.user_type not in ['finance_manager', 'admin']:
            return Response({'error': 'Only finance managers can approve loans'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        loan.status = 'approved'
        loan.approved_by = request.user
        loan.approved_at = timezone.now()
        loan.save()
        
        Notification.objects.create(
            user=loan.customer,
            title='Loan Approved! 🎉',
            message=f'Congratulations! Your loan application {loan.application_number} has been approved.'
        )
        
        return Response({'message': 'Loan approved successfully'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject Loan Application"""
        loan = self.get_object()
        if request.user.user_type not in ['finance_manager', 'admin']:
            return Response({'error': 'Only finance managers can reject loans'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        reason = request.data.get('reason', '')
        loan.status = 'rejected'
        loan.rejection_reason = reason
        loan.save()
        
        Notification.objects.create(
            user=loan.customer,
            title='Loan Application Rejected',
            message=f'Your loan application {loan.application_number} has been rejected. Reason: {reason}'
        )
        
        return Response({'message': 'Loan rejected'})


# Document ViewSet
class DocumentViewSet(viewsets.ModelViewSet):
    """Document Management"""
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'customer':
            return Document.objects.filter(application__customer=user)
        return Document.objects.all()
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify Document"""
        document = self.get_object()
        if request.user.user_type not in ['sales_rep', 'admin']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        document.status = 'verified'
        document.verified_by = request.user
        document.verified_at = timezone.now()
        document.verification_notes = request.data.get('notes', '')
        document.save()
        
        return Response({'message': 'Document verified'})


# EMI Schedule ViewSet
class EMIScheduleViewSet(viewsets.ReadOnlyModelViewSet):
    """EMI Schedule View"""
    serializer_class = EMIScheduleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'customer':
            return EMISchedule.objects.filter(application__customer=user)
        return EMISchedule.objects.all()
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get Upcoming EMIs"""
        today = timezone.now().date()
        upcoming = self.get_queryset().filter(
            status='pending',
            due_date__gte=today
        ).order_by('due_date')[:5]
        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)


# Payment ViewSet
class PaymentViewSet(viewsets.ModelViewSet):
    """Payment Management"""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'customer':
            return Payment.objects.filter(emi_schedule__application__customer=user)
        return Payment.objects.all()


# Notification ViewSet
class NotificationViewSet(viewsets.ModelViewSet):
    """Notification Management"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'message': 'Marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        self.get_queryset().update(is_read=True)
        return Response({'message': 'All notifications marked as read'})


# Dashboard Statistics
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get Dashboard Statistics"""
    user = request.user
    
    if user.user_type == 'customer':
        stats = {
            'total_applications': LoanApplication.objects.filter(customer=user).count(),
            'approved_loans': LoanApplication.objects.filter(customer=user, status='approved').count(),
            'pending_applications': LoanApplication.objects.filter(
                customer=user, status__in=['submitted', 'under_review']
            ).count(),
            'total_emi_paid': Payment.objects.filter(
                emi_schedule__application__customer=user
            ).count(),
        }
    elif user.user_type == 'admin':
        stats = {
            'total_applications': LoanApplication.objects.count(),
            'pending_verifications': LoanApplication.objects.filter(status='submitted').count(),
            'approved_today': LoanApplication.objects.filter(
                approved_at__date=timezone.now().date()
            ).count(),
            'total_customers': User.objects.filter(user_type='customer').count(),
        }
    else:
        stats = {
            'pending_tasks': LoanApplication.objects.filter(
                Q(status='submitted') | Q(status='under_review')
            ).count()
        }
    
    return Response(stats)