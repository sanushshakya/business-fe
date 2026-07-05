import pytest
from src.models import CompanyBranch, Product
from src.services import syncService


def test_company_branch_creation():
    """
    Test case to create a new CompanyBranch instance and ensure it is saved correctly.
    """

    # Arrange
    name = "Test Branch"
    location = "Test Location"

    # Act
    company_branch = syncService.create_company_branch(name, location)
    db_company_branch = syncService.get_company_branch_by_id(company_branch.id)

    # Assert
    assert db_company_branch is not None
    assert db_company_branch.name == name
    assert db_company_branch.location == location


def test_product_creation():
    """
    Test case to create a new Product instance and ensure it is saved correctly.
    """

    # Arrange
    company_branch_id = 1  # Assuming there's at least one CompanyBranch created in the database for testing
    name = "Test Product"
    price = 9.99

    # Act
    product = syncService.create_product(company_branch_id, name, price)
    db_product = syncService.get_product_by_id(product.id)

    # Assert
    assert db_product is not None
    assert db_product.name == name
    assert db_product.price == price


def test_get_company_branch():
    """
    Test case to retrieve a CompanyBranch by its ID and ensure the data is correct.
    """

    # Arrange
    company_branch_id = 1  # Assuming there's at least one CompanyBranch created in the database for testing

    # Act
    company_branch = syncService.get_company_branch_by_id(company_branch_id)

    # Assert
    assert company_branch is not None
    assert company_branch.id == company_branch_id


def test_get_product():
    """
    Test case to retrieve a Product by its ID and ensure the data is correct.
    """

    # Arrange
    product_id = 1  # Assuming there's at least one Product created in the database for testing

    # Act
    product = syncService.get_product_by_id(product_id)

    # Assert
    assert product is not None
    assert product.id == product_id