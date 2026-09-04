/* =========================================================
   GLOW GARDEN
   Plain JavaScript — no libraries, no APIs.
   ========================================================= */

"use strict";


/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEY = "glow-garden-v5";

let state = {
  profile: null,
  completed: {},
  customTasks: [],
  basket: [],
  theme: "rose",
  mood: null
};


function loadState() {

  try {

    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return;
    }

    const parsed = JSON.parse(saved);

    if (parsed && typeof parsed === "object") {
      state = {
        ...state,
        ...parsed
      };
    }

  } catch (error) {

    console.warn("Glow Garden could not read saved data.", error);

  }

}


function saveState() {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );

  } catch (error) {

    console.warn("Glow Garden could not save data.", error);

  }

}


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);

const $$ = (selector, parent = document) =>
  Array.from(parent.querySelectorAll(selector));


function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function getChecked(name) {

  return $$(`input[name="${name}"]:checked`)
    .map(input => input.value);

}


function getRadio(name, fallback = "") {

  const selected = document.querySelector(
    `input[name="${name}"]:checked`
  );

  return selected ? selected.value : fallback;

}


function todayIndex() {

  const day = new Date().getDay();

  return day === 0 ? 6 : day - 1;

}


function todayDateKey() {

  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");

}


function showToast(message) {

  const toast = $("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {

    toast.classList.remove("show");

  }, 2600);

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function showScreen(screenId) {

  const screens = $$(".screen");

  screens.forEach(screen => {

    screen.classList.remove("active");

  });

  const target = $(screenId);

  if (!target) return;

  target.classList.add("active");

  $$(".nav-btn").forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.screen === screenId
    );

  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


function goHome() {

  showScreen("homeScreen");

}


function openSetup() {

  currentStep = 1;

  populateFormFromState();

  renderWizard();

  showScreen("setupScreen");

}


/* =========================================================
   WIZARD
   ========================================================= */

let currentStep = 1;


function renderWizard() {

  $$(".wizard-step").forEach(step => {

    step.classList.toggle(
      "active",
      Number(step.dataset.step) === currentStep
    );

  });

  $$(".wizard-dot").forEach(dot => {

    const number = Number(dot.dataset.dot);

    dot.classList.toggle(
      "active",
      number <= currentStep
    );

  });

  const progress = ((currentStep - 1) / 4) * 100;

  const progressBar = $("wizardProgress");

  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }

  $("prevBtn").disabled = currentStep === 1;

  $("nextBtn").classList.toggle(
    "hidden",
    currentStep === 5
  );

  $("finishBtn").classList.toggle(
    "hidden",
    currentStep !== 5
  );

}


function validateStep(step) {

  if (step === 1) {

    const name = $("nameInput").value.trim();

    if (!name) {

      showToast("Tell me your name first, lovely ♡");

      $("nameInput").focus();

      return false;

    }

    const categories = getChecked("category");

    if (!categories.length) {

      showToast("Choose at least one little glow-up chapter.");

      return false;

    }

  }

  return true;

}


function nextStep() {

  if (!validateStep(currentStep)) {
    return;
  }

  if (currentStep < 5) {

    currentStep++;

    renderWizard();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }

}


function previousStep() {

  if (currentStep > 1) {

    currentStep--;

    renderWizard();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }

}


/* =========================================================
   PROFILE FORM
   ========================================================= */

function collectProfile() {

  const budgetValue = Number(
    $("budgetInput").value
  );

  return {

    name:
      $("nameInput").value.trim() ||
      "Lovely",

    categories:
      getChecked("category"),

    budget:
      Number.isFinite(budgetValue) && budgetValue >= 0
        ? Math.round(budgetValue)
        : 0,

    owned:
      getChecked("owned"),

    skin: {

      type:
        getRadio("skinType", "normal"),

      sensitivity:
        document.querySelector(
          '[name="sensitivity"]'
        )?.value || "medium",

      concerns:
        getChecked("skinConcern"),

      climate:
        document.querySelector(
          '[name="climate"]'
        )?.value || "mixed",

      sun:
        document.querySelector(
          '[name="sun"]'
        )?.value || "medium"

    },

    hair: {

      texture:
        getRadio("hairTexture", "straight"),

      scalp:
        getRadio("scalp", "normal"),

      concerns:
        getChecked("hairConcern"),

      wash:
        Number(
          document.querySelector(
            '[name="hairWash"]'
          )?.value || 3
        ),

      porosity:
        document.querySelector(
          '[name="porosity"]'
        )?.value || "unknown"

    },

    body: {

      type:
        getRadio("bodyType", "normal"),

      concerns:
        getChecked("bodyConcern")

    },

    wellness: {

      goals:
        getChecked("wellnessGoal"),

      minutes:
        Number(
          document.querySelector(
            '[name="minutes"]'
          )?.value || 20
        ),

      meditation:
        Number(
          document.querySelector(
            '[name="meditation"]'
          )?.value || 5
        )

    },

    preferences: {

      intensity:
        getRadio("intensity", "balanced"),

      fragrance:
        getRadio("fragrance", "love")

    }

  };

}


function finishSetup() {

  if (!validateStep(1)) {

    currentStep = 1;

    renderWizard();

    return;

  }

  try {

    state.profile = collectProfile();

    state.basket = chooseProducts(
      state.profile,
      state.profile.budget
    );

    saveState();

    renderAll();

    showScreen("todayScreen");

    showToast(
      `Your little garden is ready, ${state.profile.name} ✦`
    );

  } catch (error) {

    console.error(error);

    showToast(
      "Something went wrong while creating your plan. Please try again."
    );

  }

}


function populateFormFromState() {

  if (!state.profile) return;

  const p = state.profile;

  $("nameInput").value = p.name || "";

  $("budgetInput").value =
    Number.isFinite(p.budget)
      ? p.budget
      : 500;


  $$('input[name="category"]').forEach(input => {

    input.checked =
      (p.categories || []).includes(input.value);

  });


  $$('input[name="owned"]').forEach(input => {

    input.checked =
      (p.owned || []).includes(input.value);

  });


  setRadio(
    "skinType",
    p.skin?.type || "normal"
  );

  setRadio(
    "hairTexture",
    p.hair?.texture || "straight"
  );

  setRadio(
    "scalp",
    p.hair?.scalp || "normal"
  );

  setRadio(
    "bodyType",
    p.body?.type || "normal"
  );

  setRadio(
    "intensity",
    p.preferences?.intensity || "balanced"
  );

  setRadio(
    "fragrance",
    p.preferences?.fragrance || "love"
  );


  setSelect(
    "sensitivity",
    p.skin?.sensitivity || "medium"
  );

  setSelect(
    "climate",
    p.skin?.climate || "mixed"
  );

  setSelect(
    "sun",
    p.skin?.sun || "medium"
  );

  setSelect(
    "hairWash",
    String(p.hair?.wash || 3)
  );

  setSelect(
    "porosity",
    p.hair?.porosity || "unknown"
  );


  setChecked(
    "skinConcern",
    p.skin?.concerns || []
  );

  setChecked(
    "hairConcern",
    p.hair?.concerns || []
  );

  setChecked(
    "bodyConcern",
    p.body?.concerns || []
  );

  setChecked(
    "wellnessGoal",
    p.wellness?.goals || []
  );


  const minutes =
    document.querySelector('[name="minutes"]');

  if (minutes) {
    minutes.value =
      p.wellness?.minutes || 20;
  }


  const meditation =
    document.querySelector('[name="meditation"]');

  if (meditation) {
    meditation.value =
      p.wellness?.meditation || 5;
  }

}


function setRadio(name, value) {

  const input = document.querySelector(
    `input[name="${name}"][value="${CSS.escape(value)}"]`
  );

  if (input) {
    input.checked = true;
  }

}


function setChecked(name, values) {

  $$(`input[name="${name}"]`).forEach(input => {

    input.checked = values.includes(input.value);

  });

}


function setSelect(name, value) {

  const select = document.querySelector(
    `[name="${name}"]`
  );

  if (select) {
    select.value = value;
  }

}


/* =========================================================
   PRODUCT CATALOG
   Reference prices only — editable.
   ========================================================= */

