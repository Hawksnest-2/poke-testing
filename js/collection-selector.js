/* collection-selector.js (UPDATED)
   Terminology Refactor: "My Collections" → "My Pokedex"
   Includes:
   - Updated IDs
   - Updated classes
   - Updated screen names
   - Updated function names
   - Updated event listeners
   - Updated reset button ID
   - Comments explaining changes
*/

import { collections } from "./manifest.js";
import { rarityLegend } from "./rarity.js";

/* RARITY BUCKET CONFIG (unchanged) */
const rarityConfig = {
  common: {
    icon: rarityLegend["Common"],
    keys: ["Common"]
  },
  uncommon: {
    icon: rarityLegend["Uncommon"],
    keys: ["Uncommon"]
  },
  rare: {
    icon: rarityLegend["Rare"],
    keys: [
      "Rare",
      "Double Rare",
      "Ultra Rare",
      "Classic Collection",
      "Illustration Rare",
      "Special Illustration Rare",
      "Shiny Rare",
      "Shiny Ultra Rare",
      "Mega Attack Rare",
      "Hyper Rare",
      "Mega Hyper Rare",
      "Pikachu Rare",
      "Futuristic Rare",
      "Black White Rare",
      "ACE SPEC Rare"
    ]
  }
};

/* CACHE + DOM REFERENCES */
const collectionCache = new Map();

const mainHeader = document.getElementById("main-header");
const collectionSelector = document.getElementById("collection-selector");
const collectionOverview = document.getElementById("collection-overview");
const cardViewer = document.getElementById("card-viewer");

/* UPDATED: My Collections → My Pokedex */
const pokedexPage = document.getElementById("pokedex");

const cardModal = document.getElementById("card-modal");

const overviewTitle = document.getElementById("overview-title");
const overviewTotal = document.getElementById("overview-total");

const rarityCommonIcon = document.getElementById("rarity-common-icon");
const rarityUncommonIcon = document.getElementById("rarity-uncommon-icon");
const rarityRareIcon = document.getElementById("rarity-rare-icon");

const rarityCommonFill = document.getElementById("rarity-common-fill");
const rarityUncommonFill = document.getElementById("rarity-uncommon-fill");
const rarityRareFill = document.getElementById("rarity-rare-fill");

const rarityCommonText = document.getElementById("rarity-common-text");
const rarityUncommonText = document.getElementById("rarity-uncommon-text");
const rarityRareText = document.getElementById("rarity-rare-text");

const collectionTitle = document.getElementById("collection-title");
const cardGrid = document.getElementById("card-grid");

const modalImage = document.getElementById("modal-image");
const modalName = document.getElementById("modal-name");
const modalClose = document.getElementById("modal-close");

/* UPDATED: My Collections → My Pokedex */
const myPokedexButtonHome = document.getElementById("my-pokedex-button");

/* UPDATED: My Collection → My Pokedex */
const overviewBackButton = document.getElementById("overview-back-button");
const overviewPokedexButton = document.getElementById("overview-pokedex-button");
const viewerBackButton = document.getElementById("viewer-back-button");
const viewerPokedexButton = document.getElementById("viewer-pokedex-button");

const mcBackButton = document.getElementById("mc-back-button");

const catchOpenImageOverview = document.getElementById("catch-open-image");

/* UPDATED: My Collections → My Pokedex */
const pokedexGrid = document.getElementById("pokedex-grid");

/* STATE */
let currentCollectionId = null;
let currentCollectionData = null;
let pendingCatchRefresh = false;
let currentModalCard = null;

const ownedCards = new Map(); // key: `${collectionId}:${card.id}` => true

function saveOwnedCards() {
  const obj = Object.fromEntries(ownedCards);
  localStorage.setItem("ownedCards", JSON.stringify(obj));
}

function loadOwnedCards() {
  const raw = localStorage.getItem("ownedCards");
  if (!raw) return;

  try {
    const obj = JSON.parse(raw);
    ownedCards.clear();
    for (const [key, value] of Object.entries(obj)) {
      ownedCards.set(key, value);
    }
  } catch (e) {
    console.error("Failed to load ownedCards:", e);
  }
}

