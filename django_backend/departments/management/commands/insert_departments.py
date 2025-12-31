"""
Django management command to insert departments from SQL file.
Usage: python manage.py insert_departments
"""
from django.core.management.base import BaseCommand
from django.db import connection
from pathlib import Path
import os


class Command(BaseCommand):
    help = 'Insert department data from SQL file into the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--sql-file',
            type=str,
            help='Path to SQL file (default: sql/insert_department.sql in project root)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show SQL without executing it',
        )

    def handle(self, *args, **options):
        # Get the SQL file path
        if options['sql_file']:
            sql_file_path = Path(options['sql_file'])
        else:
            # Default: sql/insert_department.sql in project root
            project_root = Path(__file__).resolve().parent.parent.parent.parent.parent
            sql_file_path = project_root / 'sql' / 'insert_department.sql'
        
        if not sql_file_path.exists():
            self.stdout.write(
                self.style.ERROR(f'Error: SQL file not found at {sql_file_path}')
            )
            return
        
        self.stdout.write(f'Reading SQL file: {sql_file_path}')
        
        # Read the SQL file
        try:
            with open(sql_file_path, 'r', encoding='utf-8') as f:
                sql_content = f.read()
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error reading SQL file: {e}')
            )
            return
        
        if options['dry_run']:
            self.stdout.write(self.style.WARNING('DRY RUN - SQL content:'))
            self.stdout.write(sql_content[:500] + '...' if len(sql_content) > 500 else sql_content)
            return
        
        # Execute the SQL
        self.stdout.write('Executing SQL statements...')
        try:
            with connection.cursor() as cursor:
                # Execute the SQL content
                cursor.execute(sql_content)
                affected_rows = cursor.rowcount
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Successfully executed SQL. Rows affected: {affected_rows}'
                    )
                )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error executing SQL: {e}')
            )
            import traceback
            self.stdout.write(traceback.format_exc())
            return
        
        self.stdout.write(
            self.style.SUCCESS('✓ Department data insertion completed successfully!')
        )

