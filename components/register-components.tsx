"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { createTransaction } from "@/lib/actions/transaction.actions"

export interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
}

interface ItemListProps {
  items: CartItem[]
  onItemClick: (item: CartItem) => void
}

export function ItemList({ items, onItemClick }: ItemListProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <Button
          key={item.id}
          variant="outline"
          className="h-20 flex flex-col items-start p-2"
          onClick={() => onItemClick(item)}
        >
          <div className="font-bold">{item.name}</div>
          <div>${item.price.toFixed(2)}</div>
        </Button>
      ))}
    </div>
  )
}

interface CartProps {
  items: CartItem[]
  updateQuantity: (id: number, quantity: number) => void
  removeFromCart: (id: number) => void
}

export function Cart({ items, updateQuantity, removeFromCart }: CartProps) {
  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between items-center">
            <div>
              <div className="font-bold">{item.name}</div>
              <div>${item.price.toFixed(2)}</div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                -
              </Button>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => updateQuantity(item.id, Number.parseInt(e.target.value, 10))}
                className="w-16 text-center"
              />
              <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                +
              </Button>
              <Button variant="destructive" size="icon" onClick={() => removeFromCart(item.id)}>
                ×
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  total: number
  items: CartItem[]
  customerId?: number | null
  onPaymentComplete: (paymentMethod: string, amountPaid: number) => void
}

export function PaymentModal({ isOpen, onClose, total, items, customerId, onPaymentComplete }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [amountPaid, setAmountPaid] = useState(total.toFixed(2))
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePayment = async () => {
    setError(null)
    setIsProcessing(true)

    try {
      const userId = localStorage.getItem("userId")
      if (!userId) {
        throw new Error("User not authenticated")
      }

      // Validate inputs
      if (!items.length) {
        throw new Error("Cart is empty")
      }

      if (Number(amountPaid) < total) {
        throw new Error("Amount paid must be greater than or equal to total")
      }

      console.log("Processing payment with data:", {
        userId,
        total,
        items,
        paymentMethod,
        customerId,
      })

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
        customer_id: customerId || undefined,
      }

      const result = await createTransaction(transaction)
      console.log("Transaction created successfully:", result)

      onPaymentComplete(paymentMethod, Number(amountPaid))
      onClose()

      toast({
        title: "Payment Successful",
        description: `Transaction #${result.id} completed successfully.`,
      })
    } catch (error) {
      console.error("Payment error:", error)
      setError(error instanceof Error ? error.message : "Failed to process payment")
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <label htmlFor="payment-method">Payment Method:</label>
            <Select onValueChange={setPaymentMethod} defaultValue={paymentMethod}>
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="credit">Credit Card</SelectItem>
                <SelectItem value="debit">Debit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <label htmlFor="amount-paid">Amount Paid:</label>
            <Input
              id="amount-paid"
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              min={total}
              step="0.01"
            />
          </div>
          <div className="text-2xl font-bold">Total: ${total.toFixed(2)}</div>
          {paymentMethod === "cash" && Number(amountPaid) >= total && (
            <div className="text-xl">Change: ${(Number(amountPaid) - total).toFixed(2)}</div>
          )}
          {error && <div className="text-sm text-red-500">{error}</div>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={isProcessing || Number(amountPaid) < total}>
            {isProcessing ? "Processing..." : "Complete Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  sale: { total: number; items: CartItem[] } | null
}

export function ReceiptModal({ isOpen, onClose, sale }: ReceiptModalProps) {
  if (!sale) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {sale.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${sale.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
          <Button variant="outline">Print Receipt</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

