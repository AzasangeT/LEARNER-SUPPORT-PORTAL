// Import Firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";


// Import Firebase Authentication

import { getAuth } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";


// Import Firebase Realtime Database

import { getDatabase } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-database.js";


// Your Firebase configuration

const firebaseConfig = {

    apiKey: "AIzaSyCmNrJcU3FXjyj2NKwlU1SVcitlzqN0g5Y",

    authDomain: "learner-support-portal-8f0ac.firebaseapp.com",

    projectId: "learner-support-portal-8f0ac",

    storageBucket: "learner-support-portal-8f0ac.firebasestorage.app",

    messagingSenderId: "1016865847066",

    appId: "1:1016865847066:web:129ede773af3e53f38dea3"

};


// Initialize Firebase

const app = initializeApp(firebaseConfig);


// Initialize Firebase Authentication

export const auth = getAuth(app);


// Initialize Realtime Database

export const database = getDatabase(app);

