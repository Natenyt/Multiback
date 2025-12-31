So before I give you task on the project let me fully explain the project to you so you will have and maintain a solid context awareness throughout the project. But please keep in mind that you do not start coding after this message you will wait for my instructions to start coding. Ok then here below you ll find description of the project.

So the project is a messaging platfrom for district governments, where people can send message and requests, complaints, inquiries, question and so on from telegram bot or from website. This messages once recevied and saved and created session by our django backend it will be sent to fastapi microservice for injection detection and classification to find the right department to route the message to so it can be handled by the right department and user finds the right response to their message. We essentially building a messaging platfrom where it bridging the user and the department staffs with each other. Let me explain the project in more detail. Users can send messages from both telegram bot and website. When a user sends a message from telegram or website we first always save them in our database and create a session for them if the user has no open sessions. if the user has open session and the assigned_department field is not null then we connect the message to the session, but the assigned_admin can't be null and at the same time the session cannot exist before the message is saved, cuz message is the initator of the session, so it will be created when the message is saved. and in that situation assigned_department will yet be null, cuz the message we saved is the first message and it haven't be send to microservice to be processed and found a department for it. that is why before sending the message to microservice we need to check if the assigned_department is null or not, if it is null then we need to send the message to microservice to be processed and found a department for it but if it is not null then messages will be automatically connected to the open session and we look up the assigned department field from Session table and then call the function responsible for routing messages to departments, and provide the message and the assigned_department to the function. So if bascially if assigned_department is not null then do not call microservice rather route to that assigned department. 
Now let's talk about the the scenario where the assigned_department is null, then we call fast api and provide the message with gemini settings like "model": "gemini-2.5-pro",
 "temperature": 0.2,
 "max_tokens": 500, 

(always as soon as fastapi microservice recevies call we should start timer to keep a track of time spent for processing the message)
 now once message is recevied by fastapi the message initally goes through the first level of the microservice, language detect language detection is very simple we check weather the message is in latin alphabet or in russian, latin = uz , russian = ru. and the second level of microservice. which is injeciton detector function that process the message and looks for potential injections this function will return results like in_injection True or false and risk_score 0.0 to 1.0. if injection detector returns is_injection=True then the process should be terminated from this moment and fast api  should make an api call with results and message_uuid to django backend injection_handler handler function which it will save the results to InjectionLog and quarantine the message and then it will send notification about the message with injection and user_uuid and some import info to the superuser dashboard.
 But if injection_detector return in_injection_False then we safely forward the message to embed function where which it will use gemini embed model to embed the message before doing semantic search in the qdrant vector database. Once the message is embedded then we call semantic search function where it will use qdrant semantic search to find the most 3 compatible department to the message we embedded.  but we have to use the results of the language detect function to call the semantic search function, if the language is uz then we do search only for the uz written version of the department but if language russian then search will be for ru. This increases effeciency so we don't do mixed bloated search.
 the search function should return the 3 top id name similarity score candidates with their description as well in json format. once we get the results from the search function then we should call the function responsible for creating a prompt for gemini which will include the top candidates and their descriptions also we have to provide the message to the prompt maker function. we should tell the gemini that it needs to choose the most compatible department and return the id and the name of the department as the result plus it should aslo return confidence score of the department as well and reason why it chose that department. then the prompt goes to the gemini to the model was specified  in the json payload made to miscroservice from django backend. once we get the results from the gemini, we should call the dedicated django api that responsibe for saving all this results to AIAnalysis and calling the function responsible for routing the message to the department.
 the message routing function will send the message to the dashboard of the suggesteddepartment and plus it will fetch all the admins belonging to the department and send the message to their telegram as well.

 That is the whole process, we ll later add logs and statistics as well.

 The frontend dashboards will be build with node and next.js typescript react


 important detail: the sessions are like chats, which will appear like chats in the dasboards of department. and when a new sessions is created it will department staff assign themselves byt opening it and it will permanetly locked to them , the ui of this session is exactly like a chat a back and forth of messages, and once the department staff notices that the user's request has been resolved they close the session by the button end session. This will update the session status to closed and but the staff might forget to close the session that is why we will automatically close the session after 24 hours of inactivity. plus we will add a feature hold button that will hold the session for 2 days of inactivity. after 2 days of inactivity the session will be closed automatically.  


 well performance we will use reddis + celery for microservices and plus wherever it is necessary across the project. 



 Feedback loop feature:
Current Logic: we have an operator dashboard where they can correct the department. The Opportunity: we are sitting on a goldmine of training data.