const PRODUCTS = [

  {
    id: "minimalist-niacinamide",
    category: "skin",
    role: "skinTreatment",
    brand: "Minimalist",
    name: "Niacinamide 5% Face Serum",
    price: 237,
    concerns: ["acne", "oiliness", "darkSpots", "texture"],
    types: ["oily", "combination", "normal"],
    climates: ["humid", "hot", "mixed"],
    sensitivitySafe: true,
    fragranceFree: true,
    why: "A simple niacinamide option for oiliness, breakouts and uneven-looking texture."
  },

  {
    id: "dermaco-niacinamide-arbutin",
    category: "skin",
    role: "skinTreatment",
    brand: "The Derma Co",
    name: "5% Niacinamide + Alpha Arbutin Serum",
    price: 439,
    concerns: ["darkSpots", "unevenTone", "dullness"],
    types: ["normal", "combination", "oily"],
    climates: ["humid", "hot", "mixed", "dry"],
    sensitivitySafe: false,
    fragranceFree: true,
    why: "A targeted brightening-style option for the appearance of uneven tone and dark spots."
  },

  {
    id: "dermaco-niacinamide-zinc",
    category: "skin",
    role: "skinTreatment",
    brand: "The Derma Co",
    name: "10% Niacinamide + 2% Zinc PCA",
    price: 515,
    concerns: ["acne", "oiliness", "texture"],
    types: ["oily", "combination"],
    climates: ["humid", "hot"],
    sensitivitySafe: false,
    fragranceFree: true,
    why: "A more targeted option for oily, breakout-prone skin."
  },

  {
    id: "dermaco-vitc",
    category: "skin",
    role: "skinTreatment",
    brand: "The Derma Co",
    name: "C-Cinamide Radiance Serum",
    price: 545,
    concerns: ["dullness", "darkSpots"],
    types: ["normal", "combination", "oily"],
    climates: ["mixed", "dry", "humid"],
    sensitivitySafe: false,
    fragranceFree: true,
    why: "A brightening-focused serum option for dull-looking skin."
  },

  {
    id: "dove-body-lotion",
    category: "body",
    role: "bodyMoisturizer",
    brand: "Dove",
    name: "Body Love Moisturizing Lotion",
    price: 220,
    concerns: ["dryness", "roughness"],
    types: ["dry", "normal"],
    climates: ["dry", "cold", "mixed"],
    sensitivitySafe: true,
    fragranceFree: false,
    why: "A budget-friendly body moisturization option for dry-feeling skin."
  },

  {
    id: "minimalist-body-lotion",
    category: "body",
    role: "bodyMoisturizer",
    brand: "Minimalist",
    name: "5% Marula Oil Body Lotion",
    price: 299,
    concerns: ["dryness", "roughness"],
    types: ["dry", "normal", "sensitive"],
    climates: ["dry", "cold", "mixed"],
    sensitivitySafe: true,
    fragranceFree: true,
    why: "A fragrance-free body moisturization choice for dry-feeling skin."
  },

  {
    id: "minimalist-body-acne",
    category: "body",
    role: "bodyTreatment",
    brand: "Minimalist",
    name: "2% Salicylic Acid Body Wash",
    price: 299,
    concerns: ["bodyAcne", "ingrowns", "roughness"],
    types: ["oily", "normal"],
    climates: ["humid", "hot", "mixed"],
    sensitivitySafe: false,
    fragranceFree: true,
    why: "A targeted body-care option for clogged-feeling or breakout-prone areas."
  },

  {
    id: "dove-shampoo",
    category: "hair",
    role: "shampoo",
    brand: "Dove",
    name: "Daily Shine Shampoo",
    price: 180,
    concerns: ["dullness", "oily"],
    types: ["straight", "wavy"],
    climates: ["humid", "hot", "mixed"],
    sensitivitySafe: true,
    fragranceFree: false,
    why: "An accessible shampoo option when you need a simple wash routine."
  },

  {
    id: "loreal-dream-length",
    category: "hair",
    role: "hairTreatment",
    brand: "L'Oréal Paris",
    name: "Dream Lengths Hair Mask",
    price: 499,
    concerns: ["breakage", "dryness", "frizz", "dullness"],
    types: ["straight", "wavy", "curly", "coily"],
    climates: ["dry", "cold", "mixed"],
    sensitivitySafe: true,
    fragranceFree: false,
    why: "A richer conditioning step for dry, frizzy or fragile-feeling lengths."
  },

  {
    id: "dove-conditioner",
    category: "hair",
    role: "conditioner",
    brand: "Dove",
    name: "Intense Repair Conditioner",
    price: 210,
    concerns: ["breakage", "dryness", "frizz"],
    types: ["straight", "wavy", "curly", "coily"],
    climates: ["dry", "cold", "mixed"],
    sensitivitySafe: true,
    fragranceFree: false,
    why: "A low-cost conditioning option for dry or damaged-feeling lengths."
  },

  {
    id: "mamaearth-hair-oil",
    category: "hair",
    role: "hairTreatment",
    brand: "Mamaearth",
    name: "Onion Hair Oil",
    price: 399,
    concerns: ["dryness", "breakage", "thinning"],
    types: ["straight", "wavy", "curly", "coily"],
    climates: ["dry", "cold", "mixed"],
    sensitivitySafe: false,
    fragranceFree: false,
    why: "An optional pre-wash oiling step for dry-feeling lengths."
  },

  {
    id: "minimalist-spf",
    category: "skin",
    role: "sunscreen",
    brand: "Minimalist",
    name: "SPF 50 Sunscreen",
    price: 399,
    concerns: ["darkSpots", "dullness"],
    types: ["dry", "normal", "combination", "oily"],
    climates: ["humid", "hot", "mixed"],
    sensitivitySafe: true,
    fragranceFree: true,
    why: "Daily UV protection is particularly useful when uneven tone or outdoor exposure is a concern."
  },

  {
    id: "dove-body-wash",
    category: "body",
    role: "bodyWash",
    brand: "Dove",
    name: "Deeply Nourishing Body Wash",
    price: 220,
    concerns: ["dryness"],
    types: ["dry", "normal"],
    climates: ["dry", "cold", "mixed"],
    sensitivitySafe: true,
    fragranceFree: false,
    why: "A gentle-feeling body wash option for a simple shower ritual."
  }

];


/* =========================================================
   PRODUCT RECOMMENDATION ENGINE
   ========================================================= */

function chooseProducts(profile, budget) {

  if (!profile || budget <= 0) {
    return [];
  }

  const candidates = [];

  const categories =
    profile.categories || [];

  const owned =
    profile.owned || [];


  PRODUCTS.forEach(product => {

    if (!categories.includes(
      product.category === "skin"
        ? "skin"
        : product.category
    )) {
      return;
    }

    if (owned.includes(product.role)) {
      return;
    }

    let score = 0;


    /* Skin scoring */

    if (product.category === "skin") {

      const concerns =
        profile.skin?.concerns || [];

      concerns.forEach(concern => {

        if (product.concerns.includes(concern)) {
          score += 8;
        }

      });

      if (
        product.types.includes(
          profile.skin?.type
        )
      ) {
        score += 3;
      }

      if (
        product.climates.includes(
          profile.skin?.climate
        )
      ) {
        score += 2;
      }

      if (
        profile.skin?.sensitivity === "high" &&
        product.sensitivitySafe
      ) {
        score += 4;
      }

      if (
        profile.preferences?.fragrance === "free" &&
        product.fragranceFree
      ) {
        score += 3;
      }

      if (
        profile.skin?.sun === "high" &&
        product.role === "sunscreen"
      ) {
        score += 10;
      }

    }


    /* Hair scoring */

    if (product.category === "hair") {

      const concerns =
        profile.hair?.concerns || [];

      concerns.forEach(concern => {

        if (product.concerns.includes(concern)) {
          score += 8;
        }

      });

      if (
        product.types.includes(
          profile.hair?.texture
        )
      ) {
        score += 3;
      }

      if (
        product.climates.includes(
          profile.skin?.climate
        )
      ) {
        score += 2;
      }

      if (
        profile.preferences?.fragrance === "free" &&
        product.fragranceFree
      ) {
        score += 3;
      }

    }


    /* Body scoring */

    if (product.category === "body") {

      const concerns =
        profile.body?.concerns || [];

      concerns.forEach(concern => {

        if (product.concerns.includes(concern)) {
          score += 8;
        }

      });

      if (
        product.types.includes(
          profile.body?.type
        )
      ) {
        score += 3;
      }

      if (
        profile.preferences?.fragrance === "free" &&
        product.fragranceFree
      ) {
        score += 3;
      }

    }


    /* Basic role priority */

    const basicRoles = [
      "cleanser",
      "moisturizer",
      "sunscreen",
      "shampoo",
      "conditioner",
      "bodyWash",
      "bodyMoisturizer"
    ];

    if (
      basicRoles.includes(product.role)
    ) {
      score += 1;
    }


    if (score > 0) {

      candidates.push({
        product,
        score
      });

    }

  });


  candidates.sort((a, b) => {

    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return a.product.price - b.product.price;

  });


  /*
    We select useful items only.
    The basket can NEVER exceed the budget.
  */

  const selected = [];

  let total = 0;

  const maxItems =
    profile.preferences?.intensity === "minimal"
      ? 2
      : profile.preferences?.intensity === "detailed"
        ? 5
        : 4;


  for (const candidate of candidates) {

    if (selected.length >= maxItems) {
      break;
    }

    const product = candidate.product;

    if (total + product.price <= budget) {

      selected.push(product);

      total += product.price;

    }

  }


  return selected;

}


