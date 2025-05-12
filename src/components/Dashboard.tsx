// src/components/Dashboard.tsx

import React, { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Package,
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  Truck,
  LineChart,
  BarChart as BarChartIcon,
  Download,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { formatKSH } from "@/lib/formatCurrency";
import { toast } from "sonner";
import { Sale, Product } from "@/types";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [invRes, salesRes] = await Promise.all([
        supabase
          .from("inventory")
          .select("id, name, category, price, cost, stock_quantity, reorder_level")
          .eq("user_id", user.id),
        supabase
          .from("sales")
          .select("id, product_id, product_name, quantity, total_amount, profit, date")
          .eq("user_id", user.id),
      ]);

      if (invRes.error) {
        toast.error("Failed to load inventory.");
      } else {
        setProducts(
          invRes.data.map((r) => ({
            id: r.id,
            name: r.name,
            category: r.category,
            price: r.price,
            cost: r.cost,
            stockQuantity: r.stock_quantity,
            reorderLevel: r.reorder_level,
          }))
        );
      }

      if (salesRes.error) {
        toast.error("Failed to load sales.");
      } else {
        setSales(
          salesRes.data.map((r) => ({
            id: r.id,
            productId: r.product_id,
            productName: r.product_name,
            quantity: r.quantity,
            totalAmount: r.total_amount,
            profit: r.profit,
            date: r.date,
          }))
        );
      }
    })();
  }, []);

  const totalStock = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const totalValue = products.reduce((sum, p) => sum + p.cost * p.stockQuantity, 0);
  const currentYear = new Date().getFullYear();

  const currentYearSales = useMemo(
    () => sales.filter((s) => new Date(s.date).getFullYear() === currentYear),
    [sales]
  );

  const currentYearTotalSales = useMemo(
    () => currentYearSales.reduce((sum, s) => sum + s.totalAmount, 0),
    [currentYearSales]
  );

  const currentYearTotalProfit = useMemo(
    () => currentYearSales.reduce((sum, s) => sum + s.profit, 0),
    [currentYearSales]
  );

  const currentYearTotalUnitsSold = useMemo(
    () => currentYearSales.reduce((sum, s) => sum + s.quantity, 0),
    [currentYearSales]
  );

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stockQuantity <= p.reorderLevel),
    [products]
  );

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      value,
      color: COLORS[idx % COLORS.length],
    }));
  }, [products]);

  const now = new Date();
  const currentMonth = now.getMonth();

  const currentMonthSales = useMemo(
    () => currentYearSales.filter((s) => new Date(s.date).getMonth() === currentMonth),
    [currentYearSales]
  );

  // ✅ Group and combine profit for current month sales
  const topMonthSales = useMemo(() => {
    const grouped: Record<string, number> = {};
    currentMonthSales.forEach((s) => {
      const name =
        s.productName.length > 10
          ? s.productName.slice(0, 10) + "…"
          : s.productName;
      grouped[name] = (grouped[name] || 0) + (s.profit || 0);
    });
    return Object.entries(grouped)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [currentMonthSales]);

  // ✅ Group and combine profit for current year sales
  const topYearSales = useMemo(() => {
    const grouped: Record<string, number> = {};
    currentYearSales.forEach((s) => {
      const name =
        s.productName.length > 10
          ? s.productName.slice(0, 10) + "…"
          : s.productName;
      grouped[name] = (grouped[name] || 0) + (s.profit || 0);
    });
    return Object.entries(grouped)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [currentYearSales]);

  const generateSalesReport = () => {
    const totalQty = currentYearSales.reduce((sum, s) => sum + s.quantity, 0);
    const totalAmt = currentYearSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalProf = currentYearSales.reduce((sum, s) => sum + s.profit, 0);

    let csv = `Date,Product Name,Quantity,Unit Price,Total Amount,Profit\n`;
    currentYearSales.forEach((s) => {
      const date = new Date(s.date).toLocaleDateString();
      const unit = (s.totalAmount / s.quantity).toFixed(2);
      csv += `${date},"${s.productName}",${s.quantity},${unit},${s.totalAmount.toFixed(
        2
      )},${s.profit.toFixed(2)}\n`;
    });
    csv += `\nTOTALS,,${totalQty},,${totalAmt.toFixed(2)},${totalProf.toFixed(2)}\n`;
    csv += `\nSUMMARY INFORMATION\nReporting Period,${currentYear}\n`;
    csv += `Total Products Sold,${totalQty}\nTotal Revenue,${totalAmt.toFixed(
      2
    )}\nTotal Profit,${totalProf.toFixed(2)}\nProfit Margin,${(
      (totalProf / totalAmt) *
      100
    ).toFixed(2)}%\n`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_report_${currentYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.success(`Sales report for ${currentYear} downloaded successfully`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{currentYear} Dashboard Summary</h2>
        <Button onClick={generateSalesReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" /> Download Sales Report
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col items-start space-y-1">
            <div className="text-2xl font-bold break-words">{totalStock}</div>
            <p className="text-xs text-muted-foreground">items in stock</p>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col items-start space-y-1">
            <div className="text-2xl font-bold break-words">{formatKSH(totalValue)}</div>
            <p className="text-xs text-muted-foreground">total value at retail</p>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{currentYear} Sales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col items-start space-y-1">
            <div className="text-2xl font-bold break-words">{formatKSH(currentYearTotalSales)}</div>
            <p className="text-xs text-muted-foreground">year to date</p>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{currentYear} Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col items-start space-y-1">
            <div className="text-2xl font-bold break-words">{formatKSH(currentYearTotalProfit)}</div>
            <p className="text-xs text-muted-foreground">year to date</p>
          </CardContent>
        </Card>
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">{currentYear} Units Sold</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col items-start space-y-1">
            <div className="text-2xl font-bold break-words">{currentYearTotalUnitsSold}</div>
            <p className="text-xs text-muted-foreground">year to date</p>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col items-start space-y-1">
            <div className="text-2xl font-bold break-words">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">products need reordering</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Low Stock Products ({lowStockProducts.length})</span>
            </div>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => window.open("#/inventory", "_self")}>
            View All Inventory
          </Button>
        </CardHeader>
        <CardContent>
          {lowStockProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Reorder Level</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell className="text-center">{p.stockQuantity}</TableCell>
                    <TableCell className="text-center">{p.reorderLevel}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        Low Stock
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium">All Products Well Stocked</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                You have no products that need reordering at this time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, "Products"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Sales This Month</CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topMonthSales}>
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `Ksh ${v}`} />
                <Tooltip 
                  formatter={(v) => [formatKSH(Number(v)), "Profit"]}
                  labelFormatter={(label) => label}
                  labelStyle={{ color: 'black' }}
                />
                <Bar dataKey="amount" name="Profit" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Sales This Year ({currentYear})</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topYearSales}>
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `KSh ${v}`} />
                <Tooltip
                  formatter={(v) => [formatKSH(Number(v)), "Profit"]}
                  labelFormatter={(label) => label}
                  labelStyle={{ color: 'black' }}
                />
                <Bar dataKey="amount" name="Profit" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
