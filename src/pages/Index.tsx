
import React, { useState } from "react";
import Header from "@/components/Header";
import Dashboard from "@/components/Dashboard";
import InventoryList from "@/components/InventoryList";
import SalesList from "@/components/SalesList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 pt-[108px]">
          <Tabs defaultValue="dashboard" className="space-y-6">
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                <TabsTrigger value="sales">Sales</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="dashboard" className="space-y-6">
              <Dashboard />
            </TabsContent>
            <TabsContent value="inventory" className="space-y-6">
              <InventoryList />
            </TabsContent>
            <TabsContent value="sales" className="space-y-6">
              <SalesList />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;
