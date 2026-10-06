//BOOKING FORM 
const supportRequestForm = document.getElementById("supportRequestForm");
const supportTopic = document.getElementById("supportTopic");
const preferredDate = document.getElementById("preferredDate");
const preferredTime = document.getElementById("preferredTime");
const supportDescription = document.getElementById("supportDescription");
const supportDocument = document.getElementById("supportDocument");

//SECTIONS 

const supportRequestSection = document.getElementById("supportRequestSection");
const submittedRequestSection = document.getElementById("submittedRequestSection");
const requestSuccessSection = document.getElementById("requestSuccessSection");
const submittedRequestDetails = document.getElementById("submittedRequestDetails");
 
// BUTTONS 
const cancelRequestBtn = document.getElementById("cancelRequestBtn");
const viewRequestBtn = document.getElementById("viewRequestBtn");
const backDashboardBtn = document.getElementById("backDashboardBtn");
const closePopupBtn = document.getElementById("closePopupBtn");

// POPUP 
const successPopup = document.getElementById("successPopup");

// STORE REQUEST 
let supportRequest = {};

// SUBMIT REQUEST 
supportRequestForm.addEventListener("submit", function(event){
    event.preventDefault();
    
    supportRequest = {
        topic: supportTopic.value,
        date: preferredDate.value,
        time: preferredTime.value,
        description: supportDescription.value,
        document: supportDocument.files[0] || null
    };

    console.log(supportRequest);

    //SHOW POPUP 
    successPopup.style.display = "Flex";

});
   
// CLOSE POPUP 
closePopupBtn.addEventListener("click", function() {
    successPopup.style.display = "none";
    supportRequestSection.style.display = "none";
    requestSuccessSection.style.display = "block";
});

//VIEW REQUEST DETAILS 

viewRequestBtn.addEventListener("click", function(){

    requestSuccessSection.style.display = "none";

    submittedRequestSection.style.display = "block";
});
    
    closePopupBtn.addEventListener("click", function(){
        successPopup.style.display = "none";
        supportRequestSection.style.display = "none";
        submittedRequestSection.style.display = "block";
    
    submittedRequestDetails.innerHTML = 
    "<p>Support Topic: " + supportRequest.topic + "</p>" +
    "<p>Preferred Date: " + supportRequest.date + "</p>" +
    "<p>Preferred Time: " + supportRequest.time + "</p>" +
    "<p>What do you need help with? " + supportRequest.document.name + "</p>";

    if (supportRequest.document) {
    submittedRequestDetails.innerHTML +=
        "<p>Supporting Document: " + supportRequest.document.name + "</p>";
    } else { 
         submittedRequestDetails.innerHTML += 
         "<p>Supporting Document: No document uploaded </p>";
  }
});

// CANCEL REQUEST  

cancelRequestBtn.addEventListener("click", function(){
    
    supportRequestForm.reset();

});

// Back to dashboard from success screen 

backDashboardBtn.addEventListener("click", function(){

    <a href="Learner_Dashboard.html">Back to Dashboard</a>

})

//Back to dashboard from request details

requestBackDashboardBtn.addEventListener("click", function() {

    <a href="Learner_Dashboard.html">Back to Dashboard </a>

});