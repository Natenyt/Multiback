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

and at the bottom of sidebar the just like in the reference image we have the staff avatar , and full name and below it their email if it doesn't exist then we instead a display a text "emailnot@registered.com" just to keep the ui intact and also cuz we are not focing email use!.
I have just realized that we don't have a specific endpoint that retrevies the staff information , that we will be needing specifically to display that staff avatar full name and email at the bottom of the side bar. We first we will build that! 

We have too also write the Name of the Project right next to after the logo at top left of the sidebar and it is NTMP


Now let me outline the design of the Dashboard section. 
For this section i am uploading an another reference_image2 , we will be copying the strcuture of the design of the reference_image2 but not its design, still we sticking with the desing of the reference_dashboard image. 


So in the dashboard section, Specifically at top left start of the page, place a search bar, and top right end side, place a notifcation button and language change button just like in the reference_image2, but ignore the staff profile. 
Then righ bottom of the search bar, we will have greeting text "Xush kelebsiz {staff_fullname}". On the righ end in the same row as the greeting text we place the job title of the staff just like in the reference_image2. the job title will be inside a button like container. 

Then below that block , we place first 5 dashboard stats we have, that are unassigned_count, active_count(assigned_count), solved_today, personal_best_record, then compeletion rate. 
we display these stats each inside a container like in the image and align them horizontally. Do not forget add a title to this stats block, the title is "Kunlik hisobot". Then we place a filter to the right end of this row. 

Below this stats block, we place full width shadcn area chart with a filter. This chart we represent the unassigned, assigned and closed sessions based on the filter. and please don't forget to add the chartlegends, well use shadcn charts they have it already. The title is "Murojatlar Umumiy" 

Below the area chart block we will have two charts side by side.
The first one , the title is "Demografik". for this chart use Pie Chart - Donut with Text. This will display the percentage of the Male and Female appeal senders. and the text at the center will display the number of all appeal senders to that department. 
and then the next chart is Bar Chart - Horizontal, for displaying the percentage of appeals sent from top 6 each neigborhoods. Title - Top Mahallalar 

and the last thing is leaderboard
I have decided that let's not that display leaderboard as leaderboads but rather have a tilte, like "Boshqa tashkilotdagi ham kasblariningiz" and show not only 5 and don't put ranks but order them by their rank but don't show rank and do not display the current rank of the staff. This is just for now to keep things cool and neutral. I don't want to hurst someone's feelings early on. this section will be full width. 

Backend Changes:
Let me outline some of the new endpoints and changes to endpoints you need to make. 
We are showing the staff information their avatar email and fullname at the bottom of the sidebar, and to retreive this data we need to have an endpoint i think, called staff-profile/.
Next, we need an endpoint for shadcn area chart (Murojatlar Umumiy), this endpoint needs to provide the data of unassigned, assigned and closed sessions based on the filter of the chart. 
Third one is an endpoint for pie chart (Demografik), endpoint is responsible providing a percentage of sessions sent by Male and Female citizens to that specific department. Currently in User model we do not have a field called gender, and will not be having it any soon, so we will take advantage of the fact that In Uzbekistan woman don't get named male's name. and thus we will have a list of all female names and a list of male names, we differ agains that. We have two choices either to implement this thing when saving the citizen registration data, we cann immeditaly search their Full Name to ourlist and then save the result to a new field gender we can make. so when providing the data Demografik stats we can just get it from the User model or manually do it each time when reqest send for a data to Demografik stats. I think option 1 is good. Plus we need to provide the total of number of the appealers that have send an appeal that was routed to that department, doesn't matter weather the status session, but always ignore sessions with escalated status. 
4. The last one is Horizontal Bar chart the title of the stats Top Mahallalar, for this stats bar chart we will build an endpoint that sends the percentage of appeals sent from neigborhoods, we will show top 5. the logic is we need to first know the total number of sessions routed to that department, regardless of their status but always ignore escalated sessions. and then you are going to have to find the number of appeals sent by users belonging to a neigborhood. This can be done cuz each user has neighborhood field. Then you need choose the top 5 with most appeals, and then compute their percentages using the total number of appeals routed to that department. then provide the data. 

The last one is you need to make a change to the @ leaderboard endpoint so that i will return only 5. 