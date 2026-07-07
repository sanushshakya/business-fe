from rest_framework import serializers

class VerifyEmailSerializer(serializers.Serializer):
    """
    Serializer for handling the validation logic for the email verification request.
    
    Fields:
        token (str): JWT token received from the frontend to verify the user's email.
    """

    token = serializers.CharField(
        write_only=True,
        help_text="JWT token used for verifying the user's email."
    )

    def validate_token(self, value):
        """
        Validates the JWT token and sets the is_verified field of the associated user to True.
        
        Args:
            value (str): The JWT token received from the frontend.
            
        Returns:
            str: The original token if valid.
            
        Raises:
            serializers.ValidationError: If the token is invalid or expired.
        """
        try:
            # Logic to decode and validate the JWT token
            payload = verify_jwt_token(value)
            user = User.objects.get(email=payload['email'])
            user.is_verified = True
            user.save()
        except (JWTError, User.DoesNotExist):
            raise serializers.ValidationError("Invalid or expired token.")
        
        return value