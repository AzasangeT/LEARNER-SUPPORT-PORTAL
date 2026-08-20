# 1.LOGIN 
START 
    Display Login Page 

    Ask user to enter email 
    Ask user to enter password 

IF email or password is empty THEN 
   Display "Please complete all fields" 
ELSE 
   Send login details to Fiirebase Authentication 

IF login is successful THEN 
   Get user's role 

If role is "learner" THEN
   redirect to Learner Dashboard 
ELSE IF role is "assessor" THEN 
   redirect to Assessor Dashboard 

END IF 

 ELSE Display "Invalid email or Password"
  END IF
END IF 
END 

# USER REGISTRATION 
START 
   Display Registration Form 

   Ask user for full name 
   Ask user for email address
   Ask user for password 
   Ask user for role 

IF any required field is empty THEN 
  Display "Please fill all required fields "
ELSE 
  Create user account using Firebase Authentication 

IF account creation is successful THEN 
  Save user information to Firebase 
  Display "Registration Successful" 
  Redirect user to Login page 
ELSE 
  Display Registration error 
END IF
 END IF 
END 

# 3. DISPLAY LEARNER DASHBOARD 
START 
    IF user is not logged in THEN 
    redirect to Login page 
ELSE 
    Get current user's information from Firebase 

    Display user's name 
    Display user's tasks 
    Calculate completed tasks 
    Calculate outstanding tasks 
    Calculate overall progress 

    Display tasks 
    Display progress 
    Display Announcements 
    Display Support Requests 
    Display Documents 
END IF 
END 

# 4.TASK CREATION 
START 
   Display task form 

   Ask learner to enter task title 
   Ask learner to select task category 
   Ask learner to select due date 

IF required information is missing THEN 
   Display "Please complete all required fields" 
ELSE 
   Create at task object 
   Store : task title 
           category 
           due date 
           user ID 
           
   Save to Firebase 

   Display "Task created successfully" 
   Refresh task list 
   END IF 
END 

# 5.VIEW TASKS 
START 
   Get current user's ID 
   Retrieve tasks from Firebase 

For Each task 
     IF task belongs to curret user THEN 
        Display task 
    END IF 
END FOR 
END 

# 6.UPDATE TASK
START 
   Learner selects a task 
   Display task information 

   Allow learner to edit : 
                          task title 
                          category 
                          due date 

   IF updated information is valid THEN 
      update task in Firebase 
      Display "Task successfully updated" 
      Refresh task list 
   ELSE 
      Display Validation Error 
   END IF 
END 

# 7.DELETION CONFIRMATION 
START 
   Learner clicks delete 

   Display Confirmation dialog: 
   "Are you sure you want to delete this task?"

IF learner clicks "cancel" THEN 
   Close confirmation dialog 
   Keep task 
ELSE IF 
   learner clicks "confirm" THEN 
   Delete task from Firebase 
   Display "Task deleted successfully"
END IF 
END 

# 8.CALCULATE LEARNER PROGRESS 
START 
    Retrieve task 

    Count Completed tasks 
    Count Outstanding tasks 
    Calculate Percentage 
    Display Progress 
END 


# 9.REQUEST / BOOK SUPPORT 
START 
    Display support booking form 

    Ask learner to select support topic 
    Ask learner to select preferred date 
    Ask learner to select preferred time 

IF required information is missing THEN 
   Display "Please complete all required fields"
ELSE 
   Create support booking 
   Set status = "Pending" 
   Save booking to Firebase 
   Display "Support request submitted successfully"
   Redirect learner to Support Request page
END IF 
END 

# 10.VIEW SUPPORT REQUEST STATUS 
START 
   Retrieve learner's support requests 

   FOR each request 
          Display: 
                 topic 
                 preferred date
                 preferred time
                 status 
   END FOR 

   IF status is "Pending" THEN 
      Display "Waiting for assessor" 
   ELSE IF status is "Approved" Then 
      Display "Support booking approved" 
   ELSE IF status is "Declined" THEN
      Display "Support booking declined" 
   END IF 
   END 

# 11.ASSESSOR REVIEWS SUPPORT BOOKING 
START
    Assessor opens Support Bookings
    Retrieve support bookings from Firebase 

    Display bookings: 
                   learner
                   topic 
                   preferred date 
                   status 

   Assessor selects booking 

   IF assessor chooses "Approve" THEN 
      Set ststus = "Approved" 
      Update booking in Firebase 
      Notify learner 
   ELSE IF assessor chooses "Decline" Then 
      Set status = "Declined" 
      Update booking in Firebase 
      Notify learner 
   END IF 

# 12. UPLOAD A DOCUMENT 
START 
    Learner selects "Upload Document" 
    Display upload form 
    Ask learner to select a file 

IF no file is selected THEN 
   Display "Please select a document" 
ELSE 
   Validate file type and size 

   IF file is valid THEN 
     Upload document 
     Save document information 
     Link document to current user's ID 
     Display "Document uploaded successfully" 
   ELSE 
     Display "Invalid file" 
   END IF 
END IF 
END 

# 13. SEARCH / FILTER 
START
    Retrieve all tasks 
    Ask user to enter search term
    Filter task array 

FOR each task 
    IF task title contains search term THEN 
       Add task to filtered results 
   END IF 
END FOR 

Display filtered tasks 

IF no tasks match THEN 
   Display " No tasks found"
END IF 
END 

# 14.ASSESSOR VIEWS LEARNERS 
START 
    Assessor opens learner page 
    Retrieve learner information from Firebase

FOR each learner 
   Display : 
           learner name 
           completed tasks 
           outstanding tasks 
           progress 
           support status 
END FOR 
END 

# 15.DISPLAY LEARNERS NEEDING SUPPORT 
START 
    Retrieve learner progress and support information

FOR each learner 
 
    IF learner has urgent outstanding work 
       Set status = "High Priority" 
    ELSE IF learner requires attention
      Set status = "Needs Attention" 
    ELSE 
      Set status = "On Track" 
    END IF 
     
      Display learner and status 

   END FOR 
   END 
   
# 16.PRINT PROGRESS SUMMARY
START 
    Learner opens Progress page 
    Retrieve learner progress 

    Display : 
           learner name 
           total tasks 
           completed tasks 
           outstanding tasks 
           progress percentage 

    Learner selects "Print Progress" 

    END 



