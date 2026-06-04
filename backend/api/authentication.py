from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework import exceptions

class SafeJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        auth_result = super().authenticate(request)
        if auth_result is not None:
            user, token = auth_result
            if user.is_suspended:
                raise exceptions.AuthenticationFailed("This account has been suspended by the administrator.")
        return auth_result