/* =========================================================
   DIY APOTHECARY
   ========================================================= */

const DIY = [

  /* ---------------- SKIN ---------------- */

  {
    id: "oat-soothing-mask",
    category: "skin",
    icon: "🥣",
    title: "Cloud Oat Soothing Mask",
    purpose: "A very simple, fresh soothing ritual for dry- or sensitive-feeling skin.",
    evidence: "Plain oats are commonly used in soothing cosmetic preparations. This is not a treatment for a skin condition.",
    ingredients: [
      {
        name: "finely ground plain oats",
        amount: "1 tablespoon",
        why: "Creates a soft, soothing paste."
      },
      {
        name: "clean water",
        amount: "1–2 teaspoons, as needed",
        why: "Hydrates the oats into a spreadable paste."
      }
    ],
    tools: [
      "clean small bowl",
      "clean spoon"
    ],
    steps: [
      "Wash your hands and use a clean bowl.",
      "Add 1 tablespoon of finely ground plain oats.",
      "Slowly add clean water until you have a soft paste.",
      "Apply a thin layer to clean skin, avoiding the eye area.",
      "Leave on for about 10–15 minutes.",
      "Rinse gently with lukewarm water.",
      "Apply your normal moisturizer afterward."
    ],
    usage: [
      "Use a fresh batch each time.",
      "Do not scrub the mask into the skin.",
      "If your skin feels irritated, rinse immediately."
    ],
    frequency: "About 1 time per week, or simply whenever a soothing ritual feels nice.",
    storage: "Make only what you need. Discard leftovers after the session; do not store the wet mixture.",
    safety: "Patch-test first. Avoid broken or irritated skin. Stop if itching, burning or redness develops."
  },


  {
    id: "green-tea-compress",
    category: "skin",
    icon: "🍵",
    title: "Moonlit Green Tea Compress",
    purpose: "A cool, simple face-compress ritual for a refreshed feeling.",
    evidence: "Green tea contains plant compounds studied in cosmetic research, but this simple home compress should not be treated as an acne or pigmentation treatment.",
    ingredients: [
      {
        name: "green tea",
        amount: "1 tea bag or about 1 teaspoon loose tea",
        why: "Provides a simple, cooled botanical compress."
      },
      {
        name: "clean water",
        amount: "150 ml",
        why: "Brews the tea."
      }
    ],
    tools: [
      "clean cup",
      "clean cotton pads or soft cloth"
    ],
    steps: [
      "Brew the tea in about 150 ml of hot water.",
      "Allow it to cool completely.",
      "Wash your face normally.",
      "Soak a clean cotton pad or soft cloth in the cooled tea.",
      "Place it gently on the skin for a few minutes.",
      "Let the skin dry naturally or pat very gently.",
      "Continue with your normal moisturizer."
    ],
    usage: [
      "Keep the compress cool, never hot.",
      "Do not rub the skin."
    ],
    frequency: "1–3 times per week if comfortable.",
    storage: "For hygiene, make a fresh batch. If refrigerated, use within 24 hours in a clean covered container and discard afterward.",
    safety: "Patch-test first. Avoid the eyes and broken skin."
  },


  {
    id: "honey-oat-mask",
    category: "skin",
    icon: "🍯",
    title: "Soft Honey Oat Mask",
    purpose: "A simple wash-off mask for a soft, moisturized feeling.",
    evidence: "Honey is used in many cosmetic preparations, but a kitchen mask is not a medical treatment.",
    ingredients: [
      {
        name: "finely ground plain oats",
        amount: "1 tablespoon",
        why: "Provides a soft base."
      },
      {
        name: "plain honey",
        amount: "1 teaspoon",
        why: "Adds a sticky, emollient-feeling component."
      },
      {
        name: "clean water",
        amount: "a few drops if needed",
        why: "Adjusts texture."
      }
    ],
    tools: [
      "clean bowl",
      "clean spoon"
    ],
    steps: [
      "Mix the oats and honey in a clean bowl.",
      "Add a few drops of water if the mixture is too thick.",
      "Apply a thin layer to clean skin.",
      "Leave for 5–10 minutes.",
      "Rinse gently with lukewarm water.",
      "Follow with your usual moisturizer."
    ],
    usage: [
      "Do not scrub while removing it.",
      "Use only a small fresh batch."
    ],
    frequency: "About once weekly.",
    storage: "Do not save the mixed mask. Make fresh each time.",
    safety: "Do not use if you have a known honey allergy. Patch-test first. Avoid broken or irritated skin."
  },


  /* ---------------- HAIR ---------------- */

  {
    id: "rosemary-clove-mist",
    category: "hair",
    icon: "🌿",
    title: "Rosemary + Clove Scalp Mist",
    purpose: "A simple traditional scalp-care ritual. It is not a guaranteed hair-growth treatment.",
    evidence: "Rosemary and clove contain aromatic plant compounds, but evidence for homemade preparations is limited and does not establish guaranteed hair growth.",
    ingredients: [
      {
        name: "dried rosemary",
        amount: "1 teaspoon",
        why: "Provides rosemary's aromatic plant compounds."
      },
      {
        name: "whole cloves",
        amount: "2–3 cloves",
        why: "Adds a small amount of clove aroma and plant compounds."
      },
      {
        name: "clean water",
        amount: "250 ml",
        why: "Makes the light infusion."
      }
    ],
    tools: [
      "small saucepan",
      "fine strainer",
      "clean spray bottle"
    ],
    steps: [
      "Add 250 ml of water, rosemary and cloves to a small saucepan.",
      "Bring to a gentle simmer for about 5 minutes.",
      "Turn off the heat and let it cool completely.",
      "Strain very carefully.",
      "Pour into a clean spray bottle.",
      "Apply a light amount to the scalp rather than soaking the hair.",
      "Massage gently with clean fingertips."
    ],
    usage: [
      "Avoid spraying near the eyes.",
      "Do not aggressively massage or scratch the scalp.",
      "Stop if it causes itching, burning or irritation."
    ],
    frequency: "Start 1–2 times per week and see how your scalp responds.",
    storage: "This is a water-based homemade product without preservatives. Refrigerate and discard after 24–48 hours. Make a tiny fresh batch.",
    safety: "Patch-test first. Do not use on a broken, inflamed or highly irritated scalp. Do not ingest."
  },


  {
    id: "aloe-hair-mask",
    category: "hair",
    icon: "🌱",
    title: "Aloe Length Soothe",
    purpose: "A simple pre-shampoo length ritual for hair that feels dry or rough.",
    evidence: "Aloe is commonly used in cosmetic products, but homemade aloe mixtures are not proven treatments for hair loss or scalp disease.",
    ingredients: [
      {
        name: "plain fragrance-free aloe vera gel",
        amount: "1–2 tablespoons",
        why: "Adds a lightweight, water-rich conditioning feel."
      },
      {
        name: "plain conditioner you already tolerate",
        amount: "1 tablespoon",
        why: "Provides the conditioning component."
      }
    ],
    tools: [
      "clean bowl"
    ],
    steps: [
      "Mix the aloe gel and conditioner in a clean bowl.",
      "Apply mainly from mid-lengths to ends.",
      "Leave for 10–15 minutes.",
      "Rinse thoroughly.",
      "Shampoo if you prefer, especially if your hair feels coated."
    ],
    usage: [
      "Keep the mixture away from the eyes.",
      "Do not use a homemade mixture as a leave-in unless you know the ingredients are suitable for that use."
    ],
    frequency: "About once weekly.",
    storage: "Mix fresh each time. Do not store the mixture.",
    safety: "Patch-test the aloe product first. Avoid if it causes irritation."
  },


  {
    id: "oat-hair-rinse",
    category: "hair",
    icon: "🥛",
    title: "Oat Water Length Rinse",
    purpose: "A very mild rinse ritual for hair that feels dry or rough.",
    evidence: "This is a cosmetic rinse rather than a proven treatment.",
    ingredients: [
      {
        name: "plain oats",
        amount: "1 tablespoon",
        why: "Creates a light oat-infused rinse."
      },
      {
        name: "clean water",
        amount: "300 ml",
        why: "Creates the rinse."
      }
    ],
    tools: [
      "bowl",
      "fine strainer"
    ],
    steps: [
      "Soak the oats in clean water for about 10 minutes.",
      "Stir well.",
      "Strain the liquid carefully so no oat pieces remain.",
      "After shampooing, pour the rinse over the lengths.",
      "Leave for 2–3 minutes.",
      "Rinse with clean water."
    ],
    usage: [
      "Use a fresh batch.",
      "Rinse thoroughly."
    ],
    frequency: "Once weekly if your hair likes it.",
    storage: "Discard after use rather than storing.",
    safety: "Stop if scalp or skin irritation occurs."
  },


  /* ---------------- BODY ---------------- */

  {
    id: "oat-body-soak",
    category: "body",
    icon: "🛁",
    title: "Oat Bath for Soft Skin",
    purpose: "A cozy bath ritual for dry- or sensitive-feeling body skin.",
    evidence: "Oat preparations are commonly used in soothing cosmetic products.",
    ingredients: [
      {
        name: "finely ground plain oats",
        amount: "½ cup",
        why: "Creates a soft, soothing bath suspension."
      }
    ],
    tools: [
      "clean sock or muslin bag if desired"
    ],
    steps: [
      "Place the ground oats in a clean muslin bag or clean thin sock.",
      "Run a warm bath and place the oat bag under the water.",
      "Gently squeeze it a few times to release the oat water.",
      "Soak for around 10–15 minutes.",
      "Rinse the body gently with clean water.",
      "Pat dry rather than rubbing."
    ],
    usage: [
      "Use warm rather than very hot water."
    ],
    frequency: "Whenever your skin feels dry and you enjoy the ritual.",
    storage: "Do not reuse wet oats.",
    safety: "Be careful: bath surfaces can become slippery."
  },


  {
    id: "sugar-body-scrub",
    category: "body",
    icon: "🍚",
    title: "Tiny Sugar Body Polish",
    purpose: "A gentle physical exfoliation ritual for the body.",
    evidence: "Physical exfoliation can temporarily smooth the feel of skin, but over-exfoliation can irritate.",
    ingredients: [
      {
        name: "fine sugar",
        amount: "2 tablespoons",
        why: "Provides the physical exfoliating particles."
      },
      {
        name: "plain body oil",
        amount: "1 tablespoon",
        why: "Helps the scrub glide more easily."
      }
    ],
    tools: [
      "clean bowl"
    ],
    steps: [
      "Mix sugar and oil in a clean bowl.",
      "Apply to damp body skin.",
      "Use very light circular motions for a few seconds.",
      "Rinse thoroughly.",
      "Apply body moisturizer afterward."
    ],
    usage: [
      "Use only on intact body skin.",
      "Do not use on active body acne, irritated skin, freshly shaved skin or cuts."
    ],
    frequency: "At most about once weekly if your skin tolerates it.",
    storage: "Make a small fresh batch. Keep water out of the mixture.",
    safety: "Do not use on the face. Stop if irritation occurs."
  },


  /* ---------------- WELLNESS ---------------- */

  {
    id: "evening-reset",
    category: "wellness",
    icon: "🕯️",
    title: "The 10-Minute Evening Reset",
    purpose: "A cozy little ritual for winding down without needing any products.",
    evidence: "Relaxation routines can support a sense of calm, though individual effects vary.",
    ingredients: [
      {
        name: "quiet space",
        amount: "10 minutes",
        why: "Creates a small pause in the day."
      },
      {
        name: "water or tea",
        amount: "optional",
        why: "Adds a comforting ritual element."
      }
    ],
    tools: [
      "timer",
      "comfortable seat"
    ],
    steps: [
      "Put your phone on silent for 10 minutes.",
      "Take five slow breaths.",
      "Spend two minutes tidying one tiny area.",
      "Spend three minutes stretching gently.",
      "Spend the final few minutes writing one thing you liked about today.",
      "Finish by taking a sip of water."
    ],
    usage: [
      "Keep it intentionally small.",
      "Skip anything that causes pain or discomfort."
    ],
    frequency: "As often as feels supportive.",
    storage: "No storage needed.",
    safety: "This is a general wellness ritual, not medical care."
  }

];


