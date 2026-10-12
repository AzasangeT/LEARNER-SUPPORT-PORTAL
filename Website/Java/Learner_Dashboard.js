// =========================================
// SKILLS TRACK - LEARNER DASHBOARD
// =========================================


// =========================================
// FIREBASE IMPORTS
// =========================================

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    ref,
    get,
    onValue
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-database.js";

import {
    auth,
    database
} from "./firebase.js";


// =========================================
// FIREBASE REST API URL
// =========================================

const DATABASE_URL =
    "https://learner-support-portal-8f0ac-default-rtdb.firebaseio.com";


// =========================================
// GET HTML ELEMENTS
// =========================================

// Learner information
const learnerName =
    document.getElementById("learnerName");

// Task summary
const totalTasksElement =
    document.getElementById("totalTasks");

const completedTasksElement =
    document.getElementById("completedTasks");

const outstandingTaskText =
    document.getElementById("outstandingTaskText");

const overallProgressElement =
    document.getElementById("overallProgress");

// Recent tasks
const dashboardTaskList =
    document.getElementById("dashboardTaskList");

// Support request summary
const supportRequestCount =
    document.getElementById("supportRequestCount");

const supportRequestText =
    document.getElementById("supportRequestText");

// Upcoming support bookings
const dashboardBookings =
    document.getElementById("dashboardBookings");


// =========================================
// CURRENT USER AND LISTENERS
// =========================================

let currentUser = null;

let unsubscribeBookings = null;

// Prevent outdated asynchronous requests from
// updating the dashboard after authentication changes.
let authRequestId = 0;


// =========================================
// CHECK AUTHENTICATION
// =========================================

onAuthStateChanged(auth, async (user) => {

    const requestId = ++authRequestId;

    // Remove any existing bookings listener.
    if (unsubscribeBookings) {
        unsubscribeBookings();
        unsubscribeBookings = null;
    }

    if (!user) {

        currentUser = null;

        console.log("No user logged in.");

        window.location.href = "Login.html";

        return;
    }

    currentUser = user;

    console.log("Dashboard user:", user.uid);

    try {

        // Verify the user's profile and role first.
        const isLearner = await loadLearnerInformation(user);

        // Ignore an outdated authentication request.
        if (requestId !== authRequestId) {
            return;
        }

        if (!isLearner) {
            return;
        }

        // Load task information.
        await loadDashboardTasks(user);

        if (requestId !== authRequestId) {
            return;
        }

        // Listen for booking updates in real time.
        listenForDashboardBookings(user.uid);

    } catch (error) {

        console.error(
            "Learner dashboard initialization error:",
            error
        );

    }

});


// =========================================
// LOAD LEARNER INFORMATION
// =========================================

async function loadLearnerInformation(user) {

    try {

        const userRef = ref(
            database,
            "users/" + user.uid
        );

        const snapshot = await get(userRef);

        if (!snapshot.exists()) {

            console.error(
                "Learner profile not found."
            );

            return false;
        }

        const userData = snapshot.val();

        // =====================================
        // ROLE PROTECTION
        // =====================================

        if (userData.role !== "Learner") {

            console.error(
                "User is not a learner."
            );

            if (userData.role === "Assessor") {

                window.location.href =
                    "Assessor_Dashboard.html";

            }

            return false;
        }

        // =====================================
        // DISPLAY LEARNER NAME
        // =====================================

        if (learnerName) {

            learnerName.textContent =
                userData.fullName || "Learner";

        }

        console.log(
            "Learner profile:",
            userData
        );

        return true;

    } catch (error) {

        console.error(
            "Unable to load learner profile:",
            error
        );

        return false;
    }

}


// =========================================
// LOAD DASHBOARD TASKS USING FIREBASE REST
// =========================================