Suggestion: Implement a "Dynamic Vector Upsert" workflow. If the AI routes a message to "Water Dept" but the Admin manually moves it to "Roads Dept":

Django detects this "Correction Event."

Django sends the original message text + the Corrected Department ID back to the FastAPI microservice.

FastAPI embeds this text and upserts it into Qdrant labeled as "Roads Dept."

Result: The system learns from its mistakes in real-time. Next time a user sends a similar message, Qdrant will find this "Corrected" vector and route it correctly.


i wanna make a crucial change to the project, having operator is fine they will be needed one day but actually i see that rather that just allowing only operator to correct the department we should allow the department staff to correct the department as well. This is effecient and faster. everytime before they start asnwering the message we ask them if they think this this message was sent to right department and select the right department and if so explain why and we also tell them that this is for training our model so they won't be reluctant do to it. and it will stay etheir if it was routed correctly or staff says it is not then it will be sent to the department they have corrected to.



and here is the solutio to burst problem where users send mulitple message after one another and  they are short like hi or hello or spamming.


By changing the User Interface (UI) logic, you solve the Backend Complexity problem entirely. You are effectively moving from a "WhatsApp Model" (instant, chatty, bursty) to a "Ticket-to-Chat Hybrid Model".

This approach is actually standard for high-volume support systems (like Intercom, Zendesk, or Government portals) because it forces the user to provide high-quality context right at the start.

Here is why this design is superior for your specific use case and how we will implement the "Lock Mechanism".

The New "Ticket-to-Chat" Workflow
The "Gatekeeper" UI (Frontend)

Instead of an open chat bar, the user sees a button: "New message".

Clicking it opens a Modal/Popup.

Prompt: "Please describe your issue in detail so we can route you to the right department."

Validation: You can enforce a minimum character count (e.g., min 20 chars) to prevent "Hello" or "Test".

The "Lock" State (Frontend + Backend)

User clicks Submit.

Frontend: Immediately replaces the form with the Chat Interface.

Crucial Change: The input bar at the bottom is Disabled/Greyed Out.

Status Message: "Your request is being processed by the system. Please wait for a staff member to join."

The Processing (Backend - No Burst Logic Needed)

Since the input is locked, the user cannot send Message #2.

We don't need Redis timers or aggregators. We just take that single, high-quality paragraph and send it to FastAPI immediately.

Django creates the Session.

The "Unlock" Trigger (The Handover)

The system routes the session to the "Sanitation Dept".

Staff Member opens the dashboard, reads the issue, and types: "Hello, we are sending a truck."

The Trigger: When the Frontend receives a message where is_staff_message=True, it Unlocks the input bar.

Now the user can reply: "Thank you, they just arrived."

Impact on Database & API
This simplifies your data model and API requirements significantly.

1. Session Model Update We don't strictly need a new field, but a helper property makes the frontend logic easier.

Python

# In models.py (Session)

@property
def is_locked_for_user(self):
    """
    Returns True if the session is new and NO staff has replied yet.
    """
    # If session is closed, it's locked.
    if self.status == 'closed':
        return True
        
    # If it's open, check if any staff message exists.
    # We optimize this query in the view to avoid N+1 problems.
    has_staff_reply = self.messages.filter(is_staff_message=True).exists()
    
    return not has_staff_reply
2. API Response When the Frontend fetches the Session details, Django sends this flag:

JSON

{
  "session_uuid": "...",
  "status": "open",
  "is_locked": true,  // Frontend disables input
  "messages": [...]
}
Why this is perfect for Government Context
Eliminates "Hello" Spam: Citizens are forced to articulate their problem to get the "Submit" button to work.

Reduces AI Cost: You get 1 long, descriptive message (perfect for Embedding) instead of 5 short fragments (bad for Embedding).

Sets Expectations: It tells the citizen: "This is a formal request process, not a casual chat with a friend."

Final Consensus
We are scrapping the "Redis 10-second Aggregator". We are adopting the "UI Lock / Ticket-First" approach.



and one more thing we will have telegram bot as well for the users to send messages to the government, the logic is the same all messages are caught by django backend and sent to fastapi microservice and processed and then sent to the right department and user.

there is no verification for the telegram bot users at the registration process

but we do simple verificcation by sending one time code to their number when they are getting registered and then they have to enter the code to complete the registration process. 



Subject: Project Specification - "CivicConnect": AI-Powered Government Messaging Platform

