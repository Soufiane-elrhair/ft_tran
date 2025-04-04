from django.urls import path
from .views import FriendListView ,SendFriendRequestView, \
        ReceiveFriendRequestListView,SentFriendRequestListView,RespondFriendRequestView ,\
        CancelFriendRequestView,RemoveFriend ,SearchUser

urlpatterns =[
    path('friend/friendList/', FriendListView.as_view(),name="friends"),
    path('friend-requests/invite/', SendFriendRequestView.as_view(),name="friends"),
    path('friend-requests/receive/', ReceiveFriendRequestListView.as_view(),name="friendRequestReceive"),
    path('friend-requests/sent/', SentFriendRequestListView.as_view(),name="friendRequestSent"),
    path('friend-requests/respond/', RespondFriendRequestView.as_view(),name="Respond"),
    path("friend-requests/cancelRequest/<int:request_id>/", CancelFriendRequestView.as_view(), name="cancel_friend_request"),
    path("friend/remove/<int:friend_id>/", RemoveFriend.as_view(), name="remove_friend_request"),
    path("search/", SearchUser.as_view(), name="search_user"),
    ]