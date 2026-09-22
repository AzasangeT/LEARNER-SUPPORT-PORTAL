// =========================================
// LEARNER TASK PAGE
// =========================================

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import { auth } from "./firebase.js";


// Get HTML elements
const createTaskBtn =
    document.getElementById("createTaskBtn");

const cancelTaskBtn =
    document.getElementById("cancelTaskBtn");

const createTaskSection =
    document.getElementById("createTaskSection");

const taskForm =
    document.getElementById("taskForm");


// =========================================
// OPEN CREATE TASK FORM
// =========================================

createTaskBtn.addEventListener("click", () => {

    createTaskSection.classList.add("show");

});


// =========================================
// CLOSE CREATE TASK FORM
// =========================================

cancelTaskBtn.addEventListener("click", () => {

    createTaskSection.classList.remove("show");

    taskForm.reset();

});

let currentUser = null;

// =========================================
// CREATE TASK
// =========================================

taskForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    // Make sure a user is logged in
    if (!currentUser) {
        alert("You must be logged in to create a task.");
        return;
    }


    // Get form values
    const title =
        document.getElementById("taskTitle").value.trim();

    const category =
        document.getElementById("taskCategory").value;

    const dueDate =
        document.getElementById("taskDueDate").value;

    const priority =
        document.getElementById("taskPriority").value;

    const description =
        document.getElementById("taskDescription").value.trim();


    // Validate required fields
    if (
        title === "" ||
        category === "" ||
        dueDate === "" ||
        priority === ""
    ) {

        alert("Please complete all required fields.");

        return;
    }


    // Create task object
    const task = {

        title: title,
        category: category,
        dueDate: dueDate,
        priority: priority,
        description: description,

        completed: false,

        userId: currentUser.uid

    };


    console.log("Task to save:", task);


    try {

        // Firebase REST endpoint
        const url =
            `https://learner-support-portal-8f0ac-default-rtdb.firebaseio.com/tasks.json?auth=${currentUser.accessToken}`;


        // POST task to Firebase
        const response = await fetch(url, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(task)

        });


        if (!response.ok) {

            throw new Error(
                "Unable to create task."
            );

        }


        const result = await response.json();

        console.log("Firebase response:", result);
        console.log("Generated Task ID:", result.name);


        alert("Task created successfully!");

               taskForm.reset();

        createTaskSection.classList.remove("show");

// Reload tasks from Firebase
await loadTasks();  

    } catch (error) {

        console.error(
            "Create task error:",
            error
        );

        alert(
            "Unable to create task. Please try again."
        );

    }

});


// =========================================
// CHECK LOGGED-IN USER
// =========================================

onAuthStateChanged(auth, async (user) => {

    if (user) {

        currentUser = user;

        console.log(
            "Logged-in learner:",
            user.uid
        );

        await loadTasks();

    } else {

        console.log(
            "No user logged in."
        );

        window.location.href =
            "Login.html";

    }

});


const taskList =
    document.getElementById("taskList");


   // =========================================
// LOAD TASKS FROM FIREBASE
// =========================================

async function loadTasks() {

    if (!currentUser) {
        return;
    }

    try {

        const token =
            await currentUser.getIdToken();

        const url =
            `https://learner-support-portal-8f0ac-default-rtdb.firebaseio.com/tasks.json?orderBy="userId"&equalTo="${currentUser.uid}"&auth=${token}`;


        // GET learner tasks from Firebase
        const response = await fetch(url, {
            method: "GET"
        });


        if (!response.ok) {

            const errorData =
                await response.text();

            console.error(
                "Firebase GET error:",
                errorData
            );

            throw new Error(
                "Unable to load tasks."
            );
        }


        const tasks =
            await response.json();


        console.log(
            "Learner tasks from Firebase:",
            tasks
        );


        displayTasks(tasks);


    } catch (error) {

        console.error(
            "Load tasks error:",
            error
        );


        taskList.innerHTML = `
            <p class="task-empty-message">
                Unable to load your tasks.
            </p>
        `;
    }
}
// =========================================
// DISPLAY TASKS
// =========================================

function displayTasks(tasks) {

    // Clear existing task cards
    taskList.innerHTML = "";


    // No tasks exist
    if (!tasks) {

        taskList.innerHTML = `
            <p class="task-empty-message">
                You currently have no learning tasks.
            </p>
        `;

        return;
    }


    // Convert Firebase object into an array
    const taskEntries = Object.entries(tasks);


    // Only keep tasks belonging to logged-in learner
    const learnerTasks = taskEntries.filter(
        ([taskId, task]) =>
            task.userId === currentUser.uid
    );


    // Learner has no tasks
    if (learnerTasks.length === 0) {

        taskList.innerHTML = `
            <p class="task-empty-message">
                You currently have no learning tasks.
            </p>
        `;

        return;
    }


    // Create a card for every task
    learnerTasks.forEach(([taskId, task]) => {

        const taskCard =
            document.createElement("div");

        taskCard.classList.add(
            "learner-task-card"
        );


        const statusText =
            task.completed
                ? "Completed"
                : "Outstanding";


        const statusClass =
            task.completed
                ? "status-completed"
                : "status-outstanding";


        taskCard.innerHTML = `

            <div class="task-card-header">

                <h3>${task.title}</h3>

                <span class="${statusClass}">
                    ${statusText}
                </span>

            </div>


            <div class="task-card-details">

                <p>
                    <strong>Category:</strong>
                    ${task.category}
                </p>

                <p>
                    <strong>Due:</strong>
                    ${task.dueDate}
                </p>

                <p>
                    <strong>Priority:</strong>
                    ${task.priority}
                </p>

            </div>


            ${
                task.description
                    ? `
                    <div class="task-card-description">
                        <p>${task.description}</p>
                    </div>
                    `
                    : ""
            }


            <div class="task-card-actions">

                ${
                    !task.completed
                        ? `
                        <button
                            type="button"
                            class="complete-task-btn"
                            data-id="${taskId}"
                        >
                            Mark Complete
                        </button>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="edit-task-btn"
                    data-id="${taskId}"
                >
                    Edit
                </button>

                <button
                    type="button"
                    class="delete-task-btn"
                    data-id="${taskId}"
                >
                    Delete
                </button>

            </div>
        `;


        taskList.appendChild(taskCard);

    });

}