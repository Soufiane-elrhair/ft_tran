from django.urls import path
from .consumers import OnlineStatusConsumer

websocket_urlpatterns = [
    path("ws/online-status/", OnlineStatusConsumer.as_asgi()),
]
