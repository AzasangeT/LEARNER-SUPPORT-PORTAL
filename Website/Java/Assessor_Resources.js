// =========================================
// SKILLS TRACK - ASSESSOR RESOURCES
// =========================================

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-database.js";

import { auth, database } from "./firebase.js";

const DATABASE_URL =
    "https://learner-support-portal-8f0ac-default-rtdb.firebaseio.com";

// =========================================
// OOP - RESOURCE CLASS
// =========================================

class Resource {

    constructor(title, category, description, type, fileUrl, uploadedBy) {
        this.title = title;
        this.category = category;
        this.description = description;
        this.type = type;
        this.fileUrl = fileUrl;
        this.uploadedBy = uploadedBy;
        this.createdAt = Date.now();
    }

}

// =========================================
// HTML ELEMENTS
// =========================================

const assessorName = document.getElementById("assessorName");

const resourceFormSection =
    document.getElementById("resourceFormSection");

const resourceForm = document.getElementById("resourceForm");

const resourceFormHeading =
    document.getElementById("resourceFormHeading");

const saveResourceBtn =
    document.getElementById("saveResourceBtn");

const resourceList =
    document.getElementById("assessorResourceList");

const resourceMessage =
    document.getElementById("resourceMessage");

const resourceSearch =
    document.getElementById("resourceSearch");

const resourceFilter =
    document.getElementById("resourceFilter");

let currentUser = null;
let resources = [];
let editingResourceId = null;

// =========================================
// AUTHENTICATION
// =========================================

onAuthStateChanged(auth, async user => {

    if (!user) {
        window.location.replace("Login.html");
        return;
    }

    try {
        const snapshot = await get(ref(database, `users/${user.uid}`));

        if (!snapshot.exists()) {
            window.location.replace("Login.html");
            return;
        }

        const profile = snapshot.val();

        if (profile.role !== "Assessor") {
            window.location.replace(
                profile.role === "Learner"
                    ? "Learner_Dashboard.html"
                    : "Login.html"
            );
            return;
        }

        currentUser = user;
        assessorName.textContent = profile.fullName || "Assessor";

        await loadResources();

    } catch (error) {
        console.error(error);
        resourceMessage.textContent = "Unable to verify your account.";
    }

});

// =========================================
// FIREBASE REST REQUEST
// =========================================

async function firebaseRequest(path, method = "GET", data = null) {

    if (!currentUser) {
        throw new Error("Please sign in.");
    }

    const token = await currentUser.getIdToken();

    const options = { method };

    if (data !== null) {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify(data);
    }

    const response = await fetch(
        `${DATABASE_URL}/${path}.json?auth=${encodeURIComponent(token)}`,
        options
    );

    if (!response.ok) {
        throw new Error(await response.text());
    }

    return response.json();
}

// =========================================
// VALIDATE RESOURCE URL
// =========================================

function validResourceUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

// =========================================
// LOAD RESOURCES
// =========================================

async function loadResources() {

    resourceMessage.textContent = "";
    resourceList.textContent = "Loading resources...";

    try {
        const data = await firebaseRequest("resources");

        resources = Object.entries(data || {}).map(([id, item]) => ({
            id,
            ...item
        }));

        updateSummary();
        displayResources();

    } catch (error) {
        console.error("Unable to load resources:", error);
        resourceList.textContent = "Unable to retrieve resources.";
    }

}

// =========================================
// SUMMARY
// =========================================

function updateSummary() {

    document.getElementById("totalResources").textContent =
        resources.length;

    document.getElementById("javascriptResources").textContent =
        resources.filter(item => item.category === "JavaScript").length;

    document.getElementById("pythonResources").textContent =
        resources.filter(item => item.category === "Python").length;

    document.getElementById("databaseResources").textContent =
        resources.filter(item => item.category === "Database").length;

}

// =========================================
// DISPLAY RESOURCES
// =========================================

