from rest_framework import serializers
from .models import Neighborhood

class NeighborhoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Neighborhood
        fields = ['id', 'name_uz', 'name_ru']