/* =========================================================
   PERSONALIZED DIY FILTER
   ========================================================= */

function getPersonalizedDiy(category) {

  const profile = state.profile;

  if (!profile) {
    return DIY.filter(
      recipe => recipe.category === category
    ).slice(0, 3);
  }


  const recipes =
    DIY.filter(
      recipe => recipe.category === category
    );


  if (category === "skin") {

    const concerns =
      profile.skin?.concerns || [];

    if (
      profile.skin?.type === "dry" ||
      profile.skin?.sensitivity === "high" ||
      concerns.includes("dryness") ||
      concerns.includes("redness")
    ) {

      return [
        DIY.find(r => r.id === "oat-soothing-mask"),
        DIY.find(r => r.id === "green-tea-compress"),
        DIY.find(r => r.id === "honey-oat-mask")
      ].filter(Boolean);

    }

    if (
      concerns.includes("dullness") ||
      concerns.includes("darkSpots")
    ) {

      return [
        DIY.find(r => r.id === "green-tea-compress"),
        DIY.find(r => r.id === "oat-soothing-mask")
      ].filter(Boolean);

    }

  }


  if (category === "hair") {

    const concerns =
      profile.hair?.concerns || [];

    if (
      concerns.includes("dryness") ||
      concerns.includes("frizz") ||
      concerns.includes("breakage")
    ) {

      return [
        DIY.find(r => r.id === "aloe-hair-mask"),
        DIY.find(r => r.id === "oat-hair-rinse"),
        DIY.find(r => r.id === "rosemary-clove-mist")
      ].filter(Boolean);

    }

    return [
      DIY.find(r => r.id === "rosemary-clove-mist"),
      DIY.find(r => r.id === "aloe-hair-mask")
    ].filter(Boolean);

  }


  if (category === "body") {

    const concerns =
      profile.body?.concerns || [];

    if (
      concerns.includes("dryness") ||
      profile.body?.type === "dry"
    ) {

      return [
        DIY.find(r => r.id === "oat-body-soak"),
        DIY.find(r => r.id === "sugar-body-scrub")
      ].filter(Boolean);

    }

    return recipes;

  }


  return recipes.slice(0, 3);

}


/* =========================================================
   ROUTINE BUILDER
   ========================================================= */

function buildSkinRoutine() {

  if (!state.profile) return [];

  const p = state.profile;

  const routine = [];


  if (
    p.categories.includes("skin")
  ) {

    routine.push({
      id: "skin-cleanse-am",
      category: "skin",
      title: "Gentle morning cleanse",
      description:
        p.skin.type === "dry" ||
        p.skin.sensitivity === "high"
          ? "Use a gentle cleanser or simply rinse if cleansing twice feels drying."
          : "Cleanse gently without scrubbing."
    });


    if (
      p.skin.concerns.length > 0
    ) {

      const concern =
        p.skin.concerns[0];

      const treatmentName =
        getSkinTreatmentName(concern);

      routine.push({
        id: "skin-treatment-am",
        category: "skin",
        title: treatmentName,
        description:
          "Use your selected targeted product if you own or purchased one. Otherwise choose the matching DIY ritual."
      });

    }


    routine.push({
      id: "skin-moisturize-am",
      category: "skin",
      title: "Moisturize",
      description:
        "Apply a comfortable layer appropriate for your skin type."
    });


    routine.push({
      id: "skin-spf-am",
      category: "skin",
      title: "Sun protection",
      description:
        p.skin.sun === "high"
          ? "Your plan prioritizes daily broad-spectrum sunscreen because you selected high outdoor exposure."
          : "Finish with broad-spectrum sunscreen during daytime."
    });


    routine.push({
      id: "skin-cleanse-pm",
      category: "skin",
      title: "Evening cleanse",
      description:
        "Gently remove sunscreen, makeup and the day's buildup."
    });


    routine.push({
      id: "skin-moisturize-pm",
      category: "skin",
      title: "Night moisture",
      description:
        "Finish with your moisturizer and keep the evening simple."
    });

  }


  return routine;

}


