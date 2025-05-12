import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from "@/components/ui/select";
import { Sale, Product } from "@/types";

const formSchema = z.object({
  productId: z.string({ required_error: "Please select a product." }),
  quantity: z.coerce.number().int().positive({ message: "Quantity must be positive." }),
  date: z.string().min(1, { message: "Date is required." }),
});

type FormValues = z.infer<typeof formSchema>;

interface AddSaleFormProps {
  onClose: () => void;
  onAddSale: (sale: Sale) => void;
}

const AddSaleForm: React.FC<AddSaleFormProps> = ({ onClose, onAddSale }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
      date: new Date().toISOString().split("T")[0],
    },
  });
  const { handleSubmit, control, formState, setValue } = form;
  const productId = useWatch({ control, name: "productId" });
  const quantity = useWatch({ control, name: "quantity" });

  // Fetch inventory for select options
  useEffect(() => {
    const fetchProducts = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      const { data, error } = await supabase
        .from("inventory")
        .select("id, name, price, cost, stock_quantity")
        .eq("user_id", userId)
        .order("name");

      if (error) {
        console.error("Error fetching inventory:", error.message);
        toast.error("Failed to load products.");
      } else if (data) {
        setProducts(
          data.map((p) => ({
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
    };
    fetchProducts();
  }, []);

  // Update selected product and total amount
  useEffect(() => {
    const product = products.find((p) => p.id === productId) || null;
    setSelectedProduct(product);
    if (product) {
      setTotalAmount(product.price * (quantity || 1));
    } else {
      setTotalAmount(0);
    }
  }, [productId, quantity, products]);

  const onSubmit = handleSubmit(async (data) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData.user;
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

    await supabase
      .from("inventory")
      .update({ stock_quantity: selectedProduct.stockQuantity - data.quantity })
      .eq("id", selectedProduct.id);

    onAddSale({
      id: inserted.id,
      productId: inserted.product_id,
      productName: inserted.product_name,
      quantity: inserted.quantity,
      totalAmount: inserted.total_amount,
      profit: inserted.profit,
      date: inserted.date,
    });

    toast.success("Sale recorded successfully!");
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
                  onValueChange={(val) => {
                    field.onChange(val);
                    setValue("productId", val);
                  }}
                >
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} - Ksh{p.price.toFixed(2)} (Stock: {p.stockQuantity})
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
            Record Sale
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddSaleForm;
