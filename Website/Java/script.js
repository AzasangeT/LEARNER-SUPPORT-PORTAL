//import page
import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";

import {
  collection,
  getDocs,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";
// Protect menu page
onAuthStateChanged(auth, (user) => {
  const currentPage = window.location.pathname;

  if (currentPage.includes("menu.html") && !user) {
    window.location.href = "login.html";
  }
});

// ====================================
// FRESHLY MADE - MAIN JAVASCRIPT
// ====================================

// Get modal elements
const loginModal = document.getElementById('loginModal');
const loginBtn = document.getElementById('loginBtn');
const heroLoginBtn = document.getElementById('heroLoginBtn');
const closeModal = document.getElementById('closeModal');

// ====================================
// OPEN LOGIN MODAL
// ====================================

function openLoginModal() {
if (loginModal) {
loginModal.classList.remove('hidden');
}
}

// ====================================
// CLOSE LOGIN MODAL
// ====================================

function closeLoginModal() {
if (loginModal) {
loginModal.classList.add('hidden');
}
}

// ====================================
// EVENT LISTENERS
// ====================================

// Open modal from navigation
if (loginBtn) {
loginBtn.addEventListener('click', openLoginModal);
}

// Open modal from hero button
if (heroLoginBtn) {
heroLoginBtn.addEventListener('click', openLoginModal);
}

// Close modal when X is clicked
if (closeModal) {
closeModal.addEventListener('click', closeLoginModal);
}

// Close modal when clicking outside the modal content
if (loginModal) {
loginModal.addEventListener('click', function(event) {
if (event.target === loginModal) {
closeLoginModal();
}
});
}

// Close modal when ESC key is pressed
document.addEventListener('keydown', function(event) {
if (event.key === 'Escape') {
closeLoginModal();
}
});

// ====================================
// LOGIN FORM
// ====================================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      console.log("Logged in:", userCredential.user);

      alert("Login successful!");
      window.location.href = "menu.html";

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  });
}

// ====================================
// SIGNUP FORM
// ====================================

const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      console.log("User created:", userCredential.user);

      alert("Account created successfully!");
      window.location.href = "login.html";

    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  });
}
// ====================================
// CHECKOUT FORM
// ====================================

const checkoutForm = document.getElementById('checkoutForm');

if (checkoutForm) {
checkoutForm.addEventListener('submit', function(event) {
event.preventDefault();


    alert('Thank you! Your order has been placed.');

    // Redirect to home page
    window.location.href = 'index.html';
});


}
// ====================================
// ADD TO CART
// ====================================

const cartButtons = document.querySelectorAll(".add-to-cart");

cartButtons.forEach(button => {
  button.addEventListener("click", async () => {

    const user = auth.currentUser;

    if (!user) {
      alert("Please log in first.");
      window.location.href = "login.html";
      return;
    }

    const product = {
      id: button.dataset.id,
      name: button.dataset.name,
      price: Number(button.dataset.price),
      image: button.dataset.image,
      quantity: 1
    };

    const cartRef = doc(db, "users", user.uid, "cart", product.id);

    const existing = await getDoc(cartRef);

    if (existing.exists()) {
      const data = existing.data();
      product.quantity = data.quantity + 1;
    }

    await setDoc(cartRef, product);

    alert(product.name + " added to cart!");

  });
});
// ====================================
// LOAD CART
// ====================================

async function loadCart(user) {
  const cartContainer = document.getElementById("cartItems");
  const subtotalElement = document.getElementById("subtotal");
  const totalElement = document.getElementById("total");

  if (!cartContainer) return;

  cartContainer.innerHTML = "";

  try {
    const cartRef = collection(db, "users", user.uid, "cart");
    const snapshot = await getDocs(cartRef);

    let subtotal = 0;

    if (snapshot.empty) {
      cartContainer.innerHTML = "<p>Your cart is empty.</p>";
    } else {
      snapshot.forEach((docSnap) => {
        const item = docSnap.data();

        subtotal += item.price * item.quantity;

        cartContainer.innerHTML += `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-info">
              <h3>${item.name}</h3>
              <p>Quantity: ${item.quantity}</p>
              <span class="cart-price">R${item.price}</span>
            </div>
          </div>
        `;
      });
    }

    subtotalElement.textContent = `R${subtotal}`;
    totalElement.textContent = `R${subtotal + 20}`;

  } catch (error) {
    console.error(error);
    cartContainer.innerHTML = "<p>Error loading cart.</p>";
  }
}

if (window.location.pathname.includes("cart.html")) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadCart(user);
    } else {
      window.location.href = "login.html";
    }
  });
}