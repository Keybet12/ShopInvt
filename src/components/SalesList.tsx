// src/components/SalesList.tsx

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import AddSaleForm from "./AddSaleForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatKSH } from "@/lib/formatCurrency";
import { Sale } from "@/types";
import { toast } from "sonner";

const SalesList: React.FC = () => {
  const [showAddSale, setShowAddSale] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sales, setSales] = useState<Sale[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const fetchSales = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Failed to load sales.");
    } else {
      setSales(
        data.map((row) => ({
          id: row.id,
          productId: row.product_id,
          productName: row.product_name,
          quantity: row.quantity,
          totalAmount: row.total_amount,
          profit: row.profit,
          date: row.date,
        }))
      );
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return isNaN(d.getTime())
      ? "Invalid date"
      : d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  const filteredSales = sales
    .filter((sale) =>
      sale.productName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((sale) => {
      if (startDate && sale.date < startDate) return false;
      if (endDate && sale.date > endDate) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(p - 1, 1));
  };
  const handleNextPage = () => {
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  };

  const totalProfit = filteredSales.reduce((sum, s) => sum + s.profit, 0);

  const handleAddSale = async (newSale: Sale) => {
    await fetchSales();
    setCurrentPage(1);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Recent Sales</CardTitle>
          <details className="w-full sm:w-auto bg-muted/30 p-4 rounded-md">
            <summary className="cursor-pointer font-medium mb-2">Filter Sales</summary>
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <div className="relative w-full sm:w-[200px]">
                <label htmlFor="search" className="text-sm font-medium mb-1">Search</label>
                <Search className="absolute left-2.5 top-9 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="search"
                  placeholder="Search products..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <div className="flex flex-col w-full sm:w-[160px]">
                <label htmlFor="start-date" className="text-sm font-medium mb-1">Start Date</label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                />
              </div>
              <div className="flex flex-col w-full sm:w-[160px]">
                <label htmlFor="end-date" className="text-sm font-medium mb-1">End Date</label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>
          </details>
          <Button onClick={() => setShowAddSale(true)} className="w-full sm:w-auto mt-3 sm:mt-0">
            <Plus className="mr-2 h-4 w-4" /> Record Sale
          </Button>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{formatDate(sale.date)}</TableCell>
                  <TableCell className="font-medium">{sale.productName}</TableCell>
                  <TableCell>{sale.quantity}</TableCell>
                  <TableCell className="text-right">
                    {sale.quantity > 0 ? formatKSH(sale.totalAmount / sale.quantity) : "-"}
                  </TableCell>
                  <TableCell className="text-right">{formatKSH(sale.totalAmount)}</TableCell>
                  <TableCell className="text-right">{formatKSH(sale.profit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="space-x-2">
              <Button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Previous
              </Button>
              <Button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end border-t px-6 py-3">
          <div className="text-sm font-medium">
            Total Profit: <span className="text-green-600">{formatKSH(totalProfit)}</span>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={showAddSale} onOpenChange={setShowAddSale}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record New Sale</DialogTitle></DialogHeader>
          <AddSaleForm onClose={() => setShowAddSale(false)} onAddSale={handleAddSale} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SalesList;
