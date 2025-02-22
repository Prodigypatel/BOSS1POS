"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PlusCircle, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "@/components/ui/use-toast"
import { Spinner } from "@/components/ui/spinner"

interface Item {
  id: number
  barcode: string
  name: string
  quantity: number
  case_quantity: number
  price: number
  average_cost: number
  margin: number
  size: string
  category: string
  supplier: string
  units_per_case: number
  case_cost: number
  rank: number
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [editItem, setEditItem] = useState<Item | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("items").select("*").order("name", { ascending: true })

      if (error) {
        throw error
      }

      setItems(data || [])
    } catch (error) {
      console.error("Error fetching items:", error)
      toast({
        title: "Error",
        description: "Failed to fetch items. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditItem = (item: Item) => {
    setEditItem(item)
    setIsEditDialogOpen(true)
  }

  const handleSaveItem = async (updatedItem: Item) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("items")
        .update({
          barcode: updatedItem.barcode,
          name: updatedItem.name,
          quantity: updatedItem.quantity,
          case_quantity: updatedItem.case_quantity,
          price: updatedItem.price,
          average_cost: updatedItem.average_cost,
          margin: updatedItem.margin,
          size: updatedItem.size,
          category: updatedItem.category,
          supplier: updatedItem.supplier,
          units_per_case: updatedItem.units_per_case,
          case_cost: updatedItem.case_cost,
          rank: updatedItem.rank,
        })
        .eq("id", updatedItem.id)
        .select()

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error("No data returned after update")
      }

      setItems(items.map((item) => (item.id === updatedItem.id ? data[0] : item)))
      setIsEditDialogOpen(false)
      toast({
        title: "Success",
        description: "Item updated successfully.",
      })
    } catch (error) {
      console.error("Error updating item:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = async (newItem: Omit<Item, "id">) => {
    setIsLoading(true)
    try {
      // Validate required fields
      const requiredFields = [
        "barcode",
        "name",
        "quantity",
        "price",
        "average_cost",
        "size",
        "category",
        "supplier",
        "units_per_case",
        "case_cost",
      ]

      for (const field of requiredFields) {
        if (!newItem[field as keyof typeof newItem]) {
          throw new Error(`${field.replace("_", " ")} is required`)
        }
      }

      // Validate numeric fields
      const numericFields = [
        "quantity",
        "case_quantity",
        "price",
        "average_cost",
        "margin",
        "units_per_case",
        "case_cost",
        "rank",
      ]

      for (const field of numericFields) {
        const value = newItem[field as keyof typeof newItem]
        if (typeof value !== "number" || isNaN(value)) {
          throw new Error(`${field.replace("_", " ")} must be a valid number`)
        }
      }

      const { data, error } = await supabase
        .from("items")
        .insert([
          {
            barcode: newItem.barcode,
            name: newItem.name,
            quantity: newItem.quantity,
            case_quantity: newItem.case_quantity,
            price: newItem.price,
            average_cost: newItem.average_cost,
            margin: newItem.margin,
            size: newItem.size,
            category: newItem.category,
            supplier: newItem.supplier,
            units_per_case: newItem.units_per_case,
            case_cost: newItem.case_cost,
            rank: newItem.rank,
          },
        ])
        .select()

      if (error) {
        throw error
      }

      if (!data || data.length === 0) {
        throw new Error("No data returned after insert")
      }

      setItems([...items, data[0]])
      setIsEditDialogOpen(false)
      toast({
        title: "Success",
        description: "Item added successfully.",
      })
    } catch (error) {
      console.error("Error adding item:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredItems = items.filter(
    (item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.barcode.includes(searchTerm),
  )

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
          <h2 className="text-3xl font-bold tracking-tight">Items</h2>
          <div className="flex items-center space-x-2">
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditItem(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                </DialogHeader>
                <ItemForm item={editItem} onSave={editItem ? handleSaveItem : handleAddItem} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spinner />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Barcode</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>QTY</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Avg. Cost</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Units/Case</TableHead>
                <TableHead>Case Cost</TableHead>
                <TableHead>Rank</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.barcode}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    {item.quantity} ({item.case_quantity} cases)
                  </TableCell>
                  <TableCell>${item.price.toFixed(2)}</TableCell>
                  <TableCell>${item.average_cost.toFixed(2)}</TableCell>
                  <TableCell>{item.margin.toFixed(2)}%</TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell>{item.units_per_case}</TableCell>
                  <TableCell>${item.case_cost.toFixed(2)}</TableCell>
                  <TableCell>{item.rank}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleEditItem(item)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}

interface ItemFormProps {
  item: Item | null
  onSave: (item: any) => void
}

function ItemForm({ item, onSave }: ItemFormProps) {
  const [formData, setFormData] = useState<Item>(
    item || {
      id: 0,
      barcode: "",
      name: "",
      quantity: 0,
      case_quantity: 0,
      price: 0,
      average_cost: 0,
      margin: 0,
      size: "",
      category: "",
      supplier: "",
      units_per_case: 0,
      case_cost: 0,
      rank: 0,
    },
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const numericFields = [
      "quantity",
      "case_quantity",
      "price",
      "average_cost",
      "margin",
      "units_per_case",
      "case_cost",
      "rank",
    ]

    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? Number(value) : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="barcode">Barcode *</Label>
          <Input id="barcode" name="barcode" value={formData.barcode} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantity *</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="case_quantity">Case Quantity</Label>
          <Input
            id="case_quantity"
            name="case_quantity"
            type="number"
            value={formData.case_quantity}
            onChange={handleChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="average_cost">Average Cost *</Label>
          <Input
            id="average_cost"
            name="average_cost"
            type="number"
            step="0.01"
            value={formData.average_cost}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="margin">Margin (%)</Label>
          <Input id="margin" name="margin" type="number" step="0.01" value={formData.margin} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="size">Size *</Label>
          <Input id="size" name="size" value={formData.size} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Input id="category" name="category" value={formData.category} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier *</Label>
          <Input id="supplier" name="supplier" value={formData.supplier} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="units_per_case">Units per Case *</Label>
          <Input
            id="units_per_case"
            name="units_per_case"
            type="number"
            value={formData.units_per_case}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="case_cost">Case Cost *</Label>
          <Input
            id="case_cost"
            name="case_cost"
            type="number"
            step="0.01"
            value={formData.case_cost}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rank">Rank</Label>
          <Input id="rank" name="rank" type="number" value={formData.rank} onChange={handleChange} />
        </div>
      </div>
      <Button type="submit">{item ? "Update Item" : "Add Item"}</Button>
    </form>
  )
}

