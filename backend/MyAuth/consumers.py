import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from channels.layers import get_channel_layer

from friendship.models import Friend ,FriendshipRequest,Block

class OnlineStatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """When a user connects, mark them as online."""

        self.user = self.scope["user"]
        if self.user.is_authenticated:
            print("im here 1")
            await self.set_user_online(self.user.id) 
            await self.channel_layer.group_add(f"user_{self.user.id}", self.channel_name)
            await self.notify_friends_online_status(self.user.id, "online")

        await self.accept()
        await self.send_friends_status()

    async def disconnect(self, close_code):
        """When a user disconnects, mark them as offline."""
        if self.user.is_authenticated:
            await self.set_user_offline(self.user.id)
            await self.channel_layer.group_discard(f"user_{self.user.id}", self.channel_name)
            await self.notify_friends_online_status(self.user.id, "offline")

    async def notify_friends_online_status(self, user_id, status):
        """Notify friends about the user's online status."""
        print(f"Sending {status} status for user {user_id} to friends.")
        friends = await self.get_friends(user_id)
        print(friends)
        for friend in friends:
            print("notify friend",friend.id)
            await self.channel_layer.group_send(
            f"user_{friend.id}",
                {"type": "user_status", "user_id": user_id, "status": status}
            )
    async def send_friends_status(self):
        friends = await self.get_friends(self.user)
        for friend in friends:
            is_online =  self.is_user_online(friend)
            await self.send(text_data=json.dumps({
                'type': 'friend_status',
                'friend.id': friend.id,
                'username': friend.username,
                'is_online': is_online,
            }))
    def is_user_online(self, user):
        return user.is_online

    async def user_status(self, event):
        """Send the online/offline status update to the frontend."""
        await self.send(json.dumps({
            "type": "status_update",
            "user_id": event["user_id"],
            "status": event["status"]
        }))

    
    @database_sync_to_async
    def set_user_online(self, user_id):
        """Update online status in the database."""
        User = get_user_model() 
        user = User.objects.get(id=user_id)
        user.is_online = True
        user.save()

    @database_sync_to_async
    def set_user_offline(self, user_id):
        """Update offline status in the database."""
        User = get_user_model() 
        user = User.objects.get(id=user_id)
        user.is_online = False
        user.save()

    @database_sync_to_async
    def get_friends(self, user):
        User = get_user_model() 
        friends_from = Friend.objects.filter(from_user=user).values_list('to_user', flat=True)
        friends_to = Friend.objects.filter(to_user=user).values_list('from_user', flat=True)
        
        friend_ids = set(friends_from) | set(friends_to)        
        return list(User.objects.filter(id__in=friend_ids))

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        user_id = text_data_json["user_id"]
        status = text_data_json["status"]
        print(f"Received status: {status} for user {user_id}")
        await self.send(text_data=json.dumps({
            "user_id": user_id,
            "status": status,
        }))


class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_anonymous:
            await self.close()  
        else:
            await self.channel_layer.group_add(
                f"notifications_{self.user.id}",   
                self.channel_name  
            )
            await self.accept()  

    async def disconnect(self, close_code):
        if hasattr(self, 'user') and not self.user.is_anonymous:
            await self.channel_layer.group_discard(
                f"notifications_{self.user.id}",
                self.channel_name
            )

    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'friend_request', 
            'from_user_id': event['from_user_id'],   
            'from_user_username': event['from_user_username'], 
            'message': event['message'],   
        }))