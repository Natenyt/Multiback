from rest_framework import generics, permissions, filters
from .models import Neighborhood
from .serializers import NeighborhoodSerializer

class NeighborhoodListView(generics.ListAPIView):
    """
    Returns a list of active neighborhoods.
    Supports filtering via ?search=Name
    """
    permission_classes = [permissions.AllowAny] # Needed for Registration too
    serializer_class = NeighborhoodSerializer
    queryset = Neighborhood.objects.filter(is_active=True)
    filter_backends = [filters.SearchFilter]
    search_fields = ['name_uz', 'name_ru']
