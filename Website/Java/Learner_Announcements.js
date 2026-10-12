// =========================================
// SKILLS TRACK - LEARNER ANNOUNCEMENTS
// =========================================

// FIREBASE IMPORTS

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    ref,
    get,
    onValue
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-database.js";

import {
    auth,
    database
} from "./firebase.js";


// =========================================
// HTML ELEMENTS
// =========================================

const announcementList =
    document.getElementById("dashboardAnnouncements");

const announcementCount =
    document.getElementById("announcementCount");

const announcementStatus =
    document.getElementById("learnerAnnouncementStatus");
// =========================================
// AUTHENTICATION
// =========================================

let unsubscribeAnnouncements = null;

onAuthStateChanged(auth, async (user) => {

    // Stop any previous listener
    if (unsubscribeAnnouncements) {
        unsubscribeAnnouncements();
        unsubscribeAnnouncements = null;
    }

    if (!user) {
        return;
    }

    try {

        const userSnapshot = await get(
            ref(database, `users/${user.uid}`)
        );

        if (!userSnapshot.exists()) {
            return;
        }

        const profile = userSnapshot.val();

        // Announcements are displayed only to Learners
        if (profile.role !== "Learner") {
            return;
        }

        listenForAnnouncements();

    } catch (error) {

        console.error(
            "Unable to verify learner:",
            error
        );

        announcementStatus.textContent =
            "Unable to load announcements.";

    }

});


// =========================================
// REALTIME ANNOUNCEMENTS LISTENER
// =========================================

function listenForAnnouncements() {

    const announcementsRef = ref(
        database,
        "announcements"
    );

    unsubscribeAnnouncements = onValue(

        announcementsRef,

        (snapshot) => {

            const data = snapshot.exists()
                ? snapshot.val()
                : {};

            const announcements = Object.entries(data)
                .map(([id, announcement]) => ({
                    id,
                    ...announcement
                }));

            // Newest announcements first
            announcements.sort(
                (a, b) =>
                    (b.createdAt || 0) -
                    (a.createdAt || 0)
            );

            displayAnnouncements(announcements);

        },

        (error) => {

            console.error(
                "Unable to retrieve announcements:",
                error
            );

            announcementStatus.textContent =
                "Unable to retrieve announcements.";

            announcementList.textContent = "";

        }

    );

}


// =========================================
// DISPLAY ANNOUNCEMENTS
// =========================================

 function displayAnnouncements(announcements) {

    if (!announcementList || !announcementCount || !announcementStatus) {
        console.error(
            "Announcements HTML elements are missing. Check your element IDs."
        );
        return;
    }

    announcementList.innerHTML = "";

    announcementStatus.textContent = "";

    announcementCount.textContent =
        `${announcements.length} announcement${announcements.length === 1 ? "" : "s"}`;

    // Show the five latest announcements
    const latestAnnouncements = announcements.slice(0, 5);

    latestAnnouncements.forEach(announcement => {

        const card = document.createElement("article");

        card.className = "announcement-card";

        if (announcement.priority === "Important") {
            card.classList.add("announcement-important");
        }


        // ANNOUNCEMENT HEADER

        const header = document.createElement("div");

        header.className = "announcement-card-header";

        const title = document.createElement("h3");

        title.textContent =
            announcement.title || "Untitled Announcement";

        const priority = document.createElement("span");

        priority.className = "announcement-priority";

        priority.textContent =
            announcement.priority || "Normal";

        header.append(title, priority);


        // CATEGORY

        const category = document.createElement("p");

        category.className = "announcement-category";

        category.textContent =
            `Category: ${announcement.category || "General"}`;


        // MESSAGE

        const message = document.createElement("p");

        message.className = "announcement-body";

        message.textContent =
            announcement.message || "";


        // DATE

        const date = document.createElement("small");

        date.textContent = announcement.createdAt
            ? new Date(
                announcement.createdAt
            ).toLocaleDateString("en-ZA")
            : "Date unavailable";


        // ADD TO CARD

        card.append(
            header,
            category,
            message,
            date
        );

        announcementList.appendChild(card);

    });

}