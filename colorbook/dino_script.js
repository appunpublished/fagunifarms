// Scroll fade-in
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add("show");
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll(".hidden").forEach(el => observer.observe(el));

// Roar sound
function playRoar() {
  document.getElementById("roarSound").play();
}
