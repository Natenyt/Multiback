from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import StaffDailyPerformance
from message_app.models import Session
from datetime import timedelta
from django.db.models import Sum
from django.contrib.auth import get_user_model

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

    # 2. unassigned_count
    # Status='unassigned' AND assigned_department equals the current user's department.
    unassigned_count = Session.objects.filter(
        status='unassigned', 
        assigned_department=department
    ).count()

    # 3. active_count
    # Status='assigned' AND assigned_staff equals the current user.
    active_count = Session.objects.filter(
        status='assigned', 
        assigned_staff=user
    ).count()

    # 4. solved_today & avg_response_time
    today = timezone.now().date()
    # Attempt to get the daily performance row
    # Use .filter().first() to avoid exceptions if multiple rows accidentally exist 
    # (though model has unique_together) or if none exist.
    daily_perf = StaffDailyPerformance.objects.filter(
        staff=user, 
        date=today
    ).first()

    if daily_perf:
        solved_today = daily_perf.tickets_solved
        avg_response_time = daily_perf.avg_response_time_seconds
    else:
        solved_today = 0
        avg_response_time = 0.0

    # 5. personal_best_record
    personal_best_record = profile.personal_best_record

    # 6. personal_best_today
    # Simply the value of solved_today
    personal_best_today = solved_today

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
        "avg_response_time": avg_response_time,
        "personal_best_record": personal_best_record,
        "personal_best_today": personal_best_today,
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

    # --- 3. Build Top 10 List ---
    leaderboard_response = []
    
    for rank, entry in enumerate(leaderboard_data[:10], start=1):
        staff_id = entry['staff']
        score = entry['total_score']
        
        try:
            # Fetch user + department in one go
            staff_user = User.objects.select_related('staff_profile__department').get(id=staff_id)
            
            # Handle name (check if your model uses full_name property or get_full_name method)
            name = getattr(staff_user, 'full_name', staff_user.get_full_name())
            if not name: 
                name = staff_user.username # Fallback if name is empty

            leaderboard_response.append({
                "rank": rank,
                "name": name,
                "department": get_dept_name(staff_user),
                "score": score
            })
        except User.DoesNotExist:
            continue

    # --- 4. Current User Logic ---
    user_total_score = 0
    
    # Find user's score in the full list
    for entry in leaderboard_data:
        if entry['staff'] == user.id:
            user_total_score = entry['total_score']
            break
            
    # Calculate Rank: Count how many people have a higher score than you
    # (No need to query DB again, we have the list in memory)
    better_scores_count = sum(1 for entry in leaderboard_data if entry['total_score'] > user_total_score)
    user_rank = better_scores_count + 1

    user_stats = {
        "rank": user_rank,
        "name": "You",
        "department": get_dept_name(user),
        "score": user_total_score,
        "is_in_top_10": user_rank <= 10
    }

    return Response({
        "leaderboard": leaderboard_response,
        "user_stats": user_stats
    })