function displayResources() {

    resourceList.innerHTML = "";

    const search = resourceSearch.value.trim().toLowerCase();
    const category = resourceFilter.value;

    const filtered = resources.filter(item => {

        const matchesSearch =
            (item.title || "").toLowerCase().includes(search) ||
            (item.description || "").toLowerCase().includes(search);

        const matchesCategory =
            category === "all" || item.category === category;

        return matchesSearch && matchesCategory;
    });

    if (!filtered.length) {
        resourceList.textContent =
            resources.length
                ? "No resources match your search."
                : "No learning resources have been published yet.";
        return;
    }

    filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    filtered.forEach(resource => {

        const card = document.createElement("article");
        card.className = "resource-card";

        const category = document.createElement("span");
        category.className = "resource-category";
        category.textContent = resource.category || "Other";

        const title = document.createElement("h3");
        title.textContent = resource.title || "Untitled Resource";

        const description = document.createElement("p");
        description.textContent = resource.description || "";

        const type = document.createElement("p");
        type.textContent = `Type: ${resource.type || "Website"}`;

        const link = document.createElement("a");
        link.textContent = "Open Resource";
        link.className = "resource-open-btn";

        if (validResourceUrl(resource.fileUrl)) {
            link.href = resource.fileUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        } else {
            link.textContent = "Invalid resource link";
            link.removeAttribute("href");
        }

        const actions = document.createElement("div");
        actions.className = "resource-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.textContent = "Edit";
        editBtn.className = "resource-edit-btn";

        editBtn.addEventListener("click", () => {
            editingResourceId = resource.id;

            document.getElementById("resourceTitle").value =
                resource.title || "";

            document.getElementById("resourceCategory").value =
                resource.category || "Other";

            document.getElementById("resourceType").value =
                resource.type || "Website";

            document.getElementById("resourceUrl").value =
                resource.fileUrl || "";

            document.getElementById("resourceDescription").value =
                resource.description || "";

            resourceFormHeading.textContent = "Edit Learning Resource";
            saveResourceBtn.textContent = "Save Changes";
            resourceFormSection.hidden = false;

            resourceFormSection.scrollIntoView({ behavior: "smooth" });
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "resource-delete-btn";

        deleteBtn.addEventListener("click", async () => {

            if (!confirm(`Delete "${resource.title}"?`)) return;

            deleteBtn.disabled = true;

            try {
                await firebaseRequest(
                    `resources/${resource.id}`,
                    "DELETE"
                );

                await loadResources();

            } catch (error) {
                console.error(error);
                alert("Unable to delete resource.");
                deleteBtn.disabled = false;
            }

        });

        actions.append(editBtn, deleteBtn);

        card.append(category, title, description, type, link, actions);
        resourceList.appendChild(card);
    });
}

// =========================================
// ADD / EDIT RESOURCE
// =========================================

resourceForm.addEventListener("submit", async event => {

    event.preventDefault();

    if (!currentUser) return;

    const title =
        document.getElementById("resourceTitle").value.trim();

    const category =
        document.getElementById("resourceCategory").value;

    const type =
        document.getElementById("resourceType").value;

    const fileUrl =
        document.getElementById("resourceUrl").value.trim();

    const description =
        document.getElementById("resourceDescription").value.trim();

    if (!title || !category || !type || !description ||
        !validResourceUrl(fileUrl)) {
        alert("Please complete all fields with a valid HTTP(S) link.");
        return;
    }

    saveResourceBtn.disabled = true;

    try {

        if (editingResourceId) {

            await firebaseRequest(
                `resources/${editingResourceId}`,
                "PATCH",
                { title, category, type, fileUrl, description }
            );

        } else {

            const resource = new Resource(
                title,
                category,
                description,
                type,
                fileUrl,
                currentUser.uid
            );

            await firebaseRequest("resources", "POST", resource);
        }

        closeForm();
        await loadResources();

    } catch (error) {
        console.error(error);
        alert("Unable to save resource. Check your Firebase rules.");
    } finally {
        saveResourceBtn.disabled = false;
    }

});

// =========================================
// FORM CONTROLS
// =========================================

function closeForm() {
    editingResourceId = null;
    resourceForm.reset();
    resourceFormSection.hidden = true;
    resourceFormHeading.textContent = "Add Learning Resource";
    saveResourceBtn.textContent = "Publish Resource";
}

document.getElementById("showResourceFormBtn")
    .addEventListener("click", () => {
        closeForm();
        resourceFormSection.hidden = false;
        resourceFormSection.scrollIntoView({ behavior: "smooth" });
    });

document.getElementById("cancelResourceBtn")
    .addEventListener("click", closeForm);

document.getElementById("refreshResourcesBtn")
    .addEventListener("click", loadResources);

resourceSearch.addEventListener("input", displayResources);
resourceFilter.addEventListener("change", displayResources);