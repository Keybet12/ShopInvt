// src/context/InventoryContext.tsx

import React, { createContext, useContext, useState } from "react";
import { Product, Sale } from "@/types";

interface InventoryContextProps {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  updateProductStock: (productId: string, quantitySold: number) => void;
  sales: Sale[];
  addSale: (sale: Sale) => void;
}

const InventoryContext = createContext<InventoryContextProps | undefined>(undefined);

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error("useInventory must be used within InventoryProvider");
  return context;
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const addProduct = (product: Product) => {
    setProducts((prev) => [...prev, product]);
  };

  const updateProduct = (updated: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const updateProductStock = (productId: string, quantitySold: number) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === productId
          ? { ...product, stockQuantity: product.stockQuantity - quantitySold }
          : product
      )
    );
  };

  const addSale = (sale: Sale) => {
    setSales((prev) => [...prev, sale]);
    updateProductStock(sale.productId, sale.quantity);
  };

  return (
    <InventoryContext.Provider
      value={{ products, addProduct, updateProduct, updateProductStock, sales, addSale }}
    >
      {children}
    </InventoryContext.Provider>
  );
};
