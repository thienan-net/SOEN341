**Acceptance Tests**



## Feature 1.1 – Browse Campus Events (Student)
**Goal:** Students can see upcoming events.
---Test---
1. Open the app → go to **Events**  
2. A list of future, approved, published events is displayed (not empty)

----------------


## Feature 1.2 – Filter Events (Student)
**Goal:** Let students filter events by category, date, or search text.
---Test1--- **Filter by category**  
1. Go to **Events** → set Category = “Sports”  
2. Only sports events are shown
---Test2--- **Filter by date**  
1. Select a specific date  
2. Only events on that date appear
---Test3--- **Search bar**  
1. Type “basketball”  
2. Only matching events are shown

-----------


## Feature 2.1 – Create Event (Organizer)
**Goal:** Enable organizers to create and publish new events.
---Test--- 
1. Log in as an organizer  
2. Go to **Create Event**  
3. Fill valid inputs → Submit  
4. The new event appears in the organizer list (status = pending or published depending on rules)

-----------


## Feature 2.3 – Tools (Export CSV)
**Goal:** Allow organizers to export attendee data (CSV).
---Test---
1. Organizer opens one of their events  
2. Click **Export CSV**  
3. A CSV file is downloaded with attendee info (name, email, ticketID, etc.)

----------

## Feature 3.1 – Approve Organizer Accounts (Admin)
**Goal:** Let admins approve users who request organizer access.
---Test--- 
1. Log in as admin → **Admin Dashboard**  
2. Go to **Pending organizers**  
3. Click **Approve**  
4. The user disappears from the pending list and now has the organizer role

----------


## Feature 3.2 – Approve / Reject Events (Admin)
**Goal:** Let admins approve or reject event submissions.
---Test--- 
1. Admin → **Moderation**  
2. Select a pending event → click **Approve**  
3. The event becomes visible to students

------------

## Feature 3.3 – Manage Organizations & Roles (Admin)
**Goal:** Allow admins to manage organizations and assign roles.
---Test1--- **Promote user to organizer**  
1. Admin → **Organizations / Users**  
2. Search a user → click **Promote to organizer**  
3. The role changes and remains after page refresh
---Test2--- **Create / edit organization**  
1. Admin → **Organizations** → **Create new**  
2. Enter org name + contact email → Save  
3. The organization appears in the list and can be edited
---Test3---**Validation Rule**
| Result | Meaning |
|--------|---------|
| ✅ PASS | Feature works exactly as described |
| ❌ FAIL | Missing, broken, or inconsistent behavior |
