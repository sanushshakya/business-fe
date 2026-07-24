from django.views.generic import ListView, DetailView
from rest_framework.permissions import IsAuthenticated
from .models import StockReceipt
from .serializers import StockReceiptSerializer

class StockReceiptListView(ListView):
    """
    View to list all stock receipts.

    This view is responsible for displaying a paginated list of stock receipts.
    Only authenticated users can access this view.
    """
    model = StockReceipt
    serializer_class = StockReceiptSerializer
    permission_classes = [IsAuthenticated]
    paginate_by = 25

class StockReceiptDetailView(DetailView):
    """
    View to retrieve details of a single stock receipt.

    This view allows users to retrieve detailed information about a specific stock receipt.
    Only authenticated users can access this view.
    """
    model = StockReceipt
    serializer_class = StockReceiptSerializer
    permission_classes = [IsAuthenticated]
