# tests/test_verify_email.py

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

@pytest.mark.django_db
def test_verify_email_success(client: APIClient):
    """
    Test the POST /api/auth/verify-email/ endpoint for a successful token validation and email verification.
    """

    # Create a valid token (mocked or generated as per your application's logic)
    valid_token = "valid_token_here"

    # Prepare the payload with the valid token
    payload = {
        'token': valid_token
    }

    # Make a POST request to the verify-email endpoint
    response = client.post(reverse('verify-email'), data=payload, format='json')

    # Assert that the response status code is 200 OK
    assert response.status_code == 200

    # Assert that the response contains expected data (e.g., is_verified=True)
    assert response.data['is_verified'] is True


@pytest.mark.django_db
def test_verify_email_invalid_token(client: APIClient):
    """
    Test the POST /api/auth/verify-email/ endpoint for an invalid token.
    """

    # Create an invalid token
    invalid_token = "invalid_token_here"

    # Prepare the payload with the invalid token
    payload = {
        'token': invalid_token
    }

    # Make a POST request to the verify-email endpoint
    response = client.post(reverse('verify-email'), data=payload, format='json')

    # Assert that the response status code is 400 Bad Request
    assert response.status_code == 400

    # Assert that the response contains an error message indicating invalid token
    assert 'Invalid token' in str(response.data)


@pytest.mark.django_db
def test_verify_email_missing_token(client: APIClient):
    """
    Test the POST /api/auth/verify-email/ endpoint for a request missing the token.
    """

    # Prepare an empty payload without the token
    payload = {}

    # Make a POST request to the verify-email endpoint
    response = client.post(reverse('verify-email'), data=payload, format='json')

    # Assert that the response status code is 400 Bad Request
    assert response.status_code == 400

    # Assert that the response contains an error message indicating missing token
    assert 'Token is required' in str(response.data)