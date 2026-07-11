import pytest
from src.models.Till import Till
from src.actions.AddTillAction import add_till_action

def test_add_till_action():
    """
    Test the add_till_action function to ensure it correctly adds a new till.
    
    This test checks that the action creates a new Till object with the correct attributes.
    """
    # Arrange
    new_till_data = {
        "name": "Test Till",
        "location": "Test Location"
    }
    
    # Act
    result = add_till_action(new_till_data)
    
    # Assert
    assert isinstance(result, Till)
    assert result.name == new_till_data["name"]
    assert result.location == new_till_data["location"]

def test_add_till_action_with_missing_data():
    """
    Test the add_till_action function with missing data to ensure it handles errors.
    
    This test checks that the action raises a ValueError when required data is missing.
    """
    # Arrange
    incomplete_data = {
        "name": "Test Till"
    }
    
    # Act & Assert
    with pytest.raises(ValueError):
        add_till_action(incomplete_data)

def test_add_till_action_with_invalid_location():
    """
    Test the add_till_action function with an invalid location to ensure it handles errors.
    
    This test checks that the action raises a ValueError when an invalid location is provided.
    """
    # Arrange
    invalid_location_data = {
        "name": "Test Till",
        "location": ""
    }
    
    # Act & Assert
    with pytest.raises(ValueError):
        add_till_action(invalid_location_data)
```

This file contains unit tests for the `add_till_action` function in a hypothetical system that manages tills. The tests cover normal operation, handling of missing data, and handling of invalid data. Each test includes a docstring explaining the purpose and expected behavior, ensuring clarity and maintainability.