// Utilities
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

const state = {
  query: "",
  category: "alla",
  sort: "featured",
  favorites: new Set(JSON.parse(localStorage.getItem("favorites") || "[]")),
  theme: localStorage.getItem("theme") || "auto"
};

const grid = $("#cardGrid");
const cards = $$(".card", grid);
const empty = $("#emptyState");

// ------ Theme ------
const themeToggle = $("#themeToggle");
const applyTheme = () => {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const mode = state.theme === "auto" ? (prefersDark ? "dark" : "light") : state.theme;
  document.documentElement.dataset.theme = mode;
  themeToggle.setAttribute("aria-pressed", mode === "dark");
};
themeToggle.addEventListener("click", () => {
  // toggle dark/light/auto (cycle)
  const order = ["auto","dark","light"];
  const idx = order.indexOf(state.theme);
  state.theme = order[(idx + 1) % order.length];
  localStorage.setItem("theme", state.theme);
  applyTheme();
});
applyTheme();

// ------ Favorites ------
function syncFavoriteButtons(){
  $$(".favorite").forEach(btn=>{
    const card = btn.closest(".card");
    const id = card.dataset.id;
    const active = state.favorites.has(id);
    btn.classList.toggle("is-active", active);
    btn.textContent = active ? "❤" : "♡";
    btn.setAttribute("aria-label", active ? "Ta bort favorit" : "Lägg till som favorit");
  });
}
syncFavoriteButtons();

grid.addEventListener("click", (e)=>{
  const favBtn = e.target.closest(".favorite");
  if(favBtn){
    const id = favBtn.closest(".card").dataset.id;
    if(state.favorites.has(id)) state.favorites.delete(id); else state.favorites.add(id);
    localStorage.setItem("favorites", JSON.stringify([...state.favorites]));
    syncFavoriteButtons();
  }
});

// ------ Search ------
const searchInput = $("#searchInput");
searchInput.addEventListener("input", (e)=>{
  state.query = e.target.value.trim().toLowerCase();
  render();
});

// ------ Category filter ------
const chips = $$(".chip");
chips.forEach(chip=>{
  chip.addEventListener("click", ()=>{
    chips.forEach(c=>{ c.classList.remove("is-active"); c.setAttribute("aria-pressed","false"); });
    chip.classList.add("is-active"); chip.setAttribute("aria-pressed","true");
    state.category = chip.dataset.filter;
    render();
  });
});

// ------ Sort ------
const sortSelect = $("#sortSelect");
sortSelect.addEventListener("change", (e)=>{
  state.sort = e.target.value;
  render(true);
});

// ------ Recipe modal ------
const recipeModal = $("#recipeModal");
const recipeContent = $("#recipeContent");
$("#cardGrid").addEventListener("click", (e)=>{
  const btn = e.target.closest(".show-recipe");
  if(!btn) return;
  const card = btn.closest(".card");
  const title = $(".card-title", card).textContent;
  const tpl = $("template.recipe", card).content.cloneNode(true);

  $("#recipeTitle").textContent = title + " – Recept";
  recipeContent.innerHTML = "";
  recipeContent.appendChild(tpl);

  // Open with <dialog> API
  if(typeof recipeModal.showModal === "function"){
    recipeModal.showModal();
  } else {
    // Safari fallback
    recipeModal.setAttribute("open", "");
  }
});

// Close on Esc (for Safari fallback)
document.addEventListener("keydown", (e)=>{
  if(e.key === "Escape" && recipeModal.hasAttribute("open")){
    recipeModal.close ? recipeModal.close() : recipeModal.removeAttribute("open");
  }
});

// ------ Keyboard: open recipe with Enter on focused card ------
grid.addEventListener("keydown", (e)=>{
  if(e.key === "Enter" && e.target.classList.contains("card")){
    $(".show-recipe", e.target)?.click();
  }
});

// ------ Render (filter + sort) ------
function render(sortOnly=false){
  let items = cards.slice();

  // Filter by query
  if(state.query){
    items = items.filter(card=>{
      const txt = card.innerText.toLowerCase();
      return txt.includes(state.query);
    });
  }

  // Filter by category
  if(state.category !== "alla"){
    items = items.filter(card => card.dataset.category === state.category);
  }

  // Sort
  const byNum = (attr, dir=1) => (a,b) => (parseFloat(a.dataset[attr]) - parseFloat(b.dataset[attr])) * dir;
  switch(state.sort){
    case "price-asc":   items.sort(byNum("price", +1)); break;
    case "price-desc":  items.sort(byNum("price", -1)); break;
    case "kcal-asc":    items.sort(byNum("kcal", +1)); break;
    case "kcal-desc":   items.sort(byNum("kcal", -1)); break;
    case "protein-desc":items.sort(byNum("protein", -1)); break;
    default:            items.sort((a,b)=> parseInt(b.dataset.featured) - parseInt(a.dataset.featured));
  }

  // Update grid
  grid.innerHTML = "";
  items.forEach(card=> grid.appendChild(card));

  // Empty state
  empty.hidden = items.length > 0;

  if(!sortOnly){ syncFavoriteButtons(); }
}
render();

// ------ Contact form (demo only) ------
const contactForm = $("#contactForm");
const statusEl = $(".form-status");
contactForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  const formData = new FormData(contactForm);
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const message = formData.get("message")?.toString().trim();

  // Basic validation
  if(!name || !email || !message){
    statusEl.style.color = "var(--danger)";
    statusEl.textContent = "Fyll i alla fält.";
    return;
  }
  statusEl.style.color = "var(--ok)";
  statusEl.textContent = "Tack! Ditt meddelande är skickat (demo).";
  contactForm.reset();
});

// ------ Footer year ------
$("#year").textContent = new Date().getFullYear();
