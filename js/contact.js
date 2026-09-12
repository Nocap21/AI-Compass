/* =========================================================
   contact.js
   Simple client-side validation for the Contact form: checks
   that every field is filled in and the email looks valid,
   shows inline errors, and fires a success toast + banner when
   the form is "sent" (no backend — this is a front-end demo).
   ========================================================= */

(function () {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const fields = {
    name: { el: document.getElementById("field-name"), validate: (v) => v.trim().length > 1, msg: "Enter your full name" },
    email: { el: document.getElementById("field-email"), validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: "Enter a valid email address" },
    subject: { el: document.getElementById("field-subject"), validate: (v) => v.trim().length > 2, msg: "Subject is too short" },
    message: { el: document.getElementById("field-message"), validate: (v) => v.trim().length > 9, msg: "Message should be at least 10 characters" },
  };

  function validateField(key) {
    const { el, validate, msg } = fields[key];
    const wrapper = el.closest(".form-field");
    const errorEl = wrapper.querySelector(".field-error");
    const valid = validate(el.value);
    wrapper.classList.toggle("invalid", !valid);
    errorEl.textContent = msg;
    errorEl.classList.toggle("show", !valid);
    return valid;
  }

  Object.keys(fields).forEach((key) => {
    fields[key].el.addEventListener("blur", () => validateField(key));
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const allValid = Object.keys(fields).map(validateField).every(Boolean);
    if (!allValid) {
      window.AICompass.toast("Please fix the highlighted fields", "error");
      return;
    }
    document.getElementById("contact-success").classList.remove("hidden");
    form.reset();
    window.AICompass.toast("Message sent! We'll get back to you soon.", "success");
  });
})();
