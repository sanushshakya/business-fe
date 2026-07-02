import pytest
from src.actions.syncActions import fetch_user_suppliers
from src.models.SupplierModel import SupplierModel
from src.services.authService import get_auth_token


def test_fetch_user_suppliers():
    # Mock the authentication token retrieval to avoid actual network requests
    def mock_get_auth_token():
        return "mocked-auth-token"

    get_auth_token.side_effect = mock_get_auth_token

    # Call the function under test
    suppliers = fetch_user_suppliers()

    # Assert that the returned data is not empty and has the expected structure
    assert len(suppliers) > 0
    for supplier in suppliers:
        assert isinstance(supplier, SupplierModel)
        assert "id" in supplier
        assert "name" in supplier
        assert "email" in supplier


def test_fetch_user_suppliers_auth_failure(mocker):
    # Mock the authentication token retrieval to simulate an auth failure
    def mock_get_auth_token():
        return None

    get_auth_token.side_effect = mock_get_auth_token

    # Call the function under test with mocking the axios request to simulate a 401 response
    with pytest.raises(Exception) as e:
        fetch_user_suppliers()

    assert str(e.value) == "Authentication failed"