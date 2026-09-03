import { MenuItem, TableSession, Coupon } from '../types/cafe';

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Coffee & Tea
  {
    id: 'm1',
    name: 'Hazelnut Cappuccino',
    category: 'Coffee & Tea',
    price: 180,
    imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isKitchenItem: true,
    prepTimeMinutes: 5,
    inStock: true,
    type: 'prepared'
  },
  {
    id: 'm2',
    name: 'Artisan Espresso',
    category: 'Coffee & Tea',
    price: 120,
    imageUrl: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isKitchenItem: true,
    prepTimeMinutes: 3,
    inStock: true,
    type: 'prepared'
  },
  {
    id: 'm3',
    name: 'Masala Chai Latte',
    category: 'Coffee & Tea',
    price: 90,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isKitchenItem: true,
    prepTimeMinutes: 4,
    inStock: true,
    type: 'prepared'
  },

  // Cold Brews & Shakes
  {
    id: 'm4',
    name: 'Classic Vietnamese Cold Brew',
    category: 'Cold Brews & Shakes',
    price: 210,
    imageUrl: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isKitchenItem: true,
    prepTimeMinutes: 4,
    inStock: true,
    type: 'prepared'
  },
  {
    id: 'm5',
    name: 'Thick Belgian Chocolate Shake',
    category: 'Cold Brews & Shakes',
    price: 240,
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isKitchenItem: true,
    prepTimeMinutes: 6,
    inStock: true,
    type: 'prepared'
  },

  // Pizzas
  {
    id: 'm6',
    name: 'Farmhouse Special Pizza (10 inch)',
    category: 'Pizzas',
    price: 360,
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isKitchenItem: true,
    prepTimeMinutes: 12,
    inStock: true,
    type: 'prepared'
  },
  {
    id: 'm7',
    name: 'Classic Margherita Supreme',
    category: 'Pizzas',
    price: 290,
    imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isKitchenItem: true,
    prepTimeMinutes: 10,
    inStock: true,
    type: 'prepared'
  },

  // Burgers & Fries
  {
    id: 'm8',
    name: 'Crispy Peri Peri French Fries',
    category: 'Burgers & Fries',
    price: 150,
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isKitchenItem: true,
    prepTimeMinutes: 7,
    inStock: true,
    type: 'prepared'
  },
  {
    id: 'm9',
    name: 'Paneer Crunch Burger',
    category: 'Burgers & Fries',
    price: 220,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isKitchenItem: true,
    prepTimeMinutes: 9,
    inStock: true,
    type: 'prepared'
  },

  // Desserts
  {
    id: 'm10',
    name: 'Sizzling Hot Brownie with Ice Cream',
    category: 'Desserts',
    price: 190,
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isKitchenItem: true,
    prepTimeMinutes: 5,
    inStock: true,
    type: 'prepared'
  },

  // Retail & Counter (NON-KITCHEN ITEMS: Only seen by Biller, NEVER by Chef)
  {
    id: 'm11',
    name: 'Classic Regular Cigarettes (Pack of 10)',
    category: 'Retail & Counter',
    price: 180,
    imageUrl: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isKitchenItem: false, // EXCLUDED FROM CHEF KDS
    prepTimeMinutes: 0,
    inStock: true,
    type: 'packaged',
    stockQuantity: 25,
    lowStockThreshold: 20
  },
  {
    id: 'm12',
    name: 'Marlboro Lights (Pack of 10)',
    category: 'Retail & Counter',
    price: 210,
    imageUrl: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isKitchenItem: false, // EXCLUDED FROM CHEF KDS
    prepTimeMinutes: 0,
    inStock: true,
    type: 'packaged',
    stockQuantity: 18,
    lowStockThreshold: 20
  },
  {
    id: 'm13',
    name: 'Packaged Organic Mango Juice (300ml)',
    category: 'Retail & Counter',
    price: 80,
    imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isKitchenItem: false, // EXCLUDED FROM CHEF KDS
    prepTimeMinutes: 0,
    inStock: true,
    type: 'packaged',
    stockQuantity: 30,
    lowStockThreshold: 25
  },
  {
    id: 'm14',
    name: 'Belgian Chocolate Ice Cream Tub (120ml)',
    category: 'Retail & Counter',
    price: 110,
    imageUrl: 'https://images.unsplash.com/photo-1560008581-09826d1de69e?w=500&auto=format&fit=crop&q=60',
    isVeg: true,
    isKitchenItem: false, // EXCLUDED FROM CHEF KDS
    prepTimeMinutes: 0,
    inStock: true,
    type: 'packaged',
    stockQuantity: 12,
    lowStockThreshold: 30
  }
];

export const INITIAL_TABLES: TableSession[] = Array.from({ length: 12 }, (_, i) => ({
  tableNumber: i + 1,
  sessionToken: `table_${i + 1}_secure_token`,
  status: i === 1 ? 'OCCUPIED' : i === 3 ? 'SERVED' : 'FREE',
  customerName: i === 1 ? 'Rahul Sharma' : i === 3 ? 'Priya Patel' : undefined,
  customerPhone: i === 1 ? '9876543210' : i === 3 ? '9812345678' : undefined,
  sessionStartedAt: i === 1 ? Date.now() - 15 * 60 * 1000 : i === 3 ? Date.now() - 40 * 60 * 1000 : undefined,
  servedAt: i === 3 ? Date.now() - 12 * 60 * 1000 : undefined
}));

export const INITIAL_COUPONS: Coupon[] = [
  {
    code: 'WELCOME50',
    discountType: 'FLAT',
    discountValue: 50,
    minOrder: 250,
    isActive: true,
    description: 'Flat ₹50 OFF on orders above ₹250'
  },
  {
    code: 'CAFEVIP',
    discountType: 'PERCENT',
    discountValue: 15,
    minOrder: 400,
    isActive: true,
    description: '15% OFF for our loyal patrons'
  }
];
