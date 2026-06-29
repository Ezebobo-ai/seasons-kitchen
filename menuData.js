/* FULL MENU LIST */
const menuData = [
  { id: 301, category: "Breakfast", name: "Akara", price: 3500, image: "/akara.jpeg", description: "Plain steamed rice served fresh and soft" },
  { id: 302, category: "Breakfast", name: "Custard", price: 3000, image: "/cus.jpeg", description: "Plain steamed rice served fresh and soft" },
  { id: 303, category: "Breakfast", name: "Oat", price: 3000, image: "/J&R.jpeg", description: "Plain steamed rice served fresh and soft" },
  { id: 304, category: "Breakfast", name: "Tea", price: 3000, image: "/J&R.jpeg", description: "Plain steamed rice served fresh and soft" },
  { id: 305, category: "Breakfast", name: "Vegetable Noodles", price: 3000, image: "/vn.jpeg", description: "Plain steamed rice served fresh and soft" },
  { id: 306, category: "Breakfast", name: "Tea & Bread", price: 3000, image: "/J&R.jpeg", description: "Plain steamed rice served fresh and soft" },

  { id: 1, category: "Rice & Pasta", name: "Jollof Rice", price: 3000, image: "/J&R.jpeg", description: "Plain steamed rice served fresh and soft" },
  { id: 2, category: "Rice & Pasta", name: "Fried Rice", price: 4000, image: "/fried rice.jpeg", description: "Plain steamed rice served fresh and soft" },
  { id: 3, category: "Rice & Pasta", name: "White Rice ", price: 2675, image: "/Rice.jpeg", description: "Plain steamed rice served fresh and soft" },
  { id: 4, category: "Rice & Pasta", name: "Stir Fry Pasta", price: 5000, image: "/pasta.jpeg", description: "Plain steamed rice served fresh and soft"},
  { id: 5, category: "Rice & Pasta", name: "Vegetable Noodles", price: 4000, image: "/vegetable_noodles.jpg", description: "Plain steamed rice served fresh and soft"},
  { id: 6, category: "Rice & Pasta", name: "Beans & Rice", price: 4500, image: "/beans_rice.jpg", description: "Plain steamed rice served fresh and soft" },

  { id: 7, category: "Special Meal", name: "Boiled Yam", price: 3000, image: "/yam.jpeg", description: "Plain steamed rice served fresh and soft" },
  { id: 8, category: "Special Meal", name: "Porridge Yam", price: 7500, image: "/porridge_yam.jpg", description: "Plain steamed rice served fresh and soft" },
  { id: 9, category: "Special Meal", name: "Egg Sauce", price: 3000, image: "/egg.jpeg", description: "Plain steamed rice served fresh and soft" },
  { id: 10, category: "Special Meal", name: "Boiled Irish", price: 3000, image: "/boiled_irish.jpg", description: "Plain steamed rice served fresh and soft" },
  { id: 11, category: "Special Meal", name: "Yamarita", price: 5500, image: "/yamarita.jpg", description: "Plain steamed rice served fresh and soft" },
  { id: 12, category: "Special Meal", name: "Porridge Plantain", price: 5000, image: "/porridge_plantain.jpg", description: "Plain steamed rice served fresh and soft" },
  { id: 29, category: "Special Meal", name: "Turkey Pepper Soup", price: 9500, image: "/Turkey pepper soup.jpeg", description: "Plain steamed rice served fresh and soft" },
  { id: 32, category: "Special Meal", name: "Chicken Sandwich", price: 4500, image: "/Chicken Sandwich.jpeg",description: "Plain steamed rice served fresh and soft" },
  { id: 33, category: "Special Meal", name: "Fruit salad", price: 4220, image: "/Fruit salad.jpeg",description: "Plain steamed rice served fresh and soft" },
  { id: 30, category: "Special Meal", name: "Club sandwich", price: 5000, image: "/Club sandwich.jpeg", description: "Plain steamed rice served fresh and soft" },

  { id: 13, category: "Sides", name: "Fried Plantain", price: 1500, image: "/plan.jpeg", description: "Plain steamed rice served fresh and soft" },
  { id: 14, category: "Sides", name: "French Fries", price: 3000, image: "/french_fries.jpg.jpeg" },
  { id: 15, category: "Sides", name: "Coleslaw", price: 1500, image: "/coleslaw.jpeg" },
  { id: 16, category: "Sides", name: "Omelette", price: 1500, image: "/omelette.jpg" },
  { id: 17, category: "Sides", name: "Pepper Sauce", price: 2000, image: "/pepper_sauce.jpg" },
  { id: 31, category: "Sides", name: "Chicken salad", price: 10000, image: "/Chicken salad.jpeg" },

  { id: 18, category: "Swallow & Soups", name: "Poundo", price: 3000, image: "/pound.jpeg" },
  { id: 19, category: "Swallow & Soups", name: "Semo", price: 7500, image: "/se.jpeg" },
  { id: 20, category: "Swallow & Soups", name: "Eba", price: 3000, image: "/Eba.jpeg" },
  { id: 21, category: "Swallow & Soups", name: "Vegetable Soup", price: 4000, image: "/vegetable soup.jpeg" },


  { id: 201, category: "Soup Bowls", name: "Okra Soup Bowl (3ltrs)", price: 20000, image: "/okoro.jpeg" },
  { id: 202, category: "Soup Bowls", name: "Ogbono Soup Bowl (3ltrs)", price: 20000, image: "/ogbono.jpeg" },
  { id: 203, category: "Soup Bowls", name: "Egusi Soup Bowl (3ltrs)", price: 20000, image: "/Egusi.jpeg" },
  { id: 204, category: "Soup Bowls", name: "Oha Soup Bowl (3ltrs)", price: 30000, image: "/oha.jpeg" },
  { id: 205, category: "Soup Bowls", name: "Ofada Stew Bowl (3ltrs)", price: 25000, image: "/ofa.jpeg" },
  { id: 206, category: "Soup Bowls", name: "Chicken Stew Bowl (3ltrs)", price: 37000, image: "/stew.jpeg" },
  { id: 207, category: "Soup Bowls", name: "White Soup Bowl (3ltrs)", price: 50000, image: "/ws.jpeg" },

  { id: 34, category: "Snacks", name: "Meat Pie", price: 1000, image: "/Meat pea.jpg" },
  { id: 37, category: "Customer's Delight", name: "Yam and Egg Sauce", price: 1000, image: "/yam.jpeg" },

  {
    id: 22,
    category: "Drinks",
    name: "Tigernut Drink",
    image: "/Tigernut.jpeg",
    description: "Plain steamed rice served fresh and soft",
    sizes: [
      { size: "250ml", price: 1500 },
      { size: "500ml", price: 2500 }
    ]
  },
  {
    id: 23,
    category: "Drinks",
    name: "Zobo Drink",
    image: "/Zobo.jpeg",
    description: "Plain steamed rice served fresh and soft",
    sizes: [
      { size: "250ml", price: 1500 },
      { size: "500ml", price: 2500 }
    ]
  },
  {
    id: 24,
    category: "Drinks",
    name: "Pineapple Delight",
    image: "/Pineapple.jpeg",
    description: "Plain steamed rice served fresh and soft",
    sizes: [
      { size: "250ml", price: 1500 },
      { size: "500ml", price: 2500 }
    ]
  },
  {
    id: 25,
    category: "Drinks",
    name: "Orange Juice",
    image: "/Orange.jpeg",
    description: "Plain steamed rice served fresh and soft",
    sizes: [
      { size: "250ml", price: 2250 },
      { size: "500ml", price: 4000 }
    ]
  },
  {
    id: 26,
    category: "Drinks",
    name: "Founder's Special",
    image: "/Special.jpeg",
    description: "Plain steamed rice served fresh and soft",
    sizes: [
      { size: "250ml", price: 2532 },
      { size: "500ml", price: 4000 }
    ]
  },
  {
    id: 27,
    category: "Drinks",
    name: "Fresh Yogurt Drink",
    image: "/Yogurt.jpeg",
    description: "Plain steamed rice served fresh and soft",
    sizes: [
      { size: "350ml", price: 3375 },
      { size: "500ml", price: 7000 }
    ]
  },
  {
    id: 28,
    category: "Drinks",
    name: "Sweet Mint Green",
    image: "/Sweet.jpeg",
    description: "Plain steamed rice served fresh and soft",
    sizes: [
      { size: "250ml", price: 2500 },
      { size: "500ml", price: 4000 }
    ]
  },
  {
    id: 29,
    category: "Drinks",
    name: "Glowrite",
    image: "/Glowrite.jpeg",
    description: "Plain steamed rice served fresh and soft",
    sizes: [
      { size: "250ml", price: 2813 },
      { size: "500ml", price: 4500 }
    ]
  }
];