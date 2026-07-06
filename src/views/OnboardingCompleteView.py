# src/views/OnboardingCompleteView.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class OnboardingCompleteView(APIView):
    """
    View to handle the PATCH request for marking onboarding complete.
    
    This view is responsible for processing the PATCH request to mark the onboarding of a company as complete.
    It updates the Company model accordingly and returns a success response if the operation is successful.
    """

    def patch(self, request, *args, **kwargs):
        """
        Handle the PATCH request for marking onboarding complete.
        
        Args:
            request (Request): The incoming HTTP request object.
        
        Returns:
            Response: The HTTP response object with the result of the operation.
        """
        # Retrieve the company ID from the URL parameters
        company_id = kwargs.get('company_id')

        if not company_id:
            return Response({"error": "Company ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        # Logic to mark onboarding complete for the specified company
        try:
            # Simulate marking onboarding complete (replace with actual database update logic)
            company = Company.objects.get(id=company_id)
            company.onboarding_complete = True
            company.save()
        except Company.DoesNotExist:
            return Response({"error": "Company not found"}, status=status.HTTP_404_NOT_FOUND)

        # Return success response
        return Response({"message": "Onboarding complete marked successfully"}, status=status.HTTP_200_OK)