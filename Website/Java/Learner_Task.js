// =========================================
// LEARNER TASK PAGE
// =========================================

import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import { auth } from "./firebase.js";


// =========================================
// GET HTML ELEMENTS
// =========================================

const createTaskBtn =
    document.getElementById("createTaskBtn");

const cancelTaskBtn =
    document.getElementById("cancelTaskBtn");

const createTaskSection =
    document.getElementById("createTaskSection");

const taskForm =
    document.getElementById("taskForm");

const taskList =
    document.getElementById("taskList");


// =========================================
// VARIABLES
// =========================================

let currentUser = null;

// null = creating a new task
// task ID = editing an existing task
let editingTaskId = null;


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

        // Load learner's tasks
        await loadTasks();

    } else {

        console.log(
            "No user logged in."
        );

        window.location.href =
            "Login.html";

    }

});


// =========================================
// OPEN CREATE TASK FORM
// =========================================

createTaskBtn.addEventListener("click", () => {

    // We are creating a NEW task
    editingTaskId = null;

    // Clear anything previously entered
    taskForm.reset();

    // Show form
    createTaskSection.classList.add("show");

});


// =========================================
// CLOSE CREATE TASK FORM
// =========================================

cancelTaskBtn.addEventListener("click", () => {

    createTaskSection.classList.remove("show");

    taskForm.reset();

    // Stop edit mode
    editingTaskId = null;

});


// =========================================
// CREATE OR UPDATE TASK
// =========================================

taskForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        // Make sure user is logged in
        if (!currentUser) {

            alert(
                "You must be logged in to save a task."
            );

            return;

        }


        // =================================
        // GET FORM VALUES
        // =================================

        const title =
            document
                .getElementById("taskTitle")
                .value
                .trim();

        const category =
            document
                .getElementById("taskCategory")
                .value;

        const dueDate =
            document
                .getElementById("taskDueDate")
                .value;

        const priority =
            document
                .getElementById("taskPriority")
                .value;

        const description =
            document
                .getElementById("taskDescription")
                .value
                .trim();


        // =================================
        // VALIDATION
        // =================================

        if (
            title === "" ||
            category === "" ||
            dueDate === "" ||
            priority === ""
        ) {

            alert(
                "Please complete all required fields."
            );

            return;

        }


        try {

            // Get fresh Firebase token
            const token =
                await currentUser.getIdToken();


            // =================================
            // EDIT EXISTING TASK
            // =================================

            if (editingTaskId) {

                const url =
                    `https://learner-support-portal-8f0ac-default-rtdb.firebaseio.com/tasks/${editingTaskId}.json?auth=${token}`;


                const updatedTask = {

                    title: title,
                    category: category,
                    dueDate: dueDate,
                    priority: priority,
                    description: description

                };


                const response =
                    await fetch(
                        url,
                        {
                            method: "PATCH",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    updatedTask
                                )
                        }
                    );


                if (!response.ok) {

                    const errorData =
                        await response.text();

                    console.error(
                        "Firebase UPDATE error:",
                        errorData
                    );

                    throw new Error(
                        "Unable to update task."
                    );

                }


                console.log(
                    "Task updated:",
                    editingTaskId
                );


                alert(
                    "Task updated successfully!"
                );


                // Exit edit mode
                editingTaskId = null;

            }


            // =================================
            // CREATE NEW TASK
            // =================================

            else {

                const task = {

                    title: title,
                    category: category,
                    dueDate: dueDate,
                    priority: priority,
                    description: description,

                    completed: false,

                    userId:
                        currentUser.uid

                };


                console.log(
                    "Task to save:",
                    task
                );


                const url =
                    `https://learner-support-portal-8f0ac-default-rtdb.firebaseio.com/tasks.json?auth=${token}`;


                const response =
                    await fetch(
                        url,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    task
                                )
                        }
                    );


                if (!response.ok) {

                    const errorData =
                        await response.text();

                    console.error(
                        "Firebase POST error:",
                        errorData
                    );

                    throw new Error(
                        "Unable to create task."
                    );

                }


                const result =
                    await response.json();


                console.log(
                    "Firebase response:",
                    result
                );

                console.log(
                    "Generated Task ID:",
                    result.name
                );


                alert(
                    "Task created successfully!"
                );

            }


            // =================================
            // RESET FORM
            // =================================

            taskForm.reset();

            createTaskSection
                .classList
                .remove("show");


            // Reload tasks from Firebase
            await loadTasks();

        }

        catch (error) {

            console.error(
                "Save task error:",
                error
            );

            alert(
                "Unable to save task. Please try again."
            );

        }

    }
);


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


        // GET learner tasks
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

    }

    catch (error) {

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

    // Clear existing cards
    taskList.innerHTML = "";


    // No tasks returned
    if (!tasks) {

        taskList.innerHTML = `
            <p class="task-empty-message">
                You currently have no learning tasks.
            </p>
        `;

        return;

    }


    // Convert Firebase object to array
    const taskEntries =
        Object.entries(tasks);


    // Keep only logged-in learner's tasks
    const learnerTasks =
        taskEntries.filter(
            ([taskId, task]) =>
                task.userId === currentUser.uid
        );


    // No tasks for learner
    if (learnerTasks.length === 0) {

        taskList.innerHTML = `
            <p class="task-empty-message">
                You currently have no learning tasks.
            </p>
        `;

        return;

    }


    // =========================================
    // CREATE TASK CARDS
    // =========================================

    learnerTasks.forEach(
        ([taskId, task]) => {

            const taskCard =
                document.createElement("div");


            taskCard.classList.add(
                "learner-task-card"
            );


            // Status text
            const statusText =
                task.completed
                    ? "Completed"
                    : "Outstanding";


            // Status CSS class
            const statusClass =
                task.completed
                    ? "status-completed"
                    : "status-outstanding";


            taskCard.innerHTML = `

                <div class="task-card-header">

                    <h3>
                        ${task.title}
                    </h3>

                    <span class="${statusClass}">
                        ${statusText}
                    </span>

                </div>


                <div class="task-card-details">

                    <p>
                        <strong>
                            Category:
                        </strong>

                        ${task.category}
                    </p>


                    <p>
                        <strong>
                            Due:
                        </strong>

                        ${task.dueDate}
                    </p>


                    <p>
                        <strong>
                            Priority:
                        </strong>

                        ${task.priority}
                    </p>

                </div>


                ${
                    task.description
                        ? `
                            <div class="task-card-description">

                                <p>
                                    ${task.description}
                                </p>

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


            taskList.appendChild(
                taskCard
            );

        }
    );

}


