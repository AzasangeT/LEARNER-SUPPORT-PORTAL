// =========================================
// SKILLS TRACK - ASSESSOR TASKS
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

// Firebase configuration
import {
    auth,
    database
} from "./firebase.js";


// =========================================
// HTML ELEMENTS
// =========================================

const assessorName = document.getElementById("assessorName");

const totalTasksElement = document.getElementById("totalTasks");
const completedTasksElement = document.getElementById("completedTasks");
const outstandingTasksElement = document.getElementById("outstandingTasks");
const completionRateElement = document.getElementById("completionRate");

const taskSearch = document.getElementById("taskSearch");
const learnerFilter = document.getElementById("learnerFilter");
const statusFilter = document.getElementById("statusFilter");

const taskList = document.getElementById("assessorTaskList");
const taskCount = document.getElementById("taskCount");

const refreshTasksBtn = document.getElementById("refreshTasksBtn");


// =========================================
// APPLICATION DATA
// =========================================

let currentUser = null;

let allTasks = [];

let learners = {};


// =========================================
// AUTHENTICATION AND ROLE VERIFICATION
// =========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.replace("Login.html");
        return;

    }

    try {

        // Retrieve user profile
        const userSnapshot = await get(
            ref(database, `users/${user.uid}`)
        );

        if (!userSnapshot.exists()) {

            console.error("User profile not found.");

            window.location.replace("Login.html");
            return;

        }

        const userData = userSnapshot.val();

        // Protect assessor page
        if (userData.role !== "Assessor") {

            console.error("Access denied. Assessor account required.");

            if (userData.role === "Learner") {

                window.location.replace("Learner_Dashboard.html");

            } else {

                window.location.replace("Login.html");

            }

            return;

        }

        currentUser = user;

        assessorName.textContent =
            userData.fullName || "Assessor";

        console.log("Assessor authenticated:", user.uid);

        // Load learner tasks
        await loadAssessorTasks();

    } catch (error) {

        console.error("Authentication error:", error);

        assessorName.textContent = "Unable to load profile";

        taskList.textContent =
            "Unable to verify your account. Please refresh the page.";

    }

});


// =========================================
// LOAD LEARNER TASKS
// =========================================

async function loadAssessorTasks() {

    if (!currentUser) {
        return;
    }

    refreshTasksBtn.disabled = true;
    refreshTasksBtn.textContent = "Refreshing...";

    taskList.textContent = "Loading learner tasks...";

    try {

        // =====================================
        // GET REGISTERED LEARNERS
        // =====================================

        const usersSnapshot = await get(
            ref(database, "users")
        );

        const users = usersSnapshot.exists()
            ? usersSnapshot.val()
            : {};

        // Keep only learner profiles
        learners = {};

        Object.entries(users).forEach(([uid, profile]) => {

            if (profile && profile.role === "Learner") {

                learners[uid] = profile;

            }

        });


        // =====================================
        // GET TASKS USING FIREBASE REST API
        // =====================================

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

        const tasksData = await response.json();


        // =====================================
        // CONVERT FIREBASE OBJECT INTO ARRAY
        // =====================================

        allTasks = Object.entries(tasksData || {})

            .filter(([taskId, task]) => {

                return (
                    task &&
                    learners[task.userId]
                );

            })

            .map(([taskId, task]) => {

                return {
                    id: taskId,
                    ...task,
                    learnerName:
                        learners[task.userId].fullName ||
                        "Unnamed Learner"
                };

            });


        console.log("Learner tasks loaded:", allTasks);


        // =====================================
        // UPDATE PAGE
        // =====================================

        populateLearnerFilter();

        updateTaskSummary();

        displayTasks();

    } catch (error) {

        console.error("Error loading assessor tasks:", error);

        taskList.textContent =
            "Unable to load learner tasks. Please try again.";

        taskCount.textContent = "Unable to load tasks";

        totalTasksElement.textContent = "—";
        completedTasksElement.textContent = "—";
        outstandingTasksElement.textContent = "—";
        completionRateElement.textContent = "—";

    } finally {

        refreshTasksBtn.disabled = false;
        refreshTasksBtn.textContent = "Refresh Tasks";

    }

}


// =========================================
// POPULATE LEARNER FILTER
// =========================================

function populateLearnerFilter() {

    const selectedLearner = learnerFilter.value;

    learnerFilter.innerHTML = "";

    const defaultOption = document.createElement("option");

    defaultOption.value = "all";
    defaultOption.textContent = "All Learners";

    learnerFilter.appendChild(defaultOption);

    Object.entries(learners)

        .sort((a, b) => {

            return (a[1].fullName || "").localeCompare(
                b[1].fullName || ""
            );

        })

        .forEach(([uid, profile]) => {

            const option = document.createElement("option");

            option.value = uid;

            option.textContent =
                profile.fullName || "Unnamed Learner";

            learnerFilter.appendChild(option);

        });

    // Keep previously selected filter when refreshing
    const selectedStillExists = [...learnerFilter.options]
        .some(option => option.value === selectedLearner);

    learnerFilter.value = selectedStillExists
        ? selectedLearner
        : "all";

}


