// tests/test_api_endpoints.py

import pytest
from django.urls import reverse

pytestmark = pytest.mark.django_db

# Test case for GET /alerts-demand/
def test_get_alerts_demand(client):
    """
    Ensure the GET request to /alerts-demand/ returns a list of alerts demand data.
    """
    url = reverse('alerts-demand-list')
    response = client.get(url)
    assert response.status_code == 200
    assert len(response.data) > 0

# Test case for GET /alerts-demand/<int:pk>/
def test_get_alerts_demand_detail(client):
    """
    Ensure the GET request to /alerts-demand/<int:pk>/ returns a single alerts demand detail.
    """
    alert = AlertsDemand.objects.create(title="Test Alert", description="This is a test alert")
    url = reverse('alerts-demand-detail', kwargs={'pk': alert.id})
    response = client.get(url)
    assert response.status_code == 200
    assert response.data['title'] == "Test Alert"

# Test case for POST /stock-receipts/
def test_post_stock_receipt(client):
    """
    Ensure the POST request to /stock-receipts/ creates a new stock receipt.
    """
    url = reverse('stock-receipts')
    payload = {
        'product_id': 1,
        'quantity': 10
    }
    response = client.post(url, payload)
    assert response.status_code == 201
    assert response.data['product_id'] == 1

# Test case for GET /stock-receipts/
def test_get_stock_receipts(client):
    """
    Ensure the GET request to /stock-receipts/ returns a list of stock receipts.
    """
    StockReceipt.objects.create(product_id=1, quantity=10)
    url = reverse('stock-receipts')
    response = client.get(url)
    assert response.status_code == 200
    assert len(response.data) > 0

# Test case for PATCH /alerts-demand/<int:pk>/
def test_patch_alerts_demand(client):
    """
    Ensure the PATCH request to /alerts-demand/<int:pk>/ updates an existing alerts demand.
    """
    alert = AlertsDemand.objects.create(title="Test Alert", description="This is a test alert")
    url = reverse('alerts-demand-detail', kwargs={'pk': alert.id})
    payload = {
        'description': "Updated Test Alert"
    }
    response = client.patch(url, payload)
    assert response.status_code == 200
    assert response.data['description'] == "Updated Test Alert"

# Test case for DELETE /alerts-demand/<int:pk>/
def test_delete_alerts_demand(client):
    """
    Ensure the DELETE request to /alerts-demand/<int:pk>/ deletes an existing alerts demand.
    """
    alert = AlertsDemand.objects.create(title="Test Alert", description="This is a test alert")
    url = reverse('alerts-demand-detail', kwargs={'pk': alert.id})
    response = client.delete(url)
    assert response.status_code == 204
```

This file contains test cases for the API endpoints defined in `src/urls.py`. Each test case uses `pytest` and Django's testing framework to ensure that the endpoints are functioning correctly. The tests cover GET, POST, PATCH, and DELETE requests for the specified endpoints.