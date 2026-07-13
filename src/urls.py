from django.urls import path
from .views import AlertsDemandDetailView, AlertsDemandListView, StockReceiptView, OnboardingCompleteView, VerifyEmailView, InviteUserFormView

urlpatterns = [
    # Define URL patterns for different views
    path('alerts-demand/<int:pk>/', AlertsDemandDetailView.as_view(), name='alerts-demand-detail'),
    path('alerts-demand/', AlertsDemandListView.as_view(), name='alerts-demand-list'),
    path('stock-receipts/', StockReceiptView.as_view(), name='stock-receipts'),
    path('api/tenants/company/onboarding-complete/', OnboardingCompleteView.as_view(), name='onboarding-complete'),  # New route for Waste Reduction Report
    path('api/auth/verify-email/', VerifyEmailView.as_view(), name='verify-email'),  # New route for email verification
    path('invite-user/', InviteUserFormView.as_view(), name='invite-user-form'),  # New route to handle the Invite User form submission
]