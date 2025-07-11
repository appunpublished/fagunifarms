const posts = [
  {
    title: "Welcome to Faguni Farms",
    date: "2025-07-10",
    content: `
      We are excited to launch our blog! Stay tuned for updates on organic living, farming techniques, and wellness tips from Faguni Farms.
    `
  },
  {
    title: "5 Composting Tips for Beginners",
    date: "2025-07-08",
    content: `
      Composting is nature's way of recycling. Here's how you can start:

      1. Start with kitchen scraps  
      2. Avoid dairy and meat  
      3. Mix greens and browns  
      4. Turn regularly  
      5. Keep it moist  

      Your plants will thank you!
    `
  },
  {
    title: "Secrets to Growing Mushrooms at Home",
    date: "2025-07-05",
    content: `
      Growing mushrooms is easier than you think! All you need is:

      - A cool, dark space  
      - Clean substrate  
      - Regular misting  
      - A little patience  

      We teach this in our workshops. Join us!
    `
  }
];

window.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("blog-posts");
  container.innerHTML = "";

  posts.forEach(post => {
    const html = marked.parse(post.content);
    container.innerHTML += `
      <div class="mb-5">
        <h2>${post.title}</h2>
        <small class="text-muted">${post.date}</small>
        <div class="mt-2">${html}</div>
        <hr/>
      </div>
    `;
  });
});
