// =========================================
// SKILLS TRACK - USER REGISTRATION
// =========================================

// Firebase Authentication imports
import {
    createUserWithEmailAndPassword,
    deleteUser,
    signOut
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

// Firebase Realtime Database imports
import {
    ref,
    set
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-database.js";

// Firebase configuration
import {
    auth,
    database
} from "./firebase.js";


// =========================================
// GET REGISTRATION FORM
// =========================================

const signupForm = document.getElementById("signupForm");


// =========================================
// REGISTRATION FORM SUBMISSION
// =========================================

signupForm.addEventListener("submit", async (event) => {

    // Prevent page refresh
    event.preventDefault();


    // =====================================
    // GET FORM VALUES
    // =====================================

    const fullName = document
        .getElementById("firstName")
        .value.trim();

    const role = document
        .getElementById("AccountType")
        .value;

    const email = document
        .getElementById("email")
        .value.trim();

    const password = document
        .getElementById("password")
        .value;

    const confirmPassword = document
        .getElementById("confirmPassword")
        .value;


    // =====================================
    // VALIDATE FORM
    // =====================================

    if (!fullName || !email || !password || !confirmPassword) {

        alert("Please complete all required fields.");
        return;

    }

    if (role !== "Learner" && role !== "Assessor") {

        alert("Please select a valid account type.");
        return;

    }

    if (password !== confirmPassword) {

        alert("Passwords do not match.");
        return;

    }

    if (password.length < 6) {

        alert("Password must contain at least 6 characters.");
        return;

    }


    // =====================================
    // CREATE FIREBASE ACCOUNT
    // =====================================

    let createdUser = null;

    try {

        console.log("Starting registration...");

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        // Get newly created user
        createdUser = userCredential.user;

        console.log("Authentication account created.");
        console.log("User UID:", createdUser.uid);


        // =====================================
        // SAVE USER TO REALTIME DATABASE
        // =====================================

        const userData = {

            fullName: fullName,

            email: email,

            role: role

        };

        try {

            await set(
                ref(database, "users/" + createdUser.uid),
                userData
            );

            console.log("User profile saved successfully.");
            console.log("User information:", userData);

        } catch (databaseError) {

            console.error(
                "Realtime Database error:",
                databaseError
            );

            // Attempt to remove the incomplete account
            try {

                await deleteUser(createdUser);

                console.log(
                    "Incomplete Authentication account deleted."
                );

            } catch (deleteError) {

                console.error(
                    "Could not delete incomplete account:",
                    deleteError
                );

                // Sign out if account cleanup fails
                try {

                    await signOut(auth);

                } catch (signOutError) {

                    console.error(
                        "Sign-out error:",
                        signOutError
                    );

                }

            }

            alert(
                "Registration failed while saving your profile. Please try again."
            );

            return;

        }


        // =====================================
        // REGISTRATION SUCCESSFUL
        // =====================================

        console.log("Registration completed successfully.");
        console.log("Full Name:", fullName);
        console.log("Email:", email);
        console.log("Account Type:", role);

        alert("Account created successfully!");

        // Redirect to Login page
        window.location.href = "Login.html";


    } catch (error) {

        console.error("Registration error:", error);


        // =====================================
        // FIREBASE ERROR HANDLING
        // =====================================

        if (error.code === "auth/email-already-in-use") {

            alert("An account with this email already exists.");

        }

        else if (error.code === "auth/invalid-email") {

            alert("Please enter a valid email address.");

        }

        else if (error.code === "auth/weak-password") {

            alert("Password must contain at least 6 characters.");

        }

        else if (error.code === "auth/network-request-failed") {

            alert("Network error. Please check your internet connection.");

        }

        else {

            alert(
                "Registration failed: " +
                (error.message || "Please try again.")
            );

        }

    }

});