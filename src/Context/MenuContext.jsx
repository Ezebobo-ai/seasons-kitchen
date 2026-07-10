import React, { createContext, useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";

// ─── HARDCODED SEED DATA ───────────────────────────────────────────────────
const SEED_MENU = [
  // Breakfast
  { id: 301, category: "Breakfast", name: "Akara", price: 3500, image: "/akara.jpeg", description: "Crispy deep-fried bean cakes, golden on the outside and fluffy within. A beloved Nigerian breakfast staple.", quantityAvailable: 20 },
  { id: 302, category: "Breakfast", name: "Custard", price: 3000, image: "/cus.jpeg", description: "Smooth, creamy custard served warm. A light and comforting way to start your morning.", quantityAvailable: 20 },
  { id: 303, category: "Breakfast", name: "Oat", price: 3000, image: "/J&R.jpeg", description: "Hearty oatmeal porridge, rich in fibre. Naturally filling and great for sustained energy.", quantityAvailable: 20 },
  { id: 304, category: "Breakfast", name: "Tea", price: 3000, image: "/J&R.jpeg", description: "Hot brewed tea, served fresh. Choose your strength — perfect with a slice of bread.", quantityAvailable: 20 },
  { id: 305, category: "Breakfast", name: "Vegetable Noodles", price: 3000, image: "/vn.jpeg", description: "Stir-fried noodles packed with fresh vegetables. A quick, nutritious breakfast option.", quantityAvailable: 20 },
  { id: 306, category: "Breakfast", name: "Tea & Bread", price: 3000, image: "/J&R.jpeg", description: "Classic hot tea paired with soft sliced bread. Simple, satisfying, and always dependable.", quantityAvailable: 20 },

  // Rice & Pasta
  { id: 1, category: "Rice & Pasta", name: "Jollof Rice", price: 3000, image: "/J&R.jpeg", description: "West Africa's most beloved dish — smoky, richly spiced tomato rice cooked to perfection in a pot.", quantityAvailable: 25 },
  { id: 2, category: "Rice & Pasta", name: "Fried Rice", price: 4000, image: "/fried rice.jpeg", description: "Wok-tossed rice with mixed vegetables, seasoned and stir-fried to a beautiful golden colour.", quantityAvailable: 25 },
  { id: 3, category: "Rice & Pasta", name: "White Rice", price: 2675, image: "/Rice.jpeg", description: "Plain steamed long-grain rice, fluffy and soft. Pairs perfectly with any stew or sauce.", quantityAvailable: 30 },
  { id: 4, category: "Rice & Pasta", name: "Stir Fry Pasta", price: 5000, image: "/pasta.jpeg", description: "Al dente pasta tossed in a savoury stir-fry sauce with vegetables and seasoning.", quantityAvailable: 15 },
  { id: 5, category: "Rice & Pasta", name: "Vegetable Noodles", price: 4000, image: "/vegetable_noodles.jpg", description: "Silky noodles stir-fried with fresh garden vegetables in a light, flavourful sauce.", quantityAvailable: 20 },
  { id: 6, category: "Rice & Pasta", name: "Beans & Rice", price: 4500, image: "/beans_rice.jpg", description: "A classic combo of well-seasoned beans served alongside freshly steamed white rice.", quantityAvailable: 20 },

  // Special Meal
  { id: 7, category: "Special Meal", name: "Boiled Yam", price: 3000, image: "/yam.jpeg", description: "Tender chunks of yam boiled to the perfect softness. Best served with egg sauce or stew.", quantityAvailable: 20 },
  { id: 8, category: "Special Meal", name: "Porridge Yam", price: 7500, image: "/porridge_yam.jpg", description: "Creamy yam porridge cooked with palm oil, crayfish, and spices. A deeply comforting meal.", quantityAvailable: 10 },
  { id: 9, category: "Special Meal", name: "Egg Sauce", price: 3000, image: "/egg.jpeg", description: "Scrambled eggs simmered in a rich tomato and pepper sauce. Great with yam, rice, or bread.", quantityAvailable: 20 },
  { id: 10, category: "Special Meal", name: "Boiled Irish", price: 3000, image: "/boiled_irish.jpg", description: "Simply boiled Irish potatoes, soft and wholesome. Light on the stomach, heavy on satisfaction.", quantityAvailable: 20 },
  { id: 11, category: "Special Meal", name: "Yamarita", price: 5500, image: "/yamarita.jpg", description: "Yam coated in a spiced egg batter and deep-fried until golden. Crispy outside, fluffy inside.", quantityAvailable: 15 },
  { id: 12, category: "Special Meal", name: "Porridge Plantain", price: 5000, image: "/porridge_plantain.jpg", description: "Ripe plantains cooked down into a thick, flavourful porridge with palm oil and seasonings.", quantityAvailable: 15 },
  { id: 299, category: "Special Meal", name: "Turkey Pepper Soup", price: 9500, image: "/Turkey pepper soup.jpeg", description: "Aromatic pepper soup made with succulent turkey cuts and a blend of native spices. Warming and bold.", quantityAvailable: 10 },
  { id: 32, category: "Special Meal", name: "Chicken Sandwich", price: 4500, image: "/Chicken Sandwich.jpeg", description: "Grilled seasoned chicken breast nestled in toasted bread with crisp lettuce and sauce.", quantityAvailable: 15 },
  { id: 33, category: "Special Meal", name: "Fruit Salad", price: 4220, image: "/Fruit salad.jpeg", description: "A colourful medley of fresh seasonal fruits, lightly dressed and chilled. Refreshing and vibrant.", quantityAvailable: 10 },
  { id: 30, category: "Special Meal", name: "Club Sandwich", price: 5000, image: "/Club sandwich.jpeg", description: "Triple-decker toasted sandwich stacked with chicken, egg, lettuce, tomato, and creamy spread.", quantityAvailable: 10 },

  // Sides
  { id: 13, category: "Sides", name: "Fried Plantain", price: 1500, image: "/plan.jpeg", description: "Sweet ripe plantain slices fried to a caramelised, tender perfection. The ultimate side dish.", quantityAvailable: 30 },
  { id: 14, category: "Sides", name: "French Fries", price: 3000, image: "/french_fries.jpg.jpeg", description: "Crispy golden potato fries seasoned with a house spice blend. Always a crowd favourite.", quantityAvailable: 25 },
  { id: 15, category: "Sides", name: "Coleslaw", price: 1500, image: "/coleslaw.jpeg", description: "Creamy, lightly tangy coleslaw made with fresh shredded cabbage and carrots.", quantityAvailable: 25 },
  { id: 16, category: "Sides", name: "Omelette", price: 1500, image: "/omelette.jpg", description: "Fluffy egg omelette seasoned with onions and peppers. A simple protein-rich side.", quantityAvailable: 20 },
  { id: 17, category: "Sides", name: "Pepper Sauce", price: 2000, image: "/pepper_sauce.jpg", description: "A bold, fiery blend of peppers and tomatoes, slow-cooked into a rich, deep sauce.", quantityAvailable: 20 },
  { id: 31, category: "Sides", name: "Chicken Salad", price: 10000, image: "/Chicken salad.jpeg", description: "Grilled chicken pieces tossed with fresh greens, vegetables, and a light dressing.", quantityAvailable: 10 },

  // Swallow & Soups
  { id: 18, category: "Swallow & Soups", name: "Poundo", price: 3000, image: "/pound.jpeg", description: "Smooth, stretchy pounded yam substitute made from poundo flour. Pairs with any Nigerian soup.", quantityAvailable: 20 },
  { id: 19, category: "Swallow & Soups", name: "Semo", price: 7500, image: "/se.jpeg", description: "Light semolina swallow with a soft, smooth texture. A versatile base for all soups.", quantityAvailable: 15 },
  { id: 20, category: "Swallow & Soups", name: "Eba", price: 3000, image: "/Eba.jpeg", description: "Classic garri swallow with a firm, satisfying texture. The heartbeat of Nigerian home cooking.", quantityAvailable: 20 },
  { id: 21, category: "Swallow & Soups", name: "Vegetable Soup", price: 4000, image: "/vegetable soup.jpeg", description: "Rich, dark green leafy vegetable soup with assorted meat and fish, cooked in palm oil.", quantityAvailable: 15 },

  // Soup Bowls
  { id: 201, category: "Soup Bowls", name: "Okra Soup Bowl (3ltrs)", price: 20000, image: "/okoro.jpeg", description: "A generous 3-litre pot of thick, slimy okra soup with fish and assorted proteins.", quantityAvailable: 5 },
  { id: 202, category: "Soup Bowls", name: "Ogbono Soup Bowl (3ltrs)", price: 20000, image: "/ogbono.jpeg", description: "Silky, draw-style ogbono soup with an earthy richness, packed with meat and crayfish.", quantityAvailable: 5 },
  { id: 203, category: "Soup Bowls", name: "Egusi Soup Bowl (3ltrs)", price: 20000, image: "/Egusi.jpeg", description: "Thick, nutty egusi (melon seed) soup in palm oil with assorted meats. 3 litres of pure comfort.", quantityAvailable: 5 },
  { id: 204, category: "Soup Bowls", name: "Oha Soup Bowl (3ltrs)", price: 30000, image: "/oha.jpeg", description: "Delicate oha leaf soup with cocoyam thickener and rich proteins. A true Eastern Nigerian classic.", quantityAvailable: 5 },
  { id: 205, category: "Soup Bowls", name: "Ofada Stew Bowl (3ltrs)", price: 25000, image: "/ofa.jpeg", description: "Pungent, complex ofada stew with unripe peppers, locust beans, and assorted offal.", quantityAvailable: 5 },
  { id: 206, category: "Soup Bowls", name: "Chicken Stew Bowl (3ltrs)", price: 37000, image: "/stew.jpeg", description: "A rich tomato-based chicken stew, slow-cooked and deeply seasoned. 3 litres, pure joy.", quantityAvailable: 5 },
  { id: 207, category: "Soup Bowls", name: "White Soup Bowl (3ltrs)", price: 50000, image: "/ws.jpeg", description: "Creamy, delicate nsala (white soup) with fresh fish and aromatic utazi leaf. Premium and flavourful.", quantityAvailable: 3 },

  // Snacks
  { id: 34, category: "Snacks", name: "Meat Pie", price: 1000, image: "/Meat pea.jpg", description: "Flaky, golden pastry filled with seasoned minced meat, potatoes, and carrots. A Nigerian classic snack.", quantityAvailable: 30 },

  // Customer's Delight
  { id: 37, category: "Customer's Delight", name: "Yam and Egg Sauce", price: 1000, image: "/yam.jpeg", description: "A beloved combination — soft boiled yam served alongside a rich, spiced egg sauce.", quantityAvailable: 20 },

  // Drinks
  { id: 22, category: "Drinks", name: "Tigernut Drink", price: 1500, image: "/Tigernut.jpeg", description: "Naturally sweet, creamy tigernut milk — a probiotic-rich traditional Nigerian refreshment.", quantityAvailable: 20,
    sizes: [{ label: "250ml", volume: 250, price: 1500, stock: 12 }, { label: "500ml", volume: 500, price: 2500, stock: 8 }] },
  { id: 23, category: "Drinks", name: "Zobo Drink", price: 1500, image: "/Zobo.jpeg", description: "Deep ruby hibiscus drink infused with ginger, cloves, and citrus. Refreshing and antioxidant-rich.", quantityAvailable: 20,
    sizes: [{ label: "250ml", volume: 250, price: 1500, stock: 12 }, { label: "500ml", volume: 500, price: 2500, stock: 8 }] },
  { id: 24, category: "Drinks", name: "Pineapple Delight", price: 1500, image: "/Pineapple.jpeg", description: "Fresh pineapple blended into a smooth, tropical drink with a naturally sweet-tart balance.", quantityAvailable: 15,
    sizes: [{ label: "250ml", volume: 250, price: 1500, stock: 9 }, { label: "500ml", volume: 500, price: 2500, stock: 6 }] },
  { id: 25, category: "Drinks", name: "Orange Juice", price: 2250, image: "/Orange.jpeg", description: "Freshly squeezed orange juice, vibrant and packed with Vitamin C. Pure and unadulterated.", quantityAvailable: 15,
    sizes: [{ label: "250ml", volume: 250, price: 2250, stock: 9 }, { label: "500ml", volume: 500, price: 4000, stock: 6 }] },
  { id: 26, category: "Drinks", name: "Founder's Special", price: 2532, image: "/Special.jpeg", description: "Our signature house blend — a unique fusion of seasonal fruits and herbs. A chef's secret recipe.", quantityAvailable: 10,
    sizes: [{ label: "250ml", volume: 250, price: 2532, stock: 6 }, { label: "500ml", volume: 500, price: 4000, stock: 4 }] },
  { id: 27, category: "Drinks", name: "Fresh Yogurt Drink", price: 3375, image: "/Yogurt.jpeg", description: "Smooth, creamy homemade yogurt drink with a gentle tang. Probiotic and satisfying.", quantityAvailable: 10,
    sizes: [{ label: "350ml", volume: 350, price: 3375, stock: 6 }, { label: "500ml", volume: 500, price: 7000, stock: 4 }] },
  { id: 28, category: "Drinks", name: "Sweet Mint Green", price: 2500, image: "/Sweet.jpeg", description: "Cool, refreshing mint-infused green drink with a light sweetness. Great for digestion.", quantityAvailable: 10,
    sizes: [{ label: "250ml", volume: 250, price: 2500, stock: 6 }, { label: "500ml", volume: 500, price: 4000, stock: 4 }] },
  { id: 29, category: "Drinks", name: "Glowrite", price: 2813, image: "/Glowrite.jpeg", description: "A luminous wellness drink crafted from seasonal botanicals. Bright, light, and revitalising.", quantityAvailable: 10,
    sizes: [{ label: "250ml", volume: 250, price: 2813, stock: 6 }, { label: "500ml", volume: 500, price: 4500, stock: 4 }] },
];

const DEFAULT_SIZE_STOCK = 20;

export const CATEGORIES = [
  "Breakfast",
  "Rice & Pasta",
  "Special Meal",
  "Sides",
  "Swallow & Soups",
  "Soup Bowls",
  "Drinks",
  "Snacks",
  "Customer's Delight",
  "Promotion",
];

// ─── FIRESTORE DOC REF ────────────────────────────────────────────────────
const ADMIN_REF = () => doc(db, "settings", "admin");

// ─── SANITIZE: strip undefined from any nested object/array ──────────────
// Must run on EVERY value before it touches Firestore.
function cleanForFirestore(obj) {
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanForFirestore(v)])
    );
  }
  return obj;
}

