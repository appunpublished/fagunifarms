// Page visit counter using localStorage
let visits = localStorage.getItem("visits") || 0;
visits++;
localStorage.setItem("visits", visits);
document.getElementById("counter").innerText = visits;
