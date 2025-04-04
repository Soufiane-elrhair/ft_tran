import json
from channels.generic.websocket import AsyncWebsocketConsumer

class OnlineStatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if self.scope["user"].is_authenticated:
            await self.accept()
            await self.send(json.dumps({"message": "Connected"}))
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'user') and not self.user.is_anonymous:
            # Remove the user from their personal group
            await self.channel_layer.group_discard(
                f"notifications_{self.user.id}",
                self.channel_name
            )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get("message", "")

        await self.send(text_data=json.dumps({
            "message": f"Echo: {message}"
        }))
