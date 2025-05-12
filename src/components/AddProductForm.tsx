import React from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Product } from "@/types";
import { nanoid } from "nanoid";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Product name must be at least 2 characters.",
  }),
  category: z.string().min(1, {
    message: "Category is required.",
  }),
  price: z.coerce.number().min(0.01, {
    message: "Price must be greater than 0.",
  }),
  cost: z.coerce.number().min(0.01, {
    message: "Cost must be greater than 0.",
  }),
  stockQuantity: z.coerce.number().int().min(0, {
    message: "Stock quantity must be a non-negative integer.",
  }),
  reorderLevel: z.coerce.number().int().min(1, {
    message: "Reorder level must be at least 1.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddProductFormProps {
  onClose: () => void;
  onAddProduct: (product: Product) => void;
  editProduct?: Product | null;
}

const AddProductForm: React.FC<AddProductFormProps> = ({ onClose, onAddProduct, editProduct }) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: editProduct
      ? {
          name: editProduct.name,
          category: editProduct.category,
          price: editProduct.price,
          cost: editProduct.cost,
          stockQuantity: editProduct.stockQuantity,
          reorderLevel: editProduct.reorderLevel,
        }
      : {
          name: "",
          category: "",
          price: 0,
          cost: 0,
          stockQuantity: 0,
          reorderLevel: 5,
        },
  });

  const { handleSubmit, control, formState } = form;

  const onSubmit = handleSubmit(async (data) => {
    // Get current user from Supabase Auth
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      toast.error("You must be logged in to manage products.");
      return;
    }
    const userId = user.id;

    // Prepare payload for database
    const payload = {
      name: data.name,
      category: data.category,
      price: data.price,
      cost: data.cost,
      stock_quantity: data.stockQuantity,
      reorder_level: data.reorderLevel,
      user_id: userId,
    };

    if (editProduct) {
      // Update existing product
      const { data: updated, error } = await supabase
        .from("inventory")
        .update(payload)
        .eq("id", editProduct.id)
        .select()
        .single();
      if (error || !updated) {
        toast.error(error?.message || "Failed to update product.");
      } else {
        toast.success("Product updated successfully!");
        onAddProduct({
          id: updated.id,
          name: updated.name,
          category: updated.category,
          price: updated.price,
          cost: updated.cost,
          stockQuantity: updated.stock_quantity,
          reorderLevel: updated.reorder_level,
        });
        onClose();
      }
    } else {
      // Insert new product
      const { data: inserted, error } = await supabase
        .from("inventory")
        .insert([payload])
        .select()
        .single();
      if (error || !inserted) {
        toast.error(error?.message || "Failed to add product.");
      } else {
        toast.success("Product added successfully!");
        onAddProduct({
          id: inserted.id,
          name: inserted.name,
          category: inserted.category,
          price: inserted.price,
          cost: inserted.cost,
          stockQuantity: inserted.stock_quantity,
          reorderLevel: inserted.reorder_level,
        });
        onClose();
      }
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter product name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input placeholder="Enter category" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Buying Price</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={control}
            name="stockQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock Quantity</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="reorderLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reorder Level</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={formState.isSubmitting}>
            {editProduct ? "Update Product" : "Add Product"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddProductForm;
