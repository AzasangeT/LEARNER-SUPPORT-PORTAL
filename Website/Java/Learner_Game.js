/* =========================================
   SKILLS TRACK - LEARNER GAME
   CODE WORD SCRAMBLE

   Features:
   - Two difficulty levels
   - 10 programming questions
   - 90-second countdown
   - Score tracking
   - Answer validation
   - Game results screen
   - Firebase Realtime Database integration
========================================= */


// =========================================
// FIREBASE IMPORTS
// =========================================

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
    ref,
    push
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-database.js";

import {
    auth,
    database
} from "./firebase.js";


// =========================================
// GET ELEMENTS FROM HTML
// =========================================

const scrambledWord = document.getElementById("scrambledWord");
const hint = document.getElementById("hint");
const answerInput = document.getElementById("answerInput");
const feedback = document.getElementById("feedback");

const scoreDisplay = document.getElementById("score");
const wordNumber = document.getElementById("wordNumber");
const timerDisplay = document.getElementById("timer");

const checkButton = document.getElementById("checkButton");
const nextButton = document.getElementById("nextButton");
const restartButton = document.getElementById("restartButton");

const gameCard = document.querySelector(".game-card");
const resultsScreen = document.getElementById("resultsScreen");

const finalScore = document.getElementById("finalScore");
const resultMessage = document.getElementById("resultMessage");
const performanceMessage = document.getElementById("performanceMessage");
const resultsPlayAgain = document.getElementById("resultsPlayAgain");


// =========================================
// GAME VARIABLES
// =========================================

let currentLevelIndex = 0;
let currentWordIndex = 0;

let score = 0;
let timeLeft = 90;

let timerInterval = null;

let gameOver = false;

// Firebase user
let currentUser = null;

// Prevent duplicate saves
let resultSaved = false;


// =========================================
// GAME LEVELS
// =========================================

const levels = [

    // LEVEL 1 - BEGINNER

    {
        name: "Level 1 - Beginner",

        words: [

            {
                word: "FUNCTION",
                scrambled: "NOITCNUF",
                hint: "A reusable block of code that performs a task."
            },

            {
                word: "VARIABLE",
                scrambled: "ELBAIRAV",
                hint: "Stores data that can be used in a program."
            },

            {
                word: "ARRAY",
                scrambled: "YARRA",
                hint: "Stores multiple values in one variable."
            },

            {
                word: "LOOP",
                scrambled: "POOL",
                hint: "Repeats a block of code."
            },

            {
                word: "STRING",
                scrambled: "GNIRTS",
                hint: "A data type used for text."
            }

        ]
    },


    // LEVEL 2 - INTERMEDIATE

    {
        name: "Level 2 - Intermediate",

        words: [

            {
                word: "BOOLEAN",
                scrambled: "NAELOOB",
                hint: "A data type that has two values: true or false."
            },

            {
                word: "DEBUGGING",
                scrambled: "GUBEDGIGN",
                hint: "Finding and fixing errors in code."
            },

            {
                word: "CONDITION",
                scrambled: "NOITIDNOC",
                hint: "An expression checked to decide what code should run."
            },

            {
                word: "EVENT",
                scrambled: "TNEVE",
                hint: "Something that happens, like a button click."
            },

            {
                word: "OBJECT",
                scrambled: "TCEJBO",
                hint: "Stores related data using properties and values."
            }

        ]
    }

];


// =========================================
// FIREBASE AUTHENTICATION
// =========================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        currentUser = null;

        clearInterval(timerInterval);

        window.location.replace("Login.html");

        return;
    }

    currentUser = user;

    console.log("Game learner authenticated:", user.uid);

});


// =========================================
// START TIMER
// =========================================

function startTimer() {

    clearInterval(timerInterval);

    timerInterval = setInterval(() => {

        if (gameOver) {

            clearInterval(timerInterval);

            return;
        }

        timeLeft--;

        timerDisplay.textContent = timeLeft;

        // Warning when time is running out

        if (timeLeft <= 10) {

            timerDisplay.classList.add("time-running-out");

        }

        // End game when timer reaches zero

        if (timeLeft <= 0) {

            timeLeft = 0;

            timerDisplay.textContent = 0;

            clearInterval(timerInterval);

            endGame();

        }

    }, 1000);

}


// =========================================
// DISPLAY CURRENT WORD
// =========================================

function displayWord() {

    const currentWords = levels[currentLevelIndex].words;

    const currentWord = currentWords[currentWordIndex];

    scrambledWord.textContent = currentWord.scrambled;

    hint.textContent = "Hint: " + currentWord.hint;

    wordNumber.textContent =
        (currentWordIndex + 1) + "/" + currentWords.length;

    // Reset answer field

    answerInput.value = "";

    feedback.textContent = "";

    // Reset buttons

    checkButton.hidden = false;

    nextButton.hidden = true;

    nextButton.textContent = "Next Word";

    // Enable answer input

    answerInput.disabled = false;

    checkButton.disabled = false;

    answerInput.focus();

}


// =========================================
// CHECK ANSWER
// =========================================