// ─── MIGRATE: ensure every stored item has required fields ───────────────
// Runs on data coming FROM Firestore so the app always sees a complete shape.
// Also restores sizes to known drinks that were saved before sizes were added.
function migrateMenu(parsed) {
  const sizesById = {};
  SEED_MENU.forEach((s) => { if (s.sizes) sizesById[s.id] = s.sizes; });

  return parsed.map((item) => {
    // Restore sizes from seed if item is a known drink and has none stored
    const restoredSizes =
      !item.sizes && sizesById[item.id] ? sizesById[item.id] : undefined;
    const sizes = item.sizes || restoredSizes;
    const quantityAvailable =
      item.quantityAvailable !== undefined ? item.quantityAvailable : 20;

    if (Array.isArray(sizes)) {
      const migratedSizes = sizes.map((s) => ({
        ...s,
        stock: s.stock !== undefined ? Number(s.stock) : DEFAULT_SIZE_STOCK,
      }));
      return {
        ...item,
        sizes: migratedSizes,
        quantityAvailable: migratedSizes.reduce(
          (sum, s) => sum + (Number(s.stock) || 0),
          0
        ),
      };
    }

    return { ...item, quantityAvailable };
  });
}

// ─── CONTEXT ──────────────────────────────────────────────────────────────
export const MenuContext = createContext();