async function loadDashboardTasks(user) {

    try {

        const token = await user.getIdToken();

        // =====================================
        // FIREBASE REST QUERY
        // =====================================

        const url =
            `${DATABASE_URL}/tasks.json?orderBy=${encodeURIComponent('"userId"')}&equalTo=${encodeURIComponent(JSON.stringify(user.uid))}&auth=${encodeURIComponent(token)}`;

        const response = await fetch(url, {
            method: "GET"
        });

        if (!response.ok) {

            const errorData = await response.text();

            console.error(
                "Dashboard Firebase GET error:",
                errorData
            );

            throw new Error(
                "Unable to load dashboard tasks."
            );
        }

        const tasks = await response.json();

        console.log(
            "Dashboard tasks:",
            tasks
        );

        // Calculate summary cards.
        updateTaskSummary(tasks);

        // Display recent tasks.
        displayDashboardTasks(tasks);

    } catch (error) {

        console.error(
            "Dashboard task error:",
            error
        );

        if (dashboardTaskList) {

            dashboardTaskList.innerHTML = `
                <p class="task-empty-message">
                    Unable to load your tasks.
                </p>
            `;

        }

    }

}


// =========================================
// UPDATE TASK SUMMARY
// =========================================

function updateTaskSummary(tasks) {

    if (
        !totalTasksElement ||
        !completedTasksElement ||
        !outstandingTaskText ||
        !overallProgressElement
    ) {

        console.error(
            "Task summary HTML elements are missing."
        );

        return;
    }

    // =====================================
    // NO TASKS
    // =====================================

    if (!tasks) {

        totalTasksElement.textContent = "0";

        completedTasksElement.textContent = "0";

        outstandingTaskText.textContent =
            "0 outstanding";

        overallProgressElement.textContent = "0%";

        return;
    }

    // Convert Firebase object to array.
    const taskArray = Object.values(tasks);

    // =====================================
    // TOTAL TASKS
    // =====================================

    const totalTasks = taskArray.length;

    // =====================================
    // COMPLETED TASKS
    // =====================================

    const completedTasks = taskArray.filter(
        task => task.completed === true
    ).length;

    // =====================================
    // OUTSTANDING TASKS
    // =====================================

    const outstandingTasks =
        totalTasks - completedTasks;

    // =====================================
    // PROGRESS %
    // =====================================

    let progress = 0;

    if (totalTasks > 0) {

        progress = Math.round(
            (completedTasks / totalTasks) * 100
        );

    }

    // =====================================
    // DISPLAY VALUES
    // =====================================

    totalTasksElement.textContent =
        totalTasks;

    completedTasksElement.textContent =
        completedTasks;

    overallProgressElement.textContent =
        `${progress}%`;

    if (outstandingTasks === 1) {

        outstandingTaskText.textContent =
            "1 outstanding";

    } else {

        outstandingTaskText.textContent =
            `${outstandingTasks} outstanding`;

    }

    // =====================================
    // DEBUGGING
    // =====================================

    console.log(
        "Dashboard total tasks:",
        totalTasks
    );

    console.log(
        "Dashboard completed:",
        completedTasks
    );

    console.log(
        "Dashboard outstanding:",
        outstandingTasks
    );

    console.log(
        "Dashboard progress:",
        progress + "%"
    );

}


// =========================================
// DISPLAY DASHBOARD TASKS
// =========================================

