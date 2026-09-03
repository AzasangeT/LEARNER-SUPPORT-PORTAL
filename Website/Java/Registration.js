// Import Firebase Authentication

import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";


// Import Firebase Database

import { ref, set } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-database.js";


// Import our Firebase connections

import { auth, database } from "./firebase.js";


// Get the registration form

const signupForm = document.getElementById("signupForm");


// Listen for the form submission

signupForm.addEventListener("submit", async (event) => {

    // Prevent the page from refreshing

    event.preventDefault();


    // Get the values entered by the user

    const fullName = document.getElementById("firstName").value.trim();

    const role = document.getElementById("AccountType").value;

    const email = document.getElementById("email").value.trim();

    const password = document.getElementById("password").value;

    const confirmPassword = document.getElementById("confirmPassword").value;


    // Check that the passwords match

    if (password !== confirmPassword) {

        alert("Passwords do not match.");

        return;
    }


    // Check that an account type was selected

    if (role === "") {

        alert("Please select an account type.");

        return;
    }


    try {

        // Create the Firebase Authentication account

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );


        // Get the newly created user's information

        const user = userCredential.user;


        // Save the user's information in Realtime Database

        await set(ref(database, "users/" + user.uid), {

            fullName: fullName,

            email: email,

            role: role

        });


        // Display information in the console

        console.log("Account created successfully.");

        console.log("User UID:", user.uid);

        console.log("Full Name:", fullName);

        console.log("Role:", role);


        // Tell the user registration was successful

        alert("Account created successfully!");


        // Send the user to the Login page

        window.location.href = "Login.html";


    } catch (error) {

        console.error("Registration error:", error);


        // Firebase Authentication errors

        if (error.code === "auth/email-already-in-use") {

            alert("An account with this email already exists.");

        }

        else if (error.code === "auth/weak-password") {

            alert("Password must be at least 6 characters.");

        }

        else if (error.code === "auth/invalid-email") {

            alert("Please enter a valid email address.");

        }

        else {

            alert("Registration failed. Please try again.");

        }

    }

});

