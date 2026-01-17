# Test Suite Documentation

## Overview

This test suite provides comprehensive coverage for the CivicConnect platform, including:
- Django REST API endpoints
- FastAPI microservice endpoints
- WebSocket consumers
- Webhook integrations
- End-to-end message flows

## Test Structure

```
tests/
├── conftest.py                    # Shared fixtures and configuration
├── test_auth_endpoints.py        # Authentication tests
├── test_ticket_endpoints.py      # Ticket/Message CRUD tests
├── test_dashboard_endpoints.py   # Dashboard stats and leaderboard
├── test_webhook_endpoints.py     # Internal and AI webhooks
├── test_media_endpoints.py       # Media proxy endpoints
├── test_websocket_consumers.py   # WebSocket consumer tests
├── test_fastapi_integration.py   # FastAPI service integration
└── test_integration_flows.py     # End-to-end flow tests
```

## Test Categories

### Unit Tests
- Individual endpoint functionality
- Model validation
- Serializer behavior
- Permission checks

### Integration Tests
- Full message flow (Telegram → Django → AI → Webhook)
- WebSocket real-time updates
- Cross-service communication

### WebSocket Tests
- Connection authentication
- Message broadcasting
- Group management
- Permission validation

## Fixtures

Key fixtures available in `conftest.py`:
- `api_client`: REST API client
- `citizen_user`: Test citizen user
- `staff_user`: Test staff user
- `department`: Test department
- `staff_profile`: Staff profile linked to user
- `telegram_session`: Telegram-origin session
- `web_session`: Web-origin session
- `assigned_session`: Assigned session
- `message`: Test message with content
- `authenticated_citizen_client`: Authenticated citizen API client
- `authenticated_staff_client`: Authenticated staff API client

## Mocking

Tests use mocks for:
- External API calls (Telegram, AI services)
- Background tasks (Celery)
- File operations
- WebSocket channel layers

## Continuous Integration

Tests are designed to run in CI/CD pipelines with:
- Isolated database per test
- Mocked external dependencies
- Fast execution (< 2 minutes for full suite)

## Coverage Goals

- API Endpoints: 90%+
- WebSocket Consumers: 85%+
- Webhook Handlers: 90%+
- Integration Flows: 80%+




