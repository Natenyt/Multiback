Here is the comprehensive, architectural design specification for the **Department Staff Dashboard**. This document serves as the "source of truth" for the UI/UX.

---

# **System Design Document: Department Staff Dashboard**

### **1. Design Philosophy**
* **Vibe:** "Serious Modern." It uses a clean, high-contrast palette (Slate Grey, Government Blue, White, Black) to reduce eye strain for staff working 8-hour shifts.The ui should be modern and user friendly.
* **Layout:** **Persistent Sidebar**. We avoid Top Navigation bars to maximize vertical screen space for lists and chat histories.
* **Interaction Model:** **Split-View ("Master-Detail").** The user selects an item from a list on the left, and the details appear on the right. This mimics desktop email clients (Outlook, Superhuman) for maximum efficiency.

---

### **2. Navigation Structure (The Sidebar)**
The sidebar remains fixed on the left side of the screen at all times.

**Menu Items:**
1.  **📊 Dashboard:** The "Morning Coffee" view. Overview statistics and motivation.
2.  **📥 Unassigned (Inbox):** The "Marketplace." Tickets waiting to be picked up.
3.  **✅ Assigned to Me:** The "Workspace." Tickets currently being handled.
4.  **🏁 Closed:** The "Archive." History of resolved issues.
5.  **🔎 Global Search:** A dedicated button to search the entire database (all statuses) by phone number or ID.

---

### **3. Page-by-Page Specifications**

#### **A. The Dashboard Overview (Home)**
This is the first screen the staff sees upon login. It answers: *"How busy are we?"* and *"How am I doing?"*

* **Top Row: Critical Metrics Cards**
    * **Unassigned Tickets (Red):** The panic number. Large, bold font. E.g., **"14 Waiting"**.
    * **My Active Sessions (Blue):** How many chats I currently have open. E.g., **"3 Active"**.
    * **My Solved Today (Green):** Positive reinforcement. E.g., **"8 Closed"**.
    * **My Completion Rate:** Percentage of picked tickets vs. closed tickets.


* **Widget: My average response time**
    shows a average response time of the staff member.

* **Widget: "The Race" (Personal Best)**
    * A prominent card displaying the staff member's historical record versus today's performance.
    * *Visual:* "Today you closed **8** tickets. Your daily record is **12**. You are 4 away from a new record!"

* **Widget: The "Elite 10" Leaderboard**
    * A compact table showing only the Top 10 staff members across the *entire* district (all 70 departments).
    * *Columns:* Rank (#1), Name, Department, Total Solved.
    * *Logic:* If the current user is NOT in the Top 10, show their rank at the very bottom of the widget (e.g., "You: #42") to keep them grounded.

* **Widget: The Hokim's Broadcast (Banner)**
    * A high-visibility alert box at the very top.
    * *Content:* Messages from the Superuser (e.g., "System maintenance at 2:00 PM" or "Emergency meeting").
    * *Action:* "Acknowledge" button.

---

#### **B. The Ticket Sections (Unassigned / Assigned / Closed)**
These three pages share the same **Split-View Layout**, but the logic inside the "Chat Pane" changes.

**Layout: The Split-View**
* **Left Pane (The Queue):** Occupies 30% of the screen width. Scrollable list of tickets.
* **Right Pane (The Stage):** Occupies 70% of the screen width. The actual conversation.

**The List Header (Left Pane Tools)**
At the top of the Left Pane, there are **two critical tools**:
1.  **Search Bar:** Searchs the *current list* by Citizen Name or Phone number, Neighborhood and session_id.
2.  **Neighborhood Filter (Mahalla):** A dropdown menu listing all neighborhoods in the district.
    * *Use Case:* "I am the electricity specialist for the 'Tinchlik' neighborhood. I select 'Tinchlik' in the dropdown, and now I only see tickets from my territory."

**The List Item Card**
Each ticket in the list displays:
* **Session ID:** (e.g., "1234567890").
* **Location:** (e.g., "Tinchlik, Uzbekistan").
* **Citizen Name:** (e.g., "Alisher Usmanov").
* **Time:** (e.g., "10m ago" or "Yesterday").
* **Neighborhood Tag:** Small badge showing where they are from.
* **Preview Text:** The first 60 characters of their message. (e.g., "My street light is broken and...")

---

#### **C. The Chat Interface (Right Pane Logic)**

This area changes based on which section (Unassigned vs. Assigned) you are in.

**1. "Unassigned" Mode (The Viewing Mode)** only works in Unassigned section.
* **Chat History:** Visible. The staff can read the citizen's complaint to understand the context.
* **Input Bar:** **HIDDEN.**
* **Action Area:** full-width button at the bottom: **"Assign to Me"**.
    * *Logic:* Clicking this moves the ticket from "Unassigned" to "Assigned," unlocks the input bar, and notifies the user that "Staff Member [Name] has joined."

**2. "Assigned" Mode (The Working Mode)**
* **Chat History:** Visible.
* **Input Bar:** **Unlocked.**
    * **Text Field:** Standard typing area.
    * **📎 Attachment:** Icon to upload documents/images.
    * **⚡ Quick Replies:** A lightning bolt icon. Clicking it opens a small menu of pre-set Uzbek phrases (Greetings, Asking for Location, Closing remarks). Clicking a phrase auto-fills the text field.
* **Header Actions (Top Right):**
    * **⏸️ Hold:** Changes status to "On Hold." Used when waiting for a repair crew. Extends the auto-close timer.
    * **⚠️ Escalate (Not My Department):**
        * *Replacing Transfer:* This button immediately removes the ticket from the current staff's dashboard.
        * *System Action:* Flags the ticket as `status: escalated` and sends it to the **Superuser Dashboard** for manual re-routing. This protects the database from bad routing data.
    * **✅ End Session:**
        * *Action:* Opens a confirmation modal ("Are you sure the issue is resolved?").
        * *Result:* Moves ticket to "Closed" section.

**3. "Closed" Mode (The Archive)**
* **Chat History:** Visible (Read-only).
* **Input Bar:** Disabled. Text says: "This session is closed."

---

### **4. User Flow Summary**

1.  **Staff logs in** via Username/Password.
2.  **Lands on Dashboard:** Sees "12 Unassigned Tickets" (Red).
3.  **Clicks "Unassigned":**
    * Uses **Neighborhood Filter** to select "Yangiobod" (his territory).
    * sees a ticket "No water in street".
4.  **Clicks Ticket:** Reads the details in the preview pane.
5.  **Decides:** "Yes, I handle water in Yangiobod."
6.  **Clicks "Assign to Me":** Input bar unlocks.
7.  **Uses Quick Reply:** Selects "Greeting" (Assalomu alaykum...).
8.  **Solves Issue:** Chats with citizen.
9.  **Clicks "End Session":** Ticket moves to Closed history.
10. **Result:** His "Personal Best" counter goes up by +1.



The content of the website is strictly in Uzbek. But the word Ticket can stay in English.