function getSkinTreatmentName(concern) {

  const map = {

    acne:
      "Breakout-focused treatment",

    darkSpots:
      "Uneven-tone ritual",

    dullness:
      "Glow-focused treatment",

    dryness:
      "Hydration-focused treatment",

    oiliness:
      "Oil-control ritual",

    redness:
      "Soothing ritual",

    texture:
      "Texture-focused ritual"

  };

  return map[concern] || "Targeted skin ritual";

}


function buildHairRoutine() {

  if (!state.profile) return [];

  const p = state.profile;

  if (!p.categories.includes("hair")) {
    return [];
  }

  const wash =
    Number(p.hair.wash) || 3;

  const routine = [];


  routine.push({
    id: "hair-daily",
    category: "hair",
    title: "Gentle hair handling",
    description:
      p.hair.texture === "curly" ||
      p.hair.texture === "coily"
        ? "Minimize unnecessary brushing and handle curls gently."
        : "Detangle gently and avoid unnecessary pulling."
  });


  routine.push({
    id: "hair-wash",
    category: "hair",
    title: `${wash} wash day${wash > 1 ? "s" : ""} each week`,
    description:
      `Your plan uses the ${wash}-times-per-week wash frequency you selected.`
  });


  if (
    p.hair.concerns.includes("frizz") ||
    p.hair.concerns.includes("dryness") ||
    p.hair.concerns.includes("breakage")
  ) {

    routine.push({
      id: "hair-conditioning",
      category: "hair",
      title: "Condition the lengths",
      description:
        "Focus conditioner on the mid-lengths and ends."
    });

  }


  if (
    p.hair.concerns.includes("dandruff") ||
    p.hair.concerns.includes("thinning")
  ) {

    routine.push({
      id: "hair-scalp-care",
      category: "hair",
      title: "Scalp-care ritual",
      description:
        "Keep the scalp routine gentle. Your DIY mist is optional and is not a proven hair-growth treatment."
    });

  }


  return routine;

}


function buildBodyRoutine() {

  if (!state.profile) return [];

  const p = state.profile;

  if (!p.categories.includes("body")) {
    return [];
  }

  const routine = [

    {
      id: "body-shower",
      category: "body",
      title: "Body shower",
      description:
        "Keep water comfortably warm and avoid over-scrubbing."
    },

    {
      id: "body-moisturize",
      category: "body",
      title: "Moisturize after shower",
      description:
        "Apply body moisturizer while skin is still slightly damp."
    }

  ];


  if (
    p.body.concerns.includes("roughness") ||
    p.body.concerns.includes("ingrowns")
  ) {

    routine.push({
      id: "body-polish",
      category: "body",
      title: "Optional body polish",
      description:
        "If your skin tolerates it, use a very gentle body-only exfoliation no more than about weekly."
    });

  }


  return routine;

}


function buildWellnessRoutine() {

  if (!state.profile) return [];

  const p = state.profile;

  if (!p.categories.includes("wellness")) {
    return [];
  }

  const goals =
    p.wellness.goals || [];

  const routine = [];


  if (goals.includes("strength")) {

    routine.push({
      id: "wellness-strength",
      category: "wellness",
      title: "10-minute strength reset",
      description:
        "Try a few comfortable rounds of squats, wall push-ups and glute bridges."
    });

  }


  if (goals.includes("mobility")) {

    routine.push({
      id: "wellness-mobility",
      category: "wellness",
      title: "Gentle mobility",
      description:
        "Spend 5–10 minutes moving through comfortable neck, shoulder, hip and ankle mobility."
    });

  }


  if (goals.includes("energy")) {

    routine.push({
      id: "wellness-energy",
      category: "wellness",
      title: "Tiny energy walk",
      description:
        "Take a comfortable short walk or move around your space for a few minutes."
    });

  }


  if (goals.includes("relaxation")) {

    routine.push({
      id: "wellness-relax",
      category: "wellness",
      title: "Quiet reset",
      description:
        `Take ${Math.max(1, p.wellness.meditation)} minutes for slow breathing or quiet reflection.`
    });

  }


  if (!routine.length) {

    routine.push({
      id: "wellness-consistency",
      category: "wellness",
      title: "One tiny thing for yourself",
      description:
        "Drink some water, step outside, stretch, journal or simply rest."
    });

  }


  return routine;

}


/* =========================================================
   TODAY ROUTINE
   ========================================================= */

function getTodayRoutine() {

  if (!state.profile) {
    return [];
  }

  let tasks = [];


  if (
    state.profile.categories.includes("skin")
  ) {
    tasks.push(...buildSkinRoutine());
  }


  if (
    state.profile.categories.includes("hair")
  ) {
    tasks.push(...buildHairRoutine());
  }


  if (
    state.profile.categories.includes("body")
  ) {
    tasks.push(...buildBodyRoutine());
  }


  if (
    state.profile.categories.includes("wellness")
  ) {
    tasks.push(...buildWellnessRoutine());
  }


  const intensity =
    state.profile.preferences?.intensity || "balanced";


  if (intensity === "minimal") {
    tasks = tasks.slice(0, 7);
  }

  if (intensity === "balanced") {
    tasks = tasks.slice(0, 10);
  }

  return tasks;

}


/* =========================================================
   TASK IDS
   ========================================================= */

function taskKey(baseId) {

  return `${todayDateKey()}::${baseId}`;

}


function toggleTodayTask(baseId) {

  const id = taskKey(baseId);

  state.completed[id] =
    !state.completed[id];

  saveState();

  renderToday();

  renderPlanner();

}


/* =========================================================
   RENDER TODAY
   ========================================================= */

function renderToday() {

  if (!state.profile) {
    return;
  }

  const p = state.profile;

  $("greetingName").textContent =
    p.name || "lovely";

  const routine =
    getTodayRoutine();


  const routineContainer =
    $("todayRoutine");


  routineContainer.innerHTML = "";


  routine.forEach(task => {

    const completed =
      Boolean(
        state.completed[
          taskKey(task.id)
        ]
      );


    const article =
      document.createElement("article");

    article.className =
      `routine-item ${completed ? "done" : ""}`;


    article.innerHTML = `

      <button
        class="task-check"
        type="button"
        data-task-id="${escapeHTML(task.id)}"
        aria-label="Complete task"
      >
        ${completed ? "✓" : ""}
      </button>

      <div class="task-copy">

        <span class="task-category">
          ${escapeHTML(task.category)}
        </span>

        <strong>
          ${escapeHTML(task.title)}
        </strong>

        <small>
          ${escapeHTML(task.description)}
        </small>

      </div>

    `;


    routineContainer.appendChild(article);

  });


  if (!routine.length) {

    routineContainer.innerHTML = `
      <div class="diy-empty">
        Your garden is waiting for you to choose a chapter ♡
      </div>
    `;

  }


  const completedCount =
    routine.filter(
      task =>
        state.completed[
          taskKey(task.id)
        ]
    ).length;


  const percentage =
    routine.length
      ? Math.round(
          completedCount /
          routine.length *
          100
        )
      : 0;


  $("progressText").textContent =
    `${completedCount} / ${routine.length} completed`;

  $("todayProgress").style.width =
    `${percentage}%`;


  renderBasket();

  renderProducts();

  renderTodayDiy();

}


/* =========================================================
   BASKET
   ========================================================= */

function basketTotal() {

  return state.basket.reduce(
    (total, product) =>
      total + Number(product.price || 0),
    0
  );

}


function renderBasket() {

  const container =
    $("basketSummary");

  if (!container) return;

  if (!state.basket.length) {

    container.innerHTML = `
      <p>
        No shopping needed yet. Your DIY shelf has you covered ✦
      </p>
    `;

    return;

  }


  const total =
    basketTotal();


  container.innerHTML = `

    <strong>
      ₹${total}
    </strong>

    <span>
      ${state.basket.length}
      ${state.basket.length === 1 ? "item" : "items"}
    </span>

  `;

}


