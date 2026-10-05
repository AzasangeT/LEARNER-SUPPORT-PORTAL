//Get all elements by id
const supportRequestForm = document.getElementById("supportRequestForm");
const supportRequestSection = document.getElementById("supportRequestSection");


const supportTopic = document.getElementById("supportTopic");
const preferredDate = document.getElementById("preferredDate");
const preferredTime = document.getElementById("preferredTime");
const supportDescription = document.getElementById("supportDescription");
const supportDocument = document.getElementById("supportDocument"); 

const cancelRequestBtn = document.getElementById("cancelRequestBtn");
const viewRequestBtn = document.getElementById("viewRequestBtn");
const backDashboardBtn = document.getElementById("backDashboardBtn");

const requestBackDashboardBtn = document.getElementById("requestBackDashboardBtn");
const submittedRequestSection = document.getElementById("submittedRequestSection");
const requestSuccessSection = document.getElementById("requestSuccessSection");
const submittedSupportRequestDetails = document.getElementById("submittedSupportRequestDetails");


//Submit Support Request 

let supportRequest = {};

supportRequestForm.addEventListener("submit", function(event){
    event.preventDefault();
    
    supportRequest = {
        topic: supportTopic.value ,
        date: preferredDate.value,
        time: preferredTime.value,
        description: supportDescription.value,
        document: supportDocument.files[0] || null
    };

    console.log(supportRequest);
    
    supportRequestSection.style.display = "none";

    requestSuccessSection.style.display = "block";
});

//View My Request 

viewRequestBtn.addEventListener("click", function(){

    requestSuccessSection.style.display = "none";

    submittedRequestSection.style.display = "block";

    submittedSupportRequestDetails.innerHTML = 
    "<p>Support Topic: " + supportRequest.topic + "</p>" +
    "<p>Preferred Date: " + supportRequest.date + "</p>" +
    "<p>Preferred Time: " + supportRequest.time + "</p>" +
    "<p>What do you need help with? " + supportRequest.document.name + "</p>";

    if (supportRequest.document) {
    submittedSupportRequestDetails.innerHTML +=
        "<p>Supporting Document: " + supportRequest.document.name + "</p>";
    } else { 
         submittedSupportRequestDetails.innerHTML += 
         "<p>Supporting Document: No document uploaded </p>";
  }
});