// =========================================
// UPDATE TASK SUMMARY
// =========================================

function updateTaskSummary() {

    const total = allTasks.length;

    const completed = allTasks.filter(task => {
        return task.completed === true;
    }).length;

    const outstanding = total - completed;

    const percentage = total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    totalTasksElement.textContent = total;

    completedTasksElement.textContent = completed;

    outstandingTasksElement.textContent = outstanding;

    completionRateElement.textContent = `${percentage}%`;

}


// =========================================
// FILTER TASKS
// =========================================

function getFilteredTasks() {

    const searchValue = taskSearch.value
        .trim()
        .toLowerCase();

    const selectedLearner = learnerFilter.value;

    const selectedStatus = statusFilter.value;

    return allTasks.filter(task => {

        // Search by title or learner
        const matchesSearch =
            (task.title || "")
                .toLowerCase()
                .includes(searchValue) ||

            (task.learnerName || "")
                .toLowerCase()
                .includes(searchValue);

        // Filter by learner
        const matchesLearner =
            selectedLearner === "all" ||
            task.userId === selectedLearner;

        // Filter by completion status
        const matchesStatus =
            selectedStatus === "all" ||

            (
                selectedStatus === "completed" &&
                task.completed === true
            ) ||

            (
                selectedStatus === "outstanding" &&
                task.completed !== true
            );

        return (
            matchesSearch &&
            matchesLearner &&
            matchesStatus
        );

    });

}


// =========================================
// DISPLAY TASKS
// =========================================

function displayTasks() {

    const filteredTasks = getFilteredTasks();

    taskList.innerHTML = "";

    taskCount.textContent =
        `${filteredTasks.length} task${filteredTasks.length === 1 ? "" : "s"}`;

    if (filteredTasks.length === 0) {

        const emptyMessage = document.createElement("p");

        emptyMessage.className = "task-empty-message";

        emptyMessage.textContent = allTasks.length === 0
            ? "No learner tasks have been created yet."
            : "No tasks match your search or filters.";

        taskList.appendChild(emptyMessage);

        return;

    }

    // Sort by due date (earliest first)
    filteredTasks.sort((a, b) => {

        const dateA = a.dueDate
            ? new Date(a.dueDate).getTime()
            : Number.MAX_SAFE_INTEGER;

        const dateB = b.dueDate
            ? new Date(b.dueDate).getTime()
            : Number.MAX_SAFE_INTEGER;

        return dateA - dateB;

    });


    filteredTasks.forEach(task => {

        // =====================================
        // CREATE TASK CARD
        // =====================================

        const card = document.createElement("article");

        card.className = "assessor-task-card";


        // Task heading
        const header = document.createElement("div");

        header.className = "assessor-task-card-header";


        const title = document.createElement("h3");

        title.textContent = task.title || "Untitled Task";


        const status = document.createElement("span");

        const isCompleted = task.completed === true;

        status.className = isCompleted
            ? "status-completed"
            : "status-outstanding";

        status.textContent = isCompleted
            ? "Completed"
            : "Outstanding";


        header.append(title, status);


        // =====================================
        // TASK INFORMATION
        // =====================================

        const learner = document.createElement("p");

        learner.textContent =
            `Learner: ${task.learnerName}`;


        const category = document.createElement("p");

        category.textContent =
            `Category: ${task.category || "Not specified"}`;


        const dueDate = document.createElement("p");

        dueDate.textContent =
            `Due Date: ${task.dueDate || "Not set"}`;


        const priority = document.createElement("p");

        priority.textContent =
            `Priority: ${task.priority || "Not specified"}`;


        const description = document.createElement("p");

        description.textContent =
            `Description: ${task.description || "No description provided."}`;


        // =====================================
        // ADD ELEMENTS TO CARD
        // =====================================

        card.append(
            header,
            learner,
            category,
            dueDate,
            priority,
            description
        );

        taskList.appendChild(card);

    });

}


// =========================================
// EVENT LISTENERS
// =========================================

// Search tasks
taskSearch.addEventListener("input", displayTasks);

// Filter by learner
learnerFilter.addEventListener("change", displayTasks);

// Filter by status
statusFilter.addEventListener("change", displayTasks);

// Refresh tasks
refreshTasksBtn.addEventListener("click", loadAssessorTasks);