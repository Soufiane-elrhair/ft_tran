from urllib.parse import parse_qs
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
import asyncio

User = get_user_model()

class JWTAuthMiddleware(BaseMiddleware):
    """Custom middleware for JWT authentication in Django Channels."""

    def __init__(self, inner):
        super().__init__(inner)

    async def __call__(self, scope, receive, send):
        query_string = parse_qs(scope["query_string"].decode())
        token = query_string.get("token", [None])[0]

        scope["user"] = AnonymousUser()

        if token:
            try:
                access_token = AccessToken(token)
                user_id = access_token["user_id"]
                user = await asyncio.to_thread(User.objects.get, id=user_id)
                scope["user"] = user
            except User.DoesNotExist:
                print("User not found")
            except Exception as e:
                print(f"JWT Authentication failed: {e}")

        return await super().__call__(scope, receive, send)
