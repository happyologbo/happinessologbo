/* ==========================================================================
   contact.js — Contact form validation
   Rules: no field may be empty, the email must be valid and the phone
   number may contain digits only.
   ========================================================================== */

(function () {
  "use strict";

  var form = document.getElementById("contact-form");
  if (!form) return;

  var successCard = document.getElementById("success-card");
  var statusEl = document.getElementById("form-status");
  var messageInput = document.getElementById("c-message");
  var counter = document.getElementById("c-count");

  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var DIGITS_ONLY = /^\d+$/;

  // each field has a list of checks; the first one that fails shows its message
  var fields = [
    {
      id: "c-name", label: "name",
      checks: [
        function (v) { return v ? "" : "Please enter your name."; },
        function (v) { return v.length >= 2 ? "" : "Your name looks too short."; }
      ]
    },
    {
      id: "c-email", label: "email",
      checks: [
        function (v) { return v ? "" : "Please enter your email address."; },
        function (v) { return EMAIL_PATTERN.test(v) ? "" : "Enter a valid email, like name@example.com."; }
      ]
    },
    {
      id: "c-phone", label: "phone",
      checks: [
        function (v) { return v ? "" : "Please enter your phone number."; },
        function (v) { return DIGITS_ONLY.test(v) ? "" : "Phone number must contain digits only (0–9)."; },
        function (v) { return v.length >= 7 && v.length <= 15 ? "" : "Phone number should be 7 to 15 digits long."; }
      ]
    },
    {
      id: "c-message", label: "message",
      checks: [
        function (v) { return v ? "" : "Please write a message."; },
        function (v) { return v.length >= 10 ? "" : "Your message should be at least 10 characters."; }
      ]
    }
  ];

  function validateField(field) {
    var input = document.getElementById(field.id);
    var errorEl = document.getElementById(field.id + "-error");
    var value = input.value.trim();
    var message = "";
    for (var i = 0; i < field.checks.length; i++) {
      message = field.checks[i](value);
      if (message) break;
    }
    var wrapper = input.parentElement;
    wrapper.classList.toggle("has-error", !!message);
    wrapper.classList.toggle("is-valid", !message);
    input.setAttribute("aria-invalid", message ? "true" : "false");
    errorEl.textContent = message;
    return !message;
  }

  // live feedback once a field has been touched
  fields.forEach(function (field) {
    var input = document.getElementById(field.id);
    input.addEventListener("blur", function () {
      if (input.value.trim()) validateField(field);
    });
    input.addEventListener("input", function () {
      if (input.parentElement.classList.contains("has-error")) validateField(field);
    });
  });

  messageInput.addEventListener("input", function () {
    counter.textContent = messageInput.value.length;
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var results = fields.map(validateField);
    var errors = results.filter(function (ok) { return !ok; }).length;

    if (errors) {
      statusEl.textContent = "Please fix " + errors + " field" + (errors > 1 ? "s" : "") + " highlighted above.";
      statusEl.style.color = "var(--danger)";
      var firstBad = form.querySelector(".has-error input, .has-error textarea");
      if (firstBad) firstBad.focus();
      return;
    }

    // simulate sending: keep a copy in localStorage and show a thank-you card
    var data = {
      name: document.getElementById("c-name").value.trim(),
      email: document.getElementById("c-email").value.trim(),
      phone: document.getElementById("c-phone").value.trim(),
      message: messageInput.value.trim(),
      sentAt: new Date().toISOString()
    };
    try {
      var inbox = JSON.parse(localStorage.getItem("hoPortfolioMessages")) || [];
      inbox.push(data);
      localStorage.setItem("hoPortfolioMessages", JSON.stringify(inbox));
    } catch (err) { /* storage unavailable */ }

    document.getElementById("success-name").textContent = data.name.split(" ")[0];
    document.getElementById("success-email").textContent = data.email;
    form.hidden = true;
    successCard.classList.add("is-visible");
    successCard.focus();
    window.showToast && window.showToast("Thanks " + data.name.split(" ")[0] + ", your message was sent.");
  });

  document.getElementById("send-another").addEventListener("click", function () {
    form.reset();
    counter.textContent = "0";
    form.querySelectorAll(".field").forEach(function (f) { f.classList.remove("is-valid", "has-error"); });
    statusEl.textContent = "All fields are required.";
    statusEl.style.color = "";
    successCard.classList.remove("is-visible");
    form.hidden = false;
    document.getElementById("c-name").focus();
  });
})();
