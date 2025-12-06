from .models import Session, Message
from departments.models import Department

def route_message(payload):
    """
    Routing logic called after AI analysis.
    Payload: {department_id, session_uuid, message_uuid}
    """
    
    session_uuid = payload.get('session_uuid')
    department_id = payload.get('department_id')
    message_uuid = payload.get('message_uuid')
    
    print(f"--- ROUTING MESSAGE ---")
    print(f"Session: {session_uuid}")
    print(f"Target Dept ID: {department_id}")
    
    try:
        session = Session.objects.get(session_uuid=session_uuid)
        department = Department.objects.get(id=department_id)
        
        # Update Session
        session.assigned_department = department
        session.save()
        
        print(f"SUCCESS: Session {session.id} assigned to Department '{department.name_uz}'")
        print(f"Notification sent to dashboard (Mock)")
        
    except Session.DoesNotExist:
        print(f"ERROR: Session {session_uuid} not found")
    except Department.DoesNotExist:
        print(f"ERROR: Department {department_id} not found")
    except Exception as e:
        print(f"CRITICAL ROUTING ERROR: {e}")
