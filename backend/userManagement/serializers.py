from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework.validators import UniqueValidator

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=False,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    username = serializers.CharField(
        required=False,
        validators=[UniqueValidator(queryset=User.objects.all())]
    )
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'username', 'email', 'image']
        read_only_fields = ['id']
    def update(self, instance, validated_data):
        if 'email' in validated_data:
            raise serializers.ValidationError("Email cannot be updated.")
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance