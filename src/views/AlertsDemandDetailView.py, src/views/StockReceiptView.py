# src/views/AlertsDemandDetailView.py

import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import AlertsDemand
from .serializers import AlertsDemandSerializer

logger = logging.getLogger(__name__)

class AlertsDemandDetailView(APIView):
    """
    Class-based view to handle GET, PUT, and DELETE requests for a specific Alerts Demand.
    """

    def get_object(self, pk):
        try:
            return AlertsDemand.objects.get(pk=pk)
        except AlertsDemand.DoesNotExist:
            logger.error(f"AlertsDemand with id {pk} does not exist")
            raise

    def get(self, request, pk, format=None):
        """
        Retrieve a specific Alerts Demand.
        """
        alerts_demand = self.get_object(pk)
        serializer = AlertsDemandSerializer(alerts_demand)
        return Response(serializer.data)

    def put(self, request, pk, format=None):
        """
        Update a specific Alerts Demand.
        """
        alerts_demand = self.get_object(pk)
        serializer = AlertsDemandSerializer(alerts_demand, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        else:
            logger.error(f"Invalid data provided for updating AlertsDemand with id {pk}: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk, format=None):
        """
        Delete a specific Alerts Demand.
        """
        alerts_demand = self.get_object(pk)
        alerts_demand.delete()
        logger.info(f"AlertsDemand with id {pk} deleted successfully")
        return Response(status=status.HTTP_204_NO_CONTENT)


# src/views/StockReceiptView.py

import logging
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import StockReceipt
from .serializers import StockReceiptSerializer

logger = logging.getLogger(__name__)

class StockReceiptView(APIView):
    """
    Class-based view to handle GET, POST requests for Stock Receipts.
    """

    def get(self, request, format=None):
        """
        List all Stock Receipts.
        """
        receipts = StockReceipt.objects.all()
        serializer = StockReceiptSerializer(receipts, many=True)
        return Response(serializer.data)

    def post(self, request, format=None):
        """
        Create a new Stock Receipt.
        """
        serializer = StockReceiptSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Stock Receipt created successfully: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            logger.error(f"Invalid data provided for creating a new Stock Receipt: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
