import hashlib
from rest_framework import serializers
from .models import User
from django.contrib.auth import authenticate
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode,urlsafe_base64_decode
from django.utils.encoding import smart_str,force_str
from django.contrib.sites.shortcuts import get_current_site
from django.urls import reverse
from .utils import send_normal_email
from rest_framework_simplejwt.tokens import RefreshToken ,Token
from rest_framework_simplejwt.exceptions import TokenError
from .utils import verify_otp
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
import uuid
from django.core.cache import cache

from django.contrib.auth.hashers import make_password, check_password

User = get_user_model()

# test this fucking register api
class UserRegisterSerializer(serializers.ModelSerializer):
    password=serializers.CharField(max_length=68,min_length=6, write_only=True)
    password2=serializers.CharField(max_length=68,min_length=6, write_only=True)

    class Meta:
        model=User
        fields=['email','first_name','last_name','password','password2']
    
    def validate(self,attrs):
        password = attrs.get('password','')
        password2 = attrs.get('password2','')
        if password != password2:
            raise serializers.ValidationError("Password and password confirmation do not match.")
        return attrs

    def create(self,validated_data):
        user=User.objects.create_user(
            email=validated_data['email'],
            first_name=validated_data.get('first_name'),
            last_name=validated_data.get('last_name'),
            password=validated_data.get('password'),   
        )
        return user

class OTPSerializer(serializers.Serializer):
    otp = serializers.CharField(max_length=6, required=True)
    temp_token = serializers.CharField(required=True)
    def validate(self, attrs):
        print("Received data:", attrs) 
        oo = attrs.get("otp")
        temp_token = attrs.get("temp_token")
        print(oo," -- ",temp_token)
        user_id = cache.get(temp_token)
        user = User.objects.get(id=user_id)
        if not verify_otp(user, oo):
            raise serializers.ValidationError({"error": "The OTP is not valid"})   
        print(type(attrs))
        return attrs

class LoginSerializer(serializers.ModelSerializer):
    email=serializers.EmailField(max_length=255,min_length=6)
    password=serializers.CharField(max_length=68,write_only=True)
    full_name=serializers.CharField(max_length=255,read_only=True)
    access_token=serializers.CharField(max_length=255,read_only=True)
    refresh_token=serializers.CharField(max_length=255,read_only=True) 
    class Meta:
        model=User
        fields=['email','password','full_name','access_token','refresh_token']

    def validate(self, attrs):
        email=attrs.get('email')
        password = attrs.get('password')
        if not email or not password:
            raise serializers.ValidationError("Email and password are required.")
        try:
            print("email " , email)
            email1 = User.objects.get(email=email).email
            print("email " , email1)
            password_saved = User.objects.get(email=email).password
        except:
                raise serializers.ValidationError("No user found with this email.")
        user=authenticate(email=email,password=password)
        if not user:
            if email1  and  check_password(password, password_saved):
                raise AuthenticationFailed('Email is not verified.')
            raise AuthenticationFailed('Invalid email or password.')
        if user.is_2fa_enabled:
            temp_token = str(uuid.uuid4()) 
            cache.set(temp_token, user.id, timeout=10000)
            raise AuthenticationFailed({"detail": "2FA required", "temp_token": temp_token})
        user_tokens = user.tokens()

        return {
            'id':user.id,
            'email':user.email,
            'first_name':user.first_name,
            'last_name':user.last_name,
            'access_token': str(user_tokens.get('access')),
            'refresh_token':str(user_tokens.get('refresh'))
        }




class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            self.user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")
        return value

    def save(self):
        user = self.user
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        return uid, token


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            uid = force_str(urlsafe_base64_decode(data['uid']))
            user = User.objects.get(pk=uid, is_active=True)
        except (User.DoesNotExist, ValueError, TypeError):
            raise serializers.ValidationError("Invalid user or token.")

        if not default_token_generator.check_token(user, data['token']):
            raise serializers.ValidationError("Invalid token.")

        self.user = user
        return data

    def save(self):
        user = self.user
        user.set_password(self.validated_data['new_password'])
        user.save()

class LogoutUserSerializer(serializers.Serializer):
    refresh_token=serializers.CharField()

    default_error_message={
        'bad_token':('Token is Invalid or has expired')
    }

    def validate(self, attrs):
        self.token=attrs.get('refresh_token')
        return attrs
    def  save(self, **kwargs):
        try:
            token = RefreshToken(self.token)
            token.blacklist()

        except TokenError:
            return self.fail('bad_token')



class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    profile_image_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "is_verified",
            "is_active",
            "date_joined",
            "last_login",
            "is_2fa_enabled",
            "profile_image_url",
        ]
        read_only_fields = ["id", "date_joined", "last_login", "is_verified", "is_active"]

    def get_full_name(self, obj):
        return obj.get_full_name

    def get_profile_image_url(self, obj):
        request = self.context.get("request")
        if obj.profile_image:
            return request.build_absolute_uri(obj.profile_image.url) if request else obj.profile_image.url
        return None
