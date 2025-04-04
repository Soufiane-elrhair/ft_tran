from django.contrib.auth.base_user import BaseUserManager
from django.core.validators import validate_email
from django.utils.translation import gettext_lazy as _
class UserManager(BaseUserManager):
    def email_validator(self, email):
        """
        Validates the email address.
        """
        try:
            validate_email(email)
        except:
            raise ValueError(_("Your email is not valid. Please enter a valid one."))

    def create_user(self, email, first_name, last_name, password=None, **extra_fields):
        """
        Creates and saves a regular user with the given email, first name, last name, and password.
        """
        if email:
            email = self.normalize_email(email)
            self.email_validator(email)
        else:
            raise ValueError(_("An email address is required"))

        if not first_name:
            raise ValueError(_("First name is required"))

        user = self.model(
            email=email,
            first_name=first_name,
            last_name=last_name,
            
            **extra_fields
        )

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.username = user.generate_unique_username()
        user.save(using=self._db)

        return user

    def create_superuser(self, email, first_name, last_name, password=None, **extra_fields):
        """
        Creates and saves a superuser with the given email, first name, last name, and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))
        return self.create_user(email, first_name, last_name, password, **extra_fields)