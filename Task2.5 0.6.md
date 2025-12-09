### 1. Resources & Metadata
*Used for dropdowns and form configuration.*

| Method | Endpoint | Purpose | UI Trigger |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/common/neighborhoods/` | Returns a list of neighborhoods for the dropdown. Searchable via query param `?search=`. | "Neighborhood (searchable dropdown)" in Appeal Form. |

---

### 2. Appeals (Murojaat)
*Used for the "Fullscreen Form" and "Mening Murojaatlarim" list.*

| Method | Endpoint | Purpose | UI Trigger |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/appeals/create/` | Creates a new session and message. Accepts `multipart/form-data` ( Text, **Attachments**, **Voice**). | "Send Appeal" button. |
| **GET** | `/api/appeals/` | Lists the user's appeals the sessions. Assigned Admin Name, assigned admin avatar, Status, last message timestamp, and last message of the session for preview. Needs filter params: `?status=active` or `?status=closed`. | "Mening Murojaatlarim" page. |
| **GET** | `/api/appeals/{uuid}/` | this is same as api/appeals/ but it returns the sepecific appeal session, that is for searching. 

---

### 3. Chat System (Human Operator)
*Used for the "Chat UI". Note: Real-time features like typing indicators and status updates will be handled by WebSockets (see section 6), but these HTTP endpoints are needed for history and media.*

| Method | Endpoint | Purpose | UI Trigger |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/chat/{appeal_uuid}/history/` | Loads previous messages for this appeal. | Opening the Chat UI. |
| **POST** | `/api/chat/{appeal_uuid}/send/` | Sends a message (Text, Image, File, Voice) to the operator. | Send button in Chat UI. |
| **GET** | `/api/users/staff/{id}/` | Get public details of the staff member (Name, Department, job title, avatar). | Clicking the Staff Avatar/Name. |

---

### 4. WebSockets (Django Channels)
*Required for the "Real-time" UX you described.*

Since you have features like **"Xodim yozmoqda..." (Typing)**, **"Xodim suhbatga qo‘shildi" (Staff joined)**, and the **Status Progress Bar**, you cannot rely solely on HTTP. You need a WebSocket route.

**Route:** `ws://localhost:8000/ws/chat/{appeal_uuid}/`

**Events to handle:**
1.  `chat.message`: Receiving a new text/voice message.
2.  `status.update`: Updates the "Sent → Assigned → Closed" progress bar.
3.  `staff.join`: Triggers the "Phantom avatar becomes staff avatar" animation.
4.  `typing.start` / `typing.stop`: Controls the "Xodim yozmoqda..." indicator.

---