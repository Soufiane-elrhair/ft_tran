from django.db import models

class Player(models.Model):
    username = models.CharField(max_length=100)
    score = models.IntegerField(default=0)

class Match(models.Model):
    player1 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='player1')
    player2 = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='player2')
    score1 = models.IntegerField()
    score2 = models.IntegerField()

# Create your models here.
