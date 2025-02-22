"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  )
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  total: number
  onPaymentComplete: () => void
}

export function PaymentModal({ isOpen, onClose, total, onPaymentComplete }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [amountPaid, setAmountPaid] = useState(total.toFixed(2))

  const handlePayment = () => {
    // Here you would integrate with your payment processing system
    console.log(`Processing ${paymentMethod} payment for $${amountPaid}`)
    onPaymentComplete()
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
            <Input id="amount-paid" type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
          </div>
          <div className="text-2xl font-bold">Total: ${total.toFixed(2)}</div>
          {paymentMethod === "cash" && (
            <div className="text-xl">
              Change: $
              {(Number.parseFloat(amountPaid) - total > 0 ? Number.parseFloat(amountPaid) - total : 0).toFixed(2)}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handlePayment}>Complete Payment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

