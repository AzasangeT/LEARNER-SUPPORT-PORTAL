# 1.LOGIN 
START

Get email from email input
Get password from password input

IF email is empty OR password is empty THEN
    Display "Please enter your email and password"
    STOP
END IF

Call Firebase Authentication signInWithEmailAndPassword
    using email and password

IF authentication is successful THEN

    Get the authenticated user's UID

    Search the users collection using the UID

    Get the user's role

    IF role = "learner" THEN
        Redirect to learner-dashboard.html

    ELSE IF role = "assessor" THEN
        Redirect to assessor-dashboard.html

    ELSE
        Display "User role not found"
    END IF

ELSE
    Display Firebase authentication error
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
  START

Get the values from the task form:
    title = taskTitleInput.value
    category = categorySelect.value
    dueDate = dueDateInput.value
    priority = prioritySelect.value

Get the currently logged-in user's ID:
    userId = Firebase Authentication currentUser.uid

IF title is empty OR category is empty OR dueDate is empty THEN
    Display "Please complete all required fields"
    STOP
END IF

Create a task object:
    task = {
        title: title,
        category: category,
        dueDate: dueDate,
        priority: priority,
        completed: false,
        userId: userId
    }

Add task to Firestore:
    collection = "tasks"
    save task

IF task is successfully saved THEN
    Clear the form
    Display "Task created successfully"
    Load and display the updated task list
ELSE
    Display "Unable to create task"
END IF

END

# 5.SEARCH TASKS 
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


# 6.VIEW TASKS 
START 
   Get current user's ID 
   Retrieve tasks from Firebase 

For Each task 
     IF task belongs to curret user THEN 
        Display task 
    END IF 
END FOR 
END 

# 7.UPDATE TASK
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

# 8.DELETION CONFIRMATION 
START

When the user clicks the Delete button:

    Get the task ID associated with the selected task

    Display confirmation dialog:
        "Are you sure you want to delete this task?"

    IF user clicks Cancel THEN
        Close confirmation dialog
        Do not delete the task

    ELSE IF user clicks Confirm THEN

        Find the task document in the "tasks" collection
        using the task ID

        Delete the task document from Firestore

        IF deletion is successful THEN
            Display "Task deleted successfully"
            Remove the task from the displayed task list
        ELSE
            Display "Unable to delete task"
        END IF

    END IF

END

# 9.CALCULATE LEARNER PROGRESS 
START

Get the currently logged-in user's UID

Retrieve all documents from the "tasks" collection
where userId equals the current user's UID

Set totalTasks = number of retrieved tasks
Set completedTasks = 0

FOR EACH task in retrieved tasks

    IF task.completed === true THEN
        completedTasks = completedTasks + 1
    END IF

END FOR

IF totalTasks > 0 THEN
    progress = (completedTasks / totalTasks) * 100
ELSE
    progress = 0
END IF

Round progress to the nearest whole number

Display progress + "%"

END


# 10.REQUEST / BOOK SUPPORT 
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

# 11.VIEW SUPPORT REQUEST STATUS 
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

# 12.ASSESSOR APPROVES REVIEWS SUPPORT BOOKING 
START

When assessor clicks "Approve":

    Get support request ID

    Find the support request document
    using the request ID

    Update the status field to:
        "Approved"

    Save the updated document to Firestore

    IF update is successful THEN
        Display "Support request approved"
        Refresh the booking list
    ELSE
        Display "Unable to update request"
    END IF

END

### FOR DECLINE: 
START

When assessor clicks "Decline":

    Get support request ID

    Display decline reason input

    Get decline reason

    IF decline reason is empty THEN
        Display "Please provide a reason"
        STOP
    END IF

    Update support request:

        status = "Declined"
        reason = declineReason

    Save changes to Firestore

    IF update is successful THEN
        Display "Support request declined"
        Refresh booking list
    ELSE
        Display "Unable to update request"
    END IF

END

# 13. UPLOAD A DOCUMENT 
START

When learner selects a document:

    Get selected file

    IF no file is selected THEN
        Display "Please select a file"
        STOP
    END IF

    Get file name
    Get file type
    Get file size

    Check whether file type is allowed

    IF file type is not allowed THEN
        Display "File type not supported"
        STOP
    END IF

    Check whether file size is within the allowed limit

    IF file size is too large THEN
        Display "File is too large"
        STOP
    END IF

    Get current user's UID

    Upload file to Firebase Storage

    Get the uploaded file URL

    Create document record:

        document = {
            userId: currentUser.uid,
            fileName: file.name,
            fileType: file.type,
            fileUrl: downloadURL
        }

    Save document record to Firestore

    Display "Document uploaded successfully"

END



# 14.DISPLAY LEARNERS NEEDING SUPPORT 
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
   
# 15.PRINT PROGRESS SUMMARY
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