function displayDashboardTasks(tasks) {

    if (!dashboardTaskList) {

        console.error(
            "dashboardTaskList element not found."
        );

        return;
    }

    dashboardTaskList.innerHTML = "";

    // =====================================
    // NO TASKS
    // =====================================

    if (!tasks || Object.keys(tasks).length === 0) {

        const emptyMessage =
            document.createElement("p");

        emptyMessage.className =
            "task-empty-message";

        emptyMessage.textContent =
            "You currently have no learning tasks. ";

        const createTaskLink =
            document.createElement("a");

        createTaskLink.href =
            "Learner_Task.html";

        createTaskLink.textContent =
            "Create your first task";

        emptyMessage.appendChild(createTaskLink);

        dashboardTaskList.appendChild(emptyMessage);

        return;
    }

    // Convert Firebase object into array.
    const taskEntries = Object.entries(tasks);

    // =====================================
    // SORT TASKS
    // =====================================

    taskEntries.sort((a, b) => {

        const taskA = a[1];
        const taskB = b[1];

        // Outstanding tasks first.
        if (taskA.completed !== taskB.completed) {

            return taskA.completed ? 1 : -1;

        }

        // Then sort by due date.
        return new Date(taskA.dueDate) -
            new Date(taskB.dueDate);

    });

    // =====================================
    // ONLY SHOW FIRST 3 TASKS
    // =====================================

    const dashboardTasks =
        taskEntries.slice(0, 3);

    // =====================================
    // CREATE TASK ITEMS
    // =====================================

    dashboardTasks.forEach(([taskId, task]) => {

        const taskItem =
            document.createElement("div");

        taskItem.classList.add("task-item");

        const details =
            document.createElement("div");

        const title =
            document.createElement("h3");

        title.textContent =
            task.title || "Untitled Task";

        const categoryAndDate =
            document.createElement("p");

        categoryAndDate.textContent =
            `${task.category || "General"} • Due ${task.dueDate || "Not specified"}`;

        details.append(
            title,
            categoryAndDate
        );

        // =====================================
        // STATUS
        // =====================================

        const status =
            document.createElement("span");

        const isCompleted =
            task.completed === true;

        status.textContent =
            isCompleted
                ? "Completed"
                : "Outstanding";

        status.className =
            isCompleted
                ? "status-completed"
                : "status-pending";

        taskItem.append(
            details,
            status
        );

        dashboardTaskList.appendChild(taskItem);

    });

}


// =========================================
// LEARNER DASHBOARD - SUPPORT BOOKINGS
// =========================================


// =========================================
// REALTIME BOOKINGS LISTENER
// =========================================

function listenForDashboardBookings(userId) {

    const bookingsRef = ref(
        database,
        "bookings"
    );

    unsubscribeBookings = onValue(

        bookingsRef,

        (snapshot) => {

            const data = snapshot.exists()
                ? snapshot.val()
                : {};

            // Convert Firebase data into an array.
            const bookings = Object.entries(data)
                .map(([id, booking]) => ({
                    id,
                    ...booking
                }))

                // Only show the logged-in learner's bookings.
                .filter(
                    booking => booking.userId === userId
                );

            console.log(
                "Dashboard bookings:",
                bookings
            );

            // Update Support Requests summary.
            updateSupportRequestSummary(bookings);

            // Display upcoming bookings.
            displayDashboardBookings(bookings);

        },

        (error) => {

            console.error(
                "Unable to retrieve dashboard bookings:",
                error
            );

            if (dashboardBookings) {

                dashboardBookings.textContent =
                    "Unable to load your support bookings.";

            }

            if (supportRequestText) {

                supportRequestText.textContent =
                    "Unable to load requests";

            }

        }

    );

}


// =========================================
// UPDATE SUPPORT REQUEST SUMMARY
// =========================================

function updateSupportRequestSummary(bookings) {

    if (
        !supportRequestCount ||
        !supportRequestText
    ) {

        console.error(
            "Support Requests summary elements are missing."
        );

        return;
    }

    // =====================================
    // ACTIVE BOOKINGS
    // =====================================

    const activeBookings = bookings.filter(
        booking =>
            booking.status === "Pending" ||
            booking.status === "Approved"
    );

    const totalActive =
        activeBookings.length;

    // =====================================
    // DISPLAY TOTAL
    // =====================================

    supportRequestCount.textContent =
        totalActive;

    if (totalActive === 0) {

        supportRequestText.textContent =
            "No active requests";

    } else if (totalActive === 1) {

        supportRequestText.textContent =
            "1 active support request";

    } else {

        supportRequestText.textContent =
            `${totalActive} active support requests`;

    }

    console.log(
        "Dashboard active support requests:",
        totalActive
    );

}


