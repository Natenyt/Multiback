from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import StaffDailyPerformance
from message_app.models import Session
from datetime import timedelta, datetime
from django.db.models import Sum, Count, Q
from django.contrib.auth import get_user_model
from django.db.models.functions import TruncDate

# Create your views here.

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    
    # 1. Identify the Staff Member
    try:
        profile = user.staff_profile
        department = profile.department
    except AttributeError:
        # If user has no staff_profile
        return Response({"error": "User has no staff profile."}, status=400)
        
    if department is None:
        return Response({"error": "Staff member is not assigned to a department."}, status=400)

    # 2. Check for date parameter
    date_param = request.query_params.get('date', None)
    if date_param:
        try:
            selected_date = datetime.strptime(date_param, '%Y-%m-%d').date()
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)
    else:
        selected_date = timezone.now().date()

    # 3. unassigned_count (for today)
    unassigned_count = Session.objects.filter(
        status='unassigned', 
        assigned_department=department,
        created_at__date=selected_date
    ).count()

    # 4. active_count (for today, assigned to this user)
    active_count = Session.objects.filter(
        status='assigned', 
        assigned_staff=user,
        created_at__date=selected_date
    ).count()

    # 5. solved_today (for selected date)
    daily_perf = StaffDailyPerformance.objects.filter(
        staff=user, 
        date=selected_date
    ).first()

    if daily_perf:
        solved_today = daily_perf.tickets_solved
    else:
        solved_today = 0

    # 6. personal_best_record
    personal_best_record = profile.personal_best_record

    # 7. completion_rate
    # (solved_today / (solved_today + active_count)) * 100
    total_active_and_solved = solved_today + active_count
    if total_active_and_solved > 0:
        completion_rate = (solved_today / total_active_and_solved) * 100
    else:
        completion_rate = 0

    return Response({
        "unassigned_count": unassigned_count,
        "active_count": active_count,
        "solved_today": solved_today,
        "personal_best_record": personal_best_record,
        "completion_rate": completion_rate,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_leaderboard(request):
    User = get_user_model()
    user = request.user

    # --- 1. Language Logic ---
    accept_lang = request.headers.get('Accept-Language', '').lower()
    lang_code = 'ru' if accept_lang.startswith('ru') else 'uz'

    def get_dept_name(user_obj):
        """Helper to safely get the localized department name"""
        try:
            dept = user_obj.staff_profile.department
            if not dept:
                return "No Dept"
            # Dynamic attribute lookup: name_ru or name_uz
            return getattr(dept, f'name_{lang_code}', dept.name_uz) or "Unknown"
        except AttributeError:
            return "No Dept"

    # --- 2. Aggregate Scores (Last 7 Days) ---
    start_date = timezone.now().date() - timedelta(days=7)

    # Returns list of dicts: [{'staff': 1, 'total_score': 150}, ...]
    queryset = StaffDailyPerformance.objects.filter(
        date__gte=start_date
    ).values('staff').annotate(
        total_score=Sum('tickets_solved')
    ).order_by('-total_score')

    # Convert to list immediately to iterate multiple times without hitting DB twice
    leaderboard_data = list(queryset)

    # --- 3. Find current user's rank and score ---
    user_total_score = 0
    user_rank = None
    
    # Find user's score in the full list
    for idx, entry in enumerate(leaderboard_data, start=1):
        if entry['staff'] == user.id:
            user_total_score = entry['total_score']
            # Calculate rank: count how many have higher score
            better_scores_count = sum(1 for e in leaderboard_data if e['total_score'] > user_total_score)
            user_rank = better_scores_count + 1
            break

    # --- 4. Build Top 5 List (excluding current user if not in top 5) ---
    leaderboard_response = []
    top_5_data = leaderboard_data[:5]
    user_in_top_5 = user_rank is not None and user_rank <= 5
    
    for entry in top_5_data:
        staff_id = entry['staff']
        score = entry['total_score']
        
        # Skip current user if they're not in top 5
        if staff_id == user.id and not user_in_top_5:
            continue
        
        try:
            # Fetch user + department in one go
            staff_user = User.objects.select_related('staff_profile__department').get(id=staff_id)
            
            # Handle name
            name = getattr(staff_user, 'full_name', staff_user.get_full_name())
            if not name: 
                name = staff_user.username # Fallback if name is empty

            leaderboard_response.append({
                "name": name,
                "department": get_dept_name(staff_user),
                "score": score
            })
        except User.DoesNotExist:
            continue

    return Response({
        "leaderboard": leaderboard_response
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def staff_profile(request):
    """Return comprehensive staff profile information."""
    user = request.user
    
    try:
        profile = user.staff_profile
    except AttributeError:
        return Response({"error": "User has no staff profile."}, status=400)
    
    # Get department name (localized)
    accept_lang = request.headers.get('Accept-Language', '').lower()
    lang_code = 'ru' if accept_lang.startswith('ru') else 'uz'
    
    department_name = None
    if profile.department:
        department_name = getattr(profile.department, f'name_{lang_code}', profile.department.name_uz) or "Unknown"
    
    # Get avatar URL
    avatar_url = None
    if user.avatar:
        try:
            avatar_url = request.build_absolute_uri(user.avatar.url)
        except Exception:
            avatar_url = None
    
    # Handle email
    email = user.email if user.email else "emailnot@registered.com"
    
    return Response({
        "full_name": user.full_name or "",
        "email": email,
        "avatar_url": avatar_url,
        "job_title": profile.job_title or "",
        "department": department_name,
        "phone_number": user.phone_number,
        "joined_at": profile.joined_at.isoformat() if profile.joined_at else None,
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
    
    # Get filter parameters
    period = request.query_params.get('period', '30d')
    date_param = request.query_params.get('date', None)
    
    # Base queryset: sessions for this department, excluding escalated
    base_queryset = Session.objects.filter(
        assigned_department=department
    ).exclude(status='escalated')
    
    # Handle date parameter (single day - overrides period)
    if date_param:
        try:
            selected_date = datetime.strptime(date_param, '%Y-%m-%d').date()
            base_queryset = base_queryset.filter(
                created_at__date=selected_date
            )
            
            # Return single day data
            unassigned = base_queryset.filter(status='unassigned').count()
            assigned = base_queryset.filter(status='assigned').count()
            closed = base_queryset.filter(status='closed').count()
            
            return Response([{
                "date": selected_date.isoformat(),
                "unassigned": unassigned,
                "assigned": assigned,
                "closed": closed,
            }])
        except ValueError:
            return Response({"error": "Invalid date format. Use YYYY-MM-DD."}, status=400)
    
    # Handle period filter
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
        start_date = now - timedelta(days=30)  # default
    
    # Determine date range
    if start_date:
        base_queryset = base_queryset.filter(created_at__gte=start_date)
        start_date_obj = start_date.date()
        end_date_obj = now.date()
    else:
        # For "all" period, get the earliest session date
        earliest_session = base_queryset.order_by('created_at').first()
        if earliest_session:
            start_date_obj = earliest_session.created_at.date()
        else:
            start_date_obj = now.date()
        end_date_obj = now.date()
    
    # Group by date and status
    # Annotate with date (truncated to day)
    queryset = base_queryset.annotate(
        date_trunc=TruncDate('created_at')
    ).values('date_trunc', 'status').annotate(
        count=Count('id')
    ).order_by('date_trunc')
    
    # Build a dictionary of date -> status -> count
    data_by_date = {}
    for item in queryset:
        date = item['date_trunc']
        if date not in data_by_date:
            data_by_date[date] = {'unassigned': 0, 'assigned': 0, 'closed': 0}
        status = item['status']
        if status in ['unassigned', 'assigned', 'closed']:
            data_by_date[date][status] = item['count']
    
    # Generate all dates in the range and fill with data
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
    
    # Get all sessions routed to department (excluding escalated)
    sessions = Session.objects.filter(
        assigned_department=department
    ).exclude(status='escalated')
    
    # Get unique users (citizens) from those sessions
    # Session.citizen is a ForeignKey with to_field="user_uuid", so values('citizen') returns UUIDs
    unique_citizen_uuids = sessions.values_list('citizen', flat=True).distinct()
    
    # Count by gender
    User = get_user_model()
    users = User.objects.filter(user_uuid__in=unique_citizen_uuids)
    
    male_count = users.filter(gender='M').count()
    female_count = users.filter(gender='F').count()
    total_appealers = users.count()
    
    # Calculate percentages
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
    
    # Get all sessions routed to department (excluding escalated)
    sessions = Session.objects.filter(
        assigned_department=department
    ).exclude(status='escalated').select_related('citizen__neighborhood')
    
    # Get total count for percentage calculation
    total_sessions = sessions.count()
    
    # Count sessions by neighborhood
    # Group by citizen's neighborhood
    from support_tools.models import Neighborhood
    
    neighborhood_counts = sessions.values(
        'citizen__neighborhood__id',
        'citizen__neighborhood__name_uz'
    ).annotate(
        count=Count('id')
    ).order_by('-count')[:6]
    
    # Build response
    result = []
    for item in neighborhood_counts:
        neighborhood_name = item['citizen__neighborhood__name_uz']
        if not neighborhood_name:
            # Try to get name from Neighborhood model if available
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