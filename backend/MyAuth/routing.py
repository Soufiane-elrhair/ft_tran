from django.urls import re_path
from .consumers import OnlineStatusConsumer,NotificationConsumer

websocket_urlpatterns = [
    re_path("ws/online-status/", OnlineStatusConsumer.as_asgi()),
    re_path("ws/notifications/", NotificationConsumer.as_asgi()),
]
