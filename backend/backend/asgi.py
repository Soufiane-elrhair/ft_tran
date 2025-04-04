import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from django.contrib.staticfiles.handlers import ASGIStaticFilesHandler

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.urls import path
from MyAuth.middleware import JWTAuthMiddleware
from MyAuth.consumers import OnlineStatusConsumer,NotificationConsumer

application = ASGIStaticFilesHandler(get_asgi_application())

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        JWTAuthMiddleware(
            URLRouter([
                path("ws/online-status/", OnlineStatusConsumer.as_asgi()),
                path("ws/notifications/", NotificationConsumer.as_asgi()),
            ])
        )
    ),
})