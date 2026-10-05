// =========================================
// LEARNER PROGRESS PAGE
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
// GET HTML ELEMENTS
// =========================================

const learnerName =
    document.getElementById("learnerName");

const totalTasksElement =
    document.getElementById("totalTasks");

const completedTasksElement =
    document.getElementById("completedTasks");

const outstandingTasksElement =
    document.getElementById("outstandingTasks");

const overallProgressElement =
    document.getElementById("overallProgress");

const progressBarFill =
    document.getElementById("progressBarFill");

const progressTaskList =
    document.getElementById("progressTaskList");


// =========================================
// CURRENT USER
// =========================================

let currentUser = null;


// =========================================
// CHECK LOGGED-IN USER
// =========================================

onAuthStateChanged(auth, async (user) => {

    if (user) {

        currentUser = user;

        console.log(
            "Logged-in learner:",
            currentUser.uid
        );


        // Load learner name
        await loadLearnerInformation();


        // Load progress information
        await loadProgress();

    }

    else {

        console.log(
            "No user logged in."
        );


        window.location.href =
            "Login.html";

    }

});


// =========================================
// LOAD LEARNER INFORMATION
// =========================================

async function loadLearnerInformation() {

    try {

        const userRef =
            ref(
                database,
                "users/" + currentUser.uid
            );


        const snapshot =
            await get(userRef);


        if (snapshot.exists()) {

            const userData =
                snapshot.val();


            learnerName.textContent =
                userData.fullName || "Learner";


            console.log(
                "Learner information:",
                userData
            );

        }

    }

    catch (error) {

        console.error(
            "Unable to load learner information:",
            error
        );

    }

}


// =========================================
// LOAD LEARNER PROGRESS
// =========================================

async function loadProgress() {

    try {

        // Get fresh Firebase authentication token
        const token =
            await currentUser.getIdToken();


        // Query only tasks belonging to learner
        const url =
            `https://learner-support-portal-8f0ac-default-rtdb.firebaseio.com/tasks.json?orderBy="userId"&equalTo="${currentUser.uid}"&auth=${token}`;


        // =====================================
        // GET TASKS USING FIREBASE REST
        // =====================================

        const response =
            await fetch(
                url,
                {
                    method: "GET"
                }
            );


        if (!response.ok) {

            const errorData =
                await response.text();


            console.error(
                "Firebase progress GET error:",
                errorData
            );


            throw new Error(
                "Unable to load progress."
            );

        }


        const tasks =
            await response.json();


        console.log(
            "Tasks used for progress:",
            tasks
        );


        // Calculate progress
        calculateProgress(tasks);


        // Display task progress
        displayProgressTasks(tasks);

    }

    catch (error) {

        console.error(
            "Progress error:",
            error
        );


        progressTaskList.innerHTML = `
            <p class="task-empty-message">
                Unable to load your progress.
            </p>
        `;

    }

}


// =========================================
// CALCULATE PROGRESS
// =========================================

function calculateProgress(tasks) {

    // =====================================
    // NO TASKS
    // =====================================

    if (!tasks) {

        totalTasksElement.textContent =
            "0";

        completedTasksElement.textContent =
            "0";

        outstandingTasksElement.textContent =
            "0";

        overallProgressElement.textContent =
            "0%";

        progressBarFill.style.width =
            "0%";

        return;

    }


    // Convert Firebase object into array
    const taskArray =
        Object.values(tasks);


    // =====================================
    // TOTAL TASKS
    // =====================================

    const totalTasks =
        taskArray.length;


    // =====================================
    // COMPLETED TASKS
    // =====================================

    const completedTasks =
        taskArray.filter(
            task =>
                task.completed === true
        ).length;


    // =====================================
    // OUTSTANDING TASKS
    // =====================================

    const outstandingTasks =
        totalTasks - completedTasks;


    // =====================================
    // OVERALL PROGRESS
    // =====================================

    let overallProgress = 0;


    if (totalTasks > 0) {

        overallProgress =
            Math.round(
                (
                    completedTasks /
                    totalTasks
                ) * 100
            );

    }


    // =====================================
    // DISPLAY RESULTS
    // =====================================

    totalTasksElement.textContent =
        totalTasks;

    completedTasksElement.textContent =
        completedTasks;

    outstandingTasksElement.textContent =
        outstandingTasks;

    overallProgressElement.textContent =
        `${overallProgress}%`;


    // Fill progress bar
    progressBarFill.style.width =
        `${overallProgress}%`;


    // =====================================
    // CONSOLE DEBUGGING
    // =====================================

    console.log(
        "Total tasks:",
        totalTasks
    );

    console.log(
        "Completed tasks:",
        completedTasks
    );

    console.log(
        "Outstanding tasks:",
        outstandingTasks
    );

    console.log(
        "Overall progress:",
        overallProgress + "%"
    );

}


// =========================================
// DISPLAY TASK PROGRESS
// =========================================

function displayProgressTasks(tasks) {

    // Clear existing content
    progressTaskList.innerHTML = "";


    // =====================================
    // NO TASKS
    // =====================================

    if (!tasks) {

        progressTaskList.innerHTML = `
            <p class="task-empty-message">
                You currently have no learning tasks.
            </p>
        `;

        return;

    }


    const taskEntries =
        Object.entries(tasks);


    // =====================================
    // CREATE TASK PROGRESS ITEMS
    // =====================================

    taskEntries.forEach(
        ([taskId, task]) => {


            const taskItem =
                document.createElement("div");


            taskItem.classList.add(
                "progress-task-item"
            );


            // =================================
            // STATUS
            // =================================

            const statusText =
                task.completed
                    ? "Completed"
                    : "Outstanding";


            const statusClass =
                task.completed
                    ? "completed"
                    : "outstanding";


            // =================================
            // CREATE HTML
            // =================================

            taskItem.innerHTML = `

                <div class="progress-task-info">

                    <h3>
                        ${task.title}
                    </h3>

                    <p>
                        ${task.category}
                        •
                        Due ${task.dueDate}
                    </p>

                </div>


                <span
                    class="progress-status ${statusClass}"
                >
                    ${statusText}
                </span>

            `;


            progressTaskList.appendChild(
                taskItem
            );

        }
    );

}