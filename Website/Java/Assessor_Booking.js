// =========================================
// SKILLS TRACK - ASSESSOR BOOKINGS
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
// FIREBASE REST URL
// =========================================

const DATABASE_URL =
    "https://learner-support-portal-8f0ac-default-rtdb.firebaseio.com";


// =========================================
// HTML ELEMENTS
// =========================================

const assessorName = document.getElementById("assessorName");

const totalBookingsElement =
    document.getElementById("totalBookings");

const pendingBookingsElement =
    document.getElementById("pendingBookings");

const approvedBookingsElement =
    document.getElementById("approvedBookings");

const completedBookingsElement =
    document.getElementById("completedBookings");

const bookingSearch =
    document.getElementById("bookingSearch");

const bookingStatusFilter =
    document.getElementById("bookingStatusFilter");

const bookingList =
    document.getElementById("assessorBookingList");

const bookingCount =
    document.getElementById("bookingCount");

const bookingMessage =
    document.getElementById("bookingMessage");

const refreshBookingsBtn =
    document.getElementById("refreshBookingsBtn");


// =========================================
// APPLICATION DATA
// =========================================

let currentUser = null;

let bookings = [];

let learners = {};


// =========================================
// AUTHENTICATION
// =========================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.replace("Login.html");
        return;
    }

    try {

        const profileSnapshot = await get(
            ref(database, `users/${user.uid}`)
        );

        if (!profileSnapshot.exists()) {
            window.location.replace("Login.html");
            return;
        }

        const profile = profileSnapshot.val();

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

        await loadBookings();

    } catch (error) {

        console.error("Authentication error:", error);

        bookingMessage.textContent =
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

    const url =
        `${DATABASE_URL}/${path}.json?auth=${encodeURIComponent(token)}`;

    const options = {
        method: method
    };

    if (data !== null) {

        options.headers = {
            "Content-Type": "application/json"
        };

        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {

        const errorText = await response.text();

        throw new Error(
            `Firebase request failed: ${errorText}`
        );
    }

    return await response.json();
}


// =========================================
// LOAD BOOKINGS
// =========================================

async function loadBookings() {

    refreshBookingsBtn.disabled = true;

    bookingMessage.textContent = "";

    bookingList.textContent = "Loading support requests...";

    try {

        // Retrieve learner profiles
        const usersSnapshot = await get(
            ref(database, "users")
        );

        const users = usersSnapshot.exists()
            ? usersSnapshot.val()
            : {};

        learners = {};

        Object.entries(users).forEach(([uid, profile]) => {

            if (profile && profile.role === "Learner") {
                learners[uid] = profile;
            }

        });


        // Retrieve bookings
        const bookingData = await firebaseRequest("bookings");

        bookings = Object.entries(bookingData || {})

            .filter(([id, booking]) => {
                return booking && learners[booking.userId];
            })

            .map(([id, booking]) => {

                return {
                    id: id,
                    ...booking,
                    learnerName:
                        learners[booking.userId].fullName ||
                        "Unnamed Learner"
                };

            });


        updateBookingSummary();

        displayBookings();

    } catch (error) {

        console.error("Unable to load bookings:", error);

        bookingList.textContent =
            "Unable to retrieve support requests.";

        bookingMessage.textContent =
            "Please check your connection and Firebase rules.";

    } finally {

        refreshBookingsBtn.disabled = false;

    }

}


// =========================================
// UPDATE SUMMARY
// =========================================

function updateBookingSummary() {

    totalBookingsElement.textContent = bookings.length;

    pendingBookingsElement.textContent =
        bookings.filter(
            booking => booking.status === "Pending"
        ).length;

    approvedBookingsElement.textContent =
        bookings.filter(
            booking => booking.status === "Approved"
        ).length;

    completedBookingsElement.textContent =
        bookings.filter(
            booking => booking.status === "Completed"
        ).length;

}


// =========================================
// FILTER BOOKINGS
// =========================================

function getFilteredBookings() {

    const search = bookingSearch.value.trim().toLowerCase();

    const status = bookingStatusFilter.value;

    return bookings.filter(booking => {

        const matchesSearch =
            (booking.learnerName || "")
                .toLowerCase()
                .includes(search) ||

            (booking.topic || "")
                .toLowerCase()
                .includes(search);

        const matchesStatus =
            status === "all" ||
            booking.status === status;

        return matchesSearch && matchesStatus;

    });

}


// =========================================
// DISPLAY BOOKINGS
// =========================================

function displayBookings() {

    bookingList.innerHTML = "";

    const filteredBookings = getFilteredBookings();

    bookingCount.textContent =
        `${filteredBookings.length} request(s)`;

    if (filteredBookings.length === 0) {

        bookingList.textContent =
            bookings.length === 0
                ? "No support requests have been submitted."
                : "No requests match your filters.";

        return;
    }

    filteredBookings.sort((a, b) => {

        return (b.createdAt || 0) - (a.createdAt || 0);

    });


    filteredBookings.forEach(booking => {

        const card = document.createElement("article");

        card.className = "assessor-booking-card";


        const heading = document.createElement("div");

        heading.className = "assessor-task-card-header";


        const title = document.createElement("h3");

        title.textContent = booking.topic || "Support Request";


        const status = document.createElement("span");

        status.className =
            `booking-status booking-status-${(booking.status || "Pending").toLowerCase()}`;

        status.textContent = booking.status || "Pending";

        heading.append(title, status);


        const learner = document.createElement("p");

        learner.textContent =
            `Learner: ${booking.learnerName}`;


        const date = document.createElement("p");

        date.textContent =
            `Preferred Date: ${booking.date || "Not set"}`;


        const time = document.createElement("p");

        time.textContent =
            `Preferred Time: ${booking.time || "Not set"}`;


        const description = document.createElement("p");

        description.textContent =
            `Description: ${booking.description || "None"}`;


        const feedbackLabel = document.createElement("label");

        feedbackLabel.textContent = "Assessor Feedback";


        const feedbackInput = document.createElement("textarea");

        feedbackInput.rows = 3;

        feedbackInput.placeholder =
            "Enter feedback for the learner...";

        feedbackInput.value =
            booking.assessorFeedback || "";


        const actions = document.createElement("div");

        actions.className = "booking-actions";


        const buttons = [
            ["Approve", "Approved"],
            ["Decline", "Declined"],
            ["Complete", "Completed"]
        ];


        buttons.forEach(([label, newStatus]) => {

            const button = document.createElement("button");

            button.type = "button";

            button.textContent = label;

            button.className =
                newStatus === "Approved"
                    ? "booking-approve-btn"
                    : newStatus === "Declined"
                        ? "booking-decline-btn"
                        : "booking-complete-btn";

            button.disabled =
                booking.status === newStatus ||
                booking.status === "Completed" ||
                booking.status === "Declined" ||
                (
                    newStatus === "Completed" &&
                    booking.status !== "Approved"
                );

            button.addEventListener("click", async () => {

                const feedback = feedbackInput.value.trim();

                if (newStatus === "Declined" && !feedback) {

                    alert(
                        "Please provide feedback explaining why the request was declined."
                    );

                    return;
                }

                const originalText = button.textContent;

                button.disabled = true;

                button.textContent = "Saving...";

                try {

                    // Check the latest saved status before updating
                    const latest = await firebaseRequest(
                        `bookings/${booking.id}`
                    );

                    if (!latest) {
                        throw new Error("This booking no longer exists.");
                    }

                    const allowed =
                        (
                            latest.status === "Pending" &&
                            (
                                newStatus === "Approved" ||
                                newStatus === "Declined"
                            )
                        ) ||
                        (
                            latest.status === "Approved" &&
                            newStatus === "Completed"
                        );

                    if (!allowed) {
                        throw new Error(
                            "This booking's status has changed. Refresh the page."
                        );
                    }

                    await firebaseRequest(
                        `bookings/${booking.id}`,
                        "PATCH",
                        {
                            status: newStatus,
                            assessorFeedback: feedback,
                            reviewedBy: currentUser.uid,
                            reviewedAt: Date.now()
                        }
                    );

                    bookingMessage.textContent =
                        `Booking ${newStatus.toLowerCase()} successfully.`;

                    await loadBookings();

                } catch (error) {

                    console.error("Booking update failed:", error);

                    alert(
                        `Unable to update booking: ${error.message}`
                    );

                    button.disabled = false;

                    button.textContent = originalText;

                }

            });

            actions.appendChild(button);

        });


        card.append(
            heading,
            learner,
            date,
            time,
            description,
            feedbackLabel,
            feedbackInput,
            actions
        );

        bookingList.appendChild(card);

    });

}


// =========================================
// EVENT LISTENERS
// =========================================

bookingSearch.addEventListener("input", displayBookings);

bookingStatusFilter.addEventListener("change", displayBookings);

refreshBookingsBtn.addEventListener("click", loadBookings);