// =========================================
// SKILLS TRACK - ASSESSOR ANNOUNCEMENTS
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
// OOP - ANNOUNCEMENT CLASS
// =========================================

class Announcement {

    constructor(title, category, message, priority, createdBy) {

        this.title = title;
        this.category = category;
        this.message = message;
        this.priority = priority;
        this.createdBy = createdBy;
        this.createdAt = Date.now();

    }

}


// =========================================
// HTML ELEMENTS
// =========================================

const assessorName =
    document.getElementById("assessorName");

const announcementFormSection =
    document.getElementById("announcementFormSection");

const announcementForm =
    document.getElementById("announcementForm");

const announcementFormHeading =
    document.getElementById("announcementFormHeading");

const announcementList =
    document.getElementById("assessorAnnouncementList");

const announcementStatus =
    document.getElementById("announcementMessageStatus");

const saveAnnouncementBtn =
    document.getElementById("saveAnnouncementBtn");

const announcementSearch =
    document.getElementById("announcementSearch");

const announcementFilter =
    document.getElementById("announcementFilter");


let currentUser = null;
let announcements = [];
let editingAnnouncementId = null;


// =========================================
// AUTHENTICATION
// =========================================

onAuthStateChanged(auth, async user => {

    if (!user) {
        window.location.replace("Login.html");
        return;
    }

    try {

        const snapshot = await get(
            ref(database, `users/${user.uid}`)
        );

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

        assessorName.textContent =
            profile.fullName || "Assessor";

        await loadAnnouncements();

    } catch (error) {

        console.error(error);

        announcementStatus.textContent =
            "Unable to verify your account.";

    }

});


// =========================================
// FIREBASE REST REQUEST
// =========================================

