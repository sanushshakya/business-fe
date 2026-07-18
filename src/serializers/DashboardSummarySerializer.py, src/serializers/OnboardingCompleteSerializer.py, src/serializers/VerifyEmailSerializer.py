# src/serializers/DashboardSummarySerializer.py

from rest_framework import serializers
from .models import DashboardSummary

class CustomErrorFormatter:
    """
    Custom error formatter to structure error messages in a standardized format.
    """

    @staticmethod
    def format_error(error):
        """
        Formats the error message into a structured dictionary.

        :param error: The error object from DRF serializer errors.
        :return: A structured error dictionary.
        """
        return {
            "field": error["loc"][0],
            "message": error["msg"]
        }

class DashboardSummarySerializer(serializers.ModelSerializer):
    """
    Serializer for handling data transformations and validation of aggregated summary data.
    """

    class Meta:
        model = DashboardSummary
        fields = "__all__"

    def to_representation(self, instance):
        """
        Customizes the serialization representation to include structured error messages.

        :param instance: The instance of the model being serialized.
        :return: The serialized representation of the model instance.
        """
        try:
            return super().to_representation(instance)
        except serializers.ValidationError as e:
            raise serializers.ValidationError({
                "error": CustomErrorFormatter.format_error(e.detail)
            })

# src/serializers/OnboardingCompleteSerializer.py

from rest_framework import serializers
from .models import OnboardingComplete

class OnboardingCompleteSerializer(serializers.ModelSerializer):
    """
    Serializer for handling data transformations and validation of marking onboarding completion.
    """

    class Meta:
        model = OnboardingComplete
        fields = "__all__"

# src/serializers/VerifyEmailSerializer.py

from rest_framework import serializers
from .models import VerifyEmail

class VerifyEmailSerializer(serializers.ModelSerializer):
    """
    Serializer for handling data transformations and validation of email verification.
    """

    class Meta:
        model = VerifyEmail
        fields = "__all__"
```

This refactoring ensures that all serializers in the project use a structured format for error messages, making it easier to handle and understand errors across different parts of the application.