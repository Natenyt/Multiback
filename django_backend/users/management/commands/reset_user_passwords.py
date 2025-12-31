"""
Django management command to reset passwords for all non-superuser users.
Usage: python manage.py reset_user_passwords
"""
import re
from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import User


class Command(BaseCommand):
    help = 'Reset passwords for all non-superuser users based on their full names'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without actually updating passwords',
        )

    def generate_password_from_name(self, full_name):
        """
        Generate a simple password based on full name.
        Format: firstname_initial_lowercase + underscore + lastname_lowercase + "2025"
        Examples:
        - "Eshquvatov Shahboz" -> "s_eshquvatov2025"
        - "Mahammadiyev Nodirbek Nasimjanovich" -> "n_mahammadiyev2025"
        - "Jabborov Sarvar" -> "s_jabborov2025"
        - Single name: "Usmonov" -> "u_usmonov2025"
        """
        if not full_name:
            return "u_user2025"
        
        # Clean and split name
        name_parts = [part.strip() for part in full_name.split() if part.strip()]
        
        if not name_parts:
            return "u_user2025"
        
        # For Uzbek names: typically Surname FirstName Patronymic
        # Get first initial from first name (second word if exists, otherwise first word)
        if len(name_parts) >= 2:
            first_name_initial = name_parts[1][0].lower()  # First name is usually second word
            last_name = name_parts[0].lower()  # Surname is first word
        else:
            # Single name - use first letter as initial and the name as base
            first_name_initial = name_parts[0][0].lower()
            last_name = name_parts[0].lower()
        
        # Combine: first_initial + underscore + last_name + "2025"
        password = f"{first_name_initial}_{last_name}2025"
        
        # Ensure at least 8 characters (should always be with this format)
        if len(password) < 8:
            password = password + "12345"
        
        return password

    def handle(self, *args, **options):
        # Get all non-superuser users
        users = User.objects.filter(is_superuser=False).order_by('full_name', 'phone_number')
        
        if not users.exists():
            self.stdout.write(self.style.WARNING('No non-superuser users found.'))
            return
        
        self.stdout.write(f'Found {users.count()} non-superuser users.')
        
        if options['dry_run']:
            self.stdout.write(self.style.WARNING('\n=== DRY RUN - Passwords that would be set ===\n'))
            for user in users:
                new_password = self.generate_password_from_name(user.full_name)
                self.stdout.write(
                    f"User: {user.full_name or user.phone_number}\n"
                    f"Phone: {user.phone_number}\n"
                    f"New Password: {new_password}\n"
                    f"---\n"
                )
            return
        
        # Reset passwords
        self.stdout.write('\nResetting passwords...')
        updated_count = 0
        error_count = 0
        
        with transaction.atomic():
            for user in users:
                try:
                    new_password = self.generate_password_from_name(user.full_name)
                    user.set_password(new_password)
                    user.save()
                    
                    updated_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ Updated: {user.full_name or user.phone_number} - Password: {new_password}'
                        )
                    )
                
                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(f'✗ Error updating {user.full_name or user.phone_number}: {e}')
                    )
        
        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS(f'✓ Updated: {updated_count} users'))
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f'✗ Errors: {error_count}'))
        self.stdout.write('='*50)
        
        if updated_count > 0:
            self.stdout.write(
                self.style.WARNING(
                    '\n⚠ IMPORTANT: All passwords have been reset. '
                    'Make sure to securely share the new passwords with users.'
                )
            )

