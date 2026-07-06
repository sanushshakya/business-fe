from django.urls import path
from .views import AlertsDemandDetailView, AlertsDemandListView, StockReceiptView, OnboardingCompleteView

urlpatterns = [
    # Define URL patterns for different views
    path('alerts-demand/<int:pk>/', AlertsDemandDetailView.as_view(), name='alerts-demand-detail'),
    path('alerts-demand/', AlertsDemandListView.as_view(), name='alerts-demand-list'),
    path('stock-receipts/', StockReceiptView.as_view(), name='stock-receipts'),
    path('api/tenants/company/onboarding-complete/', OnboardingCompleteView.as_view(), name='onboarding-complete'),  # New route for Waste Reduction Report
]