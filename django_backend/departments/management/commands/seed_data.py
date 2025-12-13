"""
Management command to seed the database with test data for a week.
Run with: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.conf import settings
from django.db.models import Q
from datetime import timedelta, datetime
from departments.models import Department, StaffProfile, StaffDailyPerformance
from message_app.models import Session
from support_tools.models import Neighborhood
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with a week of test data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            StaffDailyPerformance.objects.all().delete()
            Session.objects.all().delete()
            StaffProfile.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()
            Department.objects.all().delete()
            Neighborhood.objects.all().delete()

        self.stdout.write(self.style.SUCCESS('Starting data seeding...'))

        # Create Neighborhoods
        neighborhoods = self.create_neighborhoods()

        # Create Departments
        departments = self.create_departments()

        # Create Staff Users and Profiles
        staff_users = self.create_staff_users(departments)

        # Create Citizen Users
        citizen_users = self.create_citizen_users(neighborhoods)

        # Create Sessions for the past week
        self.create_sessions(citizen_users, staff_users, departments)

        # Create Daily Performance records
        self.create_daily_performance(staff_users)

        # Create chart test data for Aziza Karimova
        self.create_chart_test_data(citizen_users, staff_users)

        self.stdout.write(self.style.SUCCESS('Data seeding completed successfully!'))

    def create_neighborhoods(self):
        """Create sample neighborhoods."""
        neighborhoods_data = [
            {"name_uz": "Tinchlik", "name_ru": "Тинчлик"},
            {"name_uz": "Yangiobod", "name_ru": "Янгиобод"},
            {"name_uz": "Dustlik", "name_ru": "Дустлик"},
            {"name_uz": "Olmazor", "name_ru": "Олмазор"},
            {"name_uz": "Yunusobod", "name_ru": "Юнусобод"},
            {"name_uz": "Chilonzor", "name_ru": "Чилонзор"},
        ]

        neighborhoods = []
        for data in neighborhoods_data:
            neighborhood, created = Neighborhood.objects.get_or_create(
                name_uz=data["name_uz"],
                defaults={"name_ru": data["name_ru"]}
            )
            neighborhoods.append(neighborhood)
            if created:
                self.stdout.write(f'Created neighborhood: {neighborhood.name_uz}')

        return neighborhoods

    def create_departments(self):
        """Create sample departments."""
        departments_data = [
            {"name_uz": "Ijtimoiy himoya", "name_ru": "Социальная защита"},
            {"name_uz": "Sog'liqni saqlash", "name_ru": "Здравоохранение"},
            {"name_uz": "Ta'lim", "name_ru": "Образование"},
            {"name_uz": "Kommunal xizmatlar", "name_ru": "Коммунальные услуги"},
        ]

        departments = []
        for data in departments_data:
            department, created = Department.objects.get_or_create(
                name_uz=data["name_uz"],
                defaults={
                    "name_ru": data["name_ru"],
                    "description_uz": f"{data['name_uz']} bo'limi",
                    "description_ru": f"Отдел {data['name_ru']}",
                }
            )
            departments.append(department)
            if created:
                self.stdout.write(f'Created department: {department.name_uz}')

        return departments

    def create_staff_users(self, departments):
        """Create staff users with profiles."""
        staff_data = [
            {
                "phone": "+998901234567",
                "email": "alisher.staff@example.com",
                "full_name": "Alisher Usmanov",
                "username": "alisher",
                "job_title": "Senior Specialist",
                "role": StaffProfile.ROLE_STAFF,
            },
            {
                "phone": "+998901234568",
                "email": "aziza.staff@example.com",
                "full_name": "Aziza Karimova",
                "username": "aziza",
                "job_title": "Manager",
                "role": StaffProfile.ROLE_MANAGER,
            },
            {
                "phone": "+998901234569",
                "email": "bekzod.staff@example.com",
                "full_name": "Bekzod Toshmatov",
                "username": "bekzod",
                "job_title": "Specialist",
                "role": StaffProfile.ROLE_STAFF,
            },
            {
                "phone": "+998901234570",
                "email": "dilnoza.staff@example.com",
                "full_name": "Dilnoza Rahimova",
                "username": "dilnoza",
                "job_title": "Junior Specialist",
                "role": StaffProfile.ROLE_STAFF,
            },
            {
                "phone": "+998901234571",
                "email": "eldor.staff@example.com",
                "full_name": "Eldor Sobirov",
                "username": "eldor",
                "job_title": "Senior Manager",
                "role": StaffProfile.ROLE_MANAGER,
            },
        ]

        staff_users = []
        for i, data in enumerate(staff_data):
            # Create or get user
            user, created = User.objects.get_or_create(
                phone_number=data["phone"],
                defaults={
                    "email": data["email"],
                    "full_name": data["full_name"],
                    "is_active": True,
                }
            )
            if created:
                user.set_password("testpass123")
                user.save()
                self.stdout.write(f'Created staff user: {user.full_name}')
            else:
                # Update password if user already exists
                user.set_password("testpass123")
                user.save()

            # Create or get staff profile
            department = departments[i % len(departments)]
            profile, created = StaffProfile.objects.get_or_create(
                user=user,
                defaults={
                    "username": data["username"],
                    "department": department,
                    "role": data["role"],
                    "job_title": data["job_title"],
                }
            )
            if created:
                self.stdout.write(f'Created staff profile: {profile.username}')

            staff_users.append(user)

        return staff_users

    def create_citizen_users(self, neighborhoods):
        """Create citizen users."""
        male_names = ["Alisher", "Bekzod", "Davron", "Eldor", "Farhod", "Gulom", "Hasan", "Ibrohim"]
        female_names = ["Aziza", "Bahriniso", "Dilnoza", "Eldora", "Farangiz", "Gulnora", "Hafiza", "Ilona"]
        last_names = ["Usmanov", "Karimov", "Toshmatov", "Rahimov", "Sobirov", "Nazarov", "Yuldashev", "Alimov"]

        citizen_users = []
        used_emails = set()  # Track used emails to avoid duplicates
        
        for i in range(30):  # Create 30 citizen users
            is_male = i % 2 == 0
            first_name = random.choice(male_names if is_male else female_names)
            last_name = random.choice(last_names)
            full_name = f"{first_name} {last_name}"
            phone = f"+99890123{4000 + i:04d}"
            
            # Generate unique email
            base_email = f"{first_name.lower()}.{last_name.lower()}"
            email = f"{base_email}@example.com"
            counter = 1
            while email in used_emails or User.objects.filter(email=email).exists():
                email = f"{base_email}{counter}@example.com"
                counter += 1
            used_emails.add(email)

            user, created = User.objects.get_or_create(
                phone_number=phone,
                defaults={
                    "email": email,
                    "full_name": full_name,
                    "neighborhood": random.choice(neighborhoods),
                    "location": f"{random.choice(neighborhoods).name_uz}, Uzbekistan",
                    "is_active": True,
                }
            )
            if created:
                self.stdout.write(f'Created citizen user: {user.full_name} ({email})')
            else:
                # User already exists, just add to list
                self.stdout.write(f'Using existing citizen user: {user.full_name}')
            citizen_users.append(user)

        return citizen_users

    def create_sessions(self, citizen_users, staff_users, departments):
        """Create sessions for the past week."""
        now = timezone.now()
        statuses = ["unassigned", "assigned", "closed", "escalated"]
        origins = ["web", "telegram"]

        # Create sessions for each day of the past week
        for day_offset in range(7):
            date = now - timedelta(days=day_offset)
            # Create 10-20 sessions per day
            num_sessions = random.randint(10, 20)

            for _ in range(num_sessions):
                # Random time during the day
                hour = random.randint(8, 20)
                minute = random.randint(0, 59)
                session_time = date.replace(hour=hour, minute=minute, second=0, microsecond=0)

                citizen = random.choice(citizen_users)
                department = random.choice(departments)
                status = random.choice(statuses)
                origin = random.choice(origins)

                # Assign staff if status is assigned
                assigned_staff = None
                if status == "assigned":
                    # Pick a staff member from the same department
                    dept_staff = [s for s in staff_users if hasattr(s, 'staff_profile') and s.staff_profile.department == department]
                    if dept_staff:
                        assigned_staff = random.choice(dept_staff)

                # Create session first
                session = Session.objects.create(
                    citizen=citizen,
                    assigned_department=department,
                    assigned_staff=assigned_staff,
                    status=status,
                    origin=origin,
                )
                
                # Manually set created_at to override auto_now_add
                session.created_at = session_time
                
                # Set closed_at if status is closed
                update_fields = ['created_at']
                if status == "closed":
                    closed_time = session_time + timedelta(hours=random.randint(1, 48))
                    session.closed_at = closed_time
                    update_fields.append('closed_at')
                
                # Save with update_fields to ensure created_at is saved
                session.save(update_fields=update_fields)

        self.stdout.write(f'Created sessions for the past 7 days')

    def create_daily_performance(self, staff_users):
        """Create daily performance records for the past week."""
        now = timezone.now()

        for day_offset in range(7):
            date = (now - timedelta(days=day_offset)).date()

            for staff_user in staff_users:
                # Random number of tickets solved (0-15 per day)
                tickets_solved = random.randint(0, 15)
                avg_response_time = random.uniform(30.0, 300.0) if tickets_solved > 0 else 0.0

                StaffDailyPerformance.objects.get_or_create(
                    staff=staff_user,
                    date=date,
                    defaults={
                        "tickets_solved": tickets_solved,
                        "avg_response_time_seconds": avg_response_time,
                    }
                )

        self.stdout.write(f'Created daily performance records for the past 7 days')

    def create_chart_test_data(self, citizen_users, staff_users):
        """Create 1 month of sessions for Aziza Karimova's department for chart testing."""
        try:
            # Find Aziza Karimova by email or full name
            aziza_user = User.objects.filter(
                Q(email="aziza.staff@example.com") | Q(full_name="Aziza Karimova")
            ).first()
            
            if not aziza_user:
                # Try to find by StaffProfile username
                try:
                    aziza_profile = StaffProfile.objects.get(username="aziza")
                    aziza_user = aziza_profile.user
                except StaffProfile.DoesNotExist:
                    self.stdout.write(self.style.WARNING('Aziza Karimova not found. Skipping chart test data creation.'))
                    return
            
            if not hasattr(aziza_user, 'staff_profile'):
                self.stdout.write(self.style.WARNING('Aziza Karimova has no staff profile. Skipping chart test data creation.'))
                return
            
            aziza_profile = aziza_user.staff_profile
            department = aziza_profile.department
            
            if not department:
                self.stdout.write(self.style.WARNING('Aziza Karimova has no department. Skipping chart test data creation.'))
                return
            
            # Date range: December 6, 2025 to December 12, 2025
            start_date = datetime(2025, 12, 6, 0, 0, 0)
            end_date = datetime(2025, 12, 12, 23, 59, 59)
            
            # Make timezone aware
            if timezone.is_naive(start_date):
                start_date = timezone.make_aware(start_date)
            if timezone.is_naive(end_date):
                end_date = timezone.make_aware(end_date)
            
            statuses = ["unassigned", "assigned", "closed"]  # Exclude escalated
            origins = ["web", "telegram"]
            
            sessions_created = 0
            current_date = start_date
            
            # Create sessions for each day
            while current_date <= end_date:
                # Create 150-250 sessions per day to match current date volume (~200 sessions)
                num_sessions = random.randint(150, 250)
                
                for _ in range(num_sessions):
                    # Random time during the day
                    hour = random.randint(8, 20)
                    minute = random.randint(0, 59)
                    second = random.randint(0, 59)
                    session_time = current_date.replace(hour=hour, minute=minute, second=second, microsecond=0)
                    
                    citizen = random.choice(citizen_users)
                    status = random.choice(statuses)
                    origin = random.choice(origins)
                    
                    # Assign staff if status is assigned
                    assigned_staff = None
                    if status == "assigned":
                        # Pick a staff member from the same department
                        dept_staff = [
                            s for s in staff_users 
                            if hasattr(s, 'staff_profile') 
                            and s.staff_profile.department == department
                        ]
                        if dept_staff:
                            assigned_staff = random.choice(dept_staff)
                    
                    # Create session first
                    session = Session.objects.create(
                        citizen=citizen,
                        assigned_department=department,
                        assigned_staff=assigned_staff,
                        status=status,
                        origin=origin,
                    )
                    
                    # Manually set created_at to override auto_now_add
                    session.created_at = session_time
                    
                    # Set closed_at if status is closed
                    update_fields = ['created_at']
                    if status == "closed":
                        closed_time = session_time + timedelta(hours=random.randint(1, 48))
                        session.closed_at = closed_time
                        update_fields.append('closed_at')
                    
                    # Save with update_fields to ensure created_at is saved
                    session.save(update_fields=update_fields)
                    
                    sessions_created += 1
                
                # Move to next day
                current_date += timedelta(days=1)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created {sessions_created} sessions for Aziza Karimova\'s department '
                    f'({department.name_uz}) from December 6 to December 12, 2025'
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating chart test data: {str(e)}')
            )

