All of the endpoints has been tested passed all the test suites, now we should move on to start building the frontend.
The dedicated frontend development directory is @node_backend/ .
The frontend tech stack is
Next.js
Typescript
Tailwind CSS
Shadcn/ui
Lucide-React
and optional other libraries based on need and situation!

Here is the image of the dashboard design we will be copying. Important: we are not copying the dashboard exactly in the image but taking heavy reference on its design and vibe. We build our frontend based on our description but the design vibe and feel be exactly the same as in the image i uploaded. To not get confused, the first image uploaded is the reference dashboard image, it is probably named as reference_dashboard.
You can find the logo.svg from @svg_files/ , the logo is specifically named logo and it is a svg file, plus there is AI svg which will serve as the icon for Asadbek AI section in side bar and later for some other cases as well.


Plan:
So basically the current plan is to build a one dashboad layout that is used by all Department staff members. The data is just different. For handling these we already have endpoints ready. 

The dashboard design is taken from the image i uploaded, The sidebar top left is the place to place the logo 
@svg_files/logo.svg and the sidebar sections include(keep this order), Dashboard, Tayinlanmagan, Tayinlangan, Arxiv, Global qidiruv, Asadbek AI. You have to choose the corresponding lucide react icons and put them righ nex to the Section names but for Asadbek AI, you will use this svg @svg_files/AI.svg as icon.

and at the bottom of the just like in the reference image we have the staff avatar , and full name and below it their email if it doesn't exist then we insted a display a text "emailnot@registered.com" just to keep the ui intact and also cuz we are not focing email use!.
I have just realized that we don't have a specific endpoint that retrevies the staff information , that we will be needing specifically to display that staff avatar full name and email at the bottom of the side bar. We first we will build that! 

We have too also write the Name of the Project right next to after the logo at top left of the sidebar.  