/* UPDATED: Screen name "myCollections" → "pokedex" */
function showScreen(screen) {
  mainHeader.classList.add("hidden");
  collectionSelector.classList.add("hidden");
  collectionOverview.classList.add("hidden");
  cardViewer.classList.add("hidden");
  pokedexPage.classList.add("hidden");

  switch (screen) {
    case "home":
      mainHeader.classList.remove("hidden");
      collectionSelector.classList.remove("hidden");
      break;
    case "overview":
      collectionOverview.classList.remove("hidden");
      break;
    case "viewer":
      cardViewer.classList.remove("hidden");
      break;
    case "pokedex":   // UPDATED
      pokedexPage.classList.remove("hidden");
      break;
  }
}

async function loadCollectionData(collectionId) {
  if (collectionCache.has(collectionId)) {
    return collectionCache.get(collectionId);
  }

  const module = await import(`../collections/${collectionId}/cardData.js`);

  let data = null;

  if (Array.isArray(module.default)) data = module.default;
  else if (Array.isArray(module.cards)) data = module.cards;
  else if (Array.isArray(module.cardData)) data = module.cardData;
  else {
    for (const value of Object.values(module)) {
      if (Array.isArray(value)) {
        data = value;
        break;
      }
    }
  }

  if (!data) {
    console.error(`ERROR: cardData.js for ${collectionId} did not export an array.`);
    data = [];
  }

  collectionCache.set(collectionId, data);
  return data;
}

/* HOME — COLLECTION SELECTOR */
function renderCollectionSelector() {
  collectionSelector.innerHTML = "";

  collections.forEach(col => {
    const tile = document.createElement("div");
    tile.className = "collection-tile";

    const img = document.createElement("img");
    img.className = "collection-logo";
    img.src = `/poke-testing/assets/logos/${col.logo}`;

    const name = document.createElement("span");
    name.className = "collection-name";
    name.textContent = col.name;

    tile.appendChild(img);
    tile.appendChild(name);

    tile.addEventListener("click", () => enterCollectionOverview(col.id));

    collectionSelector.appendChild(tile);
  });
}

/* COLLECTION OVERVIEW */
async function enterCollectionOverview(collectionId) {
  currentCollectionId = collectionId;
  currentCollectionData = await loadCollectionData(collectionId);

  showScreen("overview");

  const collectionMeta = collections.find(c => c.id === collectionId);
  overviewTitle.textContent = collectionMeta ? collectionMeta.name : collectionId;

  const totalCards = currentCollectionData.length;
  let ownedCount = 0;

  const rarityCounts = {
    common: { owned: 0, total: 0 },
    uncommon: { owned: 0, total: 0 },
    rare: { owned: 0, total: 0 }
  };

  currentCollectionData.forEach(card => {
    const key = `${collectionId}:${card.cardNumber}`;
    const isOwned = ownedCards.get(key) === true;

    if (isOwned) ownedCount++;

    const rarityName = card.rarity;

    for (const bucket of ["common", "uncommon", "rare"]) {
      if (rarityConfig[bucket].keys.includes(rarityName)) {
        rarityCounts[bucket].total++;
        if (isOwned) rarityCounts[bucket].owned++;
        break;
      }
    }
  });

  overviewTotal.textContent = `Owned: ${ownedCount} / ${totalCards} cards`;

  rarityCommonIcon.textContent = rarityConfig.common.icon;
  rarityUncommonIcon.textContent = rarityConfig.uncommon.icon;
  rarityRareIcon.textContent = rarityConfig.rare.icon;

  function setRarityRow(counts, fillEl, textEl) {
    const { owned, total } = counts;
    const pct = total > 0 ? Math.round((owned / total) * 100) : 0;
    fillEl.style.width = `${pct}%`;
    textEl.textContent = `${owned} / ${total}`;
  }

  setRarityRow(rarityCounts.common, rarityCommonFill, rarityCommonText);
  setRarityRow(rarityCounts.uncommon, rarityUncommonFill, rarityUncommonText);
  setRarityRow(rarityCounts.rare, rarityRareFill, rarityRareText);
}

