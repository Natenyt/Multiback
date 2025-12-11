# Quick Start Guide - Running Tests

## Installation

```bash
# Install test dependencies
pip install pytest pytest-django pytest-asyncio pytest-cov channels-test httpx

# Or install from requirements
pip install -r tests/requirements.txt
```

## Quick Commands

### Run All Tests
```bash
cd django_backend
pytest tests/
```

### Run Specific Test File
```bash
pytest tests/test_auth_endpoints.py
pytest tests/test_ticket_endpoints.py -v  # verbose output
```

### Run with Coverage
```bash
pytest tests/ --cov=. --cov-report=html
# Open htmlcov/index.html in browser
```

### Run FastAPI Tests
```bash
cd fastapi_microservice
pytest tests/
```

## Test Categories

### Mark Tests
```bash
# Run only integration tests
pytest -m integration

# Run only unit tests
pytest -m unit

# Run database tests
pytest -m django_db
```

## Common Issues

### Database Errors
- Tests use isolated test database
- Run `pytest --create-db` if database doesn't exist

### Import Errors
- Ensure you're in the `django_backend` directory
- Check that all dependencies are installed

### WebSocket Test Failures
- Ensure Redis is running (for channel layers)
- Or use in-memory channel layer for tests

## Test Structure

```
tests/
├── conftest.py              # Shared fixtures
├── test_auth_endpoints.py   # Authentication
├── test_ticket_endpoints.py # Tickets & Messages
├── test_dashboard_endpoints.py
├── test_webhook_endpoints.py
├── test_media_endpoints.py
├── test_websocket_consumers.py
├── test_fastapi_integration.py
└── test_integration_flows.py
```

## Expected Output

```
======================== test session starts ========================
platform win32 -- Python 3.x.x
collected 80+ items

tests/test_auth_endpoints.py::TestStaffLogin::test_staff_login_success PASSED
tests/test_ticket_endpoints.py::TestTicketList::test_ticket_list_unassigned PASSED
...

======================= 80+ passed in 45.23s =======================
```




