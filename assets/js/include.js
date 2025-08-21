// assets/js/include.js
async function includeHTML(id, file) {
  const el = document.getElementById(id);
  if (el) {
    const res = await fetch(file);
    if (res.ok) el.innerHTML = await res.text();
  }
}

// Load header & footer
document.addEventListener("DOMContentLoaded", () => {
  includeHTML("header-placeholder", "../partials/header.html");
  includeHTML("footer-placeholder", "../assets/partials/footer.html");
});