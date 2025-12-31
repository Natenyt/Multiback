"""
Django management command to import staff members from markdown files.
Usage: python manage.py import_staff
"""
import re
from django.core.management.base import BaseCommand
from django.db import transaction
from pathlib import Path
from users.models import User


class Command(BaseCommand):
    help = 'Import staff members from staff_list.md and paswd_username.md files'

    def add_arguments(self, parser):
        parser.add_argument(
            '--staff-list',
            type=str,
            help='Path to staff_list.md file (default: staff_list.md in project root)',
        )
        parser.add_argument(
            '--password-file',
            type=str,
            help='Path to paswd_username.md file (default: paswd_username.md in project root)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be imported without actually creating users',
        )

    def handle(self, *args, **options):
        # Get file paths
        # import_staff.py is at: django_backend/users/management/commands/import_staff.py
        # Go up 5 levels to reach project root (Multiback/)
        project_root = Path(__file__).resolve().parent.parent.parent.parent.parent
        
        staff_list_path = Path(options['staff_list']) if options['staff_list'] else project_root / 'staff_list.md'
        password_file_path = Path(options['password_file']) if options['password_file'] else project_root / 'paswd_username.md'
        
        # Verify files exist
        if not staff_list_path.exists():
            self.stdout.write(
                self.style.ERROR(f'Error: staff_list.md not found at {staff_list_path}')
            )
            return
        
        if not password_file_path.exists():
            self.stdout.write(
                self.style.ERROR(f'Error: paswd_username.md not found at {password_file_path}')
            )
            return
        
        # Parse files
        self.stdout.write('Parsing staff list file...')
        staff_data = self.parse_staff_list(staff_list_path)
        
        self.stdout.write('Parsing password file...')
        password_data = self.parse_password_file(password_file_path)
        
        # Match staff with passwords
        self.stdout.write('Matching staff with passwords...')
        matched_staff = self.match_staff_with_passwords(staff_data, password_data)
        
        if options['dry_run']:
            self.stdout.write(self.style.WARNING('\n=== DRY RUN - Users that would be created ===\n'))
            for staff in matched_staff:
                self.stdout.write(
                    f"Name: {staff['full_name']}\n"
                    f"Phone: {staff['phone_number'] or '(MISSING)'}\n"
                    f"Password: {staff['password']}\n"
                    f"Gender: M\n"
                    f"---\n"
                )
            return
        
        # Create users
        self.stdout.write(f'\nCreating {len(matched_staff)} users...')
        created_count = 0
        skipped_count = 0
        error_count = 0
        
        with transaction.atomic():
            for staff in matched_staff:
                try:
                    # Skip if phone number is missing
                    if not staff['phone_number']:
                        self.stdout.write(
                            self.style.WARNING(
                                f'⚠ Skipping {staff["full_name"]} - no phone number'
                            )
                        )
                        skipped_count += 1
                        continue
                    
                    # Check if user already exists
                    if User.objects.filter(phone_number=staff['phone_number']).exists():
                        self.stdout.write(
                            self.style.WARNING(
                                f'⚠ User with phone {staff["phone_number"]} already exists - skipping'
                            )
                        )
                        skipped_count += 1
                        continue
                    
                    # Create user
                    user = User.objects.create_user(
                        phone_number=staff['phone_number'],
                        password=staff['password'],
                        full_name=staff['full_name'],
                        is_verified=True,
                        is_operator=False,
                        is_superuser=False,
                        gender='M',  # All staff are male
                        notes='Staff',
                        neighborhood=None,  # Empty as requested
                    )
                    
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ Created: {staff["full_name"]} ({staff["phone_number"]})')
                    )
                
                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(f'✗ Error creating {staff["full_name"]}: {e}')
                    )
        
        # Summary
        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS(f'✓ Created: {created_count}'))
        if skipped_count > 0:
            self.stdout.write(self.style.WARNING(f'⚠ Skipped: {skipped_count}'))
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f'✗ Errors: {error_count}'))
        self.stdout.write('='*50)

    def parse_staff_list(self, file_path):
        """
        Parse staff_list.md file to extract names and phone numbers.
        Format is tab-separated: Number. | Position | Name | Phone
        """
        staff_data = []
        
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        for line in lines:
            line = line.strip()
            # Skip empty lines and section headers
            if not line or any(line.startswith(prefix) for prefix in [
                'NARPAY TUMANI HOKIMLIGI',
                'TUMAN HUQUQNI MUHOFAZA',
                'NARPAY TUMANI IQTISODIY',
                'QURILISH, KOMMUNIKATSIYALAR',
                'IJTIMOIY SOHA',
                'QISHLOQ VA SUV'
            ]):
                continue
            
            # Split by tabs (primary separator)
            parts = line.split('\t')
            parts = [p.strip() for p in parts if p.strip()]
            
            if len(parts) < 3:
                continue
            
            # Format is typically: Number. | Position | Name | Phone
            # Find phone number (starts with +998)
            phone_number = None
            name = None
            
            # Look for phone number
            for i, part in enumerate(parts):
                # Clean phone number (remove trailing spaces, check pattern)
                cleaned_part = part.strip()
                if re.match(r'^\+998\d{9}$', cleaned_part):
                    phone_number = cleaned_part
                    # Name should be the part just before phone
                    if i > 0:
                        name = parts[i - 1].strip()
                    break
            
            # If no phone found, try to identify name by position
            # Usually: [Number], [Position], [Name], [Phone?]
            if not name and len(parts) >= 3:
                # Try last part as phone, second-to-last as name
                last_part = parts[-1].strip()
                if re.match(r'^\+998\d{9}$', last_part):
                    phone_number = last_part
                    name = parts[-2].strip()
                else:
                    # No phone number - last part should be the name
                    # Format: [Number], [Position], [Name]
                    name = parts[-1].strip()
            
            if name:
                # Clean up name (remove any trailing/leading whitespace)
                name = re.sub(r'\s+', ' ', name).strip()
                staff_data.append({
                    'full_name': name,
                    'phone_number': phone_number,
                })
        
        return staff_data

    def parse_password_file(self, file_path):
        """
        Parse paswd_username.md file to extract names and passwords.
        Format is tab-separated: Organization | Staff Name | Username | Password
        """
        password_data = {}
        
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # Skip header line
        for line in lines[1:]:
            line = line.strip()
            if not line:
                continue
            
            # Split by tabs
            parts = [p.strip() for p in line.split('\t') if p.strip()]
            
            if len(parts) >= 4:
                # parts[0] = Organization
                # parts[1] = Staff Name
                # parts[2] = Username
                # parts[3] = Password
                name = parts[1]
                password = parts[3]
                password_data[name] = password
        
        return password_data

    def match_staff_with_passwords(self, staff_data, password_data):
        """
        Match staff from staff_list with passwords from password file.
        Uses fuzzy matching on names to handle slight variations.
        """
        matched_staff = []
        
        for staff in staff_data:
            name = staff['full_name']
            password = None
            
            # Try exact match first
            if name in password_data:
                password = password_data[name]
            else:
                # Try fuzzy matching - check if any key contains the name or vice versa
                for key, value in password_data.items():
                    # Normalize names for comparison (remove extra spaces, convert to lowercase)
                    normalized_name = re.sub(r'\s+', ' ', name.lower().strip())
                    normalized_key = re.sub(r'\s+', ' ', key.lower().strip())
                    
                    # Check if names match (allowing for some variation)
                    if normalized_name == normalized_key:
                        password = value
                        break
                    # Check if one contains the other (for partial matches)
                    elif normalized_name in normalized_key or normalized_key in normalized_name:
                        password = value
                        break
                    # Check if last names match (common pattern in Uzbek names)
                    name_parts = normalized_name.split()
                    key_parts = normalized_key.split()
                    if len(name_parts) >= 2 and len(key_parts) >= 2:
                        # Compare last name and first name
                        if name_parts[-1] == key_parts[-1] and name_parts[0] == key_parts[0]:
                            password = value
                            break
            
            if password:
                matched_staff.append({
                    'full_name': staff['full_name'],
                    'phone_number': staff['phone_number'],
                    'password': password,
                })
            else:
                # Still add staff even without password (they'll need to be handled separately)
                self.stdout.write(
                    self.style.WARNING(f'⚠ No password found for: {staff["full_name"]}')
                )
        
        return matched_staff

