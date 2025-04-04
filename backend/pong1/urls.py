from django.urls import path
from .views import PongGameView

urlpatterns = [
    path('', PongGameView.as_view(), name='pong-game'),
]