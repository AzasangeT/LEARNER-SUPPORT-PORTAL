// =========================================
// SKILLS TRACK - ASSESSOR DASHBOARD
// =========================================

// Firebase Authentication
import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

// Firebase Realtime Database
import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-database.js";

// Firebase Configuration
import {
    auth,
    database
} from "./firebase.js";


// =========================================
// HTML ELEMENTS
// =========================================

const assessorName =
    document.getElementById("assessorName");

const totalLearnersElement =
    document.getElementById("totalLearners");

const totalTasksElement =
    document.getElementById("totalTasks");

const outstandingTasksElement =
    document.getElementById("outstandingTasks");

const learnerProgressList =
    document.getElementById("learnerProgressList");

const assessorTaskList =
    document.getElementById("assessorTaskList");


// =========================================
// CURRENT USER
// =========================================

let currentUser = null;


// =========================================
// AUTHENTICATION AND ROLE PROTECTION
// =========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.replace("Login.html");

        return;
    }

    try {

        currentUser = user;

        console.log("Authenticated UID:", user.uid);

        // Retrieve assessor profile
        const userRef = ref(
            database,
            `users/${user.uid}`
        );

        const snapshot = await get(userRef);

        if (!snapshot.exists()) {

            console.error("User profile not found.");

            assessorName.textContent =
                "Profile not found";

            return;
        }

        const userData = snapshot.val();

        console.log("Account role:", userData.role);

        // Verify assessor role
        if (userData.role !== "Assessor") {

            console.error(
                "Access denied. User is not an assessor."
            );

            if (userData.role === "Learner") {

                window.location.replace(
                    "Learner_Dashboard.html"
                );

            } else {

                window.location.replace("Login.html");

            }

            return;
        }

        // Display assessor name
        assessorName.textContent =
            userData.fullName || "Assessor";

        console.log("Assessor access granted.");

        // Load dashboard information
        await loadAssessorDashboard();

    }

    catch (error) {

        console.error(
            "Authentication/role error:",
            error
        );

        assessorName.textContent =
            "Unable to load profile";

    }

});


// =========================================
// LOAD ASSESSOR DASHBOARD
// =========================================

async function loadAssessorDashboard() {

    try {

        // Read registered users
        const usersRef = ref(database, "users");

        const usersSnapshot = await get(usersRef);

        const allUsers = usersSnapshot.exists()
            ? usersSnapshot.val()
            : {};

        // Only include learner accounts
        const learners = Object.entries(allUsers)
            .filter(([uid, user]) => {
                return user.role === "Learner";
            });

        console.log("Registered learners:", learners);

        // Read tasks using Firebase REST
        const token = await currentUser.getIdToken();

        const tasksUrl =
            `https://learner-support-portal-8f0ac-default-rtdb.firebaseio.com/tasks.json?auth=${encodeURIComponent(token)}`;

        const response = await fetch(tasksUrl, {
            method: "GET"
        });

        if (!response.ok) {

            const errorText = await response.text();

            throw new Error(
                `Unable to retrieve tasks: ${errorText}`
            );

        }

        const allTasks = await response.json();

        // Match tasks to registered learners
        const learnerIds = new Set(
            learners.map(([uid]) => uid)
        );

        const tasks = Object.entries(allTasks || {})
            .filter(([taskId, task]) => {
                return learnerIds.has(task.userId);
            });

        // Update summary cards
        updateDashboardSummary(learners, tasks);

        // Display learner progress
        displayLearnerProgress(learners, tasks);

        // Display outstanding tasks
        displayOutstandingTasks(learners, tasks);

    }

    catch (error) {

        console.error(
            "Unable to load assessor dashboard:",
            error
        );

        totalLearnersElement.textContent = "—";
        totalTasksElement.textContent = "—";
        outstandingTasksElement.textContent = "—";

        learnerProgressList.textContent =
            "Unable to load learner progress.";

        assessorTaskList.textContent =
            "Unable to load outstanding tasks.";

    }

}


// =========================================
// UPDATE DASHBOARD SUMMARY
// =========================================

function updateDashboardSummary(learners, tasks) {

    const totalLearners = learners.length;

    const totalTasks = tasks.length;

    const outstandingTasks = tasks.filter(
        ([taskId, task]) => task.completed !== true
    ).length;

    totalLearnersElement.textContent =
        totalLearners;

    totalTasksElement.textContent =
        totalTasks;

    outstandingTasksElement.textContent =
        outstandingTasks;

    console.log("Total learners:", totalLearners);
    console.log("Total tasks:", totalTasks);
    console.log("Outstanding tasks:", outstandingTasks);

}


// =========================================
// DISPLAY LEARNER PROGRESS
// =========================================

function displayLearnerProgress(learners, tasks) {

    learnerProgressList.innerHTML = "";

    if (learners.length === 0) {

        learnerProgressList.textContent =
            "No registered learners found.";

        return;
    }

    learners.forEach(([uid, learner]) => {

        // Get tasks belonging to this learner
        const learnerTasks = tasks.filter(
            ([taskId, task]) => task.userId === uid
        );

        const total = learnerTasks.length;

        const completed = learnerTasks.filter(
            ([taskId, task]) => task.completed === true
        ).length;

        const progress = total > 0
            ? Math.round((completed / total) * 100)
            : 0;

        // Create learner progress card
        const card = document.createElement("div");

        card.className = "assessor-learner-card";

        const heading = document.createElement("h3");

        heading.textContent =
            learner.fullName || "Unnamed learner";

        const details = document.createElement("p");

        details.textContent =
            `${completed} of ${total} tasks completed`;

        const progressText = document.createElement("p");

        progressText.textContent =
            `Overall Progress: ${progress}%`;

        const progressBar = document.createElement("div");

        progressBar.className = "progress-bar";

        const progressFill = document.createElement("div");

        progressFill.className = "progress-bar-fill";

        progressFill.style.width = `${progress}%`;

        progressBar.appendChild(progressFill);

        card.append(
            heading,
            details,
            progressText,
            progressBar
        );

        learnerProgressList.appendChild(card);

    });

}


// =========================================
// DISPLAY OUTSTANDING TASKS
// =========================================

function displayOutstandingTasks(learners, tasks) {

    assessorTaskList.innerHTML = "";

    const outstanding = tasks.filter(
        ([taskId, task]) => task.completed !== true
    );

    if (outstanding.length === 0) {

        assessorTaskList.textContent =
            "No outstanding learner tasks.";

        return;
    }

    // Sort by due date
    outstanding.sort((a, b) => {

        return new Date(a[1].dueDate) -
               new Date(b[1].dueDate);

    });

    // Show first five outstanding tasks
    const recentTasks = outstanding.slice(0, 5);

    recentTasks.forEach(([taskId, task]) => {

        // Find the task owner
        const learnerEntry = learners.find(
            ([uid]) => uid === task.userId
        );

        const learnerName = learnerEntry
            ? learnerEntry[1].fullName
            : "Unknown learner";

        const taskItem = document.createElement("div");

        taskItem.className = "task-item";

        const details = document.createElement("div");

        const title = document.createElement("h3");

        title.textContent = task.title || "Untitled task";

        const description = document.createElement("p");

        description.textContent =
            `${learnerName} • ${task.category || "Uncategorised"} • Due ${task.dueDate || "Not set"}`;

        const status = document.createElement("span");

        status.className = "status-pending";

        status.textContent = "Outstanding";

        details.append(title, description);

        taskItem.append(details, status);

        assessorTaskList.appendChild(taskItem);

    });

}