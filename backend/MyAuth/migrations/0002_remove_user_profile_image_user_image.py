# Generated by Django 5.1.7 on 2025-03-21 23:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('MyAuth', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='profile_image',
        ),
        migrations.AddField(
            model_name='user',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='profile_images/'),
        ),
    ]
