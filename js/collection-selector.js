import { collections } from "./manifest.js";

/* -------------------------------------------------------
   OWNERSHIP STORAGE
------------------------------------------------------- */

function getOwnedCards() {
  return JSON.parse(localStorage.getItem("ownedCards") || "{}");
}

function saveOwnedCards(data) {
  localStorage.setItem("ownedCards", JSON.stringify(data));
}

/* -------------------------------------------------------
   COLLECTION SELECTOR
------------------------------------------------------- */

function renderCollectionSelector() {
  const container = document.getElementById("collection-selector");

  collections.forEach(col => {
    const tile = document.createElement("div");
    tile.className = "collection-tile";

    tile.innerHTML = `
      <img src="/poke-testing/assets/logos/${col.logo}" class="collection-logo" />
      <span class="collection-name">${col.name}</span>
    `;

    tile.onclick = () => enterCollection(col.id, col.name);

    container.appendChild(tile);
  });
}

/* -------------------------------------------------------
   ENTER COLLECTION → LOAD CARD VIEWER
------------------------------------------------------- */

window.collectionSizes = {}; // Track total cards per collection

async function enterCollection(id, name) {
  const selector = document.getElementById("collection-selector");
  const viewer = document.getElementById("card-viewer");
  const mc = document.getElementById("my-collections");
  const title = document.getElementById("collection-title");

  selector.classList.add("hidden");
  mc.classList.add("hidden");
  viewer.classList.remove("hidden");

  title.textContent = name;

  // ⭐ ABSOLUTE PATH FIX
  const { cardData } = await import(`/poke-testing/collections/${id}/cardData.js`);

  window.currentCollection = { id, name, cardData };
  window.collectionSizes[id] = cardData.length;

  renderCards(cardData, id);
}

/* -------------------------------------------------------
   CARD VIEWER GRID
------------------------------------------------------- */

function renderCards(cards, collectionId) {
  const grid = document.getElementById("card-grid");
  grid.innerHTML = "";

  const owned = getOwnedCards();

  cards.forEach(card => {
    const tile = document.createElement("div");
    tile.className = "card-tile";

    const isOwned = owned[collectionId]?.includes(card.cardNumber);

    // ⭐ ABSOLUTE PATH FIX
    const imgSrc = isOwned
      ? `/poke-testing/collections/${collectionId}/images/${card.file}`
      : `/poke-testing/assets/logos/cardback.jpg`;

    tile.innerHTML = `
      <img src="${imgSrc}" class="card-image" />
      <p>${card.cardNumber}</p>
    `;

    tile.onclick = () => openCardModal(card, imgSrc, collectionId);

    grid.appendChild(tile);
  });
}

/* -------------------------------------------------------
   CARD MODAL
------------------------------------------------------- */

function openCardModal(card, imgSrc, collectionId) {
  const modal = document.getElementById("card-modal");
  const modalImg = document.getElementById("modal-image");
  const modalName = document.getElementById("modal-name");
  const modalRarity = document.getElementById("modal-rarity");

  modalImg.src = imgSrc;
  modalName.textContent = card.name;
  modalRarity.textContent = card.rarity;

  modal.classList.remove("hidden");

  const closeBtn = document.getElementById("modal-close");
  closeBtn.onclick = () => {
    modal.classList.add("hidden");
  };

  modalImg.onclick = () => {
    const owned = getOwnedCards();
    owned[collectionId] = owned[collectionId] || [];

    if (!owned[collectionId].includes(card.cardNumber)) {
      owned[collectionId].push(card.cardNumber);

      const catchSound = new Audio("/poke-testing/assets/audio/catch.mp3");
      catchSound.play();
    } else {
      owned[collectionId] = owned[collectionId].filter(n => n !== card.cardNumber);
    }

    saveOwnedCards(owned);
    modal.classList.add("hidden");

    const { cardData } = window.currentCollection;
    renderCards(cardData, collectionId);
  };
}

/* -------------------------------------------------------
   BACK BUTTON (Viewer → Selector)
------------------------------------------------------- */

document.getElementById("back-button").onclick = () => {
  document.getElementById("card-viewer").classList.add("hidden");
  document.getElementById("my-collections").classList.add("hidden");
  document.getElementById("collection-selector").classList.remove("hidden");
};

/* -------------------------------------------------------
   MY COLLECTIONS PAGE
------------------------------------------------------- */

function showMyCollections() {
  const selector = document.getElementById("collection-selector");
  const viewer = document.getElementById("card-viewer");
  const mc = document.getElementById("my-collections");

  selector.classList.add("hidden");
  viewer.classList.add("hidden");
  mc.classList.remove("hidden");

  const grid = document.getElementById("my-collections-grid");
  grid.innerHTML = "";

  const owned = getOwnedCards();

  collections.forEach(col => {
    const colOwned = owned[col.id] || [];
    const totalCards = window.collectionSizes[col.id] || 0;

    if (colOwned.length === 0) return;

    const tile = document.createElement("div");
    tile.className = "mc-tile";

    tile.innerHTML = `
      <img src="/poke-testing/assets/logos/${col.logo}" class="mc-logo" />
      <h3>${col.name}</h3>
      <p class="mc-progress">${colOwned.length} / ${totalCards} cards owned</p>
    `;

    tile.onclick = () => enterCollection(col.id, col.name);

    grid.appendChild(tile);
  });
}

document.getElementById("my-collections-button").onclick = showMyCollections;

document.getElementById("mc-back-button").onclick = () => {
  document.getElementById("my-collections").classList.add("hidden");
  document.getElementById("collection-selector").classList.remove("hidden");
};

/* -------------------------------------------------------
   CATCH A RANDOM POKÉMON
------------------------------------------------------- */

function catchRandomPokemon() {
  const { id, cardData } = window.currentCollection;

  const randomCard = cardData[Math.floor(Math.random() * cardData.length)];

  const owned = getOwnedCards();
  owned[id] = owned[id] || [];

  const alreadyOwned = owned[id].includes(randomCard.cardNumber);

  if (!alreadyOwned) {
    owned[id].push(randomCard.cardNumber);
    saveOwnedCards(owned);

    const catchSound = new Audio("/poke-testing/assets/audio/catch.mp3");
    catchSound.play();
  }

  const modal = document.getElementById("card-modal");
  const modalImg = document.getElementById("modal-image");
  const modalName = document.getElementById("modal-name");
  const modalRarity = document.getElementById("modal-rarity");

  // ⭐ ABSOLUTE PATH FIX
  const imgSrc = `/poke-testing/collections/${id}/images/${randomCard.file}`;

  modalImg.src = imgSrc;
  modalName.textContent = randomCard.name;
  modalRarity.textContent = randomCard.rarity;

  modal.classList.remove("hidden");

  renderCards(cardData, id);
}

document.getElementById("catch-button").onclick = catchRandomPokemon;

/* -------------------------------------------------------
   INITIALIZE SELECTOR
------------------------------------------------------- */

renderCollectionSelector();
