// js/collection-selector.js
import { collections } from "./manifest.js";
import { rarityLegend } from "./rarity.js";

/* ============================
   RARITY BUCKET CONFIG (3 buckets)
   ============================ */
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

/* ============================
   DOM ELEMENTS
   ============================ */
const mainHeader = document.getElementById("main-header");
const collectionSelector = document.getElementById("collection-selector");
const collectionOverview = document.getElementById("collection-overview");
const cardViewer = document.getElementById("card-viewer");
const myCollectionsPage = document.getElementById("my-collections");
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
const modalRarity = document.getElementById("modal-rarity");
const modalClose = document.getElementById("modal-close");

const myCollectionsButtonHome = document.getElementById("my-collections-button");
const overviewBackButton = document.getElementById("overview-back-button");
const overviewMyCollectionButton = document.getElementById("overview-my-collection-button");
const viewerBackButton = document.getElementById("viewer-back-button");
const viewerMyCollectionButton = document.getElementById("viewer-my-collection-button");
const mcBackButton = document.getElementById("mc-back-button");

const catchOpenImageOverview = document.getElementById("catch-open-image");
const catchClosedImageOverview = document.getElementById("catch-closed-image");
const catchOpenImageViewer = document.getElementById("viewer-catch-open-image");
const catchClosedImageViewer = document.getElementById("viewer-catch-closed-image");

const myCollectionsGrid = document.getElementById("my-collections-grid");

/* ============================
   STATE
   ============================ */
let currentCollectionId = null;
let currentCollectionData = null;
let pendingCatchRefresh = false;   // ⭐ FIX #1

const ownedCards = new Map(); // key: `${collectionId}:${card.id}` => true

/* ============================
   SCREEN SWITCHER
   ============================ */
function showScreen(screen) {
  mainHeader.classList.add("hidden");
  collectionSelector.classList.add("hidden");
  collectionOverview.classList.add("hidden");
  cardViewer.classList.add("hidden");
  myCollectionsPage.classList.add("hidden");

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
    case "myCollections":
      myCollectionsPage.classList.remove("hidden");
      break;
  }
}

/* ============================
   LOAD COLLECTION DATA
   ============================ */
function loadCollectionData(collectionId) {
  return import(`../collections/${collectionId}/cardData.js`)
    .then(module => module.default || module.cards || module.cardData);
}

/* ============================
   HOME PAGE — COLLECTION SELECTOR
   ============================ */
function renderCollectionSelector() {
  collectionSelector.innerHTML = "";

  collections.forEach(col => {
    const tile = document.createElement("div");
    tile.className = "collection-tile";

    const img = document.createElement("img");
    img.className = "collection-logo";
    img.src = `/poke-testing/collections/${col.id}/${col.logo}`;

    const name = document.createElement("span");
    name.className = "collection-name";
    name.textContent = col.name;

    tile.appendChild(img);
    tile.appendChild(name);

    tile.addEventListener("click", () => enterCollectionOverview(col.id));

    collectionSelector.appendChild(tile);
  });
}

/* ============================
   COLLECTION OVERVIEW PAGE
   ============================ */
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
    const key = `${collectionId}:${card.id}`;
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

/* ============================
   MY COLLECTION VIEWER
   ============================ */
function renderCardViewer() {
  if (!currentCollectionData || !currentCollectionId) return;

  showScreen("viewer");

  const collectionMeta = collections.find(c => c.id === currentCollectionId);
  collectionTitle.textContent = collectionMeta ? collectionMeta.name : currentCollectionId;

  cardGrid.innerHTML = "";

  currentCollectionData.forEach(card => {
    const key = `${currentCollectionId}:${card.id}`;
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

    /* ⭐ FIX #4 — check ownership at click time */
    tile.addEventListener("click", () => {
      const isOwnedNow = ownedCards.get(key) === true;
      openCardModal(card, isOwnedNow);
    });

    cardGrid.appendChild(tile);
  });
}

/* ============================
   MODAL
   ============================ */
function openCardModal(card, isOwned) {
  const imgSrc = isOwned
    ? `/poke-testing/collections/${currentCollectionId}/${card.file}`
    : `/poke-testing/assets/logos/cardback.jpg`;

  modalImage.src = imgSrc;
  modalName.textContent = card.name || "";
  modalRarity.textContent = card.rarity || "";

  cardModal.classList.remove("hidden");
}

function closeCardModal() {
  cardModal.classList.add("hidden");
}

/* ============================
   CATCH LOGIC
   ============================ */
function catchRandomPokemon() {
  if (!currentCollectionData || !currentCollectionId) return;

  const unowned = currentCollectionData.filter(card => {
    const key = `${currentCollectionId}:${card.id}`;
    return ownedCards.get(key) !== true;
  });

  if (unowned.length === 0) {
    alert("You already own all cards in this collection!");
    return;
  }

  const randomCard = unowned[Math.floor(Math.random() * unowned.length)];
  const key = `${currentCollectionId}:${randomCard.id}`;
  ownedCards.set(key, true);

  const imgSrc = `/poke-testing/collections/${currentCollectionId}/${randomCard.file}`;

  modalImage.src = imgSrc;
  modalName.textContent = randomCard.name || "";
  modalRarity.textContent = randomCard.rarity || "";

  cardModal.classList.remove("hidden");

  /* ⭐ FIX #2 — mark that viewer should refresh after closing */
  pendingCatchRefresh = true;
}

/* ============================
   MY COLLECTIONS (PLURAL)
   ============================ */
function renderMyCollectionsPage() {
  myCollectionsGrid.innerHTML = "";

  collections.forEach(col => {
    loadCollectionData(col.id).then(data => {
      let ownedCount = 0;
      data.forEach(card => {
        const key = `${col.id}:${card.id}`;
        if (ownedCards.get(key) === true) ownedCount++;
      });

      if (ownedCount === 0) return;

      const tile = document.createElement("div");
      tile.className = "mc-tile";

      const img = document.createElement("img");
      img.className = "mc-logo";
      img.src = `/poke-testing/collections/${col.id}/${col.logo}`;

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

      myCollectionsGrid.appendChild(tile);
    });
  });
}

/* ============================
   EVENT WIRING
   ============================ */
myCollectionsButtonHome.addEventListener("click", () => {
  renderMyCollectionsPage();
  showScreen("myCollections");
});

overviewBackButton.addEventListener("click", () => {
  showScreen("home");
});

overviewMyCollectionButton.addEventListener("click", () => {
  renderCardViewer();
});

viewerBackButton.addEventListener("click", () => {
  enterCollectionOverview(currentCollectionId);
});

viewerMyCollectionButton.addEventListener("click", () => {
  renderCardViewer();
});

mcBackButton.addEventListener("click", () => {
  showScreen("home");
});

/* ⭐ FIX #3 — unified modal close handler */
modalClose.addEventListener("click", () => {
  closeCardModal();

  if (pendingCatchRefresh) {
    pendingCatchRefresh = false;
    renderCardViewer();
  }
});

/* Catch images */
catchOpenImageOverview.addEventListener("click", catchRandomPokemon);
catchClosedImageOverview.addEventListener("click", catchRandomPokemon);
catchOpenImageViewer.addEventListener("click", catchRandomPokemon);
catchClosedImageViewer.addEventListener("click", catchRandomPokemon);

/* ============================
   INIT
   ============================ */
renderCollectionSelector();
showScreen("home");
