from django.urls import path
from django.contrib.auth import views as auth_views

from .views import RegisterUserView,Enable2FAView ,\
        VerifyUserEmail,LoginUserView, VerifyView, \
         _42Redirect , CollectAuthorizeCode, \
        DeleteUser,Disable2FAView,PasswordResetRequestView,PasswordResetConfirmView,LogoutUserView

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.views import TokenBlacklistView
from rest_framework_simplejwt.views import TokenRefreshView



urlpatterns = [
    path('register/',RegisterUserView.as_view(),name='register'),
    path('verify-email/',VerifyUserEmail.as_view(),name='verify'),
    path('login/',LoginUserView.as_view(),name='login'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset-confirm/<uid>/<token>/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('logout/',LogoutUserView.as_view(),name='logout'),
    path('enable2FA/', Enable2FAView.as_view(), name='enable_2FA'),
    path('Disable2FA/', Disable2FAView.as_view(), name='disable_2FA'),
    path('verify2FA/', VerifyView.as_view(), name='VerifyView_2FA'),
    path('Redirect42', _42Redirect.as_view(), name='redirect'),
    path('2OAuth', CollectAuthorizeCode.as_view(), name='redirect11'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/blacklist/', TokenBlacklistView.as_view(), name='token_blacklist'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # path('profile/',TestAuthenticationView.as_view(),name='granted'),
    # path('delete', DeleteUser.as_view(),name="delete this mdf") ,

]
