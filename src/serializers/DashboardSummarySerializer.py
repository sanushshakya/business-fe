from rest_framework import serializers

class DashboardSummarySerializer(serializers.Serializer):
    """
    Serializer for handling data transformations and validation of aggregated summary data.

    This serializer is designed to be used with Django REST Framework (DRF) to ensure that the data fetched from a new API endpoint is properly validated and transformed before being passed to the front-end.
    """

    # Define fields that will be included in the serialized output
    total_sales = serializers.FloatField()
    average_order_value = serializers.FloatField()
    order_count = serializers.IntegerField()
    customer_count = serializers.IntegerField()

    def validate(self, data):
        """
        Custom validation method to ensure consistency and accuracy of the aggregated data.

        This method can be extended to include more complex validation logic as required.
        """

        # Example validation: Ensure that total_sales is not negative
        if data['total_sales'] < 0:
            raise serializers.ValidationError("Total sales cannot be negative.")

        return data

    def to_representation(self, instance):
        """
        Custom method to transform the instance data into a dictionary suitable for serialization.

        This method can be extended to include additional transformations as required.
        """

        # Example transformation: Format total_sales to two decimal places
        instance['total_sales'] = round(instance['total_sales'], 2)

        return super().to_representation(instance)