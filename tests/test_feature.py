import pytest
from src.actions.syncActions import fetch_user_suppliers
from src.models.SupplierModel import SupplierModel
from src.services.authService import get_auth_token


def test_fetch_user_suppliers(mocker):
    """
    Test the fetch_user_suppliers function to ensure it correctly retrieves user suppliers.

    This test uses a mock to simulate the authentication token retrieval process.
    """

    # Mock the authentication token retrieval to avoid actual network requests
    mock_get_auth_token = mocker.patch.object(get_auth_token, 'side_effect', lambda: "mocked-auth-token")

    # Call the fetch_user_suppliers function
    suppliers = fetch_user_suppliers()

    # Verify that the authentication token was retrieved correctly
    assert mock_get_auth_token.called_once

    # Verify that the fetched suppliers are instances of SupplierModel
    for supplier in suppliers:
        assert isinstance(supplier, SupplierModel)

    # Additional assertions can be added to test other aspects of the function's behavior