/* =========================================================
   PRODUCT CARDS
   ========================================================= */

function renderProducts() {

  const container =
    $("productRecommendations");

  if (!container) return;

  container.innerHTML = "";


  if (!state.profile) return;


  if (!state.basket.length) {

    container.innerHTML = `
      <div class="diy-empty">
        <strong>No shopping is necessary.</strong><br>
        Your plan found no suitable product within your current budget.
        Try the DIY apothecary instead ♡
      </div>
    `;

    $("budgetLabel").textContent =
      `₹0 / ₹${state.profile.budget}`;

    return;

  }


  const total =
    basketTotal();


  $("budgetLabel").textContent =
    `₹${total} / ₹${state.profile.budget}`;


  state.basket.forEach(product => {

    const card =
      document.createElement("article");

    card.className =
      "product-card";


    card.innerHTML = `

      <span class="product-tag">
        ${escapeHTML(product.category)}
      </span>

      <h4>
        ${escapeHTML(product.name)}
      </h4>

      <div class="brand">
        ${escapeHTML(product.brand)}
      </div>

      <p class="product-why">
        ${escapeHTML(product.why)}
      </p>

      <div class="product-price">

        <strong>
          ₹${product.price}
        </strong>

        <button
          type="button"
          class="product-remove"
          data-remove-product="${escapeHTML(product.id)}"
        >
          remove
        </button>

      </div>

    `;


    container.appendChild(card);

  });

}


function removeProduct(productId) {

  state.basket =
    state.basket.filter(
      product =>
        product.id !== productId
    );

  saveState();

  renderProducts();

  renderBasket();

  showToast("Removed from your little basket ♡");

}


/* =========================================================
   DIY CARDS
   ========================================================= */

function renderDiyCards(containerId, recipes) {

  const container =
    $(containerId);

  if (!container) return;

  container.innerHTML = "";


  if (!recipes.length) {

    container.innerHTML = `
      <div class="diy-empty">
        No DIY rituals are currently selected.
      </div>
    `;

    return;

  }


  recipes.forEach(recipe => {

    const card =
      document.createElement("article");

    card.className =
      "diy-card";

    card.dataset.recipeId =
      recipe.id;


    card.innerHTML = `

      <div class="diy-icon">
        ${recipe.icon}
      </div>

      <h4>
        ${escapeHTML(recipe.title)}
      </h4>

      <p>
        ${escapeHTML(recipe.purpose)}
      </p>

      <small>
        open recipe →
      </small>

    `;


    container.appendChild(card);

  });

}


function renderTodayDiy() {

  const container =
    $("todayDiy");

  if (!container) return;


  const categories =
    state.profile?.categories || [];


  let category = "wellness";

  if (categories.includes("skin")) {
    category = "skin";
  } else if (categories.includes("hair")) {
    category = "hair";
  } else if (categories.includes("body")) {
    category = "body";
  }


  const recipes =
    getPersonalizedDiy(category);


  const recipe =
    recipes[0];


  if (!recipe) {

    container.innerHTML =
      "<p>Take a tiny rest today ♡</p>";

    return;

  }


  container.innerHTML = `

    <div
      class="diy-card"
      data-recipe-id="${escapeHTML(recipe.id)}"
    >

      <div class="diy-icon">
        ${recipe.icon}
      </div>

      <h4>
        ${escapeHTML(recipe.title)}
      </h4>

      <p>
        ${escapeHTML(recipe.purpose)}
      </p>

      <small>
        open recipe →
      </small>

    </div>

  `;

}


function renderDiyPreview() {

  const recipes = [];


  if (
    state.profile?.categories.includes("skin")
  ) {

    recipes.push(
      ...getPersonalizedDiy("skin").slice(0, 2)
    );

  }


  if (
    state.profile?.categories.includes("hair")
  ) {

    recipes.push(
      ...getPersonalizedDiy("hair").slice(0, 2)
    );

  }


  if (
    state.profile?.categories.includes("body")
  ) {

    recipes.push(
      ...getPersonalizedDiy("body").slice(0, 1)
    );

  }


  renderDiyCards(
    "diyPreview",
    recipes.slice(0, 5)
  );

}


function renderCategoryDiy() {

  renderDiyCards(
    "skinDiy",
    getPersonalizedDiy("skin")
  );

  renderDiyCards(
    "hairDiy",
    getPersonalizedDiy("hair")
  );

  renderDiyCards(
    "bodyDiy",
    getPersonalizedDiy("body")
  );

}


/* =========================================================
   DIY MODAL
   ========================================================= */

function openRecipe(recipeId) {

  const recipe =
    DIY.find(
      item => item.id === recipeId
    );

  if (!recipe) return;


  const modal =
    $("recipeModal");

  const content =
    $("recipeContent");


  content.innerHTML = `

    <span class="recipe-kicker">
      home apothecary · ${escapeHTML(recipe.category)}
    </span>

    <h2 class="recipe-title">
      ${recipe.icon} ${escapeHTML(recipe.title)}
    </h2>

    <p class="recipe-purpose">
      ${escapeHTML(recipe.purpose)}
    </p>

    <div class="recipe-meta">
      <span>fresh batch</span>
      <span>simple ingredients</span>
      <span>♡ gentle ritual</span>
    </div>


    <section class="recipe-section">

      <h4>Ingredients</h4>

      <ul>

        ${recipe.ingredients.map(item => `

          <li>
            <strong>
              ${escapeHTML(item.name)}
            </strong>
            — ${escapeHTML(item.amount)}

            <br>

            <small>
              why: ${escapeHTML(item.why)}
            </small>
          </li>

        `).join("")}

      </ul>

    </section>


    <section class="recipe-section">

      <h4>What you'll need</h4>

      <ul>
        ${recipe.tools.map(tool =>
          `<li>${escapeHTML(tool)}</li>`
        ).join("")}
      </ul>

    </section>


    <section class="recipe-section">

      <h4>How to make it</h4>

      <ol>
        ${recipe.steps.map(step =>
          `<li>${escapeHTML(step)}</li>`
        ).join("")}
      </ol>

    </section>


    <section class="recipe-section">

      <h4>How to use it</h4>

      <ul>
        ${recipe.usage.map(item =>
          `<li>${escapeHTML(item)}</li>`
        ).join("")}
      </ul>

    </section>


    <section class="recipe-section">

      <h4>Frequency</h4>

      <p class="recipe-purpose">
        ${escapeHTML(recipe.frequency)}
      </p>

    </section>


    <section class="recipe-section">

      <h4>Storage</h4>

      <p class="recipe-purpose">
        ${escapeHTML(recipe.storage)}
      </p>

    </section>


    <section class="recipe-section">

      <h4>A tiny safety note ♡</h4>

      <div class="recipe-caution">
        ${escapeHTML(recipe.safety)}
      </div>

    </section>


    <section class="recipe-section">

      <h4>Evidence note</h4>

      <p class="recipe-purpose">
        ${escapeHTML(recipe.evidence)}
      </p>

    </section>

  `;


  modal.classList.remove("hidden");

  document.body.style.overflow = "hidden";

}


function closeRecipe() {

  $("recipeModal").classList.add("hidden");

  document.body.style.overflow = "";

}


/* =========================================================
   SKIN / HAIR / BODY
   ========================================================= */

function renderSkin() {

  if (!state.profile) return;

  const p = state.profile;

  $("skinIntro").textContent =
    `Your plan is based on ${p.skin.type} skin, ${p.skin.sensitivity} sensitivity, ${p.skin.climate} climate and the concerns you selected.`;

  renderRoutineList(
    "skinRoutine",
    buildSkinRoutine()
  );

}


function renderHair() {

  if (!state.profile) return;

  const p = state.profile;

  $("hairIntro").textContent =
    `Your plan is built around ${p.hair.texture} hair, a ${p.hair.scalp} scalp and washing about ${p.hair.wash} time${p.hair.wash === 1 ? "" : "s"} per week.`;

  renderRoutineList(
    "hairRoutine",
    buildHairRoutine()
  );

}


