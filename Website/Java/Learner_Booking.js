// =========================================
// SKILLS TRACK - LEARNER BOOKINGS
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

const learnerName = document.getElementById("learnerName");

const learnerGreeting = document.getElementById("learnerGreeting");

const supportRequestForm =
    document.getElementById("supportRequestForm");

const supportRequestSection =
    document.getElementById("supportRequestSection");

const requestSuccessSection =
    document.getElementById("requestSuccessSection");

const submittedRequestSection =
    document.getElementById("submittedRequestSection");

const submittedRequestDetails =
    document.getElementById("submittedRequestDetails");

const submitRequestBtn =
    document.getElementById("submitRequestBtn");

const preferredDate =
    document.getElementById("preferredDate");


// =========================================
// CURRENT USER
// =========================================

let currentUser = null;


// =========================================
// AUTHENTICATION
// =========================================

onAuthStateChanged(auth, async (user) => {

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

        if (profile.role !== "Learner") {

            window.location.replace(
                profile.role === "Assessor"
                    ? "Assessor_Dashboard.html"
                    : "Login.html"
            );

            return;
        }

        currentUser = user;

        learnerName.textContent =
            profile.fullName || "Learner";

        learnerGreeting.textContent =
            profile.fullName || "Learner";

        await loadMyBookings();

    } catch (error) {

        console.error("Unable to load learner profile:", error);

        submittedRequestDetails.textContent =
            "Unable to load your account information.";

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
// SUBMIT SUPPORT REQUEST
// =========================================

supportRequestForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    if (!currentUser) {
        alert("Please log in before submitting a request.");
        return;
    }

    const topic =
        document.getElementById("supportTopic").value;

    const date = preferredDate.value;

    const time =
        document.getElementById("preferredTime").value;

    const description =
        document.getElementById("supportDescription").value.trim();

    if (!topic || !date || !time || !description) {

        alert("Please complete all required fields.");
        return;
    }

    // Compare dates in local calendar format
    const today = new Date();

    const localToday =
        `${today.getFullYear()}-` +
        `${String(today.getMonth() + 1).padStart(2, "0")}-` +
        `${String(today.getDate()).padStart(2, "0")}`;

    if (date < localToday) {

        alert("Please select today or a future date.");
        return;
    }

    const booking = {
        userId: currentUser.uid,
        topic: topic,
        date: date,
        time: time,
        description: description,
        status: "Pending",
        createdAt: Date.now(),
        assessorFeedback: "",
        reviewedBy: "",
        reviewedAt: 0
    };

    submitRequestBtn.disabled = true;
    submitRequestBtn.textContent = "Submitting...";

    try {

        const result = await firebaseRequest(
            "bookings",
            "POST",
            booking
        );

        console.log("Booking created:", result.name);

        supportRequestForm.reset();

        supportRequestSection.style.display = "none";

        requestSuccessSection.style.display = "block";

        await loadMyBookings();

    } catch (error) {

        console.error("Booking submission failed:", error);

        alert(
            "Unable to submit your request. Please try again."
        );

    } finally {

        submitRequestBtn.disabled = false;

        submitRequestBtn.textContent = "Submit Request";

    }

});


// =========================================
// LOAD LEARNER BOOKINGS
// =========================================

async function loadMyBookings() {

    if (!currentUser) {
        return;
    }

    submittedRequestDetails.textContent =
        "Loading your support requests...";

    try {

        const token = await currentUser.getIdToken();

        const url =
            `${DATABASE_URL}/bookings.json` +
            `?orderBy=${encodeURIComponent('"userId"')}` +
            `&equalTo=${encodeURIComponent(JSON.stringify(currentUser.uid))}` +
            `&auth=${encodeURIComponent(token)}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const bookingData = await response.json();

        const myBookings = Object.entries(bookingData || {})

            .filter(([id, booking]) => {
                return booking && booking.userId === currentUser.uid;
            })

            .map(([id, booking]) => ({
                id,
                ...booking
            }));

        displayMyBookings(myBookings);

    } catch (error) {

        console.error("Unable to load bookings:", error);

        submittedRequestDetails.textContent =
            "Unable to retrieve your support requests.";

    }

}


// =========================================
// DISPLAY LEARNER BOOKINGS
// =========================================

function displayMyBookings(myBookings) {

    submittedRequestDetails.innerHTML = "";

    if (myBookings.length === 0) {

        submittedRequestDetails.textContent =
            "You have not submitted any support requests.";

        return;
    }

    myBookings.sort((a, b) => {
        return (b.createdAt || 0) - (a.createdAt || 0);
    });

    myBookings.forEach(booking => {

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

        const date = document.createElement("p");

        date.textContent = `Preferred Date: ${booking.date || "Not set"}`;

        const time = document.createElement("p");

        time.textContent = `Preferred Time: ${booking.time || "Not set"}`;

        const description = document.createElement("p");

        description.textContent =
            `Description: ${booking.description || "None"}`;

        const feedback = document.createElement("p");

        feedback.textContent =
            `Assessor Feedback: ${booking.assessorFeedback || "Awaiting review"}`;

        card.append(
            heading,
            date,
            time,
            description,
            feedback
        );

        submittedRequestDetails.appendChild(card);

    });

}


// =========================================
// BUTTON EVENTS
// =========================================

document.getElementById("cancelRequestBtn")
    .addEventListener("click", () => {
        supportRequestForm.reset();
    });

document.getElementById("viewRequestBtn")
    .addEventListener("click", () => {

        submittedRequestSection.scrollIntoView({
            behavior: "smooth"
        });

    });

document.getElementById("newRequestBtn")
    .addEventListener("click", () => {

        requestSuccessSection.style.display = "none";

        supportRequestSection.style.display = "block";

        supportRequestSection.scrollIntoView({
            behavior: "smooth"
        });

    });

document.getElementById("refreshMyBookingsBtn")
    .addEventListener("click", loadMyBookings);