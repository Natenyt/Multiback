# message_app/pagination.py
from rest_framework.pagination import CursorPagination

class MessageCursorPagination(CursorPagination):
    page_size = 30
    ordering = '-created_at'  # newest-first for cursor; we'll reverse page results for client
    cursor_query_param = 'cursor'
    page_size_query_param = 'page_size'
    max_page_size = 100
