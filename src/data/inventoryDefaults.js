// src/data/inventoryDefaults.js
// Default kitchen inventory seeded on first load.
// The system reads this ONLY if localStorage has no "sk_inventory" key.
// Admins can add/edit/delete — those changes persist in localStorage and
// this file is never re-read again, so custom values are never overwritten.

export const DEFAULT_INVENTORY = [
  // ── FOOD INGREDIENTS ─────────────────────────────────────────────────────
  { id: "inv_001", name: "Rice",          category: "Food Ingredients", qty: 50,  unit: "kg",     minThreshold: 10 },
  { id: "inv_002", name: "Beans",         category: "Food Ingredients", qty: 20,  unit: "kg",     minThreshold: 5  },
  { id: "inv_003", name: "Vegetable Oil", category: "Food Ingredients", qty: 15,  unit: "liters", minThreshold: 3  },
  { id: "inv_004", name: "Palm Oil",      category: "Food Ingredients", qty: 10,  unit: "liters", minThreshold: 2  },
  { id: "inv_005", name: "Chicken",       category: "Food Ingredients", qty: 30,  unit: "kg",     minThreshold: 5  },
  { id: "inv_006", name: "Beef",          category: "Food Ingredients", qty: 20,  unit: "kg",     minThreshold: 5  },
  { id: "inv_007", name: "Fish",          category: "Food Ingredients", qty: 15,  unit: "kg",     minThreshold: 3  },
  { id: "inv_008", name: "Pepper",        category: "Food Ingredients", qty: 8,   unit: "kg",     minThreshold: 2  },
  { id: "inv_009", name: "Onion",         category: "Food Ingredients", qty: 10,  unit: "kg",     minThreshold: 3  },
  { id: "inv_010", name: "Tomato",        category: "Food Ingredients", qty: 12,  unit: "kg",     minThreshold: 3  },
  { id: "inv_011", name: "Salt",          category: "Food Ingredients", qty: 5,   unit: "kg",     minThreshold: 1  },
  { id: "inv_012", name: "Seasoning",     category: "Food Ingredients", qty: 2,   unit: "kg",     minThreshold: 0.5},
  { id: "inv_013", name: "Flour",         category: "Food Ingredients", qty: 15,  unit: "kg",     minThreshold: 3  },

  // ── PACKAGING ────────────────────────────────────────────────────────────
  { id: "inv_020", name: "Takeaway Packs",  category: "Packaging", qty: 200, unit: "pieces", minThreshold: 30 },
  { id: "inv_021", name: "Nylon Bags",      category: "Packaging", qty: 300, unit: "pieces", minThreshold: 50 },
  { id: "inv_022", name: "Plastic Plates",  category: "Packaging", qty: 150, unit: "pieces", minThreshold: 20 },
  { id: "inv_023", name: "Spoons/Forks",   category: "Packaging", qty: 200, unit: "pieces", minThreshold: 30 },

  // ── DAIRY / DRINK INGREDIENTS ─────────────────────────────────────────────
  { id: "inv_030", name: "Milk",         category: "Dairy & Drinks", qty: 10,  unit: "liters", minThreshold: 2  },
  { id: "inv_031", name: "Yogurt Base",  category: "Dairy & Drinks", qty: 8,   unit: "liters", minThreshold: 2  },
  { id: "inv_032", name: "Sugar",        category: "Dairy & Drinks", qty: 10,  unit: "kg",     minThreshold: 2  },
  { id: "inv_033", name: "Flavoring",    category: "Dairy & Drinks", qty: 2,   unit: "liters", minThreshold: 0.5},

  // ── FRUIT JUICE INGREDIENTS ──────────────────────────────────────────────
  { id: "inv_040", name: "Orange",     category: "Fruit Juice", qty: 40,  unit: "pieces", minThreshold: 10 },
  { id: "inv_041", name: "Pineapple",  category: "Fruit Juice", qty: 20,  unit: "pieces", minThreshold: 5  },
  { id: "inv_042", name: "Watermelon", category: "Fruit Juice", qty: 5,   unit: "pieces", minThreshold: 2  },
  { id: "inv_043", name: "Apple",      category: "Fruit Juice", qty: 30,  unit: "pieces", minThreshold: 5  },
  { id: "inv_044", name: "Mango",      category: "Fruit Juice", qty: 25,  unit: "pieces", minThreshold: 5  },
  { id: "inv_045", name: "Ginger",     category: "Fruit Juice", qty: 3,   unit: "kg",     minThreshold: 0.5},
  { id: "inv_046", name: "Lemon",      category: "Fruit Juice", qty: 20,  unit: "pieces", minThreshold: 5  },

  // ── EXTRAS ───────────────────────────────────────────────────────────────
  { id: "inv_050", name: "Ice",     category: "Extras", qty: 20,  unit: "kg",     minThreshold: 5  },
  { id: "inv_051", name: "Cups",    category: "Extras", qty: 200, unit: "pieces", minThreshold: 30 },
  { id: "inv_052", name: "Bottles", category: "Extras", qty: 100, unit: "pieces", minThreshold: 20 },
  { id: "inv_053", name: "Straws",  category: "Extras", qty: 300, unit: "pieces", minThreshold: 50 },
];