function checkAnswer() {

    if (gameOver) {
        return;
    }

    const userAnswer = answerInput.value
        .trim()
        .toUpperCase();

    const currentWords = levels[currentLevelIndex].words;

    const correctAnswer = currentWords[currentWordIndex].word;


    // EMPTY ANSWER

    if (userAnswer === "") {

        feedback.textContent = "Please enter an answer!";

        feedback.style.color = "orange";

        return;
    }


    // CORRECT ANSWER

    if (userAnswer === correctAnswer) {

        feedback.textContent = "Correct! Well done! 🎉";

        feedback.style.color = "green";

        score += 10;

        scoreDisplay.textContent = score;

    } else {

        // INCORRECT ANSWER

        feedback.textContent = "Not quite! Try again.";

        feedback.style.color = "red";

        return;

    }


    // Disable answered question

    checkButton.hidden = true;

    answerInput.disabled = true;


    // CHECK IF LAST WORD IN LEVEL

    if (currentWordIndex === currentWords.length - 1) {

        // LEVEL 1 COMPLETE

        if (currentLevelIndex === 0) {

            feedback.textContent =
                "Level 1 complete! Ready for Level 2? 🎉";

            nextButton.textContent = "Start Level 2";

            nextButton.hidden = false;

        } else {

            // LEVEL 2 COMPLETE

            endGame();

        }

    } else {

        // SHOW NEXT WORD BUTTON

        nextButton.hidden = false;

    }

}


// =========================================
// NEXT WORD
// =========================================

function nextWord() {

    if (gameOver) {
        return;
    }

    const currentWords = levels[currentLevelIndex].words;

    if (currentWordIndex === currentWords.length - 1) {

        currentLevelIndex++;

        currentWordIndex = 0;

    } else {

        currentWordIndex++;

    }

    displayWord();

}


// =========================================
// SAVE GAME RESULT TO FIREBASE
// =========================================

async function saveGameResult() {

    // Prevent duplicate saves

    if (resultSaved) {
        return;
    }

    resultSaved = true;


    // Check authenticated learner

    if (!currentUser) {

        console.error(
            "Unable to save game result: no authenticated user."
        );

        return;
    }


    try {

        // Calculate total questions

        const totalQuestions = levels.reduce(
            (total, level) => total + level.words.length,
            0
        );

        // Number of correct answers

        const completedQuestions = score / 10;

        // Determine completion status

        const status = score === 100
            ? "Completed"
            : "Time Up";


        // Create game result object

        const gameResult = {

            userId: currentUser.uid,

            gameName: "Code Word Scramble",

            score: score,

            totalQuestions: totalQuestions,

            completedQuestions: completedQuestions,

            timeRemaining: Math.max(0, timeLeft),

            status: status,

            completedAt: Date.now()

        };


        // Firebase database location

        const resultsRef = ref(database, "gameResults");


        // Save new attempt

        const newResultRef = await push(
            resultsRef,
            gameResult
        );


        console.log(
            "Game result saved successfully:",
            newResultRef.key
        );

        console.log("Saved game data:", gameResult);


    } catch (error) {

        console.error(
            "Failed to save game result:",
            error
        );

    }

}


// =========================================
// GAME OVER
// =========================================

function endGame() {

    // Prevent game ending twice

    if (gameOver) {
        return;
    }

    gameOver = true;

    // Stop timer

    clearInterval(timerInterval);


    // Save score to Firebase

    saveGameResult();


    // Hide game card

    gameCard.hidden = true;


    // Display results screen

    resultsScreen.hidden = false;


    // Display final score

    finalScore.textContent = score;


    // PERFORMANCE MESSAGES

    if (score === 100) {

        resultMessage.textContent =
            "Perfect score! 🎉";

        performanceMessage.textContent =
            "Amazing work! You mastered both levels.";

    } else if (score >= 60) {

        resultMessage.textContent =
            "Great job!";

        performanceMessage.textContent =
            "You have a good understanding of programming terms.";

    } else if (score >= 30) {

        resultMessage.textContent =
            "Good effort!";

        performanceMessage.textContent =
            "Keep practising to improve your programming knowledge.";

    } else {

        resultMessage.textContent =
            "Keep learning!";

        performanceMessage.textContent =
            "Every attempt helps you learn. Try again!";

    }

}


// =========================================
// RESTART GAME
// =========================================

function restartGame() {

    // Stop existing timer

    clearInterval(timerInterval);


    // Reset game variables

    currentLevelIndex = 0;

    currentWordIndex = 0;

    score = 0;

    timeLeft = 90;

    gameOver = false;

    resultSaved = false;


    // Reset score and timer

    scoreDisplay.textContent = score;

    timerDisplay.textContent = timeLeft;


    // Remove timer warning

    timerDisplay.classList.remove("time-running-out");


    // Hide results screen

    resultsScreen.hidden = true;


    // Show game card

    gameCard.hidden = false;


    // Hide restart button

    restartButton.hidden = true;


    // Display first word

    displayWord();


    // Restart timer

    startTimer();

}


// =========================================
// BUTTON EVENT LISTENERS
// =========================================

// Check answer

checkButton.addEventListener(
    "click",
    checkAnswer
);


// Next word

nextButton.addEventListener(
    "click",
    nextWord
);


// Restart game

restartButton.addEventListener(
    "click",
    restartGame
);


// Play again from results screen

resultsPlayAgain.addEventListener(
    "click",
    restartGame
);


// =========================================
// ENTER KEY SUPPORT
// =========================================

answerInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

        event.preventDefault();

        if (!checkButton.hidden && !checkButton.disabled) {

            checkAnswer();

        } else if (!nextButton.hidden) {

            nextWord();

        }

    }

});


// =========================================
// START GAME
// =========================================

timerDisplay.textContent = timeLeft;

scoreDisplay.textContent = score;

displayWord();

startTimer();