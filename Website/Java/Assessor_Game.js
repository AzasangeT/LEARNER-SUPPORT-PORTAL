/* =========================================
   SKILLS TRACK - ASSESSOR GAME PERFORMANCE
========================================= */

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

const totalPlayers = document.getElementById("totalPlayers");
const averageScore = document.getElementById("averageScore");
const highestScore = document.getElementById("highestScore");
const totalAttempts = document.getElementById("totalAttempts");

const gameResultsTable = document.getElementById("gameResultsTable");
const searchLearner = document.getElementById("searchLearner");


// =========================================
// VARIABLES
// =========================================

let allResults = [];
let learnerProfiles = {};

let stopResultsListener = null;


// =========================================
// AUTHENTICATION
// =========================================

onAuthStateChanged(auth, async (user) => {

    if (stopResultsListener) {
        stopResultsListener();
        stopResultsListener = null;
    }

    if (!user) {
        window.location.replace("Login.html");
        return;
    }

    try {

        // Get logged-in user's profile

        const userRef = ref(database, `users/${user.uid}`);

        const userSnapshot = await get(userRef);

        if (!userSnapshot.exists()) {
            window.location.replace("Login.html");
            return;
        }

        const userData = userSnapshot.val();

        // Only assessors can view this page

        if (userData.role !== "Assessor") {
            window.location.replace("learner-dashboard.html");
            return;
        }

        // Load learner profiles

        await loadLearnerProfiles();

        // Start tracking results

        listenForGameResults();

    } catch (error) {

        console.error("Authentication error:", error);

        gameResultsTable.innerHTML = `
            <tr>
                <td colspan="5">
                    Unable to load game performance.
                </td>
            </tr>
        `;

    }

});


// =========================================
// LOAD LEARNER PROFILES
// =========================================

async function loadLearnerProfiles() {

    try {

        const usersRef = ref(database, "users");

        const snapshot = await get(usersRef);

        learnerProfiles = snapshot.exists()
            ? snapshot.val()
            : {};

    } catch (error) {

        console.error("Unable to load learner profiles:", error);

        learnerProfiles = {};

    }

}


// =========================================
// LISTEN FOR GAME RESULTS
// =========================================

function listenForGameResults() {

    const resultsRef = ref(database, "gameResults");

    stopResultsListener = onValue(

        resultsRef,

        (snapshot) => {

            const data = snapshot.val() || {};

            allResults = Object.entries(data).map(
                ([resultId, result]) => ({
                    resultId,
                    ...result
                })
            );

            updateStatistics();
            displayResults();

        },

        (error) => {

            console.error("Unable to load game results:", error);

            gameResultsTable.innerHTML = `
                <tr>
                    <td colspan="5">
                        Unable to retrieve game results.
                        Please check Firebase permissions.
                    </td>
                </tr>
            `;

        }

    );

}


// =========================================
// UPDATE STATISTICS
// =========================================

function updateStatistics() {

    // Total attempts

    totalAttempts.textContent = allResults.length;

    // Count unique learners

    const uniqueLearners = new Set(
        allResults.map(result => result.userId)
            .filter(Boolean)
    );

    totalPlayers.textContent = uniqueLearners.size;

    // Handle empty database

    if (allResults.length === 0) {

        averageScore.textContent = "0%";
        highestScore.textContent = "0%";

        return;

    }

    // Calculate average score

    const totalScore = allResults.reduce(
        (sum, result) => sum + Number(result.score || 0),
        0
    );

    const average = totalScore / allResults.length;

    averageScore.textContent = `${Math.round(average)}%`;

    // Find highest score

    const highest = Math.max(
        ...allResults.map(result => Number(result.score || 0))
    );

    highestScore.textContent = `${highest}%`;

}


// =========================================
// DISPLAY RESULTS
// =========================================

function displayResults() {

    const searchTerm = searchLearner.value
        .trim()
        .toLowerCase();

    const filteredResults = allResults.filter(result => {

        const learnerName = getLearnerName(result.userId);

        return learnerName.toLowerCase().includes(searchTerm);

    });

    // Sort latest attempts first

    filteredResults.sort(
        (a, b) => Number(b.completedAt || 0) -
                  Number(a.completedAt || 0)
    );

    gameResultsTable.innerHTML = "";

    if (filteredResults.length === 0) {

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 5;

        cell.textContent = allResults.length === 0
            ? "No game results recorded yet."
            : "No learners match your search.";

        row.appendChild(cell);
        gameResultsTable.appendChild(row);

        return;

    }

    filteredResults.forEach(result => {

        const row = document.createElement("tr");

        const learnerName = getLearnerName(result.userId);

        const score = Number(result.score || 0);

        const performance = getPerformance(score);

        const status = result.status ||
            (Number(result.timeRemaining) > 0
                ? "Completed"
                : "Time Up");

        const date = result.completedAt
            ? new Date(result.completedAt).toLocaleString("en-ZA")
            : "Unknown";

        addCell(row, learnerName);
        addCell(row, `${score}/100`);
        addCell(row, performance);
        addCell(row, status);
        addCell(row, date);

        gameResultsTable.appendChild(row);

    });

}


// =========================================
// GET LEARNER NAME
// =========================================

function getLearnerName(userId) {

    if (!userId) {
        return "Unknown Learner";
    }

    const learner = learnerProfiles[userId];

    if (learner && learner.fullName) {
        return learner.fullName;
    }

    return "Unknown Learner";

}


// =========================================
// PERFORMANCE CATEGORY
// =========================================

function getPerformance(score) {

    if (score >= 80) {
        return "Excellent";
    }

    if (score >= 60) {
        return "Good";
    }

    if (score >= 40) {
        return "Satisfactory";
    }

    return "Needs Improvement";

}


// =========================================
// CREATE TABLE CELL
// =========================================

function addCell(row, value) {

    const cell = document.createElement("td");

    cell.textContent = value;

    row.appendChild(cell);

}


// =========================================
// SEARCH LEARNERS
// =========================================

searchLearner.addEventListener("input", displayResults);