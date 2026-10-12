// =========================================
// SKILLS TRACK - ASSESSOR PROGRESS
// =========================================


// =========================================
// FIREBASE IMPORTS
// =========================================

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-database.js";

import {
    auth,
    database
} from "./firebase.js";


// =========================================
// FIREBASE DATABASE URL
// =========================================

const DATABASE_URL =
    "https://learner-support-portal-8f0ac-default-rtdb.firebaseio.com";


// =========================================
// HTML ELEMENTS
// =========================================

const assessorName =
    document.getElementById("assessorName");

const totalLearnersElement =
    document.getElementById("totalLearners");

const averageProgressElement =
    document.getElementById("averageProgress");

const completedTasksElement =
    document.getElementById("completedTasks");

const outstandingTasksElement =
    document.getElementById("outstandingTasks");

const learnerSearch =
    document.getElementById("learnerSearch");

const progressFilter =
    document.getElementById("progressFilter");

const learnerCount =
    document.getElementById("learnerCount");

const progressMessage =
    document.getElementById("progressMessage");

const learnerProgressList =
    document.getElementById("learnerProgressList");

const refreshProgressBtn =
    document.getElementById("refreshProgressBtn");


// =========================================
// APPLICATION DATA
// =========================================

let currentUser = null;

let learners = [];

let tasks = [];

let learnerProgress = [];


// =========================================
// AUTHENTICATION AND ROLE VERIFICATION
// =========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.replace("Login.html");
        return;

    }

    try {

        const userSnapshot = await get(
            ref(database, `users/${user.uid}`)
        );

        if (!userSnapshot.exists()) {

            window.location.replace("Login.html");
            return;

        }

        const userData = userSnapshot.val();

        if (userData.role !== "Assessor") {

            window.location.replace(
                userData.role === "Learner"
                    ? "Learner_Dashboard.html"
                    : "Login.html"
            );

            return;

        }

        currentUser = user;

        assessorName.textContent =
            userData.fullName || "Assessor";

        await loadProgress();

    } catch (error) {

        console.error(
            "Unable to verify assessor account:",
            error
        );

        progressMessage.textContent =
            "Unable to verify your account.";

    }

});


// =========================================
// LOAD PROGRESS DATA
// =========================================

async function loadProgress() {

    if (!currentUser) {
        return;
    }

    refreshProgressBtn.disabled = true;

    refreshProgressBtn.textContent = "Refreshing...";

    progressMessage.textContent = "";

    learnerProgressList.textContent =
        "Loading learner progress...";

    try {

        // =====================================
        // RETRIEVE REGISTERED LEARNERS
        // =====================================

        const usersSnapshot = await get(
            ref(database, "users")
        );

        const users = usersSnapshot.exists()
            ? usersSnapshot.val()
            : {};

        learners = Object.entries(users)

            .filter(([uid, profile]) => {

                return (
                    profile &&
                    profile.role === "Learner"
                );

            })

            .map(([uid, profile]) => {

                return {
                    uid: uid,
                    fullName:
                        profile.fullName || "Unnamed Learner",
                    email:
                        profile.email || "No email available"
                };

            });


        // =====================================
        // RETRIEVE TASKS USING REST API
        // =====================================

        const token = await currentUser.getIdToken();

        const url =
            `${DATABASE_URL}/tasks.json?auth=${encodeURIComponent(token)}`;

        const response = await fetch(url);

        if (!response.ok) {

            const errorText = await response.text();

            throw new Error(
                `Unable to retrieve tasks: ${errorText}`
            );

        }

        const taskData = await response.json();

        tasks = Object.entries(taskData || {})

            .map(([id, task]) => {

                return {
                    id: id,
                    ...task
                };

            });


        // =====================================
        // CALCULATE LEARNER PROGRESS
        // =====================================

        calculateLearnerProgress();

        updateProgressSummary();

        displayLearnerProgress();

    } catch (error) {

        console.error(
            "Unable to load learner progress:",
            error
        );

        progressMessage.textContent =
            "Unable to retrieve learner progress. Check your connection and Firebase rules.";

        learnerProgressList.textContent =
            "Unable to load learner information.";

        totalLearnersElement.textContent = "—";

        averageProgressElement.textContent = "—";

        completedTasksElement.textContent = "—";

        outstandingTasksElement.textContent = "—";

    } finally {

        refreshProgressBtn.disabled = false;

        refreshProgressBtn.textContent = "Refresh Progress";

    }

}


