from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from rest_framework_simplejwt.tokens import RefreshToken
from django_otp.plugins.otp_totp.models import TOTPDevice
from .managers import UserManager
from django.core.files.temp import NamedTemporaryFile
import requests
from django.core.files import File
import random
import string

class User(AbstractBaseUser, PermissionsMixin):
    email=models.EmailField(max_length=255,unique=True,verbose_name=("Email Address"))
    username = models.CharField(max_length=100,verbose_name=("username"),unique=True)
    first_name = models.CharField(max_length=100,verbose_name=("First Name"))
    last_name = models.CharField(max_length=100,verbose_name=("Last Name"))
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)
    otp_secret = models.CharField(max_length=32, blank=True, null=True)
    is_2fa_enabled = models.BooleanField(default=False)
    # profile_image = models.ImageField(upload_to='usr_images/', null=True, blank=True)
    image = models.ImageField(upload_to='profile_images/', default='profile_images/default.png',blank=True, null=True)

    is_admin = models.BooleanField(default=False) 
    is_staff = models.BooleanField(default=False)
    is_online = models.BooleanField(default=False)

    
    USERNAME_FIELD="email"

    REQUIRED_FIELDS=["first_name","last_name"]

    objects= UserManager()

    def __str__(self):
        return f"{self.username}"
    
    @property
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def tokens(self):
        refresh=RefreshToken.for_user(self)
        return {
            'refresh':str(refresh),
            'access':str(refresh.access_token)
        }
    
    def download_profile_image_from_url(self, url):
        response = requests.get(url)
        if response.status_code == 200:
            img_temp = NamedTemporaryFile(delete=True)
            img_temp.write(response.content)
            img_temp.flush()
            self.profile_image.save(f'profile_image_{self.user.id}.jpg', File(img_temp), save=True)

    def get_profile_image_url(self):
        if self.profile_image:
            return self.profile_image.url
        else:
            return '/static/images/default_profile_image.png' 
    def generate_unique_username(self,length=8, prefix="userTransc_"):
        chars = string.ascii_lowercase + string.digits

        while True:
            random_part = ''.join(random.choices(chars, k=length))
            username = f"{prefix}{random_part}"
            
            if not User.objects.filter(username=username).exists():
                return username
class OneTimePassword(models.Model):
    code=models.CharField(unique=True,max_length=6)
    user= models.ForeignKey(User,on_delete=models.CASCADE)


