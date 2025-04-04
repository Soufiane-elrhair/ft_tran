# api/views.py
import os
from django.conf import settings
from django.http import HttpResponse, HttpResponseNotFound
from django.views import View

class GameView(View):
    """
    View to serve the game client with modified static paths
    """
    
    STATIC_PATH_REPLACEMENTS = {
        '/static/css/': '/game2/static/css/',
        '/static/js/': '/game2/static/js/'
    }

    def get(self, request):
        """
        Serve the game's index.html with modified static paths
        """
        try:
            # Construct file path
            file_path = os.path.join(
                settings.BASE_DIR,
                'backend',
                'game',
                'static',
                'index.html'
            )

            # Read and modify content
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Replace static paths
            for old_path, new_path in self.STATIC_PATH_REPLACEMENTS.items():
                content = content.replace(old_path, new_path)

            return HttpResponse(content, content_type='text/html')

        except FileNotFoundError:
            return HttpResponseNotFound("Game client not found")
        except Exception as e:
            return HttpResponse(
                f"Error loading game: {str(e)}", 
                status=500
            )
# Create your views here.
from django.views import View
from django.shortcuts import render

class PongGameView(View):
    def get(self, request):
        return render(request, 'pong/index.html')  # Your game HTML