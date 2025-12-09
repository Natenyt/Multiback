ok i will now first send the whole descriptio but you don't start coding, i ll guide myself ok. first read the whole description

⭐ FULL UPDATED DESCRIPTION (WITH ALL IMPROVEMENTS ADDED)

When a user visits the website, they see a modern, minimal, and clear interface with a horizontal top navbar.

NAVBAR
Left Side

District logo

Acronym NTMP (Narpay Tumani Murojaatlari Portali)

A thin 1px underline under NTMP to subtly increase trust and identity.

Right Side (Burger Menu)

When opened:

Profile

Mening Murojaatlarim

Asadbek AI

About

Bottom of Navbar

A small horizontal container with:

UZ / RU language toggles

Selected language has white filled background

Theme toggle buttons (light/dark icons)

Navbar remains sticky across all pages except the Chat UI.

HOME PAGE

Centered near the top is the introductory text:

“Narpay tumani uchun birinchi sun’iy intellekt asosida ishlovchi murojaat portali.”

“Ushbu sayt Narpay tumani fuqarolari uchun murojaatlarni yanada oson va qulay tarzda yuborishga yordam beradi.”

A friendly small line under it:
“Murojaatlaringiz biz uchun muhim.”

Below that:

A neutral instruction line:
“Murojaat yuborish uchun pastdagi tugmani bosing yoki bizning AI bilan suhbatlashish uchun Asadbek AI ni bosing.”


there Buttons

Send an Appeal

Asadbek AI
Mening Murojatlarim

Background

use the image uploaded firt one for desktop and the second for mobile , mobile width is 390px

Symbolizing seriousness, clarity, AI identity, and trust

⭐ SEND APPEAL FLOW
1. Authentication Popup
Stage 1 — Enter Phone Number

Field prefilled with +998

Button: Send Code

After pressing Send Code:

OTP field appears

A timer appears on the right

“Send Code” button becomes “Send Again”

Improvement

When the last OTP digit is entered and correct →
tiny green checkmark animation confirming success

No confirm button.
Validation is automatic.

you will use these endpoints for this flow:
    path('auth/send-otp/', SendOTPView.as_view(), name='send_otp'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),

2. Popup Expands → Fullscreen Form

A smooth animation expands the popup into a fullscreen appeal form.

Top Text

“To send an appeal please fill out all fields, write your appeal, and press Send.”

Section 1: Shaxsiy Ma’lumotlar

Full Name

Phone Number (prefilled, uneditable)

Section 2: Murojaat Tafsilotlari

Neighborhood (searchable dropdown)

Location (with faint placeholder example)

Appeal Text Field

Tools on the Appeal Text Field
Attachment Tool (bottom-left)

Shows a vertical list:

Camera

Photo or Video

File

Location

Line-style icons; no color.

Improvement

When media is attached:

A small horizontal preview bar appears above the text field
(very minimal, clean, collapses automatically)

Voice Message Button (bottom-right)

Push-to-talk

Center microphone animation reacts to voice

On release, voice message attaches automatically

Bottom Buttons

Cancel (left)

Send Appeal (right)

Navbar stays visible at the top.
the data of feilds Full name, Neighborhood, Location will be saved using the api "users/profile-save/" patch method, and the appeal message is created with and the appeal sessionis created with 'appeals/create/' post method.

⭐ CHAT UI (AFTER SENDING APPEAL)

Once the appeal is sent:

Chat UI opens

Navbar disappears for full immersion

Chat Header

Left: Back arrow (<)

Center: Phantom circle avatar + “?”

Right: Options (three dots)

Copy Session ID

Waiting State

Input bar is disabled

Overlay message shows:
“Sizning murojaatingiz qabul qilindi. Tez orada operator javob beradi.”

When Staff Connects

Phantom avatar becomes staff’s real avatar

Staff name appears

Green status dot appears next to avatar

Overlay text replaced:
“Xodim [name] suhbatga qo‘shildi.”

Input bar becomes active

Typing Indicator (Improvement)

When staff is typing:

“Xodim yozmoqda…” appears subtly under the header

Staff Profile Popup

When clicking avatar/name:

Full Name

Department Name (localized based on user language)

Job Title

Avatar

A minimal shield icon next to the name serving as a verification badge

⭐ Mening Murojaatlarim (My Appeals)

List layout similar to Telegram.

Each item shows:

Avatar (staff or phantom)

Staff full name (if assigned)

Status badge (Open(meaning assigned)/ Pending / Closed)

Message preview

Timestamp

Improvements Added

A filter dropdown with:

All

Active

Closed

Clicking an Item

Opens the chat UI.

If the session is closed:

Input bar visible but disabled

Overlay:

“Bu sessiya yopilgan. Iltimos, yangi murojaat yuborish uchun tugmani bosing.”

Small button: Send New Appeal

⭐ Asadbek AI Page

When selecting Asadbek AI:

A 2-second loading animation simulating “AI initializing”

Then the Asadbek AI interface appears:

Clean greeting

Tools/options like: Create Notes, Reminders, Analyze Reels, etc.

Matches the style of the second screenshot you provided

⭐ Accessibility & UX Refinements (Behind the Scenes)

These improvements don’t alter design, but improve usability:

Slight contrast boosts

Larger tap areas

Font size minimum: 16–17px

Keyboard focus indicators

Smooth micro-animations for transitions

Fully responsive on very small devices

⭐ Final Touch: Appeal Status Progress Bar

Inside the chat header, a small 3-step line:

“Yuborildi → Biriktirildi → Yakunlandi”

Subtle, clean, extremely helpful


tech stack, 
Next.js
Tailwind.css
Typescript
Frame-motion
Shadcn ui optionally.
and you can use any other ui library if you want.

create a seperate folder for this web inside @node_backend and create the frontedn there

i have uploaded images,

the first image is  sketch image of the home page , you have to take reference from it but make it better more cocise and neat and please give the Asadbek AI button a magic button design , give it blue and purple gradient stroke circling the button.  

you can use the second image as the background for desktop and the third image for mobile, the forth image is the log, the fifth image is the reference image of the chat ui

please leave the asadbek ai button as static , and don't build the asadbek ai view yet