// ── DRINK → INGREDIENT MAPPING ───────────────────────────────────────────────
// When a drink order is confirmed, these ingredients are decremented per unit.
// Quantities here represent usage per 1 drink serving.
export const DRINK_INGREDIENT_MAP = {
  "Pineapple Delight": [
    { id: "inv_041", qty: 0.5 }, // half a pineapple
    { id: "inv_032", qty: 0.05 }, // 50g sugar
    { id: "inv_051", qty: 1 },    // 1 cup
  ],
  "Orange Juice": [
    { id: "inv_040", qty: 3 },    // 3 oranges
    { id: "inv_032", qty: 0.03 }, // 30g sugar
    { id: "inv_051", qty: 1 },
  ],
  "Fresh Yogurt Drink": [
    { id: "inv_031", qty: 0.25 }, // 250ml yogurt base
    { id: "inv_030", qty: 0.1 },  // 100ml milk
    { id: "inv_032", qty: 0.02 }, // 20g sugar
    { id: "inv_033", qty: 0.01 }, // 10ml flavoring
    { id: "inv_051", qty: 1 },
  ],
  "Tigernut Drink": [
    { id: "inv_030", qty: 0.2 },
    { id: "inv_032", qty: 0.03 },
    { id: "inv_051", qty: 1 },
  ],
  "Zobo Drink": [
    { id: "inv_045", qty: 0.05 }, // ginger
    { id: "inv_032", qty: 0.03 },
    { id: "inv_051", qty: 1 },
  ],
  "Sweet Mint Green": [
    { id: "inv_032", qty: 0.02 },
    { id: "inv_033", qty: 0.01 },
    { id: "inv_051", qty: 1 },
  ],
  "Glowrite": [
    { id: "inv_044", qty: 0.5 }, // mango
    { id: "inv_046", qty: 1 },   // lemon
    { id: "inv_032", qty: 0.02 },
    { id: "inv_051", qty: 1 },
  ],
  "Founder's Special": [
    { id: "inv_043", qty: 1 },   // apple
    { id: "inv_044", qty: 0.5 }, // mango
    { id: "inv_046", qty: 0.5 }, // lemon
    { id: "inv_032", qty: 0.03 },
    { id: "inv_051", qty: 1 },
  ],
};

// ── SUGGESTED MARKET PRICES (₦) ──────────────────────────────────────────────
export const SUGGESTED_PRICES = {
  "Rice":           1200,  "Beans":         800,  "Vegetable Oil":  3500,
  "Palm Oil":       2500,  "Chicken":       4500, "Beef":           4000,
  "Fish":           3500,  "Pepper":        1000, "Onion":          600,
  "Tomato":         800,   "Salt":          400,  "Seasoning":      1500,
  "Flour":          1000,  "Takeaway Packs":2000, "Nylon Bags":     500,
  "Plastic Plates": 1500,  "Spoons/Forks":  1000, "Milk":           1500,
  "Yogurt Base":    2000,  "Sugar":         800,  "Flavoring":      1200,
  "Orange":         200,   "Pineapple":     400,  "Watermelon":     2000,
  "Apple":          300,   "Mango":         250,  "Ginger":         500,
  "Lemon":          150,   "Ice":           500,  "Cups":           1000,
  "Bottles":        2000,  "Straws":        300,
};

export const INVENTORY_CATEGORIES = [
  "Food Ingredients",
  "Packaging",
  "Dairy & Drinks",
  "Fruit Juice",
  "Extras",
  "Other",
];

export const MARKET_CATEGORIES = ["Food", "Packaging", "Supplies", "Other"];