/* CARD VIEWER */
function renderCardViewer() {
  if (!currentCollectionData || !currentCollectionId) return;

  showScreen("viewer");

  const collectionMeta = collections.find(c => c.id === currentCollectionId);
  collectionTitle.textContent = collectionMeta ? collectionMeta.name : currentCollectionId;

  cardGrid.innerHTML = "";

  currentCollectionData.forEach(card => {
    const key = `${currentCollectionId}:${card.cardNumber}`;
    const isOwned = ownedCards.get(key) === true;

    const tile = document.createElement("div");
    tile.className = "card-tile";

    const img = document.createElement("img");
    img.className = "card-image";

    const imgSrc = isOwned
      ? `/poke-testing/collections/${currentCollectionId}/${card.file}`
      : `/poke-testing/assets/logos/cardback.jpg`;

    img.src = imgSrc;
    tile.appendChild(img);

    const info = document.createElement("div");
    info.className = "card-info";

    const num = document.createElement("div");
    num.className = "card-number";
    num.textContent = `#${String(card.cardNumber).padStart(3, "0")}`;

    const name = document.createElement("div");
    name.className = "card-name";
    name.textContent = card.name;

    const rarity = document.createElement("div");
    rarity.className = "card-rarity";
    rarity.textContent = `${rarityLegend[card.rarity]} ${card.rarity}`;

    info.appendChild(num);
    info.appendChild(name);
    info.appendChild(rarity);

    tile.appendChild(info);

    tile.addEventListener("click", () => {
      const isOwnedNow = ownedCards.get(key) === true;
      openCardModal(card, isOwnedNow);
    });

    cardGrid.appendChild(tile);
  });
}

/* MODAL */
function openCardModal(card, isOwned) {
  currentModalCard = card;

  const imgSrc = isOwned
    ? `/poke-testing/collections/${currentCollectionId}/${card.file}`
    : `/poke-testing/assets/logos/cardback.jpg`;

  modalImage.src = imgSrc;
  modalName.textContent = card.name || "";

  document.getElementById("modal-rarity-icon").textContent = rarityLegend[card.rarity];
  document.getElementById("modal-rarity-text").textContent = card.rarity;

  const content = cardModal.querySelector(".card-modal-content");
  content.classList.remove("rarity-common", "rarity-uncommon", "rarity-rare");

  if (rarityConfig.common.keys.includes(card.rarity)) {
    content.classList.add("rarity-common");
  } else if (rarityConfig.uncommon.keys.includes(card.rarity)) {
    content.classList.add("rarity-uncommon");
  } else {
    content.classList.add("rarity-rare");
  }

  cardModal.classList.remove("hidden");
}

function closeCardModal() {
  cardModal.classList.add("hidden");

  modalImage.style.transform = "";
  scale = 1;
  startDistance = 0;

  currentModalCard = null;
}

/* UPDATED: Reset My Collection → Reset My Pokedex */
function resetCurrentCollection() {
  if (!currentCollectionId) return;

  if (!confirm("Reset this collection? You will lose all owned cards for this set.")) {
    return;
  }

  currentCollectionData.forEach(card => {
    const key = `${currentCollectionId}:${card.cardNumber}`;
    ownedCards.delete(key);
    saveOwnedCards();
  });

  renderCardViewer();
}