// =========================================
// CALCULATE INDIVIDUAL PROGRESS
// =========================================

function calculateLearnerProgress() {

    learnerProgress = learners.map(learner => {

        const learnerTasks = tasks.filter(task => {

            return task.userId === learner.uid;

        });

        const total = learnerTasks.length;

        const completed = learnerTasks.filter(task => {

            return task.completed === true;

        }).length;

        const outstanding = total - completed;

        const percentage = total > 0
            ? Math.round((completed / total) * 100)
            : 0;

        return {

            ...learner,

            totalTasks: total,

            completedTasks: completed,

            outstandingTasks: outstanding,

            progressPercentage: percentage,

            tasks: learnerTasks

        };

    });

}


// =========================================
// UPDATE SUMMARY CARDS
// =========================================

function updateProgressSummary() {

    const totalLearners = learnerProgress.length;

    const totalCompleted = learnerProgress.reduce(
        (sum, learner) => sum + learner.completedTasks,
        0
    );

    const totalOutstanding = learnerProgress.reduce(
        (sum, learner) => sum + learner.outstandingTasks,
        0
    );

    // Average individual learner percentages.
    // Learners with no tasks count as 0%.
    const averageProgress = totalLearners > 0
        ? Math.round(
            learnerProgress.reduce(
                (sum, learner) =>
                    sum + learner.progressPercentage,
                0
            ) / totalLearners
        )
        : 0;

    totalLearnersElement.textContent = totalLearners;

    averageProgressElement.textContent =
        `${averageProgress}%`;

    completedTasksElement.textContent = totalCompleted;

    outstandingTasksElement.textContent = totalOutstanding;

}


// =========================================
// FILTER LEARNERS
// =========================================

function getFilteredLearners() {

    const search = learnerSearch.value
        .trim()
        .toLowerCase();

    const selectedFilter = progressFilter.value;

    return learnerProgress.filter(learner => {

        const matchesSearch =
            learner.fullName.toLowerCase().includes(search) ||
            learner.email.toLowerCase().includes(search);

        let matchesProgress = true;

        if (selectedFilter === "completed") {

            matchesProgress =
                learner.totalTasks > 0 &&
                learner.progressPercentage === 100;

        } else if (selectedFilter === "in-progress") {

            matchesProgress =
                learner.totalTasks > 0 &&
                learner.progressPercentage > 0 &&
                learner.progressPercentage < 100;

        } else if (selectedFilter === "not-started") {

            matchesProgress =
                learner.progressPercentage === 0;

        }

        return matchesSearch && matchesProgress;

    });

}


// =========================================
// DISPLAY LEARNER PROGRESS
// =========================================

