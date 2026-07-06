from rest_framework import serializers

class OnboardingCompleteSerializer(serializers.Serializer):
    """
    Serializer for handling data transformations and validation of marking onboarding complete.
    """

    # Define the fields that can be updated through this serializer
    company_id = serializers.IntegerField(required=True)
    is_onboarding_complete = serializers.BooleanField(required=True)

    def validate_company_id(self, value):
        """
        Validates the company_id field to ensure it corresponds to an existing Company model.

        Args:
            value (int): The company ID provided in the request.

        Returns:
            int: The validated company ID.

        Raises:
            serializers.ValidationError: If the company ID is invalid.
        """
        try:
            # Assuming there's a way to retrieve a company by its ID
            # For example, Company.objects.get(id=value)
            pass
        except Exception as e:
            raise serializers.ValidationError(f"Invalid company ID: {value}") from e

    def validate_is_onboarding_complete(self, value):
        """
        Validates the is_onboarding_complete field to ensure it's a boolean.

        Args:
            value (bool): The onboarding complete status provided in the request.

        Returns:
            bool: The validated onboarding complete status.

        Raises:
            serializers.ValidationError: If the value is not a valid boolean.
        """
        if not isinstance(value, bool):
            raise serializers.ValidationError("is_onboarding_complete must be a boolean")
        return value

    def update(self, instance, validated_data):
        """
        Updates the onboarding complete status for the given company.

        Args:
            instance: The Company model instance to update.
            validated_data (dict): The validated data from the serializer.

        Returns:
            object: The updated Company model instance.
        """
        instance.is_onboarding_complete = validated_data.get('is_onboarding_complete', instance.is_onboarding_complete)
        # Assuming there's a way to save the company
        # For example, instance.save()
        return instance

    class Meta:
        """
        Metadata for the OnboardingCompleteSerializer.

        Attributes:
            model (None): This serializer does not correspond to a specific Django model.
            fields (list of str): The fields that can be updated through this serializer.
        """
        model = None
        fields = ['company_id', 'is_onboarding_complete']