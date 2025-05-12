// src/types.ts

export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    cost: number;
    stockQuantity: number;
    reorderLevel: number;
  }
  
  export interface Sale {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    totalAmount: number;
    profit: number;
    date: string;
  }
  