// =========================================
// TASK BUTTON ACTIONS
// =========================================

taskList.addEventListener(
    "click",
    async (event) => {

        const taskId =
            event.target.dataset.id;


        // =================================
        // MARK COMPLETE
        // =================================

        if (
            event.target
                .classList
                .contains(
                    "complete-task-btn"
                )
        ) {

            await markTaskComplete(
                taskId
            );

        }


        // =================================
        // EDIT
        // =================================

        if (
            event.target
                .classList
                .contains(
                    "edit-task-btn"
                )
        ) {

            await editTask(
                taskId
            );

        }


        // =================================
        // DELETE
        // =================================

        if (
            event.target
                .classList
                .contains(
                    "delete-task-btn"
                )
        ) {

            await deleteTask(
                taskId
            );

        }

    }
);


// =========================================
// MARK TASK AS COMPLETE
// =========================================

async function markTaskComplete(taskId) {

    if (!currentUser) {
        return;
    }


    try {

        const token =
            await currentUser.getIdToken();


        const url =
            `https://learner-support-portal-8f0ac-default-rtdb.firebaseio.com/tasks/${taskId}.json?auth=${token}`;


        // PATCH completed property
        const response =
            await fetch(
                url,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            completed: true
                        })
                }
            );


        if (!response.ok) {

            const errorData =
                await response.text();

            console.error(
                "Firebase PATCH error:",
                errorData
            );

            throw new Error(
                "Unable to update task."
            );

        }


        console.log(
            "Task marked as complete:",
            taskId
        );


        // Reload latest task data
        await loadTasks();

    }

    catch (error) {

        console.error(
            "Mark complete error:",
            error
        );


        alert(
            "Unable to mark task as complete."
        );

    }

}


// =========================================
// EDIT TASK
// =========================================

async function editTask(taskId) {

    if (!currentUser) {
        return;
    }


    try {

        const token =
            await currentUser.getIdToken();


        const url =
            `https://learner-support-portal-8f0ac-default-rtdb.firebaseio.com/tasks/${taskId}.json?auth=${token}`;


        // GET selected task
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
                "Firebase EDIT GET error:",
                errorData
            );

            throw new Error(
                "Unable to retrieve task."
            );

        }


        const task =
            await response.json();


        // Make sure task exists
        if (!task) {

            throw new Error(
                "Task could not be found."
            );

        }


        // Make sure learner owns task
        if (
            task.userId !==
            currentUser.uid
        ) {

            throw new Error(
                "You cannot edit this task."
            );

        }


        console.log(
            "Task being edited:",
            task
        );


        // Store ID so submit knows
        // this is an UPDATE
        editingTaskId = taskId;


        // =================================
        // FILL FORM WITH EXISTING DATA
        // =================================

        document
            .getElementById("taskTitle")
            .value =
            task.title;


        document
            .getElementById("taskCategory")
            .value =
            task.category;


        document
            .getElementById("taskDueDate")
            .value =
            task.dueDate;


        document
            .getElementById("taskPriority")
            .value =
            task.priority;


        document
            .getElementById("taskDescription")
            .value =
            task.description || "";


        // Show form
        createTaskSection
            .classList
            .add("show");


        // Scroll learner to form
        createTaskSection
            .scrollIntoView({
                behavior: "smooth"
            });

    }

    catch (error) {

        console.error(
            "Edit task error:",
            error
        );


        alert(
            "Unable to edit task."
        );

    }

}


// =========================================
// DELETE TASK
// =========================================

async function deleteTask(taskId) {

    if (!currentUser) {
        return;
    }


    // Ask learner to confirm
    const confirmDelete =
        confirm(
            "Are you sure you want to delete this task?"
        );


    // Learner clicked Cancel
    if (!confirmDelete) {
        return;
    }


    try {

        const token =
            await currentUser.getIdToken();


        const url =
            `https://learner-support-portal-8f0ac-default-rtdb.firebaseio.com/tasks/${taskId}.json?auth=${token}`;


        // DELETE task
        const response =
            await fetch(
                url,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            const errorData =
                await response.text();

            console.error(
                "Firebase DELETE error:",
                errorData
            );

            throw new Error(
                "Unable to delete task."
            );

        }


        console.log(
            "Task deleted:",
            taskId
        );


        alert(
            "Task deleted successfully!"
        );


        // If deleted task was being edited,
        // reset the form
        if (
            editingTaskId === taskId
        ) {

            editingTaskId = null;

            taskForm.reset();

            createTaskSection
                .classList
                .remove("show");

        }


        // GET tasks again
        await loadTasks();

    }

    catch (error) {

        console.error(
            "Delete task error:",
            error
        );


        alert(
            "Unable to delete task."
        );

    }

}