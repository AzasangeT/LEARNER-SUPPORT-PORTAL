

// 1. GET ELEMENTS FROM THE HTML

// Booking form
const bookingSection = document.getElementById("bookingSection");

// Form inputs
const supportTopic = document.getElementById("supportTopic");
const preferredDate = document.getElementById("preferredDate");
const preferredTime = document.getElementById("preferredTime");
const helpDescription = document.getElementById("helpDescription");
const supportingDocument = document.getElementById("supportingDocument");

// Buttons
const cancelButton = document.getElementById("cancelButton");
const submitRequest = document.getElementById("submitRequest");

// Success popup
const successPopup = document.getElementById("successPopup");
const viewRequestButton = document.getElementById("viewRequestButton");
const successDashboardButton = document.getElementById("successDashboardButton");

// View request section
const viewRequestSection = document.getElementById("viewRequestSection");
const requestBackDashboard = document.getElementById("requestBackDashboard");

// Learner name
const learnerName = document.getElementById("learnerName");
const loggedInUser = document.getElementById("loggedInUser");

// Request information
const requestLearner = document.getElementById("requestLearner");
const requestTopic = document.getElementById("requestTopic");
const requestDate = document.getElementById("requestDate");
const requestTime = document.getElementById("requestTime");
const requestDescription = document.getElementById("requestDescription");
const requestDocument = document.getElementById("requestDocument");


// 2. LEARNER NAME


// For now, we are using Azasange.
// Later we can connect this to Firebase
// so the name comes from the logged-in user.

const currentLearner = "Azasange";

learnerName.textContent = currentLearner;
loggedInUser.textContent = currentLearner;


// 3. SUBMIT REQUEST


submitRequest.addEventListener("click", function () {

    // Check if all required fields have been completed

    if (
        supportTopic.value === "" ||
        preferredDate.value === "" ||
        preferredTime.value === "" ||
        helpDescription.value.trim() === ""
    ) {

        alert("Please complete all required fields before submitting.");

        return;
    }


    
    // 4. SAVE THE REQUEST INFORMATION
    

    requestLearner.textContent = currentLearner;

    requestTopic.textContent = supportTopic.value;

    requestDate.textContent = preferredDate.value;

    requestTime.textContent = preferredTime.value;

    requestDescription.textContent = helpDescription.value;


    // Check if a document was uploaded

    if (supportingDocument.files.length > 0) {

        requestDocument.textContent =
            supportingDocument.files[0].name;

    } else {

        requestDocument.textContent =
            "No document uploaded";

    }


    // 5. SHOW SUCCESS POPUP
    

    successPopup.style.display = "flex";

});


// 6. VIEW MY REQUEST


viewRequestButton.addEventListener("click", function () {

    // Hide the success popup

    successPopup.style.display = "none";


    // Hide the booking form

    bookingSection.style.display = "none";


    // Show the request details

    viewRequestSection.style.display = "block";

});



// 7. BACK TO DASHBOARD FROM POPUP


successDashboardButton.addEventListener("click", function () {

    window.location.href = "learner-dashboard.html";

});



// 8. BACK TO DASHBOARD FROM REQUEST


requestBackDashboard.addEventListener("click", function () {

    window.location.href = "learner-dashboard.html";

});


// 9. CANCEL BUTTON


cancelButton.addEventListener("click", function () {

    // Clear the form

    supportTopic.value = "";

    preferredDate.value = "";

    preferredTime.value = "";

    helpDescription.value = "";

    supportingDocument.value = "";

});