/* CATCH LOGIC */
function catchRandomPokemon() {
  if (!currentCollectionData || !currentCollectionId) return;

  const unowned = currentCollectionData.filter(card => {
    const key = `${currentCollectionId}:${card.cardNumber}`;
    return ownedCards.get(key) !== true;
  });

  if (unowned.length === 0) {
    alert("You already own all cards in this collection!");
    return;
  }

  const randomCard = unowned[Math.floor(Math.random() * unowned.length)];
  const key = `${currentCollectionId}:${randomCard.cardNumber}`;

  ownedCards.set(key, true);
  saveOwnedCards();

  const imgSrc = `/poke-testing/collections/${currentCollectionId}/${randomCard.file}`;
  modalImage.src = imgSrc;
  modalName.textContent = randomCard.name || "";

  document.getElementById("modal-rarity-icon").textContent = rarityLegend[randomCard.rarity];
  document.getElementById("modal-rarity-text").textContent = randomCard.rarity;

  const content = cardModal.querySelector(".card-modal-content");
  content.classList.remove("rarity-common", "rarity-uncommon", "rarity-rare");

  if (rarityConfig.common.keys.includes(randomCard.rarity)) {
    content.classList.add("rarity-common");
  } else if (rarityConfig.uncommon.keys.includes(randomCard.rarity)) {
    content.classList.add("rarity-uncommon");
  } else {
    content.classList.add("rarity-rare");
  }

  currentModalCard = randomCard;

  cardModal.classList.remove("hidden");

  pendingCatchRefresh = true;
}

/* UPDATED: My Collections → My Pokedex */
/* UPDATED: Function renamed */
async function renderPokedexPage() {
  pokedexGrid.innerHTML = "";

  for (const col of collections) {
    const data = await loadCollectionData(col.id);

    let ownedCount = 0;
    for (const card of data) {
      const key = `${col.id}:${card.cardNumber}`;
      if (ownedCards.get(key) === true) ownedCount++;
    }

    if (ownedCount === 0) continue;

    const tile = document.createElement("div");
    tile.className = "mc-tile";

    const img = document.createElement("img");
    img.className = "mc-logo";
    img.src = `/poke-testing/assets/logos/${col.logo}`;

    const name = document.createElement("div");
    name.textContent = col.name;

    const progress = document.createElement("div");
    progress.className = "mc-progress";
    progress.textContent = `Owned: ${ownedCount} / ${data.length}`;

    tile.appendChild(img);
    tile.appendChild(name);
    tile.appendChild(progress);

    tile.addEventListener("click", () => {
      currentCollectionId = col.id;
      currentCollectionData = data;
      renderCardViewer();
    });

    pokedexGrid.appendChild(tile);
  }
}

/* EVENTS */

/* UPDATED: My Collections → My Pokedex */
myPokedexButtonHome.addEventListener("click", () => {
  renderPokedexPage();
  showScreen("pokedex");
});

overviewBackButton.addEventListener("click", () => {
  showScreen("home");
});

/* UPDATED: My Collection → My Pokedex */
overviewPokedexButton.addEventListener("click", () => {
  renderCardViewer();
});

viewerBackButton.addEventListener("click", () => {
  enterCollectionOverview(currentCollectionId);
});

/* UPDATED: My Collection → My Pokedex */
viewerPokedexButton.addEventListener("click", () => {
  renderCardViewer();
});

mcBackButton.addEventListener("click", () => {
  showScreen("home");
});

modalClose.addEventListener("click", () => {
  closeCardModal();

  if (pendingCatchRefresh) {
    pendingCatchRefresh = false;
    renderCardViewer();
  }
});

catchOpenImageOverview.addEventListener("click", catchRandomPokemon);

/* UPDATED: Reset My Collection → Reset My Pokedex */
document.getElementById("reset-pokedex-button")
  .addEventListener("click", resetCurrentCollection);

/* PINCH ZOOM */
let scale = 1;
let startDistance = 0;

modalImage.addEventListener("touchmove", (e) => {
  if (e.touches.length === 2) {
    const [t1, t2] = e.touches;
    const dx = t1.pageX - t2.pageX;
    const dy = t1.pageY - t2.pageY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (!startDistance) startDistance = distance;

    scale = Math.min(4, Math.max(1, distance / startDistance));
    modalImage.style.transform = `scale(${scale})`;
  }
});

modalImage.addEventListener("touchend", () => {
  startDistance = 0;
});

/* INIT */
loadOwnedCards();
renderCollectionSelector();
showScreen("home");
