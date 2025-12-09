Based on the "Department Staff Dashboard" design specification, here is the complete list of endpoints you need to build. I have grouped them by the specific UI section they power.

### **1. The Dashboard (Home View)**

These endpoints power the "Morning Coffee" view. You want to load these immediately upon login.

| Method | Endpoint | Purpose | Data Required |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/dashboard/stats/` | Populates the **Top Row Cards** and **Personal Best**. | Returns: `{ unassigned_count, active_count, solved_today, completion_rate, avg_response_time, personal_best_today, personal_best_record }` |
| **GET** | `/api/dashboard/leaderboard/` | Populates the **"Elite 10" Widget**. | Returns list of top 10 users + the current user's rank/stats if they are outside the top 10. |
| **GET** | `/api/dashboard/broadcast/` | Checks for **Hokim's Broadcast**. | Returns the active message text and ID. If null, hide the widget. |
| **POST** | `/api/dashboard/broadcast/{id}/ack/`| **"Acknowledge" button**. | Marks the message as read for this user so it doesn't appear again. |

-----

### **2. The Ticket Lists (Sidebar & Queue)**

This single robust endpoint handles the "Unassigned", "Assigned", "Closed", and "Global Search" views.

| Method | Endpoint | Purpose | Filters (Query Params) |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/tickets/` | **The Main List.** Fetches tickets based on the selected sidebar menu and filters. | `?status=unassigned` (Inbox)<br>`?status=assigned` (My Workspace)<br>`?status=closed` (Archive)<br>`?neighborhood_id=X` (Dropdown Filter)<br>`?search=...` (Global Search) |
| **GET** | `/api/neighborhoods/` | **Neighborhood Filter.** Populates the dropdown menu. | Returns list: `[{id: 1, name: "Tinchlik"}, ...]` |

**Note on the Ticket Object:**
Ensure the `/api/tickets/` list returns the following JSON structure to match your UI card:

```json
{
  "session_id": "1234567890",
  "location": "Tinchlik, Uzbekistan",
  "citizen_name": "Alisher Usmanov",
  "created_at": "2023-10-27T10:00:00Z", // Frontend calculates "10m ago"
  "neighborhood": "Tinchlik",
  "preview_text": "My street light is broken..."
}
```

-----

### **3. Chat Interface & Logic (The Right Pane)**

These endpoints manage the conversation and the state transitions (Unassigned → Assigned → Closed).

#### **A. Conversation Data**

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| **GET** | `/api/tickets/{id}/history/` | **Load Chat.** Fetches the conversation history for the selected ticket. |
| **POST** | `/api/tickets/{id}/message/` | **Send Message.** Handles text input and file attachments. |
| **GET** | `/api/quick-replies/` | **⚡ Quick Replies.** Fetches the list of pre-set Uzbek phrases (e.g., "Assalomu alaykum..."). |

#### **B. Ticket Actions (State Changes)**

| Method | Endpoint | UI Trigger | Logic |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/tickets/{id}/assign/` | **"Assign to Me" Button** | Changes status to `assigned`, sets `assignee = current_user`. Unlocks input bar. |
| **POST** | `/api/tickets/{id}/hold/` | **⏸️ Hold Button** | Changes status to `on_hold`. Pauses SLA timer. |
| **POST** | `/api/tickets/{id}/escalate/`| **⚠️ Escalate Button** | Changes status to `escalated`, removes assignee. Ticket vanishes from staff view and goes to Superuser. |
| **POST** | `/api/tickets/{id}/close/` | **✅ End Session** | Changes status to `closed`. Moves ticket to history. Updates "Solved Today" counter. |

-----

### **4. Statistics on Demographics (Optional but Recommended)**

Since you are dealing with government data, you might eventually need to display who is sending tickets. If you add a "Demographics" tab later, here is the data structure you should prepare for.

**District Ticket Demographics (Example Data):**

  * **Neighborhood Distribution:** Tinchlik (15%), Yangiobod (12%), Dustlik (8%).
  * **Gender:** Male (62%), Female (38%).
  * **Age Groups:** 18-25 (20%), 26-40 (45%), 40-60 (25%), 60+ (10%).

### **Summary Checklist**

1.  **Dashboard:** 4 GET endpoints, 1 POST.
2.  **Lists:** 1 Master GET endpoint (with filters), 1 Helper GET (neighborhoods).
3.  **Chat:** 1 GET (history), 1 POST (send), 1 GET (quick replies).
4.  **Actions:** 4 POST endpoints (Assign, Hold, Escalate, Close).

**Total Endpoints to Build: \~15**