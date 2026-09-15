import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAiLRpNFC6khivuyKQHpSwa7I6iO43n4rs",
  authDomain: "weba2-7a1f0.firebaseapp.com",
  projectId: "weba2-7a1f0",
  storageBucket: "weba2-7a1f0.firebasestorage.app",
  messagingSenderId: "501356088445",
  appId: "1:501356088445:web:470b722431621db00c7514"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const contactForm = document.getElementById("contactForm");
if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nameInput = document.getElementById("name");
        const emailInput = document.getElementById("email");
        const messageInput = document.getElementById("message");
        const statusDiv = contactForm.querySelector(".form-status");
        const submitBtn = contactForm.querySelector("button[type='submit']");
        const charCount = contactForm.querySelector("[data-char-count]");
        const messageError = contactForm.querySelector('[data-error-for="message"]');

        const name = nameInput ? nameInput.value.trim() : "";
        const email = emailInput ? emailInput.value.trim() : "";
        const message = messageInput ? messageInput.value.trim() : "";

        // Keep browser-side validation and Firestore submission rules identical.
        if (!name || !email || !message) {
            if (statusDiv) {
                statusDiv.className = "form-status status-error";
                statusDiv.textContent = "Please fill in all required fields before submitting.";
            }
            return;
        }

        if (message.length < 10) {
            if (messageError) {
                messageError.textContent = "Message must be at least 10 characters long.";
            }
            if (messageInput) {
                messageInput.setCustomValidity("Message must be at least 10 characters long.");
                messageInput.focus();
            }
            if (statusDiv) {
                statusDiv.className = "form-status status-error";
                statusDiv.textContent = "Please write at least 10 characters in your message.";
            }
            return;
        }

        if (messageError) messageError.textContent = "";
        if (messageInput) messageInput.setCustomValidity("");

        try {
            if (statusDiv) {
                statusDiv.className = "form-status status-loading";
                statusDiv.textContent = "Sending your message to Firestore...";
            }
            if (submitBtn) submitBtn.disabled = true;

            await addDoc(collection(db, "contacts"), {
                name,
                email,
                message,
                timestamp: new Date()
            });

            if (statusDiv) {
                statusDiv.className = "form-status status-success";
                statusDiv.textContent = "✓ Thank you! Your message has been sent successfully.";
            }

            contactForm.reset();
            if (charCount) charCount.textContent = "0 / 500";
            if (messageError) messageError.textContent = "";
            if (messageInput) messageInput.setCustomValidity("");
        } catch (error) {
            console.error("Firestore submission error:", error);
            if (statusDiv) {
                statusDiv.className = "form-status status-error";
                statusDiv.textContent = "Failed to deliver message. Please try again or email directly.";
            }
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });

    // Clear the minimum-length error as soon as the user reaches the requirement.
    const messageInput = document.getElementById("message");
    const messageError = contactForm.querySelector('[data-error-for="message"]');
    if (messageInput) {
        messageInput.addEventListener("input", () => {
            if (messageInput.value.trim().length >= 10) {
                messageInput.setCustomValidity("");
                if (messageError) messageError.textContent = "";
            }
        });
    }
}