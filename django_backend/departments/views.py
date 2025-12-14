from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import StaffDailyPerformance
from message_app.models import Session
from datetime import timedelta, datetime
from django.db.models import Sum, Count, Q
from django.contrib.auth import get_user_model
from django.db.models.functions import TruncDate
import logging

logger = logging.getLogger(__name__)

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

    # 3. unassigned_count (for today, excluding escalated)
    unassigned_count = Session.objects.filter(
        status='unassigned', 
        assigned_department=department,
        created_at__date=selected_date
    ).exclude(status='escalated').count()

    # 4. active_count (for today, assigned to this user, excluding escalated)
    # assigned status must have assigned_staff set
    active_count = Session.objects.filter(
        status='assigned', 
        assigned_staff=user,
        assigned_staff__isnull=False,  # Integrity check: ensure assigned_staff exists
        assigned_department=department,
        created_at__date=selected_date
    ).exclude(status='escalated').count()

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
    
    try:
        # Get all staff profiles across all departments
        from .models import StaffProfile
        all_staff_profiles = StaffProfile.objects.select_related('user', 'department').all()

        # Build leaderboard data with solved counts
        leaderboard_data = []
        
        print(f"\n{'='*80}")
        print(f"LEADERBOARD DEBUG: Processing {all_staff_profiles.count()} staff profiles")
        print(f"{'='*80}\n")
        
        for staff_profile in all_staff_profiles:
            try:
                staff_user = staff_profile.user
                
                # Debug: Print staff info
                print(f"Processing staff: {staff_user.full_name} (UUID: {staff_user.user_uuid})")
                
                # Count all-time closed sessions for this staff member
                # Use the related_name 'assigned_sessions' for better performance
                closed_sessions_query = staff_user.assigned_sessions.filter(
                    status='closed',
                    is_deleted=False
                )
                closed_count = closed_sessions_query.count()
                
                # Debug: Print query details
                print(f"  - Query: assigned_sessions.filter(status='closed', is_deleted=False)")
                print(f"  - Closed sessions count: {closed_count}")
                
                # Debug: Show actual session IDs if any
                if closed_count > 0:
                    session_ids = list(closed_sessions_query.values_list('id', flat=True)[:5])
                    print(f"  - Sample session IDs: {session_ids}")
                else:
                    # Check if staff has any assigned sessions at all
                    all_assigned = staff_user.assigned_sessions.count()
                    print(f"  - Total assigned sessions (any status): {all_assigned}")
                    if all_assigned > 0:
                        status_counts = staff_user.assigned_sessions.values('status').annotate(
                            count=Count('id')
                        )
                        print(f"  - Status breakdown: {list(status_counts)}")
                
                print()  # Empty line for readability
                
                # Debug logging (remove in production)
                if closed_count > 0:
                    logger.info(f"Staff {staff_user.full_name} has {closed_count} closed sessions")
                
                # Get full name
                full_name = getattr(staff_user, 'full_name', None)
                if not full_name:
                    # Try to get username from staff profile or user
                    if staff_profile.username:
                        full_name = staff_profile.username
                    elif hasattr(staff_user, 'username') and staff_user.username:
                        full_name = staff_user.username
                    else:
                        full_name = str(staff_user.user_uuid)  # Last resort fallback

                # Get department name
                department_name = "Unknown"
                if staff_profile.department:
                    department_name = staff_profile.department.name_uz if staff_profile.department.name_uz else "Unknown"

                # Get avatar URL
                avatar_url = None
                if hasattr(staff_user, 'avatar') and staff_user.avatar:
                    try:
                        avatar_url = request.build_absolute_uri(staff_user.avatar.url)
                    except Exception as e:
                        logger.warning(f"Failed to get avatar URL for user {staff_user.user_uuid}: {e}")
                        avatar_url = None

                leaderboard_data.append({
                    "full_name": full_name,
                    "rank": 0,  # Will be set after sorting
                    "department_name": department_name,
                    "solved_total": closed_count,
                    "avatar_url": avatar_url
                })
            except Exception as e:
                logger.error(f"Error processing leaderboard entry for staff profile {staff_profile.id}: {e}", exc_info=True)
                continue

        # Sort by solved_total descending
        leaderboard_data.sort(key=lambda x: x['solved_total'], reverse=True)
        
        # Debug: Print sorted leaderboard data
        print(f"\n{'='*80}")
        print(f"LEADERBOARD DEBUG: Sorted leaderboard data (before taking top 5)")
        print(f"{'='*80}")
        for i, entry in enumerate(leaderboard_data[:10], 1):  # Show top 10 for debugging
            print(f"{i}. {entry['full_name']}: {entry['solved_total']} closed sessions")
        print(f"{'='*80}\n")
        
        # Take top 5 and assign ranks
        top_5 = leaderboard_data[:5]
        
        # Assign ranks (handle ties - same rank for same score)
        # Only assign ranks to entries with solved_total > 0, or if all are 0, assign sequential ranks
        current_rank = 1
        for i, entry in enumerate(top_5):
            if i > 0:
                # If current entry has a different (lower) score than previous, increment rank
                if entry['solved_total'] < top_5[i-1]['solved_total']:
                    current_rank = i + 1
                # If same score, keep same rank (ties)
                elif entry['solved_total'] == top_5[i-1]['solved_total']:
                    # Keep current_rank (ties get same rank)
                    pass
            entry['rank'] = current_rank

        # Debug: Print final top 5
        print(f"\n{'='*80}")
        print(f"LEADERBOARD DEBUG: Final top 5 results")
        print(f"{'='*80}")
        for entry in top_5:
            print(f"Rank {entry['rank']}: {entry['full_name']} ({entry['department_name']}) - {entry['solved_total']} solved")
        print(f"{'='*80}\n")

        return Response({
            "leaderboard": top_5
        })
    except Exception as e:
        logger.error(f"Error in dashboard_leaderboard: {e}", exc_info=True)
        return Response(
            {"error": "An error occurred while fetching leaderboard data"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
            # Integrity checks: assigned and closed statuses should have assigned_staff
            unassigned = base_queryset.filter(status='unassigned').count()
            assigned = base_queryset.filter(
                status='assigned',
                assigned_staff__isnull=False  # Integrity check: assigned must have staff
            ).count()
            closed = base_queryset.filter(
                status='closed',
                assigned_staff__isnull=False  # Integrity check: closed must have staff
            ).count()
            
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
    # Integrity: Filter out assigned/closed sessions without assigned_staff before grouping
    # Unassigned sessions don't need assigned_staff, but assigned and closed must have it
    base_queryset_unassigned = base_queryset.filter(status='unassigned')
    base_queryset_assigned = base_queryset.filter(
        status='assigned',
        assigned_staff__isnull=False  # Integrity check: assigned must have staff
    )
    base_queryset_closed = base_queryset.filter(
        status='closed',
        assigned_staff__isnull=False  # Integrity check: closed must have staff
    )
    
    # Group unassigned by date
    unassigned_queryset = base_queryset_unassigned.annotate(
        date_trunc=TruncDate('created_at')
    ).values('date_trunc').annotate(
        count=Count('id')
    )
    
    # Group assigned by date
    assigned_queryset = base_queryset_assigned.annotate(
        date_trunc=TruncDate('created_at')
    ).values('date_trunc').annotate(
        count=Count('id')
    )
    
    # Group closed by date
    closed_queryset = base_queryset_closed.annotate(
        date_trunc=TruncDate('created_at')
    ).values('date_trunc').annotate(
        count=Count('id')
    )
    
    # Build a dictionary of date -> status -> count
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