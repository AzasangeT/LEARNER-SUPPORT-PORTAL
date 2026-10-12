// GET ELEMENTS FROM THE HTML

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

// VARIABLES

let currentLevelIndex = 0;
let currentWordIndex = 0;
let score = 0;
let timeLeft = 90;
let timerInterval;
let gameOver = false;

// GAME LEVELS

const levels = [
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


 // TIMER FUNCTION

function startTimer() {
    clearInterval(timerInterval);

    timerInterval = setInterval(function () {
        if (gameOver) {
            clearInterval(timerInterval);
            return;
        }

        timeLeft = timeLeft - 1;
        timerDisplay.textContent = timeLeft;

        if (timeLeft <= 10) {
            timerDisplay.classList.add("time-running-out");
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}


//  DISPLAY THE CURRENT WORD


function displayWord() {
    const currentWords = levels[currentLevelIndex].words;
    const currentWord = currentWords[currentWordIndex];

    scrambledWord.textContent = currentWord.scrambled;
    hint.textContent = "Hint: " + currentWord.hint;

    wordNumber.textContent =
        (currentWordIndex + 1) + "/" + currentWords.length;

    answerInput.value = "";
    feedback.textContent = "";

    checkButton.hidden = false;
    nextButton.hidden = true;
    nextButton.textContent = "Next Word";

    answerInput.disabled = false;
    checkButton.disabled = false;

    answerInput.focus();
}



//  CHECK THE LEARNER'S ANSWER


function checkAnswer() {
    if (gameOver) {
        return;
    }

    const userAnswer = answerInput.value.trim().toUpperCase();
    const currentWords = levels[currentLevelIndex].words;

    if (userAnswer === "") {
        feedback.textContent = "Please enter an answer!";
        feedback.style.color = "orange";
        return;
    }

    if (userAnswer === currentWords[currentWordIndex].word) {
        feedback.textContent = "Correct! Well done! 🎉";
        feedback.style.color = "green";

        score = score + 10;
        scoreDisplay.textContent = score;
    } else {
        feedback.textContent = "Not quite! Try again.";
        feedback.style.color = "red";
        return;
    }

    checkButton.hidden = true;
    answerInput.disabled = true;

    if (currentWordIndex === currentWords.length - 1) {

        if (currentLevelIndex === 0) {
            feedback.textContent =
                "Level 1 complete! Ready for Level 2? 🎉";

            nextButton.textContent = "Start Level 2";
            nextButton.hidden = false;

        } else {
            endGame();
        }

    } else {
        nextButton.hidden = false;
    }
}



//  MOVE TO THE NEXT WORD


function nextWord() {
    if (gameOver) {
        return;
    }

    const currentWords = levels[currentLevelIndex].words;

    if (currentWordIndex === currentWords.length - 1) {
        currentLevelIndex = currentLevelIndex + 1;
        currentWordIndex = 0;
    } else {
        currentWordIndex = currentWordIndex + 1;
    }

    displayWord();
}


//  RESTART THE GAME


function restartGame() {
    clearInterval(timerInterval);

    currentLevelIndex = 0;
    currentWordIndex = 0;
    score = 0;
    timeLeft = 90;
    gameOver = false;

    scoreDisplay.textContent = score;
    timerDisplay.textContent = timeLeft;

    timerDisplay.classList.remove("time-running-out");

    resultsScreen.hidden = true;
    gameCard.hidden = false;

    restartButton.hidden = true;

    displayWord();
    startTimer();
}




// GAME OVER FUNCTION

function endGame() {
    gameOver = true;

    clearInterval(timerInterval);

    gameCard.hidden = true;
    resultsScreen.hidden = false;

    finalScore.textContent = score;

    if (score === 100) {
    resultMessage.textContent = "Perfect score! 🎉";
    performanceMessage.textContent =
        "Amazing work! You mastered both levels.";

} else if (score >= 60) {
    resultMessage.textContent = "Great job! ";
    performanceMessage.textContent =
        "You have a good understanding of programming terms.";

} else if (score >= 30) {
    resultMessage.textContent = "Good effort! ";
    performanceMessage.textContent =
        "Keep practising to improve your programming knowledge.";

} else {
    resultMessage.textContent = "Keep learning! ";
    performanceMessage.textContent =
        "Every attempt helps you learn. Try again!";
}
}


//  CONNECT BUTTONS TO FUNCTIONS

checkButton.addEventListener("click", checkAnswer);
nextButton.addEventListener("click", nextWord);
restartButton.addEventListener("click", restartGame);
resultsPlayAgain.addEventListener("click", restartGame);


//  START THE GAME

displayWord();
startTimer();