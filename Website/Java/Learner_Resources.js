// =========================================
// SKILLS TRACK - LEARNER RESOURCES
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

const learnerName = document.getElementById("learnerName");
const resourceList = document.getElementById("learnerResourceList");
const resourceMessage = document.getElementById("resourceMessage");
const resourceSearch = document.getElementById("resourceSearch");
const resourceFilter = document.getElementById("resourceFilter");

let currentUser = null;
let resources = [];

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

        if (profile.role !== "Learner") {
            window.location.replace(
                profile.role === "Assessor"
                    ? "Assessor_Dashboard.html"
                    : "Login.html"
            );
            return;
        }

        currentUser = user;
        learnerName.textContent = profile.fullName || "Learner";

        await loadResources();

    } catch (error) {
        console.error(error);
        resourceMessage.textContent = "Unable to verify your account.";
    }

});

// =========================================
// LOAD RESOURCES
// =========================================

async function loadResources() {

    if (!currentUser) return;

    resourceList.textContent = "Loading learning materials...";
    resourceMessage.textContent = "";

    try {

        const token = await currentUser.getIdToken();

        const response = await fetch(
            `${DATABASE_URL}/resources.json?auth=${encodeURIComponent(token)}`
        );

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const data = await response.json();

        resources = Object.entries(data || {}).map(([id, item]) => ({
            id,
            ...item
        }));

        document.getElementById("totalResources").textContent =
            resources.length;

        displayResources();

    } catch (error) {
        console.error("Unable to load resources:", error);
        resourceList.textContent = "Unable to retrieve learning materials.";
    }

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

    document.getElementById("resourceCount").textContent =
        `${filtered.length} resource(s)`;

    if (!filtered.length) {
        resourceList.textContent =
            resources.length
                ? "No resources match your search."
                : "No learning materials are available yet.";
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
        link.className = "resource-open-btn";
        link.textContent = "Open Resource";

        try {
            const url = new URL(resource.fileUrl);

            if (url.protocol === "https:" || url.protocol === "http:") {
                link.href = url.href;
                link.target = "_blank";
                link.rel = "noopener noreferrer";
            } else {
                link.textContent = "Invalid resource link";
            }

        } catch {
            link.textContent = "Invalid resource link";
        }

        card.append(category, title, description, type, link);
        resourceList.appendChild(card);
    });
}

// =========================================
// EVENT LISTENERS
// =========================================

document.getElementById("refreshResourcesBtn")
    .addEventListener("click", loadResources);

resourceSearch.addEventListener("input", displayResources);
resourceFilter.addEventListener("change", displayResources);