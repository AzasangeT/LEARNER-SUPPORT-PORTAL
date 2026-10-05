// =========================================
// LOGOUT
// =========================================

import { signOut } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import { auth } from "./firebase.js";


// Get logout button
const logoutBtn =
    document.getElementById("logoutBtn");


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                // Sign user out of Firebase
                await signOut(auth);


                console.log(
                    "User logged out successfully."
                );


                // Redirect back to home page
                window.location.href =
                    "index.html";

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                alert(
                    "Unable to log out. Please try again."
                );

            }

        }
    );

}