async function firebaseRequest(path, method = "GET", data = null) {

    if (!currentUser) {
        throw new Error("You must be logged in.");
    }

    const token = await currentUser.getIdToken();

    const options = { method };

    if (data !== null) {

        options.headers = {
            "Content-Type": "application/json"
        };

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
// LOAD ANNOUNCEMENTS
// =========================================

async function loadAnnouncements() {

    announcementStatus.textContent = "";

    announcementList.textContent =
        "Loading announcements...";

    try {

        const data = await firebaseRequest("announcements");

        announcements = Object.entries(data || {}).map(
            ([id, announcement]) => ({
                id,
                ...announcement
            })
        );

        updateSummary();
        displayAnnouncements();

    } catch (error) {

        console.error("Unable to load announcements:", error);

        announcementStatus.textContent =
            "Unable to retrieve announcements.";

        announcementList.textContent = "";

    }

}


// =========================================
// UPDATE SUMMARY
// =========================================

function updateSummary() {

    document.getElementById("totalAnnouncements").textContent =
        announcements.length;

    document.getElementById("importantAnnouncements").textContent =
        announcements.filter(
            announcement => announcement.priority === "Important"
        ).length;

}


// =========================================
// DISPLAY ANNOUNCEMENTS
// =========================================

function displayAnnouncements() {

    announcementList.innerHTML = "";

    const search =
        announcementSearch.value.trim().toLowerCase();

    const category =
        announcementFilter.value;

    const filtered = announcements.filter(announcement => {

        const matchesSearch =
            (announcement.title || "").toLowerCase().includes(search) ||
            (announcement.message || "").toLowerCase().includes(search);

        const matchesCategory =
            category === "all" ||
            announcement.category === category;

        return matchesSearch && matchesCategory;

    });

    if (!filtered.length) {

        announcementList.textContent =
            announcements.length
                ? "No announcements match your search."
                : "No announcements have been published yet.";

        return;

    }

    filtered.sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );

    filtered.forEach(announcement => {

        const card = document.createElement("article");

        card.className = "announcement-card";

        if (announcement.priority === "Important") {
            card.classList.add("announcement-important");
        }

        const header = document.createElement("div");
        header.className = "announcement-card-header";

        const title = document.createElement("h3");
        title.textContent = announcement.title || "Untitled";

        const priority = document.createElement("span");
        priority.className = "announcement-priority";
        priority.textContent = announcement.priority || "Normal";

        header.append(title, priority);

        const category = document.createElement("p");
        category.className = "announcement-category";
        category.textContent =
            `Category: ${announcement.category || "General"}`;

        const message = document.createElement("p");
        message.className = "announcement-body";
        message.textContent = announcement.message || "";

        const date = document.createElement("small");

        date.textContent = announcement.createdAt
            ? new Date(announcement.createdAt).toLocaleDateString("en-ZA")
            : "Date unavailable";

        const actions = document.createElement("div");
        actions.className = "announcement-actions";

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.textContent = "Edit";
        editBtn.className = "resource-edit-btn";

        editBtn.addEventListener("click", () => {

            editingAnnouncementId = announcement.id;

            document.getElementById("announcementTitle").value =
                announcement.title || "";

            document.getElementById("announcementCategory").value =
                announcement.category || "General";

            document.getElementById("announcementMessage").value =
                announcement.message || "";

            document.getElementById("announcementPriority").value =
                announcement.priority || "Normal";

            announcementFormHeading.textContent =
                "Edit Announcement";

            saveAnnouncementBtn.textContent =
                "Save Changes";

            announcementFormSection.hidden = false;

            announcementFormSection.scrollIntoView({
                behavior: "smooth"
            });

        });

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "resource-delete-btn";

        deleteBtn.addEventListener("click", async () => {

            if (!confirm(`Delete "${announcement.title}"?`)) {
                return;
            }

            deleteBtn.disabled = true;

            try {

                await firebaseRequest(
                    `announcements/${announcement.id}`,
                    "DELETE"
                );

                await loadAnnouncements();

            } catch (error) {

                console.error(error);

                alert("Unable to delete announcement.");

                deleteBtn.disabled = false;

            }

        });

        actions.append(editBtn, deleteBtn);

        card.append(
            header,
            category,
            message,
            date,
            actions
        );

        announcementList.appendChild(card);

    });

}


// =========================================
// CREATE / EDIT ANNOUNCEMENT
// =========================================

announcementForm.addEventListener("submit", async event => {

    event.preventDefault();

    if (!currentUser) return;

    const title =
        document.getElementById("announcementTitle").value.trim();

    const category =
        document.getElementById("announcementCategory").value;

    const message =
        document.getElementById("announcementMessage").value.trim();

    const priority =
        document.getElementById("announcementPriority").value;

    if (!title || !category || !message) {

        alert("Please complete all required fields.");
        return;

    }

    saveAnnouncementBtn.disabled = true;

    try {

        if (editingAnnouncementId) {

            await firebaseRequest(
                `announcements/${editingAnnouncementId}`,
                "PATCH",
                {
                    title,
                    category,
                    message,
                    priority
                }
            );

        } else {

            const announcement = new Announcement(
                title,
                category,
                message,
                priority,
                currentUser.uid
            );

            await firebaseRequest(
                "announcements",
                "POST",
                announcement
            );

        }

        closeAnnouncementForm();

        await loadAnnouncements();

    } catch (error) {

        console.error(error);

        alert(
            "Unable to save announcement. Check your Firebase rules."
        );

    } finally {

        saveAnnouncementBtn.disabled = false;

    }

});


// =========================================
// FORM CONTROLS
// =========================================

function closeAnnouncementForm() {

    editingAnnouncementId = null;

    announcementForm.reset();

    announcementFormSection.hidden = true;

    announcementFormHeading.textContent =
        "Create Announcement";

    saveAnnouncementBtn.textContent =
        "Publish Announcement";

}


document.getElementById("createAnnouncementBtn")
    .addEventListener("click", () => {

        closeAnnouncementForm();

        announcementFormSection.hidden = false;

        announcementFormSection.scrollIntoView({
            behavior: "smooth"
        });

    });


document.getElementById("cancelAnnouncementBtn")
    .addEventListener("click", closeAnnouncementForm);


document.getElementById("refreshAnnouncementsBtn")
    .addEventListener("click", loadAnnouncements);


announcementSearch.addEventListener(
    "input",
    displayAnnouncements
);

announcementFilter.addEventListener(
    "change",
    displayAnnouncements
);