function renderBody() {

  if (!state.profile) return;

  const p = state.profile;

  $("bodyIntro").textContent =
    `Your body routine is shaped around ${p.body.type} body skin and the concerns you selected.`;


  renderRoutineList(
    "bodyRoutine",
    buildBodyRoutine()
  );


  renderWellness();

}


function renderRoutineList(
  containerId,
  routine
) {

  const container =
    $(containerId);

  if (!container) return;

  container.innerHTML = "";


  routine.forEach(task => {

    const completed =
      Boolean(
        state.completed[
          taskKey(task.id)
        ]
      );


    const article =
      document.createElement("article");

    article.className =
      `routine-item ${completed ? "done" : ""}`;


    article.innerHTML = `

      <button
        class="task-check"
        type="button"
        data-task-id="${escapeHTML(task.id)}"
      >
        ${completed ? "✓" : ""}
      </button>

      <div class="task-copy">

        <span class="task-category">
          ${escapeHTML(task.category)}
        </span>

        <strong>
          ${escapeHTML(task.title)}
        </strong>

        <small>
          ${escapeHTML(task.description)}
        </small>

      </div>

    `;


    container.appendChild(article);

  });

}


function renderWellness() {

  const container =
    $("wellnessCards");

  if (!container) return;

  const p = state.profile;

  const goals =
    p.wellness.goals || [];

  const cards = [];


  if (goals.includes("strength")) {

    cards.push({
      title: "Tiny strength ritual",
      text:
        "Try 2–3 comfortable rounds of squats, wall push-ups and glute bridges."
    });

  }


  if (goals.includes("mobility")) {

    cards.push({
      title: "Mobility minute",
      text:
        "Move gently through shoulders, hips, ankles and spine without forcing range."
    });

  }


  if (goals.includes("energy")) {

    cards.push({
      title: "Fresh-air reset",
      text:
        "A short walk, a few minutes of dancing or simply stepping outside counts."
    });

  }


  if (goals.includes("relaxation")) {

    cards.push({
      title: "Quiet mind ritual",
      text:
        `Try ${Math.max(1, p.wellness.meditation)} minutes of slow breathing or quiet sitting.`
    });

  }


  if (!cards.length) {

    cards.push({
      title: "Consistency over perfection",
      text:
        "Choose one small thing you can genuinely do today."
    });

  }


  container.innerHTML =
    cards.map(card => `

      <article class="wellness-card">

        <strong>
          ${escapeHTML(card.title)}
        </strong>

        <p>
          ${escapeHTML(card.text)}
        </p>

      </article>

    `).join("");

}


/* =========================================================
   WEEKLY PLANNER
   ========================================================= */

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];


function getWeeklyTasks(dayIndex) {

  if (!state.profile) {
    return [];
  }

  const p = state.profile;

  const tasks = [];


  if (
    p.categories.includes("skin")
  ) {

    tasks.push({
      id: `week-skin-${dayIndex}`,
      title: "skin ritual"
    });

  }


  if (
    p.categories.includes("hair")
  ) {

    const washFrequency =
      Number(p.hair.wash) || 3;

    const washDays =
      getWashDays(washFrequency);


    if (washDays.includes(dayIndex)) {

      tasks.push({
        id: `week-hair-wash-${dayIndex}`,
        title: "hair wash day"
      });

    }

  }


  if (
    p.categories.includes("body") &&
    [1, 3, 5].includes(dayIndex)
  ) {

    tasks.push({
      id: `week-body-${dayIndex}`,
      title: "body care ritual"
    });

  }


  if (
    p.categories.includes("wellness")
  ) {

    tasks.push({
      id: `week-wellness-${dayIndex}`,
      title: "wellness moment"
    });

  }


  if (
    dayIndex === 5 &&
    p.categories.includes("skin")
  ) {

    tasks.push({
      id: `week-diy-skin-${dayIndex}`,
      title: "DIY skin ritual"
    });

  }


  if (
    dayIndex === 6
  ) {

    tasks.push({
      id: `week-reset-${dayIndex}`,
      title: "weekly reset"
    });

  }


  const custom =
    state.customTasks.filter(
      task =>
        Number(task.day) === dayIndex
    );


  custom.forEach(task => {

    tasks.push({
      id: task.id,
      title: task.title
    });

  });


  return tasks;

}


function getWashDays(frequency) {

  const sets = {

    1: [6],

    2: [2, 6],

    3: [0, 3, 6],

    4: [0, 2, 4, 6],

    5: [0, 1, 3, 4, 6]

  };

  return sets[frequency] || [0, 3, 6];

}


function weekTaskKey(taskId, dayIndex) {

  return `week-${dayIndex}-${taskId}`;

}


function toggleWeekTask(taskId, dayIndex) {

  const key =
    weekTaskKey(taskId, dayIndex);

  state.completed[key] =
    !state.completed[key];

  saveState();

  renderPlanner();

}


function renderPlanner() {

  const container =
    $("weeklyPlanner");

  if (!container) return;

  container.innerHTML = "";


  const current =
    todayIndex();


  DAYS.forEach((day, index) => {

    const tasks =
      getWeeklyTasks(index);


    const card =
      document.createElement("article");

    card.className =
      `day-card ${index === current ? "today" : ""}`;


    card.innerHTML = `

      <h4>
        ${day}
      </h4>

      <small>
        ${index === current ? "today ♡" : "little rituals"}
      </small>

      <div class="day-tasks">

        ${
          tasks.length
            ? tasks.map(task => {

                const done =
                  Boolean(
                    state.completed[
                      weekTaskKey(
                        task.id,
                        index
                      )
                    ]
                  );

                return `

                  <div class="day-task ${done ? "done" : ""}">

                    <button
                      type="button"
                      data-week-task="${escapeHTML(task.id)}"
                      data-week-day="${index}"
                    >
                      ${done ? "✓" : ""}
                    </button>

                    <span>
                      ${escapeHTML(task.title)}
                    </span>

                  </div>

                `;

              }).join("")
            : `
              <div class="day-task">
                a little breathing room ♡
              </div>
            `
        }

      </div>

    `;


    container.appendChild(card);

  });

}


/* =========================================================
   CUSTOM TASKS
   ========================================================= */

function addCustomTask(event) {

  event.preventDefault();

  const input =
    $("customTaskInput");

  const day =
    $("customTaskDay").value;

  const title =
    input.value.trim();


  if (!title) {

    showToast("Write your tiny task first ♡");

    input.focus();

    return;

  }


  state.customTasks.push({

    id:
      `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`,

    title,

    day

  });


  saveState();

  input.value = "";

  renderPlanner();

  showToast("Tiny task added to your week ✦");

}


/* =========================================================
   PROFILE
   ========================================================= */

function renderProfile() {

  if (!state.profile) return;

  const p = state.profile;


  $("profileName").textContent =
    p.name || "Lovely";


  $("profileSummary").textContent =
    `${p.categories.length} glow-up chapter${p.categories.length === 1 ? "" : "s"} · ₹${p.budget} budget · ${p.preferences.intensity} routine`;


  $("profileSkin").textContent =
    `${capitalize(p.skin.type)} · ${p.skin.sensitivity} sensitivity`;


  $("profileHair").textContent =
    `${capitalize(p.hair.texture)} · ${p.hair.wash} wash${p.hair.wash === 1 ? "" : "es"}/week`;


  $("profileBudget").textContent =
    `₹${p.budget}`;


  $("profileIntensity").textContent =
    capitalize(
      p.preferences.intensity
    );

}


function capitalize(value) {

  if (!value) return "";

  return value.charAt(0).toUpperCase() +
    value.slice(1);

}


/* =========================================================
   THEME
   ========================================================= */

function setTheme(theme) {

  const allowed = [
    "rose",
    "plum",
    "sage",
    "mocha"
  ];

  if (!allowed.includes(theme)) {
    theme = "rose";
  }

  state.theme = theme;

  document.body.dataset.theme =
    theme;

  $$(".theme-choice").forEach(button => {

    button.classList.toggle(
      "active",
      button.dataset.themeChoice === theme
    );

  });

  saveState();

}


function cycleTheme() {

  const themes = [
    "rose",
    "plum",
    "sage",
    "mocha"
  ];

  const current =
    themes.indexOf(state.theme);

  const next =
    themes[
      (current + 1) %
      themes.length
    ];

  setTheme(next);

  showToast(
    `Garden mood: ${next} ✦`
  );

}


/* =========================================================
   HOME INTERACTIONS
   ========================================================= */

