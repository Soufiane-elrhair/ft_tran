from django.shortcuts import render
from django.http import Http404

# Create your views here.
from rest_framework.pagination import PageNumberPagination
from friendship.models import FriendshipRequest
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from friendship.models import Friend ,FriendshipRequest,Block
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth import get_user_model
from rest_framework import status
from django.shortcuts import get_object_or_404


User = get_user_model()  

@receiver(post_save, sender=FriendshipRequest)
def send_friend_request_notification(sender, instance, created, **kwargs):
    if created:   
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"notifications_{instance.to_user.id}",  
            {
                'type': 'send_notification',  
                'from_user_id': instance.from_user.id,  
                'from_user_username': instance.from_user.username,
                'message': f"You have a new friend request from {instance.from_user.username}.",  # Notification message
            }
        )


class FriendListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        try:
            friendships = Friend.objects.filter(
                Q(from_user=user) | Q(to_user=user)
            ).select_related('from_user', 'to_user')

            friend_users = {
                (f.to_user if f.from_user == user else f.from_user)
                for f in friendships
            }

            friend_data = [
                {
                    "id": friend.id,
                    "username": friend.username,
                    "full_name": f"{friend.first_name} {friend.last_name}".strip(),
                }
                for friend in friend_users
            ]

            return Response({"friends": friend_data}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": "Failed to fetch friends."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SendFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from_user = request.user
        to_user_id = request.data.get('to_user_id')

        if not to_user_id:
            return Response(
                {'error': 'to_user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            to_user = User.objects.get(id=to_user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "to_user_id does not exist!"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if Friend.objects.are_friends(from_user, to_user):
            return Response(
                {"error": "You are already friends with this user."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if FriendshipRequest.objects.filter(from_user=from_user, to_user=to_user, rejected__isnull=True).exists() or \
           FriendshipRequest.objects.filter(from_user=to_user, to_user=from_user, rejected__isnull=True).exists():
            return Response(
                {"error": "A friend request already exists."},
                status=status.HTTP_409_CONFLICT
            )

        if from_user == to_user:
            return Response(
                {"error": "You cannot send a friend request to yourself."},
                status=status.HTTP_400_BAD_REQUEST
            )

        friendship_request = FriendshipRequest.objects.create(from_user=from_user, to_user=to_user)
        friendship_request.save()

        return Response(
            {"message": "The invitation was sent successfully."},
            status=status.HTTP_201_CREATED
        )



class SentFriendRequestListView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination

    def get(self, request):
        try:
            user = request.user
            sent_requests = FriendshipRequest.objects.filter(from_user=user)

            paginator = self.pagination_class()
            paginated_requests = paginator.paginate_queryset(sent_requests, request)

            if not paginated_requests:
                return Response(
                    {"message": "No sent friend requests found."},
                    status=status.HTTP_200_OK
                )

            requests_data = [
                {
                    "friend_request_id": req.id,
                    "to_user_id": req.to_user.id,
                    "username": req.to_user.username,
                    "first_name": req.to_user.first_name,
                    "last_name": req.to_user.last_name,
                    "created": req.created.isoformat(),
                }
                for req in paginated_requests
            ]

            return paginator.get_paginated_response(requests_data)
        except Exception as e:
            return Response(
                {"error": f"An error occurred while fetching sent friend requests: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ReceiveFriendRequestListView(APIView):
    permission_classes = [IsAuthenticated]
    pagination_class = PageNumberPagination

    def get(self, request):
        try:
            user = request.user
            print(user.id)
            incoming_requests = FriendshipRequest.objects.filter(to_user_id=user.id)
            print(list(incoming_requests))
            paginator = self.pagination_class()
            print("paginator: ",paginator)
            paginated_requests = paginator.paginate_queryset(incoming_requests, request)

            print(f"Paginated Requests: {paginated_requests}")
            if not paginated_requests:
                return Response(
                    {"message": "No incoming friend requests found."},
                    status=status.HTTP_200_OK
                )

            print("incoming request" ,incoming_requests)
            requests_data = []
            requests_data = [
                {
                    "friend request id":req.id,
                    "from_user_id": req.from_user_id,
                    "username": req.from_user.username,
                    "first name": req.from_user.first_name,
                    "last name": req.from_user.last_name,
                    "created": req.created.isoformat(),
                }
                for req in incoming_requests
            ]

            return paginator.get_paginated_response(requests_data)
        except Exception as e:
            return Response(
                {"error": "An error occurred while fetching friend requests."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

#list sent request friend 
class CancelFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, request_id):
        try:
            friendship_request = FriendshipRequest.objects.get(id=request_id, from_user=request.user)
            friendship_request.delete()

            return Response(
                {"message": "Friend request canceled successfully."},
                status=status.HTTP_200_OK
            )
        except FriendshipRequest.DoesNotExist:
            return Response(
                {"error": "Friend request not found or you do not have permission to cancel it."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"An error occurred while canceling the friend request: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RemoveFriend(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, friend_id):
        try:
            try:
                friend_id = int(friend_id)
                print(friend_id)
            except ValueError:
                return Response(
                    {"error": "Invalid friend ID. Please provide a valid integer."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                print("i ma here 1")
                other_user = get_object_or_404(User, id=friend_id)
                print("i ma here 2 ", other_user.username)
            except Http404:
                    return Response(
                        {"error": "User not found."},
                        status=status.HTTP_404_NOT_FOUND
                    )
            if Friend.objects.are_friends(request.user,other_user) == True or Friend.objects.are_friends(other_user,request.user):
                Friend.objects.remove_friend(request.user, other_user)
                return Response(
                {"message": "Friend removed successfully."},
                status=status.HTTP_200_OK
            )
            else:
                print("i ma here")
                return Response(
                    {"error": "You are not friends with this user."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {"error 1": "An unexpected error occurred while removing the friend."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class RespondFriendRequestView(APIView):

    permission_classes = [IsAuthenticated]
    def post(self, request):
        try:
            requestID = request.data.get('requestID')
            print("request ID" ,requestID )
            action = request.data.get('action')
            print("action " ,action)
            if not requestID or not action:
                return Response({"error": "requestID or action is required"}, status=status.HTTP_400_BAD_REQUEST)
            if action not in ["accept", "reject"]:
                return Response({"error": "Invalid action. Must be 'accept' or 'reject'"}, status=status.HTTP_400_BAD_REQUEST)
            try:
                friendRequest = FriendshipRequest.objects.get(pk=requestID)
                print("friendRequest ",friendRequest)
            except FriendshipRequest.DoesNotExist:
                return Response({"error": "Friend request not found"}, status=status.HTTP_404_NOT_FOUND)
            if friendRequest.to_user != request.user:
                return Response({"error": "You are not authorized to accept this request"}, status=status.HTTP_403_FORBIDDEN)
            if action == "accept":
                friend1 = Friend.objects.get_or_create(
                        from_user_id=min(friendRequest.from_user_id, friendRequest.to_user_id),
                        to_user_id=max(friendRequest.from_user_id, friendRequest.to_user_id)
                    )

                friendRequest.delete()
                print("i m here")
                print("friend1", friend1)
                return Response({"message": "Friend request accepted"}, status=status.HTTP_200_OK)
            elif action == "reject":
                friendRequest.delete()
                return Response({"message": "Friend request rejected"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error: ": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    
from django.db.models import Q

class FriendStatus(APIView):
    def get(self,request):
        id = request.data.get("id")
        user = request.user
        check_user = User.objects.all(id = id)
        if not check_user and not user:
            return Response({"error:": "User not found"},status = 400)
        status = Friend.objects.are_friends(user, check_user)
        print(status)
        if status ==  True:
            return Response({"status:":"friend"},status = 200)
        status =   FriendshipRequest.objects.filter(
        (Q(from_user=user, to_user=check_user) | Q(from_user=check_user, to_user=user))
    ).exists()
        if status ==  True:
            return Response({"status:":"friend request is exist"},status = 200)
        status =  Block.objects.filter(
        Q(blocker=user, blocked=check_user) | Q(blocker=check_user, blocked=user)
    ).exists()
        if status ==  True:
            return Response({"status:":"Block"},status = 200)
        return Response({"status:":"not friend"},status = 200)


class SearchUser(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search_query = request.query_params.get("search", "").strip()
        if not search_query:
            return Response(
                {"error": "Search query is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        users = User.objects.filter(
            Q(username__icontains=search_query) |
            Q(first_name__icontains=search_query) |
            Q(last_name__icontains=search_query)
        ).values("id", "username", "first_name", "last_name")

        if not users.exists():
            return Response(
                {"error": "No users found."},
                status=status.HTTP_404_NOT_FOUND
            )
        paginator = PageNumberPagination()
        paginator.page_size = 10 
        paginated_users = paginator.paginate_queryset(users, request)
        return paginator.get_paginated_response({
            "results": list(paginated_users),
            "pagination": {
                "current_page": paginator.page.number,
                "total_pages": paginator.page.paginator.num_pages,
                "total_results": paginator.page.paginator.count
            }
        })