function displayLearnerProgress() {

    const filteredLearners = getFilteredLearners();

    learnerProgressList.innerHTML = "";

    learnerCount.textContent =
        `${filteredLearners.length} learner${filteredLearners.length === 1 ? "" : "s"}`;

    if (filteredLearners.length === 0) {

        learnerProgressList.textContent =
            learnerProgress.length === 0
                ? "No registered learners found."
                : "No learners match your search or filters.";

        return;

    }

    // Sort alphabetically
    filteredLearners.sort((a, b) => {

        return a.fullName.localeCompare(b.fullName);

    });


    filteredLearners.forEach(learner => {

        // =====================================
        // LEARNER CARD
        // =====================================

        const card = document.createElement("article");

        card.className = "assessor-progress-card";


        const header = document.createElement("div");

        header.className = "assessor-progress-card-header";


        const learnerInfo = document.createElement("div");

        const name = document.createElement("h3");

        name.textContent = learner.fullName;

        const email = document.createElement("p");

        email.textContent = learner.email;

        learnerInfo.append(name, email);


        const progressLabel = document.createElement("span");

        progressLabel.className = "assessor-progress-percentage";

        progressLabel.textContent =
            `${learner.progressPercentage}%`;


        header.append(learnerInfo, progressLabel);


        // =====================================
        // PROGRESS BAR
        // =====================================

        const progressBar = document.createElement("div");

        progressBar.className = "assessor-progress-bar";

        const progressFill = document.createElement("div");

        progressFill.className = "assessor-progress-fill";

        progressFill.style.width =
            `${learner.progressPercentage}%`;

        progressFill.setAttribute(
            "role",
            "progressbar"
        );

        progressFill.setAttribute(
            "aria-valuenow",
            learner.progressPercentage
        );

        progressFill.setAttribute(
            "aria-valuemin",
            "0"
        );

        progressFill.setAttribute(
            "aria-valuemax",
            "100"
        );

        progressBar.appendChild(progressFill);


        // =====================================
        // TASK STATISTICS
        // =====================================

        const stats = document.createElement("div");

        stats.className = "assessor-progress-stats";


        const totalStat = document.createElement("span");

        totalStat.textContent =
            `Total Tasks: ${learner.totalTasks}`;


        const completedStat = document.createElement("span");

        completedStat.textContent =
            `Completed: ${learner.completedTasks}`;


        const outstandingStat = document.createElement("span");

        outstandingStat.textContent =
            `Outstanding: ${learner.outstandingTasks}`;


        stats.append(
            totalStat,
            completedStat,
            outstandingStat
        );


        // =====================================
        // EXPANDABLE TASK DETAILS
        // =====================================

        const details = document.createElement("details");

        details.className = "assessor-progress-details";


        const summary = document.createElement("summary");

        summary.textContent = "View Learner Tasks";

        details.appendChild(summary);


        const taskContainer = document.createElement("div");

        taskContainer.className = "assessor-progress-task-list";


        if (learner.tasks.length === 0) {

            const emptyMessage = document.createElement("p");

            emptyMessage.textContent =
                "This learner has not created any tasks yet.";

            taskContainer.appendChild(emptyMessage);

        } else {

            learner.tasks.forEach(task => {

                const taskRow = document.createElement("div");

                taskRow.className = "assessor-progress-task-row";


                const taskTitle = document.createElement("strong");

                taskTitle.textContent =
                    task.title || "Untitled Task";


                const taskStatus = document.createElement("span");

                taskStatus.className = task.completed === true
                    ? "status-completed"
                    : "status-outstanding";

                taskStatus.textContent = task.completed === true
                    ? "Completed"
                    : "Outstanding";


                const dueDate = document.createElement("small");

                dueDate.textContent =
                    `Due: ${task.dueDate || "Not set"}`;


                taskRow.append(
                    taskTitle,
                    taskStatus,
                    dueDate
                );

                taskContainer.appendChild(taskRow);

            });

        }

        details.appendChild(taskContainer);


        // =====================================
        // ADD CARD TO PAGE
        // =====================================

        card.append(
            header,
            progressBar,
            stats,
            details
        );

        learnerProgressList.appendChild(card);

    });

}


// =========================================
// EVENT LISTENERS
// =========================================

// Search by learner name or email
learnerSearch.addEventListener(
    "input",
    displayLearnerProgress
);

// Filter by progress
progressFilter.addEventListener(
    "change",
    displayLearnerProgress
);

// Refresh progress
refreshProgressBtn.addEventListener(
    "click",
    loadProgress
);