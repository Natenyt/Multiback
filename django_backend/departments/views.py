from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import StaffDailyPerformance, Department
from message_app.models import Session
from datetime import timedelta, datetime
from django.db.models import Sum, Count, Q
from django.contrib.auth import get_user_model
from django.db.models.functions import TruncDate
from users.utils import get_avatar_url
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    
    try:
        profile = user.staff_profile
        department = profile.department
    except AttributeError:
        return Response({"error": "User has no staff profile."}, status=400)
        
    if department is None:
        return Response({"error": "Staff member is not assigned to a department."}, status=400)

    # Counts unassigned sessions (excluding escalated).
    unassigned_count = Session.objects.filter(
        status='unassigned', 
        assigned_department=department
    ).exclude(status='escalated').count()

    # Counts active sessions assigned to this user.
    active_count = Session.objects.filter(
        status='assigned', 
        assigned_staff=user,
        assigned_staff__isnull=False,
        assigned_department=department
    ).exclude(status='escalated').count()

    # Sums all-time tickets solved.
    solved_all_time = StaffDailyPerformance.objects.filter(
        staff=user
    ).aggregate(total=Sum('tickets_solved'))['total'] or 0

    personal_best_record = profile.personal_best_record

    # Calculates completion rate.
    total_active_and_solved = solved_all_time + active_count
    if total_active_and_solved > 0:
        completion_rate = (solved_all_time / total_active_and_solved) * 100
    else:
        completion_rate = 0

    return Response({
        "unassigned_count": unassigned_count,
        "active_count": active_count,
        "solved_today": solved_all_time,
        "personal_best_record": personal_best_record,
        "completion_rate": completion_rate,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_leaderboard(request):
    """
    Return a leaderboard of staff ranked by number of closed sessions.
    
    Optimized to avoid N+1 queries by using queryset annotations instead of
    per-staff count() calls. This keeps the response shape identical while
    significantly reducing database load on large datasets.
    """
    try:
        from .models import StaffProfile

        # Annotates each staff profile with total closed sessions.
        staff_qs = (
            StaffProfile.objects.select_related("user", "department")
            .annotate(
                solved_total=Count(
                    "user__assigned_sessions",
                    filter=Q(
                        user__assigned_sessions__status="closed",
                        user__assigned_sessions__is_deleted=False,
                    ),
                )
            )
        )

        leaderboard_data = []

        for staff_profile in staff_qs:
            staff_user = staff_profile.user
            closed_count = staff_profile.solved_total or 0

            full_name = getattr(staff_user, "full_name", None)
            if not full_name:
                if staff_profile.username:
                    full_name = staff_profile.username
                elif getattr(staff_user, "username", None):
                    full_name = staff_user.username
                else:
                    full_name = str(getattr(staff_user, "user_uuid", "")) or "Unknown"

            department_name = "Unknown"
            if staff_profile.department:
                department_name = staff_profile.department.name_uz or "Unknown"

            avatar_url = get_avatar_url(staff_user, request)

            leaderboard_data.append(
                {
                    "full_name": full_name,
                    "rank": 0,  # Will be set after sorting
                    "department_name": department_name,
                    "solved_total": closed_count,
                    "avatar_url": avatar_url,
                }
            )

        # Sorts by solved_total and assigns ranks.
        leaderboard_data.sort(key=lambda x: x["solved_total"], reverse=True)
        
        top_5 = leaderboard_data[:5]
        current_rank = 1
        for i, entry in enumerate(top_5):
            if i > 0 and entry["solved_total"] < top_5[i - 1]["solved_total"]:
                current_rank = i + 1
            entry["rank"] = current_rank

        return Response({"leaderboard": top_5})
    except Exception as e:
        logger.error("Error in dashboard_leaderboard: %s", e, exc_info=True)
        return Response(
            {"error": "An error occurred while fetching leaderboard data"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_profile(request):
    """Return comprehensive staff profile information."""
    user = request.user
    
    try:
        profile = user.staff_profile
    except AttributeError:
        return Response({"error": "User has no staff profile."}, status=400)
    
    # Determines language preference.
    accept_lang = request.headers.get('Accept-Language', '').lower()
    lang_code = 'ru' if accept_lang.startswith('ru') else 'uz'
    
    department_name = None
    department_name_uz = None
    if profile.department:
        department_name = getattr(profile.department, f'name_{lang_code}', profile.department.name_uz) or "Unknown"
        department_name_uz = profile.department.name_uz or "Unknown"
    
    avatar_url = get_avatar_url(user, request)
    email = user.email if user.email else "emailnot@registered.com"
    
    return Response({
        "full_name": user.full_name or "",
        "email": email,
        "avatar_url": avatar_url,
        "job_title": profile.job_title or "",
        "department": department_name,
        "department_name_uz": department_name_uz,
        "department_id": profile.department.id if profile.department else None,
        "phone_number": user.phone_number,
        "joined_at": profile.joined_at.isoformat() if profile.joined_at else None,
        "staff_uuid": str(user.user_uuid),
        "role": profile.role,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_sessions_chart(request):
    """Return time series data for sessions chart (unassigned, assigned, closed)."""
    user = request.user
    
    try:
        profile = user.staff_profile
        department = profile.department
    except AttributeError:
        return Response({"error": "User has no staff profile."}, status=400)
        
    if department is None:
        return Response({"error": "Staff member is not assigned to a department."}, status=400)
    
    period = request.query_params.get('period', '30d')
    date_param = request.query_params.get('date', None)
    
    # Sessions for this department, excluding escalated.
    base_queryset = Session.objects.filter(
        assigned_department=department
    ).exclude(status='escalated')
    
    # Single day mode when date parameter is provided.
    if date_param:
        try:
            selected_date = datetime.strptime(date_param, '%Y-%m-%d').date()
            
            unassigned = base_queryset.filter(
                status='unassigned',
                created_at__date=selected_date
            ).count()
            
            assigned = base_queryset.filter(
                status='assigned',
                assigned_staff__isnull=False,
                assigned_at__isnull=False,
                assigned_at__date=selected_date
            ).count()
            
            closed = base_queryset.filter(
                status='closed',
                assigned_staff__isnull=False,
                closed_at__isnull=False,
                closed_at__date=selected_date
            ).count()
            
            return Response([{
                "date": selected_date.isoformat(),
                "unassigned": unassigned,
                "assigned": assigned,
                "closed": closed,
            }])
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)
    
    # Determines date range based on period.
    now = timezone.now()
    if period == '7d':
        start_date = now - timedelta(days=7)
    elif period == '30d':
        start_date = now - timedelta(days=30)
    elif period == '3m':
        start_date = now - timedelta(days=90)
    elif period == 'this_month':
        start_date = now.replace(day=1)
    elif period == 'all':
        start_date = None
    else:
        start_date = now - timedelta(days=30)
    
    
    if start_date:
        base_queryset = base_queryset.filter(created_at__gte=start_date)
        start_date_obj = start_date.date()
        end_date_obj = now.date()
    else:
        earliest_session = base_queryset.order_by('created_at').first()
        if earliest_session:
            start_date_obj = earliest_session.created_at.date()
        else:
            start_date_obj = now.date()
        end_date_obj = now.date()
    
    # Groups sessions by status and date.
    base_queryset_unassigned = base_queryset.filter(status='unassigned')
    base_queryset_assigned = base_queryset.filter(
        status='assigned',
        assigned_staff__isnull=False
    )
    base_queryset_closed = base_queryset.filter(
        status='closed',
        assigned_staff__isnull=False
    )
    
    unassigned_queryset = base_queryset_unassigned.annotate(
        date_trunc=TruncDate('created_at')
    ).values('date_trunc').annotate(
        count=Count('id')
    )
    
    assigned_queryset = base_queryset_assigned.filter(
        assigned_at__isnull=False
    ).annotate(
        date_trunc=TruncDate('assigned_at')
    ).values('date_trunc').annotate(
        count=Count('id')
    )
    
    closed_queryset = base_queryset_closed.filter(
        closed_at__isnull=False
    ).annotate(
        date_trunc=TruncDate('closed_at')
    ).values('date_trunc').annotate(
        count=Count('id')
    )
    
    # Builds date-indexed data structure.
    data_by_date = {}
    for item in unassigned_queryset:
        date = item['date_trunc']
        if date not in data_by_date:
            data_by_date[date] = {'unassigned': 0, 'assigned': 0, 'closed': 0}
        data_by_date[date]['unassigned'] = item['count']
    
    for item in assigned_queryset:
        date = item['date_trunc']
        if date not in data_by_date:
            data_by_date[date] = {'unassigned': 0, 'assigned': 0, 'closed': 0}
        data_by_date[date]['assigned'] = item['count']
    
    for item in closed_queryset:
        date = item['date_trunc']
        if date not in data_by_date:
            data_by_date[date] = {'unassigned': 0, 'assigned': 0, 'closed': 0}
        data_by_date[date]['closed'] = item['count']
    
    # Generates all dates in range.
    result = []
    current_date = start_date_obj
    while current_date <= end_date_obj:
        date_data = {
            "date": current_date.isoformat(),
            "unassigned": data_by_date.get(current_date, {}).get('unassigned', 0),
            "assigned": data_by_date.get(current_date, {}).get('assigned', 0),
            "closed": data_by_date.get(current_date, {}).get('closed', 0),
        }
        result.append(date_data)
        current_date += timedelta(days=1)
    
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_demographics(request):
    """Return demographics data (Male/Female percentages) for all-time sessions."""
    user = request.user
    
    try:
        profile = user.staff_profile
        department = profile.department
    except AttributeError:
        return Response({"error": "User has no staff profile."}, status=400)
        
    if department is None:
        return Response({"error": "Staff member is not assigned to a department."}, status=400)
    
    # Sessions routed to this department.
    sessions = Session.objects.filter(
        assigned_department=department
    ).exclude(status='escalated')
    
    # Unique citizens from those sessions.
    unique_citizen_uuids = sessions.values_list('citizen', flat=True).distinct()
    
    # Counts by gender.
    User = get_user_model()
    users = User.objects.filter(user_uuid__in=unique_citizen_uuids)
    
    male_count = users.filter(gender='M').count()
    female_count = users.filter(gender='F').count()
    total_appealers = users.count()
    
    # Calculates percentages.
    if total_appealers > 0:
        male_percentage = (male_count / total_appealers) * 100
        female_percentage = (female_count / total_appealers) * 100
    else:
        male_percentage = 0
        female_percentage = 0
    
    return Response({
        "male_count": male_count,
        "female_count": female_count,
        "male_percentage": round(male_percentage, 2),
        "female_percentage": round(female_percentage, 2),
        "total_appealers": total_appealers,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_top_neighborhoods(request):
    """Return top 6 neighborhoods by appeal count (all-time, excluding escalated)."""
    user = request.user
    
    try:
        profile = user.staff_profile
        department = profile.department
    except AttributeError:
        return Response({"error": "User has no staff profile."}, status=400)
        
    if department is None:
        return Response({"error": "Staff member is not assigned to a department."}, status=400)
    
    sessions = Session.objects.filter(
        assigned_department=department
    ).exclude(status='escalated').select_related('citizen__neighborhood')
    
    total_sessions = sessions.count()
    
    # Counts sessions by neighborhood.
    from support_tools.models import Neighborhood
    
    neighborhood_counts = sessions.values(
        'citizen__neighborhood__id',
        'citizen__neighborhood__name_uz'
    ).annotate(
        count=Count('id')
    ).order_by('-count')[:6]
    
    result = []
    for item in neighborhood_counts:
        neighborhood_name = item['citizen__neighborhood__name_uz']
        if not neighborhood_name:
            neighborhood_id = item['citizen__neighborhood__id']
            if neighborhood_id:
                try:
                    neighborhood = Neighborhood.objects.get(id=neighborhood_id)
                    neighborhood_name = neighborhood.name_uz or "Unknown"
                except Neighborhood.DoesNotExist:
                    neighborhood_name = "Unknown"
            else:
                neighborhood_name = "Unknown"
        
        count = item['count']
        percentage = (count / total_sessions * 100) if total_sessions > 0 else 0
        
        result.append({
            "neighborhood_name": neighborhood_name,
            "count": count,
            "percentage": round(percentage, 2),
        })
    
    return Response(result)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def departments_list(request):
    """
    Get list of all active departments.
    Supports search and language filtering.
    """
    search = request.query_params.get('search', '').strip()
    lang = request.query_params.get('lang', 'uz')
    
    queryset = Department.objects.filter(is_active=True)
    
    if search:
        queryset = queryset.filter(
            Q(name_uz__icontains=search) | Q(name_ru__icontains=search)
        )
    
    departments = []
    for dept in queryset.order_by('name_uz'):
        departments.append({
            'id': dept.id,
            'name_uz': dept.name_uz,
            'name_ru': dept.name_ru,
            'is_active': dept.is_active,
        })
    
    return Response(departments)