export function MenuProvider({ children }) {
  const [menuItems, setMenuItems] = useState(SEED_MENU);

  // Live categories from Firestore — falls back to the hardcoded CATEGORIES
  // constant if the document hasn't been customized yet (first deploy, no
  // admin changes). This means the customer order page and admin form always
  // show the same list, and any changes the admin makes are immediately
  // visible everywhere with no extra code or page refresh.
  const [categories, setCategories] = useState(CATEGORIES);

  // Ref so async functions always read the LATEST menu without stale closure.
  const menuRef = useRef(menuItems);
  useEffect(() => { menuRef.current = menuItems; }, [menuItems]);

  // ── FIX 1: Single source of truth via onSnapshot ─────────────────────────
  // onSnapshot is the ONLY place that calls setMenuItems for remote data.
  // All write helpers (persist, addMenuItem, etc.) ONLY write to Firestore;
  // onSnapshot picks up the change and updates React state automatically.
  // This eliminates double-setMenuItems races and stale-closure overwrites.
  // categories is read from the same document — one listener, two fields.
  useEffect(() => {
    const ref = ADMIN_REF();
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        // ── menu ──────────────────────────────────────────────────────────
        if (Array.isArray(data.menu)) {
          setMenuItems(migrateMenu(data.menu));
        } else {
          // First run — seed menu. onSnapshot will fire again with the data.
          const safe = cleanForFirestore(SEED_MENU);
          setDoc(ref, { menu: safe }, { merge: true }).catch(console.error);
        }
        // ── categories ────────────────────────────────────────────────────
        // If the document has a categories array, use it; otherwise keep the
        // hardcoded CATEGORIES fallback so the app works on first deploy.
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategories(data.categories);
        }
      } else {
        // Brand-new project — seed both menu and categories.
        const safe = cleanForFirestore(SEED_MENU);
        setDoc(ref, { menu: safe }, { merge: true }).catch(console.error);
      }
    }, (err) => {
      console.error("[MenuContext] onSnapshot error:", err);
    });
    return () => unsub();
  }, []);

  
  const persist = async (items) => {
    const safe = cleanForFirestore(items);
    // Optimistic local update so the UI feels instant.
    setMenuItems(safe);
    try {
      await setDoc(ADMIN_REF(), { menu: safe }, { merge: true });
    } catch (err) {
      console.error("[MenuContext] persist failed:", err);
      // Roll back to the last known-good state from the ref.
      setMenuItems(menuRef.current);
      throw err;
    }
  };

  
  const addMenuItem = async (item) => {
    const isDrink = item.category === "Drinks";
    const hasSizes =
      isDrink && Array.isArray(item.sizes) && item.sizes.length > 0;

    const sizesWithStock = hasSizes
      ? item.sizes.map((s) => ({
          label: `${Number(s.ml)}ml`,
          volume: Number(s.ml),
          price: Number(s.price),
          stock: Number(s.stock) || DEFAULT_SIZE_STOCK,
        }))
      : null;

    const basePrice = hasSizes
      ? Math.min(...sizesWithStock.map((s) => s.price))
      : Number(item.price) || 0;

    // Build the new item with ONLY known safe fields — never spread raw form data.
    const newItem = {
      id: Date.now(),
      name: String(item.name || "").trim(),
      category: String(item.category || ""),
      description: String(item.description || "").trim(),
      image: String(item.image || ""),
      price: basePrice,
      quantityAvailable: hasSizes
        ? sizesWithStock.reduce((sum, s) => sum + s.stock, 0)
        : Number(item.quantityAvailable) || 20,
    };
    if (hasSizes) newItem.sizes = sizesWithStock;

    // Always fetch the latest from Firestore so we append to the real current list.
    const ref = ADMIN_REF();
    let snap;
    try {
      snap = await getDoc(ref);
    } catch (err) {
      console.error("[MenuContext] addMenuItem: failed to read Firestore:", err);
      throw err;
    }

    const existingMenu =
      snap.exists() && Array.isArray(snap.data().menu)
        ? migrateMenu(snap.data().menu) // FIX: migrate existing items before re-saving
        : migrateMenu(SEED_MENU);       // FIX: never fall back to stale React state

    // Prepend new item and sanitize the whole array before writing.
    const nextMenu = cleanForFirestore([newItem, ...existingMenu]);

    try {
      await setDoc(ref, { menu: nextMenu }, { merge: true });
      // Do NOT call setMenuItems here — onSnapshot handles it.
    } catch (err) {
      console.error("[MenuContext] addMenuItem: Firestore write failed:", err);
      throw err;
    }
  };

  // ── FIX 4: updateMenuItem — same server-read pattern as addMenuItem ───────
  const updateMenuItem = async (id, updated) => {
    const isDrink = updated.category === "Drinks";
    const hasSizes =
      isDrink && Array.isArray(updated.sizes) && updated.sizes.length > 0;

    const ref = ADMIN_REF();
    let snap;
    try {
      snap = await getDoc(ref);
    } catch (err) {
      console.error("[MenuContext] updateMenuItem: failed to read Firestore:", err);
      throw err;
    }

    const currentMenu =
      snap.exists() && Array.isArray(snap.data().menu)
        ? migrateMenu(snap.data().menu)
        : migrateMenu(SEED_MENU);

    const basePrice = hasSizes
      ? Math.min(...updated.sizes.map((s) => Number(s.price) || 0))
      : Number(updated.price) || 0;

    const updatedMenu = currentMenu.map((item) => {
      if (item.id !== id) return item;

      if (hasSizes) {
        // Preserve existing stock for sizes that already exist (matched by volume).
        const existingByVolume = {};
        (item.sizes || []).forEach((s) => { existingByVolume[s.volume] = s; });

        const nextSizes = updated.sizes.map((s) => {
          const volume = Number(s.ml);
          const existing = existingByVolume[volume];
          return {
            label: `${volume}ml`,
            volume,
            price: Number(s.price),
            stock: existing ? Number(existing.stock) || 0 : DEFAULT_SIZE_STOCK,
          };
        });

        return {
          id: item.id,
          name: String(updated.name || item.name || ""),
          category: String(updated.category || item.category || ""),
          description: String(updated.description || item.description || ""),
          image: String(updated.image ?? item.image ?? ""),
          price: basePrice,
          sizes: nextSizes,
          quantityAvailable: nextSizes.reduce((sum, s) => sum + s.stock, 0),
        };
      }

      return {
        id: item.id,
        name: String(updated.name || item.name || ""),
        category: String(updated.category || item.category || ""),
        description: String(updated.description || item.description || ""),
        image: String(updated.image ?? item.image ?? ""),
        price: basePrice,
        quantityAvailable:
          updated.quantityAvailable !== undefined
            ? Number(updated.quantityAvailable)
            : Number(item.quantityAvailable || 0),
      };
    });

    const safe = cleanForFirestore(updatedMenu);
    try {
      await setDoc(ref, { menu: safe }, { merge: true });
      // Do NOT call setMenuItems — onSnapshot handles it.
    } catch (err) {
      console.error("[MenuContext] updateMenuItem: Firestore write failed:", err);
      throw err;
    }
  };

  const deleteMenuItem = (id) => {
    persist(menuItems.filter((item) => item.id !== id));
  };

  // ── STOCK CONTROL ──────────────────────────────────────────────────────────
  const deductMenuStock = (cartItems = []) => {
    const foodDeductions = {};
    const sizeDeductions = {};

    cartItems.forEach((ci) => {
      if (ci.size) {
        const key = `${ci.id}::${ci.size}`;
        sizeDeductions[key] = (sizeDeductions[key] || 0) + (ci.quantity || 1);
      } else {
        foodDeductions[ci.id] = (foodDeductions[ci.id] || 0) + (ci.quantity || 1);
      }
    });

    persist(
      menuItems.map((item) => {
        if (Array.isArray(item.sizes) && item.sizes.length > 0) {
          let touched = false;
          const sizes = item.sizes.map((s) => {
            const key = `${item.id}::${s.label}`;
            if (sizeDeductions[key] !== undefined) {
              touched = true;
              return {
                ...s,
                stock: Math.max(0, (Number(s.stock) || 0) - sizeDeductions[key]),
              };
            }
            return s;
          });
          if (!touched) return item;
          return {
            ...item,
            sizes,
            quantityAvailable: sizes.reduce(
              (sum, s) => sum + (Number(s.stock) || 0),
              0
            ),
          };
        }

        if (foodDeductions[item.id] !== undefined) {
          return {
            ...item,
            quantityAvailable: Math.max(
              0,
              (item.quantityAvailable || 0) - foodDeductions[item.id]
            ),
          };
        }
        return item;
      })
    );
  };

  const increaseMenuStock = (id, amount) => {
    persist(
      menuItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantityAvailable:
                (item.quantityAvailable || 0) + Number(amount),
            }
          : item
      )
    );
  };

  const decreaseMenuStock = (id, amount) => {
    persist(
      menuItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantityAvailable: Math.max(
                0,
                (item.quantityAvailable || 0) - Number(amount)
              ),
            }
          : item
      )
    );
  };

  const increaseSizeStock = (itemId, sizeIndex, amount = 1) => {
    persist(
      menuItems.map((item) => {
        if (item.id !== itemId || !Array.isArray(item.sizes)) return item;
        const sizes = item.sizes.map((s, i) =>
          i === sizeIndex
            ? { ...s, stock: (Number(s.stock) || 0) + Number(amount) }
            : s
        );
        return {
          ...item,
          sizes,
          quantityAvailable: sizes.reduce(
            (sum, s) => sum + (Number(s.stock) || 0),
            0
          ),
        };
      })
    );
  };

  const decreaseSizeStock = (itemId, sizeIndex, amount = 1) => {
    persist(
      menuItems.map((item) => {
        if (item.id !== itemId || !Array.isArray(item.sizes)) return item;
        const sizes = item.sizes.map((s, i) =>
          i === sizeIndex
            ? { ...s, stock: Math.max(0, (Number(s.stock) || 0) - Number(amount)) }
            : s
        );
        return {
          ...item,
          sizes,
          quantityAvailable: sizes.reduce(
            (sum, s) => sum + (Number(s.stock) || 0),
            0
          ),
        };
      })
    );
  };

  const isInStock = (item) =>
    Array.isArray(item.sizes)
      ? item.sizes.some((s) => (Number(s.stock) || 0) > 0)
      : (item.quantityAvailable ?? 0) > 0;

  // ── CATEGORY MANAGEMENT ────────────────────────────────────────────────────
 
  const saveCategories = async (newCategories) => {
    const cleaned = newCategories
      .map((c) => String(c).trim())
      .filter(Boolean);
    const deduped = [...new Set(cleaned)];

    // Optimistic update
    setCategories(deduped);

    try {
      await setDoc(ADMIN_REF(), { categories: deduped }, { merge: true });
    } catch (err) {
      console.error("[MenuContext] saveCategories failed:", err);
      // Revert to whatever Firestore last confirmed
      setCategories(categories);
      throw err;
    }
  };

  return (
    <MenuContext.Provider
      value={{
        menuItems,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        deductMenuStock,
        increaseMenuStock,
        decreaseMenuStock,
        increaseSizeStock,
        decreaseSizeStock,
        isInStock,
        // categories is the live Firestore-backed list; CATEGORIES (the
        // constant) is kept as the hardcoded fallback in the module scope
        // so it can still be imported directly by code that doesn't need
        // reactivity (e.g. unit tests, seed checks).
        categories,
        saveCategories,
        CATEGORIES,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}
