"use client"

import * as React from "react"
import { Check, ChevronsUpDown, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { searchCustomers, createCustomer } from "@/lib/customers"
import type { Customer } from "@/lib/customers"
import { toast } from "@/components/ui/use-toast"

interface CustomerSearchProps {
  onSelect: (customer: Customer | null) => void
}

export function CustomerSearch({ onSelect }: CustomerSearchProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const [customers, setCustomers] = React.useState<Customer[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isAddCustomerOpen, setIsAddCustomerOpen] = React.useState(false)
  const [searchError, setSearchError] = React.useState<string | null>(null)

  const handleSearch = React.useCallback(async (search: string) => {
    if (search.length < 2) {
      setCustomers([])
      return
    }

    setIsLoading(true)
    setSearchError(null)

    try {
      const results = await searchCustomers(search)
      setCustomers(results)
    } catch (error) {
      console.error("Customer search error:", error)
      setSearchError(error instanceof Error ? error.message : "Failed to search customers")
      setCustomers([])
      toast({
        title: "Search Error",
        description: error instanceof Error ? error.message : "Failed to search customers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-[300px] justify-between">
            {value ? customers.find((customer) => customer.id.toString() === value)?.name : "Search customer..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput
              placeholder="Search by name, phone, or email..."
              onValueChange={handleSearch}
              disabled={isLoading}
            />
            <CommandList>
              <CommandEmpty>
                <div className="flex flex-col items-center py-4">
                  <p className="text-sm text-muted-foreground">No customer found.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setOpen(false)
                      setIsAddCustomerOpen(true)
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add New Customer
                  </Button>
                </div>
              </CommandEmpty>
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.id.toString()}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue)
                      onSelect(currentValue === value ? null : customer)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn("mr-2 h-4 w-4", value === customer.id.toString() ? "opacity-100" : "opacity-0")}
                    />
                    <div className="flex flex-col">
                      <span>{customer.name}</span>
                      <span className="text-sm text-muted-foreground">{customer.phone}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <QuickAddCustomer
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onCustomerAdded={(customer) => {
          onSelect(customer)
          setValue(customer.id.toString())
          setIsAddCustomerOpen(false)
        }}
      />
    </>
  )
}

interface QuickAddCustomerProps {
  isOpen: boolean
  onClose: () => void
  onCustomerAdded: (customer: Customer) => void
}

function QuickAddCustomer({ isOpen, onClose, onCustomerAdded }: QuickAddCustomerProps) {
  const [formData, setFormData] = React.useState({
    name: "",
    phone: "",
    email: "",
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.phone) {
        throw new Error("Name and phone are required")
      }

      const customer = await createCustomer(formData)
      toast({
        title: "Success",
        description: "Customer added successfully.",
      })
      onCustomerAdded(customer)
      setFormData({ name: "", phone: "", email: "" })
    } catch (error) {
      console.error("Error adding customer:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add customer. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={isSubmitting}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

