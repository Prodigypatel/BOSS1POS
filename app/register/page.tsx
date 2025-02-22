"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { type CartItem, ItemList, Cart, PaymentModal, ReceiptModal } from "@/components/register-components"
import { CustomerSearch } from "@/components/customer-search"
import type { Customer } from "@/lib/customers"
import { Label } from "@/components/ui/label"
import { createTransaction } from "@/lib/actions/transaction.actions"

// Mock data for demonstration
const mockItems = [
  { id: 1, name: "Red Wine", price: 15.99, barcode: "123456" },
  { id: 2, name: "White Wine", price: 13.99, barcode: "234567" },
  { id: 3, name: "Whiskey", price: 45.99, barcode: "345678" },
  { id: 4, name: "Vodka", price: 20.99, barcode: "456789" },
  { id: 5, name: "Gin", price: 30.99, barcode: "567890" },
  { id: 6, name: "Rum", price: 25.99, barcode: "678901" },
  { id: 7, name: "Tequila", price: 35.99, barcode: "789012" },
  { id: 8, name: "Beer 6-pack", price: 10.99, barcode: "890123" },
  { id: 9, name: "Cigarettes", price: 8.99, barcode: "901234" },
  { id: 10, name: "Cigars", price: 12.99, barcode: "012345" },
]

interface Promotion {
  id: number
  name: string
  type: "percentage" | "fixed"
  value: number
  start_date: string
  end_date: string
  applicable_items: string
}

export default function RegisterPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [barcodeInput, setBarcodeInput] = useState("")
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false)
  const [lastCompletedSale, setLastCompletedSale] = useState<{ total: number; items: CartItem[] } | null>(null)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [minimumAgeDate, setMinimumAgeDate] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    fetchPromotions()
    calculateMinimumAgeDate()
  }, [])

  async function fetchPromotions() {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .lte("start_date", new Date().toISOString())
      .gte("end_date", new Date().toISOString())

    if (error) {
      console.error("Error fetching promotions:", error)
    } else {
      setPromotions(data || [])
    }
  }

  function calculateMinimumAgeDate() {
    const today = new Date()
    const minAgeDate = new Date(today.getFullYear() - 21, today.getMonth(), today.getDate())
    setMinimumAgeDate(minAgeDate.toISOString().split("T")[0])
  }

  const addToCart = (item: CartItem) => {
    const existingItem = cart.find((cartItem) => cartItem.id === item.id)
    const applicablePromotions = promotions.filter((promo) =>
      promo.applicable_items
        .split(",")
        .map((i) => i.trim())
        .includes(item.name),
    )

    let discountedPrice = item.price
    applicablePromotions.forEach((promo) => {
      if (promo.type === "percentage") {
        discountedPrice *= 1 - promo.value / 100
      } else {
        discountedPrice -= promo.value
      }
    })

    if (existingItem) {
      setCart(
        cart.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1, price: discountedPrice } : cartItem,
        ),
      )
    } else {
      setCart([...cart, { ...item, quantity: 1, price: discountedPrice }])
    }
  }

  const removeFromCart = (itemId: number) => {
    setCart(cart.filter((item) => item.id !== itemId))
  }

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(itemId)
    } else {
      setCart(cart.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)))
    }
  }

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const item = mockItems.find((item) => item.barcode === barcodeInput)
    if (item) {
      addToCart(item)
      setBarcodeInput("")
    } else {
      toast({
        title: "Item not found",
        description: "The scanned barcode does not match any item in the inventory.",
        variant: "destructive",
      })
    }
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handlePaymentComplete = (paymentMethod: string, amountPaid: number) => {
    setLastCompletedSale({ total, items: [...cart] })
    setCart([])
    setIsPaymentModalOpen(false)
    setIsReceiptModalOpen(true)
    toast({
      title: "Payment Successful",
      description: `Received ${paymentMethod} payment of $${amountPaid.toFixed(2)}`,
    })
  }

  const handlePayment = async (paymentMethod: string, amountPaid: string, items: CartItem[]) => {
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) throw new Error("User not authenticated")

      const transaction = {
        type: "sale" as const,
        amount: total,
        status: "completed" as const,
        payment_method: paymentMethod,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        cashier_id: userId,
        customer_id: selectedCustomer?.id,
      }

      await createTransaction(transaction)
      handlePaymentComplete(paymentMethod, Number(amountPaid))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      })
      console.error("Payment error:", error)
    }
  }

  return (
    <div className="hidden flex-col md:flex">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Register</h2>
        </div>
        <Tabs defaultValue="newsale" className="space-y-4">
          <TabsList>
            <TabsTrigger value="newsale">New Sale</TabsTrigger>
            <TabsTrigger value="refunds">Refunds</TabsTrigger>
          </TabsList>
          <TabsContent value="newsale" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleBarcodeSubmit} className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Scan barcode or enter item code"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                    />
                    <Button type="submit">Add</Button>
                  </form>
                  <ScrollArea className="h-[400px]">
                    <ItemList items={mockItems} onItemClick={addToCart} />
                  </ScrollArea>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Cart</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Label>Customer</Label>
                    <div className="flex items-center space-x-2">
                      <CustomerSearch onSelect={setSelectedCustomer} />
                      {selectedCustomer && <div className="text-sm">Points: {selectedCustomer.loyalty_points}</div>}
                    </div>
                  </div>
                  <Cart items={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="text-2xl font-bold">Total: ${total.toFixed(2)}</div>
                  <Button onClick={() => setIsPaymentModalOpen(true)} disabled={cart.length === 0}>
                    Checkout
                  </Button>
                </CardFooter>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Age Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <p>For tobacco and alcohol purchases, customers must be born on or before:</p>
                <p className="text-lg font-bold">{minimumAgeDate}</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="refunds">
            <Card>
              <CardHeader>
                <CardTitle>Process Refund</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Refund functionality to be implemented.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={total}
        onPaymentComplete={handlePayment}
        items={cart}
      />
      <ReceiptModal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} sale={lastCompletedSale} />
    </div>
  )
}

