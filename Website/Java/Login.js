// Import Firebase Authentication
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

// Import Firebase Realtime Database
import { ref, get } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-database.js";

// Import our Firebase connections
import { auth, database } from "./firebase.js";


// Get the login form
const loginForm = document.getElementById("loginForm");

// Get the message area
const loginMessage = document.getElementById("loginMessage");


// Listen for the login form being submitted
loginForm.addEventListener("submit", async (event) => {

    // Stop the page from refreshing
    event.preventDefault();

    // Get the values entered by the user
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;


    try {

        // Sign the user into Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        // Get the logged-in user's information
        const user = userCredential.user;

        // Get the user's UID
        const uid = user.uid;

        console.log("Login successful!");
        console.log("User UID:", uid);


        // Find this user's information in Realtime Database
        const userRef = ref(database, "users/" + uid);

        const snapshot = await get(userRef);


        // Check if the user exists in the database
        if (snapshot.exists()) {

            // Get the user's data
            const userData = snapshot.val();

            console.log("User data:", userData);


            // Get the user's role
            const role = userData.role;

            console.log("User role:", role);


            // Redirect based on role
            if (role === "Learner") {

                window.location.href = "Learner_Dashboard.html";

            }
            else if (role === "Assessor") {

                window.location.href = "Assessor_Dashboard.html";

            }
            
            else {

                loginMessage.textContent = "Account Type not recognised.";

            }

        }
        else {

            loginMessage.textContent = "User information could not be found.";

        }

    }

    catch (error) {

        console.error("Login error:", error);

        // Display appropriate error messages
        if (error.code === "auth/invalid-credential") {

            loginMessage.textContent = "Incorrect email or password.";

        }
        else if (error.code === "auth/invalid-email") {

            loginMessage.textContent = "Please enter a valid email address.";
        
        
        }
        else if (error.code === "auth/too-many-requests") {

            loginMessage.textContent =
                "Too many login attempts. Please wait a while and try again.";

        }
        else {

            loginMessage.textContent = "Login failed. Please try again.";

        }

    }

});
