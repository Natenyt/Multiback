"""
Django management command to find and manage departments without staff members.
Usage: python manage.py manage_empty_departments
"""
from django.core.management.base import BaseCommand
from departments.models import Department


class Command(BaseCommand):
    help = 'Find departments without staff and manage their is_active status'

    def handle(self, *args, **options):
        # Find all departments
        all_departments = Department.objects.all()
        
        # Find departments without staff
        empty_departments = []
        for dept in all_departments:
            staff_count = dept.staff_members.count()
            if staff_count == 0:
                empty_departments.append(dept)
        
        if not empty_departments:
            self.stdout.write(
                self.style.SUCCESS('✓ No departments without staff found. All departments have staff members.')
            )
            return
        
        # Display departments without staff
        self.stdout.write(
            self.style.WARNING(f'\nFound {len(empty_departments)} department(s) without staff:\n')
        )
        
        for idx, dept in enumerate(empty_departments, 1):
            name = dept.name_uz or dept.name_ru or 'No Name'
            status = 'Active' if dept.is_active else 'Inactive'
            status_color = self.style.SUCCESS if dept.is_active else self.style.WARNING
            self.stdout.write(
                f'{idx}. ID: {dept.id} | Name (UZ): {name} | Status: {status_color(status)}'
            )
            if dept.name_ru:
                self.stdout.write(f'   Name (RU): {dept.name_ru}')
        
        # Ask for action
        self.stdout.write('\n' + '='*60)
        self.stdout.write('Choose an action:')
        self.stdout.write('1. Activate (set is_active=True)')
        self.stdout.write('2. Deactivate (set is_active=False)')
        self.stdout.write('3. Exit without changes')
        self.stdout.write('='*60)
        
        while True:
            choice = input('\nEnter your choice (1, 2, or 3): ').strip()
            
            if choice == '1':
                self.activate_departments(empty_departments)
                break
            elif choice == '2':
                self.deactivate_departments(empty_departments)
                break
            elif choice == '3':
                self.stdout.write(self.style.WARNING('Exiting without making changes.'))
                break
            else:
                self.stdout.write(
                    self.style.ERROR('Invalid choice. Please enter 1, 2, or 3.')
                )
    
    def activate_departments(self, departments):
        """Activate all empty departments (set is_active=True)."""
        updated_count = 0
        for dept in departments:
            if not dept.is_active:
                dept.is_active = True
                dept.save(update_fields=['is_active'])
                updated_count += 1
                name = dept.name_uz or dept.name_ru or 'No Name'
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Activated: {name} (ID: {dept.id})')
                )
        
        if updated_count == 0:
            self.stdout.write(
                self.style.WARNING('All departments are already active. No changes made.')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\n✓ Successfully activated {updated_count} department(s).')
            )
    
    def deactivate_departments(self, departments):
        """Deactivate all empty departments (set is_active=False)."""
        updated_count = 0
        for dept in departments:
            if dept.is_active:
                dept.is_active = False
                dept.save(update_fields=['is_active'])
                updated_count += 1
                name = dept.name_uz or dept.name_ru or 'No Name'
                self.stdout.write(
                    self.style.WARNING(f'✓ Deactivated: {name} (ID: {dept.id})')
                )
        
        if updated_count == 0:
            self.stdout.write(
                self.style.WARNING('All departments are already inactive. No changes made.')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\n✓ Successfully deactivated {updated_count} department(s).')
            )

