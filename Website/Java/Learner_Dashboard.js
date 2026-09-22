// Import Firebase Authentication
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

// Import Firebase Realtime Database
import { ref, get } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-database.js";

// Import our Firebase connections
import { auth, database } from "./firebase.js";


// Get the area where the learner's name will appear
const learnerName = document.getElementById("learnerName");


// Check which user is currently logged in
onAuthStateChanged(auth, async (user) => {

    // If nobody is logged in
    if (!user) {

        console.log("No user is logged in.");

        // Send them back to login
        window.location.href = "Login.html";

        return;
    }


    // Get the logged-in user's UID
    const uid = user.uid;

    console.log("Logged-in UID:", uid);


    try {

        // Find the user's information in Realtime Database
        const userRef = ref(database, "users/" + uid);

        const snapshot = await get(userRef);


        if (snapshot.exists()) {

            // Get the user's information
            const userData = snapshot.val();

            console.log("User data:", userData);


            // Security check:
            // Make sure this person is actually a Learner
            if (userData.role !== "Learner") {

                console.log("User is not a Learner.");

                window.location.href = "Login.html";

                return;
            }


            // Display the learner's real name
            learnerName.textContent = userData.fullName;

        }
        else {

            console.log("User information not found.");

            window.location.href = "Login.html";

        }

    }
    catch (error) {

        console.error("Dashboard error:", error);

    }

});