Role: Act as a Senior Systems Architect and Lead Developer. Objective: Ingest this project architecture, understand the business logic, and prepare for implementation. DO NOT generate code yet. Acknowledge understanding and wait for specific task instructions.

1. Project Overview
We are building a messaging platform bridging citizens and district government departments. Users send inquiries (complaints, questions) via a Web Interface or Telegram Bot.

Core Function: Automate the routing of these messages to the correct government department using a microservices architecture and AI analysis.

Feedback Loop: The system must learn from routing errors via a dynamic vector upsert mechanism.

User Flow: A "Ticket-to-Chat" hybrid model to ensure high-quality initial context and prevent spam.

2. Tech Stack & Environment
Orchestrator/Backend: Django (Python). Handles DB, Session Management, Telegram Webhooks, API Gateway logic.

AI Microservice: FastAPI (Python). Handles Language Detection, Injection Checks, Embeddings, and Reranking.

Frontend: Next.js (TypeScript) + React.

Database: PostgreSQL (Relational), Qdrant (Vector Search).

Async/Queue: Redis + Celery.

AI Models: Gemini 2.5 Pro (Reasoning/Extraction), Gemini Embedding models.

Current Status: Qdrant is running on ports 6333 and 6334. GEMINI_API_KEY and TOKEN_BOT are available in .env.


3. The "Ticket-to-Chat" Workflow (Burst Prevention)
To prevent low-quality "Hello" spam, we are abandoning standard chat logic for a Lock Mechanism:

Initiation: User clicks "New Message". A Modal appears requesting a detailed description (min character validation).

The Lock: Upon submission, the Frontend replaces the form with a Chat Interface, but the Input Bar is Disabled/Locked.

Status: UI shows: "Processing request. Waiting for staff connection."

Backend Logic: Since the input is locked, no secondary messages can be sent. The single, high-quality paragraph is sent to the Backend -> Microservice.

The Handover (Unlock): When a Department Staff member accepts the session and replies, the Frontend detects is_staff_message=True and Unlocks the input bar. The session then becomes a standard bi-directional chat.

Note: Telegram Bot follows similar logic; the first message acts as the ticket initiator.

4. Data Flow & AI Pipeline (The "Brain")
A. Session Creation (Django)

Incoming message checks for an existing open session.

If Open Session & assigned_department exists: Route message directly to that department (Skip AI).

If New Session or assigned_department is Null: Create Session -> Send message payload to FastAPI Microservice.

B. FastAPI Microservice Pipeline (Timer starts upon receipt for performance tracking)

Language Detection:

Check script: Latin = uz, Cyrillic = ru.

Injection Detection:

Scan message for malicious prompts.

If is_injection=True: Stop process immediately. Return Payload to Django -> Log to InjectionLog -> Quarantine Message -> Notify Superuser Dashboard.

If is_injection=False: Proceed.

Vector Embedding:

Embed the cleaned message using Gemini Embedding model.

Semantic Search (Qdrant):

Filter search based on language (uz vs ru).

Retrieve Top 3 compatible Department candidates (ID, Name, Description, Similarity Score).

LLM Reranking & Routing (Gemini 2.5 Pro):

Construct a prompt containing: Original Message + Top 3 Candidates + System Instructions.

Settings: Temp 0.2, Max Tokens 500.

Goal: Gemini selects the single best department, provides a confidence score, and a reasoning string.

Completion: Return final routing decision to Django.

C. Finalizing (Django)

Save analysis to AIAnalysis table.

Update Session with assigned_department.

Route message to Department Dashboard + Notify Department Admins via Telegram.

5. Staff Dashboard & Feedback Loop (RLHF)
Session Management: Sessions appear as "Chats" in the specific Department Dashboard. Staff "Pick" a session to lock it to themselves.

Timeouts: Auto-close after 24h inactivity. "Hold" button extends logic to 48h.

Correction (Training Data):

Before answering, staff (or operator) verifies the department.

If Wrong: Staff selects the correct department and provides a reason.

Dynamic Upsert: Django detects this correction. It sends the Original Message Text + Correct Department ID back to FastAPI.

FastAPI Action: Embeds the text and upserts it into Qdrant labeled with the Corrected Department. This ensures the model learns from mistakes in real-time.

6. User Verification
Simple OTP (One Time Password) verification via SMS for both Web and Telegram registration. No complex identity verification required yet.

Task for Gemini:
Please confirm you have digested this architecture. Do not generate code yet. Acknowledge the distinction between the Django Orchestrator and the FastAPI AI Service, and the specific logic of the "Ticket-to-Chat" lock mechanism.