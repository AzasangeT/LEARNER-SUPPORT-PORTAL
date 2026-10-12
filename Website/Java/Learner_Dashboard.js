// =========================================
// LEARNER DASHBOARD
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


const outstandingTaskText =
    document.getElementById("outstandingTaskText");


const overallProgressElement =
    document.getElementById("overallProgress");


const dashboardTaskList =
    document.getElementById("dashboardTaskList");



// =========================================
// CURRENT USER
// =========================================

let currentUser = null;



// =========================================
// CHECK AUTHENTICATION
// =========================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (user) {

            currentUser = user;


            console.log(
                "Dashboard user:",
                currentUser.uid
            );


            // Load learner profile
            await loadLearnerInformation();


            // Load task information
            await loadDashboardTasks();

        }

        else {

            console.log(
                "No user logged in."
            );


            window.location.href =
                "Login.html";

        }

    }
);



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



        if (!snapshot.exists()) {

            console.error(
                "Learner profile not found."
            );

            return;

        }


        const userData =
            snapshot.val();



        // =====================================
        // ROLE PROTECTION
        // =====================================

        if (userData.role !== "Learner") {

            console.error(
                "User is not a learner."
            );


            // Assessor should not access
            // learner dashboard
            if (userData.role === "Assessor") {

                window.location.href =
                    "Assessor_Dashboard.html";

            }

            return;

        }



        // =====================================
        // DISPLAY LEARNER NAME
        // =====================================

        learnerName.textContent =
            userData.fullName || "Learner";


        console.log(
            "Learner profile:",
            userData
        );

    }

    catch (error) {

        console.error(
            "Unable to load learner profile:",
            error
        );

    }

}



// =========================================
// LOAD DASHBOARD TASKS
// =========================================

async function loadDashboardTasks() {

    try {

        const token =
            await currentUser.getIdToken();



        // =====================================
        // FIREBASE REST QUERY
        // =====================================

        const url =
            `https://learner-support-portal-8f0ac-default-rtdb.firebaseio.com/tasks.json?orderBy="userId"&equalTo="${currentUser.uid}"&auth=${token}`;



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
                "Dashboard Firebase GET error:",
                errorData
            );


            throw new Error(
                "Unable to load dashboard tasks."
            );

        }



        const tasks =
            await response.json();



        console.log(
            "Dashboard tasks:",
            tasks
        );



        // Calculate summary cards
        updateTaskSummary(tasks);


        // Display recent tasks
        displayDashboardTasks(tasks);

    }

    catch (error) {

        console.error(
            "Dashboard task error:",
            error
        );


        dashboardTaskList.innerHTML = `

            <p class="task-empty-message">
                Unable to load your tasks.
            </p>

        `;

    }

}



// =========================================
// UPDATE DASHBOARD SUMMARY
// =========================================

function updateTaskSummary(tasks) {


    // =====================================
    // NO TASKS
    // =====================================

    if (!tasks) {

        totalTasksElement.textContent =
            "0";


        completedTasksElement.textContent =
            "0";


        outstandingTaskText.textContent =
            "0 outstanding";


        overallProgressElement.textContent =
            "0%";


        return;

    }



    // Convert Firebase object to array
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
        totalTasks -
        completedTasks;



    // =====================================
    // PROGRESS %
    // =====================================

    let progress = 0;


    if (totalTasks > 0) {

        progress =
            Math.round(
                (
                    completedTasks /
                    totalTasks
                ) * 100
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



    // Singular / plural wording

    if (outstandingTasks === 1) {

        outstandingTaskText.textContent =
            "1 outstanding";

    }

    else {

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


    dashboardTaskList.innerHTML =
        "";



    // =====================================
    // NO TASKS
    // =====================================

    if (!tasks) {

        dashboardTaskList.innerHTML = `

            <p class="task-empty-message">

                You currently have no learning tasks.

                <a href="Learner_Task.html">
                    Create your first task
                </a>

            </p>

        `;


        return;

    }



    // Convert Firebase object into array
    const taskEntries =
        Object.entries(tasks);



    // =====================================
    // SORT TASKS
    // =====================================

    taskEntries.sort(
        (a, b) => {

            const taskA = a[1];
            const taskB = b[1];


            // Outstanding tasks first
            if (
                taskA.completed !==
                taskB.completed
            ) {

                return taskA.completed
                    ? 1
                    : -1;

            }


            // Then sort by due date
            return new Date(taskA.dueDate) -
                new Date(taskB.dueDate);

        }
    );



    // =====================================
    // ONLY SHOW FIRST 3 TASKS
    // =====================================

    const dashboardTasks =
        taskEntries.slice(0, 3);



    // =====================================
    // CREATE TASK ITEMS
    // =====================================

    dashboardTasks.forEach(
        ([taskId, task]) => {


            const taskItem =
                document.createElement("div");


            taskItem.classList.add(
                "task-item"
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
                    ? "status-completed"
                    : "status-pending";



            // =================================
            // TASK HTML
            // =================================

            taskItem.innerHTML = `

                <div>

                    <h3>
                        ${task.title}
                    </h3>

                    <p>
                        ${task.category}
                        •
                        Due ${task.dueDate}
                    </p>

                </div>


                <span class="${statusClass}">
                    ${statusText}
                </span>

            `;



            dashboardTaskList.appendChild(
                taskItem
            );

        }
    );

}