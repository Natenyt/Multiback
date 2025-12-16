# PowerShell script to start both Django and Next.js servers

Write-Host "Starting Dashboard Servers..." -ForegroundColor Green

# Start Django server
Write-Host "`nStarting Django backend on http://localhost:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd django_backend; python manage.py runserver"

# Wait a moment for Django to start
Start-Sleep -Seconds 3

# Start Next.js server
Write-Host "Starting Next.js frontend on http://localhost:3000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd node_backend/staff-dashboard; npm run dev"

Write-Host "`nBoth servers are starting!" -ForegroundColor Green
Write-Host "Django: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Next.js: http://localhost:3000" -ForegroundColor Yellow
Write-Host "`nOpen http://localhost:3000 in your browser or Cursor's Simple Browser" -ForegroundColor Magenta













