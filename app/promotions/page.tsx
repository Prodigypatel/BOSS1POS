"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { PlusCircle } from "lucide-react"
import { Combobox } from "@/components/ui/combobox"

interface Promotion {
  id: number
  name: string
  type: "percentage" | "fixed"
  value: number
  start_date: string
  end_date: string
  applicable_items: string
  quantity_needed: number
}

interface Item {
  id: number
  name: string
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    fetchPromotions()
    fetchItems()
  }, [])

  async function fetchPromotions() {
    const { data, error } = await supabase.from("promotions").select("*").order("start_date", { ascending: false })

    if (error) {
      console.error("Error fetching promotions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch promotions. Please try again.",
        variant: "destructive",
      })
    } else {
      setPromotions(data || [])
    }
  }

  async function fetchItems() {
    const { data, error } = await supabase.from("items").select("id, name").order("name", { ascending: true })

    if (error) {
      console.error("Error fetching items:", error)
      toast({
        title: "Error",
        description: "Failed to fetch items. Please try again.",
        variant: "destructive",
      })
    } else {
      setItems(data || [])
    }
  }

  const handleSavePromotion = async (promotion: Omit<Promotion, "id">) => {
    if (editingPromotion) {
      const { data, error } = await supabase.from("promotions").update(promotion).eq("id", editingPromotion.id).select()

      if (error) {
        console.error("Error updating promotion:", error)
        toast({
          title: "Error",
          description: "Failed to update promotion. Please try again.",
          variant: "destructive",
        })
      } else {
        setPromotions(promotions.map((p) => (p.id === editingPromotion.id ? data[0] : p)))
        toast({
          title: "Success",
          description: "Promotion updated successfully.",
        })
      }
    } else {
      const { data, error } = await supabase.from("promotions").insert([promotion]).select()

      if (error) {
        console.error("Error adding promotion:", error)
        toast({
          title: "Error",
          description: "Failed to add promotion. Please try again.",
          variant: "destructive",
        })
      } else {
        setPromotions([...promotions, data[0]])
        toast({
          title: "Success",
          description: "Promotion added successfully.",
        })
      }
    }
    setIsDialogOpen(false)
    setEditingPromotion(null)
  }

  const handleEditPromotion = (promotion: Promotion) => {
    setEditingPromotion(promotion)
    setIsDialogOpen(true)
  }

  const handleDeletePromotion = async (id: number) => {
    const { error } = await supabase.from("promotions").delete().eq("id", id)

    if (error) {
      console.error("Error deleting promotion:", error)
      toast({
        title: "Error",
        description: "Failed to delete promotion. Please try again.",
        variant: "destructive",
      })
    } else {
      setPromotions(promotions.filter((p) => p.id !== id))
      toast({
        title: "Success",
        description: "Promotion deleted successfully.",
      })
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
          <h2 className="text-3xl font-bold tracking-tight">Promotions</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingPromotion(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Promotion
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingPromotion ? "Edit Promotion" : "Add New Promotion"}</DialogTitle>
              </DialogHeader>
              <PromotionForm promotion={editingPromotion} onSave={handleSavePromotion} items={items} />
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Applicable Items</TableHead>
              <TableHead>Quantity Needed</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.map((promotion) => (
              <TableRow key={promotion.id}>
                <TableCell>{promotion.name}</TableCell>
                <TableCell>{promotion.type}</TableCell>
                <TableCell>{promotion.type === "percentage" ? `${promotion.value}%` : `$${promotion.value}`}</TableCell>
                <TableCell>{new Date(promotion.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(promotion.end_date).toLocaleDateString()}</TableCell>
                <TableCell>{promotion.applicable_items}</TableCell>
                <TableCell>{promotion.quantity_needed}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditPromotion(promotion)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeletePromotion(promotion.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

interface PromotionFormProps {
  promotion: Promotion | null
  onSave: (promotion: Omit<Promotion, "id">) => void
  items: Item[]
}

function PromotionForm({ promotion, onSave, items }: PromotionFormProps) {
  const [formData, setFormData] = useState<Omit<Promotion, "id">>(
    promotion || {
      name: "",
      type: "percentage",
      value: 0,
      start_date: new Date().toISOString().split("T")[0],
      end_date: new Date().toISOString().split("T")[0],
      applicable_items: "",
      quantity_needed: 1,
    },
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Promotion Name</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="type">Type</Label>
        <Select
          name="type"
          value={formData.type}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as "percentage" | "fixed" }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select promotion type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="percentage">Percentage</SelectItem>
            <SelectItem value="fixed">Fixed Amount</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="value">Value</Label>
        <Input id="value" name="value" type="number" value={formData.value} onChange={handleChange} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="start_date">Start Date</Label>
        <Input
          id="start_date"
          name="start_date"
          type="date"
          value={formData.start_date}
          onChange={handleChange}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="end_date">End Date</Label>
        <Input id="end_date" name="end_date" type="date" value={formData.end_date} onChange={handleChange} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="applicable_items">Applicable Items</Label>
        <Combobox
          items={items}
          value={formData.applicable_items}
          onChange={(value) => setFormData((prev) => ({ ...prev, applicable_items: value }))}
          placeholder="Select applicable items"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity_needed">Quantity Needed</Label>
        <Input
          id="quantity_needed"
          name="quantity_needed"
          type="number"
          value={formData.quantity_needed}
          onChange={handleChange}
          required
          min="1"
        />
      </div>
      <Button type="submit">{promotion ? "Update Promotion" : "Add Promotion"}</Button>
    </form>
  )
}

