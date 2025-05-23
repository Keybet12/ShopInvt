// src/components/AddSaleForm.tsx

import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Sale, Product } from "@/types";

const formSchema = z.object({
  productId: z.string({ required_error: "Please select a product." }),
  quantity: z.coerce.number().int().positive({ message: "Quantity must be positive." }),
  date: z.string().min(1, { message: "Date is required." }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddSaleFormProps {
  existingSale?: Sale;
  onClose: () => void;
  onAddSale: (sale: Sale) => void;
}

const AddSaleForm: React.FC<AddSaleFormProps> = ({ existingSale, onClose, onAddSale }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: existingSale?.productId ?? "",
      quantity: existingSale?.quantity ?? 1,
      date: existingSale?.date.split("T")[0] ?? new Date().toISOString().split("T")[0],
    },
  });
  const { handleSubmit, control, formState, setValue } = form;
  const productId = useWatch({ control, name: "productId" });
  const quantity = useWatch({ control, name: "quantity" });

  // Whenever existingSale changes, repopulate the form fields:
  useEffect(() => {
    if (existingSale) {
      setValue("productId", existingSale.productId);
      setValue("quantity", existingSale.quantity);
      setValue("date", existingSale.date.split("T")[0]);
    }
  }, [existingSale, setValue]);

  // Fetch products
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("inventory")
        .select("id, name, price, cost, stock_quantity")
        .eq("user_id", user.id)
        .order("name");
      if (error) {
        toast.error("Failed to load products.");
      } else {
        setProducts(
          data!.map(p => ({
            id: String(p.id),
            name: p.name,
            price: p.price,
            cost: p.cost,
            stockQuantity: p.stock_quantity,
            category: "",
            reorderLevel: 0,
          }))
        );
      }
    })();
  }, []);

  // Recompute selectedProduct and totalAmount on changes
  useEffect(() => {
    const prod = products.find(p => p.id === productId) || null;
    setSelectedProduct(prod);
    setTotalAmount(prod ? prod.price * (quantity || 1) : 0);
  }, [products, productId, quantity]);

  const onSubmit = handleSubmit(async data => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      toast.error("You must be logged in to record a sale.");
      return;
    }
    if (!selectedProduct) {
      toast.error("Selected product not found.");
      return;
    }
    const total = selectedProduct.price * data.quantity;
    const profit = total - selectedProduct.cost * data.quantity;

    if (existingSale) {
      const originalQuantity = existingSale.quantity;
      const quantityDelta = data.quantity - originalQuantity;

      // Get latest product info
      const { data: productData, error: prodError } = await supabase
        .from("inventory")
        .select("stock_quantity")
        .eq("id", data.productId)
        .single();

      if (prodError || !productData) {
        toast.error("Failed to fetch current inventory.");
        return;
      }

      const currentStock = productData.stock_quantity;
      const newStock = currentStock - quantityDelta;

      if (newStock < 0) {
        toast.error("Not enough stock to update the sale.");
        return;
      }

      // Proceed to update sale
      const { data: updated, error } = await supabase
        .from("sales")
        .update({
          product_id: data.productId,
          product_name: selectedProduct.name,
          quantity: data.quantity,
          total_amount: total,
          profit,
          date: data.date,
        })
        .eq("id", existingSale.id)
        .select()
        .single();

      if (error || !updated) {
        toast.error(error?.message || "Failed to update sale.");
        return;
      }

      // Update inventory stock
      const { error: stockError } = await supabase
        .from("inventory")
        .update({ stock_quantity: newStock })
        .eq("id", selectedProduct.id);

      if (stockError) {
        toast.warning("Sale updated but failed to update stock.");
        console.error(stockError.message);
      } else {
        toast.success("Inventory adjusted.");
      }

      toast.success("Sale updated!");
      onAddSale({
        id: updated.id,
        productId: updated.product_id,
        productName: updated.product_name,
        quantity: updated.quantity,
        totalAmount: updated.total_amount,
        profit: updated.profit,
        date: updated.date,
      });
    }
else {
      // Insert
      const { data: inserted, error } = await supabase
        .from("sales")
        .insert([{
          product_id: data.productId,
          product_name: selectedProduct.name,
          quantity: data.quantity,
          total_amount: total,
          cost: selectedProduct.cost,
          profit,
          date: data.date,
          user_id: user.id,
        }])
        .select()
        .single();
      if (error || !inserted) {
        toast.error(error?.message || "Failed to record sale.");
        return;
      }

      if (data.quantity > selectedProduct.stockQuantity) {
        toast.error("Not enough stock for this sale.");
        return;
      }
       // Deduct stock
      const updatedStock = selectedProduct.stockQuantity - data.quantity;
      const { error: inventoryError } = await supabase
        .from("inventory")
        .update({ stock_quantity: updatedStock })
        .eq("id", selectedProduct.id);

      if (inventoryError) {
        toast.warning("Sale was recorded, but inventory was not updated.");
        console.error(inventoryError.message);
      } else {
        toast.success("Inventory updated.");
      }

      toast.success("Sale recorded!");
      onAddSale({
        id: inserted.id,
        productId: inserted.product_id,
        productName: inserted.product_name,
        quantity: inserted.quantity,
        totalAmount: inserted.total_amount,
        profit: inserted.profit,
        date: inserted.date,
      });
    }

    onClose();
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          control={control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={val => {
                    field.onChange(val);
                    setValue("productId", val);
                  }}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — Ksh{p.price.toFixed(2)} (Stock: {p.stockQuantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input type="number" min={1} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="bg-secondary p-3 rounded-md mt-4">
          <div className="flex justify-between">
            <span>Total Amount:</span>
            <span className="font-medium">Ksh {totalAmount.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={formState.isSubmitting}>
            {existingSale ? "Update Sale" : "Record Sale"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddSaleForm;