// =========================================
// DISPLAY DASHBOARD BOOKINGS
// =========================================

function displayDashboardBookings(bookings) {

    if (!dashboardBookings) {

        console.error(
            "dashboardBookings element not found."
        );

        return;
    }

    // Clear existing booking cards.
    dashboardBookings.innerHTML = "";

    // =====================================
    // FILTER ACTIVE BOOKINGS
    // =====================================

    const activeBookings = bookings.filter(
        booking =>
            booking.status === "Pending" ||
            booking.status === "Approved"
    );

    // =====================================
    // SORT BOOKINGS BY DATE AND TIME
    // =====================================

    activeBookings.sort((a, b) => {

        const dateA =
            `${a.date || ""}T${a.time || "00:00"}`;

        const dateB =
            `${b.date || ""}T${b.time || "00:00"}`;

        return dateA.localeCompare(dateB);

    });

    // =====================================
    // NO ACTIVE BOOKINGS
    // =====================================

    if (activeBookings.length === 0) {

        const emptyMessage =
            document.createElement("p");

        emptyMessage.className =
            "task-empty-message";

        emptyMessage.textContent =
            "No upcoming support sessions.";

        dashboardBookings.appendChild(
            emptyMessage
        );

        return;
    }

    // =====================================
    // DISPLAY FIRST 3 BOOKINGS
    // =====================================

    const recentBookings =
        activeBookings.slice(0, 3);

    recentBookings.forEach(booking => {

        // =====================================
        // BOOKING CARD
        // =====================================

        const bookingCard =
            document.createElement("article");

        bookingCard.className =
            "dashboard-booking-card";

        // =====================================
        // BOOKING HEADER
        // =====================================

        const bookingHeader =
            document.createElement("div");

        bookingHeader.className =
            "dashboard-booking-header";

        const bookingTitle =
            document.createElement("h3");

        bookingTitle.textContent =
            booking.topic || "Support Session";

        // =====================================
        // BOOKING STATUS
        // =====================================

        const bookingStatus =
            document.createElement("span");

        bookingStatus.className =
            "dashboard-booking-status";

        const status =
            booking.status || "Pending";

        bookingStatus.textContent = status;

        if (status === "Approved") {

            bookingStatus.classList.add(
                "booking-approved"
            );

        } else {

            bookingStatus.classList.add(
                "booking-pending"
            );

        }

        bookingHeader.append(
            bookingTitle,
            bookingStatus
        );

        // =====================================
        // BOOKING DATE
        // =====================================

        const bookingDate =
            document.createElement("p");

        bookingDate.textContent =
            `Date: ${booking.date || "Not specified"}`;

        // =====================================
        // BOOKING TIME
        // =====================================

        const bookingTime =
            document.createElement("p");

        bookingTime.textContent =
            `Time: ${booking.time || "Not specified"}`;

        // =====================================
        // BOOKING DESCRIPTION
        // =====================================

        const bookingDescription =
            document.createElement("p");

        bookingDescription.textContent =
            booking.description || "";

        // =====================================
        // ADD BOOKING DETAILS
        // =====================================

        bookingCard.append(
            bookingHeader,
            bookingDate,
            bookingTime,
            bookingDescription
        );

        // =====================================
        // ASSESSOR FEEDBACK
        // =====================================

        if (booking.assessorFeedback) {

            const feedback =
                document.createElement("p");

            feedback.className =
                "dashboard-booking-feedback";

            feedback.textContent =
                `Assessor Feedback: ${booking.assessorFeedback}`;

            bookingCard.appendChild(
                feedback
            );

        }

        // =====================================
        // DISPLAY BOOKING
        // =====================================

        dashboardBookings.appendChild(
            bookingCard
        );

    });

}