// 1. GET ELEMENTS FROM THE HTML

const scrambledWord = document.getElementById("scrambledWord");
const hint = document.getElementById("hint");
const answerInput = document.getElementById("answerInput");
const feedback = document.getElementById("feedback");
const scoreDisplay = document.getElementById("score");
const wordNumber = document.getElementById("wordNumber");

const checkButton = document.getElementById("checkButton");
const nextButton = document.getElementById("nextButton");
const restartButton = document.getElementById("restartButton");


// 2. CREATE THE GAME WORDS

const words = [
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
];


// 3. CREATE GAME VARIABLES

let currentWordIndex = 0;
let score = 0;


// 4. DISPLAY THE CURRENT WORD

function displayWord() {
    scrambledWord.textContent =
        words[currentWordIndex].scrambled;

    hint.textContent =
        "Hint: " + words[currentWordIndex].hint;

    wordNumber.textContent = currentWordIndex + 1;

    answerInput.value = "";
    feedback.textContent = "";

    checkButton.hidden = false;
    nextButton.hidden = true;

    answerInput.disabled = false;
    checkButton.disabled = false;

    answerInput.focus();
}


// 5. CHECK THE LEARNER'S ANSWER

function checkAnswer() {
    const userAnswer = answerInput.value.trim().toUpperCase();

    if (userAnswer === "") {
        feedback.textContent = "Please enter an answer!";
        feedback.style.color = "orange";
        return;
    }

    if (userAnswer === words[currentWordIndex].word) {
        feedback.textContent = "Correct! Well done! ";
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

    if (currentWordIndex === words.length - 1) {
        restartButton.hidden = false;
        feedback.textContent += " You completed the game!";
    } else {
        nextButton.hidden = false;
    }
}


// 6. MOVE TO THE NEXT WORD

function nextWord() {
    currentWordIndex = currentWordIndex + 1;
    displayWord();
}


// 7. RESTART THE GAME

function restartGame() {
    currentWordIndex = 0;
    score = 0;

    scoreDisplay.textContent = score;

    restartButton.hidden = true;

    displayWord();
}


// 8. CONNECT BUTTONS TO FUNCTIONS

checkButton.addEventListener("click", checkAnswer);
nextButton.addEventListener("click", nextWord);
restartButton.addEventListener("click", restartGame);


// 9. START THE GAME

displayWord();