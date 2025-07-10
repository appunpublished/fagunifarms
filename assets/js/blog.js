const postDir = "posts/";
const postFiles = ["welcome.md", "composting-tips.md", "mushroom-secrets.md"];

async function loadBlogPosts() {
  const container = document.getElementById("blog-posts");
  container.innerHTML = "";

  for (const file of postFiles) {
    const res = await fetch(postDir + file);
    const text = await res.text();

    const metaMatch = text.match(/---([\s\S]*?)---/);
    const meta = metaMatch ? metaMatch[1].trim().split("\n") : [];
    const body = text.replace(/---([\s\S]*?)---/, "").trim();

    let title = "Untitled", date = "";
    meta.forEach(line => {
      if (line.startsWith("title:")) title = line.replace("title:", "").trim();
      if (line.startsWith("date:")) date = line.replace("date:", "").trim();
    });

    const html = marked.parse(body);
    container.innerHTML += `
      <div class="mb-5">
        <h2>${title}</h2>
        <small class="text-muted">${date}</small>
        <div class="mt-2">${html}</div>
        <hr/>
      </div>
    `;
  }
}

window.addEventListener("DOMContentLoaded", loadBlogPosts);