function setupHomeInteractions() {

  $$(".mood-btn").forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const mood =
          button.dataset.mood;

        state.mood = mood;

        $$(".mood-btn").forEach(item => {

          item.classList.remove(
            "selected"
          );

        });

        button.classList.add(
          "selected"
        );


        const responses = {

          soft:
            "Then today's garden should feel like a warm blanket and clean sheets. ☁",

          glowy:
            "A little sparkle, a little consistency, a little main-character energy. ✦",

          fresh:
            "Open a window, drink some water and let today's rituals feel light. 🌿",

          rested:
            "Rest counts. Your glow-up does not need to be exhausting. ☾"

        };


        $("moodResponse").textContent =
          responses[mood] ||
          "Your mood is welcome here ♡";


        saveState();

      }
    );

  });


  $("exploreBtn")
    .addEventListener(
      "click",
      () => {

        $("homeFeatures")
          ?.scrollIntoView({
            behavior: "smooth"
          });

      }
    );


  $$(".feature-card").forEach(card => {

    card.addEventListener(
      "click",
      () => {

        const feature =
          card.dataset.feature;


        if (feature === "routine") {

          if (state.profile) {
            showScreen("todayScreen");
          } else {
            openSetup();
          }

        }


        if (feature === "diy") {

          if (state.profile) {

            showScreen("skinScreen");

          } else {

            openSetup();

          }

        }


        if (feature === "budget") {

          if (state.profile) {

            showScreen("todayScreen");

            setTimeout(() => {

              $("productRecommendations")
                ?.scrollIntoView({
                  behavior: "smooth"
                });

            }, 200);

          } else {

            openSetup();

          }

        }


        if (feature === "planner") {

          if (state.profile) {

            showScreen("plannerScreen");

          } else {

            openSetup();

          }

        }

      }
    );

  });

}


/* =========================================================
   EVENT DELEGATION
   ========================================================= */

function setupDynamicEvents() {

  document.addEventListener(
    "click",
    event => {

      const taskButton =
        event.target.closest(
          "[data-task-id]"
        );


      if (taskButton) {

        toggleTodayTask(
          taskButton.dataset.taskId
        );

        return;

      }


      const weekButton =
        event.target.closest(
          "[data-week-task]"
        );


      if (weekButton) {

        toggleWeekTask(
          weekButton.dataset.weekTask,
          Number(
            weekButton.dataset.weekDay
          )
        );

        return;

      }


      const removeButton =
        event.target.closest(
          "[data-remove-product]"
        );


      if (removeButton) {

        removeProduct(
          removeButton.dataset.removeProduct
        );

        return;

      }


      const recipeCard =
        event.target.closest(
          "[data-recipe-id]"
        );


      if (recipeCard) {

        openRecipe(
          recipeCard.dataset.recipeId
        );

      }

    }
  );

}


/* =========================================================
   RENDER EVERYTHING
   ========================================================= */

function renderAll() {

  if (!state.profile) {
    return;
  }

  setTheme(
    state.theme || "rose"
  );

  renderToday();

  renderSkin();

  renderHair();

  renderBody();

  renderCategoryDiy();

  renderDiyPreview();

  renderPlanner();

  renderProfile();

}


/* =========================================================
   RESET
   ========================================================= */

function resetGarden() {

  const confirmed =
    window.confirm(
      "Reset your entire Glow Garden? Your saved profile, progress and custom tasks will be removed from this browser."
    );


  if (!confirmed) {
    return;
  }


  try {

    localStorage.removeItem(
      STORAGE_KEY
    );

  } catch (error) {

    console.warn(error);

  }


  state = {

    profile: null,
    completed: {},
    customTasks: [],
    basket: [],
    theme: "rose",
    mood: null

  };


  setTheme("rose");

  showScreen("homeScreen");

  showToast(
    "Your garden has been freshly reset ♡"
  );

}


/* =========================================================
   DATE DISPLAY
   ========================================================= */

function renderDates() {

  const now =
    new Date();

  const day =
    now.toLocaleDateString(
      "en-IN",
      { weekday: "long" }
    );

  const month =
    now.toLocaleDateString(
      "en-IN",
      { month: "long" }
    );

  const date =
    String(
      now.getDate()
    ).padStart(2, "0");


  if ($("homeDay")) {
    $("homeDay").textContent = date;
  }

  if ($("homeWeekday")) {
    $("homeWeekday").textContent = day;
  }

  if ($("todayWeekday")) {
    $("todayWeekday").textContent = day;
  }

  if ($("todayDate")) {
    $("todayDate").textContent = date;
  }

  if ($("todayMonth")) {
    $("todayMonth").textContent = month;
  }


  const messages = [
    "Let's make today feel a little softer.",
    "Tiny rituals. No pressure. Just you.",
    "Your only job today is to take a little care.",
    "A soft reset is still a reset.",
    "You deserve routines that feel lovely, not punishing."
  ];


  if ($("dailyMessage")) {

    $("dailyMessage").textContent =
      messages[
        now.getDate() %
        messages.length
      ];

  }

}


/* =========================================================
   BUTTON SETUP
   ========================================================= */

function setupButtons() {

  /*
    IMPORTANT:
    These are intentionally explicit handlers.
    The home button does NOT rely on fragile delegation.
  */

  $("startBtn")
    ?.addEventListener(
      "click",
      openSetup
    );


  $("brandHomeBtn")
    ?.addEventListener(
      "click",
      goHome
    );


  $("nextBtn")
    ?.addEventListener(
      "click",
      nextStep
    );


  $("prevBtn")
    ?.addEventListener(
      "click",
      previousStep
    );


  $("profileForm")
    ?.addEventListener(
      "submit",
      event => {

        event.preventDefault();

        finishSetup();

      }
    );


  $("themeBtn")
    ?.addEventListener(
      "click",
      cycleTheme
    );


  $("openRecommendationsBtn")
    ?.addEventListener(
      "click",
      () => {

        $("productRecommendations")
          ?.scrollIntoView({
            behavior: "smooth"
          });

      }
    );


  $("openDiyBtn")
    ?.addEventListener(
      "click",
      () => {

        $("diyPreview")
          ?.scrollIntoView({
            behavior: "smooth"
          });

      }
    );


  $("seeAllDiyBtn")
    ?.addEventListener(
      "click",
      () => {

        const firstCategory =
          state.profile?.categories
            ?.find(category =>
              ["skin", "hair", "body"]
                .includes(category)
            );

        if (firstCategory === "hair") {
          showScreen("hairScreen");
        } else if (firstCategory === "body") {
          showScreen("bodyScreen");
        } else {
          showScreen("skinScreen");
        }

      }
    );


  $("editProfileBtn")
    ?.addEventListener(
      "click",
      openSetup
    );


  $("resetBtn")
    ?.addEventListener(
      "click",
      resetGarden
    );


  $("closeModalBtn")
    ?.addEventListener(
      "click",
      closeRecipe
    );


  $("modalBackdrop")
    ?.addEventListener(
      "click",
      closeRecipe
    );


  $("customTaskForm")
    ?.addEventListener(
      "submit",
      addCustomTask
    );


  $$(".nav-btn").forEach(button => {

    button.addEventListener(
      "click",
      () => {

        if (!state.profile) {

          showToast(
            "Create your little garden first ♡"
          );

          openSetup();

          return;

        }

        showScreen(
          button.dataset.screen
        );

      }
    );

  });


  $$(".theme-choice").forEach(button => {

    button.addEventListener(
      "click",
      () => {

        setTheme(
          button.dataset.themeChoice
        );

        showToast(
          "Your garden has a new little mood ✦"
        );

      }
    );

  });

}


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initialize() {

  loadState();

  renderDates();

  setupButtons();

  setupHomeInteractions();

  setupDynamicEvents();

  setTheme(
    state.theme || "rose"
  );


  if (state.profile) {

    state.basket =
      chooseProducts(
        state.profile,
        state.profile.budget
      ).filter(
        recommended =>
          state.basket.some(
            existing =>
              existing.id === recommended.id
          )
      ).length
        ? state.basket
        : chooseProducts(
            state.profile,
            state.profile.budget
          );


    saveState();

    renderAll();

    showScreen("todayScreen");

  } else {

    showScreen("homeScreen");

  }

}


/* =========================================================
   DOM READY
   ========================================================= */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initialize
  );

} else {

  initialize();

    }
