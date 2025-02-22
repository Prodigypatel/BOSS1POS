"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase"

interface User {
  id: string
  email: string
  role: "Admin" | "Cashier" | "Manager"
}

interface RolePermissions {
  [key: string]: {
    [key: string]: boolean
  }
}

export default function SettingsPage() {
  const [storeDetails, setStoreDetails] = useState({
    name: "My Liquor Store",
    address: "123 Main St, Anytown, USA",
    phone: "(555) 123-4567",
    email: "contact@myliquorstore.com",
  })

  const [taxRate, setTaxRate] = useState("8.5")
  const [receiptFooter, setReceiptFooter] = useState("Thank you for your purchase!")
  const [currency, setCurrency] = useState("USD")
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY")
  const [enableLoyaltyProgram, setEnableLoyaltyProgram] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [newUser, setNewUser] = useState({ email: "", password: "", role: "Cashier" as const })
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({
    Admin: { manageInventory: true, processSales: true, viewReports: true, manageUsers: true, approveRefunds: true },
    Manager: { manageInventory: true, processSales: true, viewReports: true, manageUsers: false, approveRefunds: true },
    Cashier: {
      manageInventory: false,
      processSales: true,
      viewReports: false,
      manageUsers: false,
      approveRefunds: false,
    },
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("*")
    if (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      })
    } else {
      setUsers(data || [])
    }
  }

  const handleStoreDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setStoreDetails({ ...storeDetails, [e.target.name]: e.target.value })
  }

  const handleSaveSettings = () => {
    // Here you would typically save the settings to your backend
    console.log("Saving settings:", {
      storeDetails,
      taxRate,
      receiptFooter,
      currency,
      dateFormat,
      enableLoyaltyProgram,
      users,
      rolePermissions,
    })
    toast({
      title: "Settings saved",
      description: "Your changes have been successfully saved.",
    })
  }

  const handleAddUser = async () => {
    if (newUser.email && newUser.password) {
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            role: newUser.role,
          },
        },
      })

      if (error) {
        console.error("Error adding user:", error)
        toast({
          title: "Error",
          description: "Failed to add user. Please try again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "User added",
          description: `${newUser.email} has been added as a ${newUser.role}.`,
        })
        fetchUsers()
      }

      setNewUser({ email: "", password: "", role: "Cashier" })
    }
  }

  const handleUpdateUser = async (userId: string, newRole: "Admin" | "Cashier" | "Manager") => {
    const { data, error } = await supabase.from("users").update({ role: newRole }).eq("id", userId)

    if (error) {
      console.error("Error updating user:", error)
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "User updated",
        description: `User role has been updated to ${newRole}.`,
      })
      fetchUsers()
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const { error } = await supabase.from("users").delete().eq("id", userId)

    if (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      })
    } else {
      toast({
        title: "User deleted",
        description: "The user has been successfully deleted.",
      })
      fetchUsers()
    }
  }

  const handlePermissionChange = (role: string, permission: string, checked: boolean) => {
    setRolePermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: checked,
      },
    }))
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
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        </div>
        <Tabs defaultValue="store" className="space-y-4">
          <TabsList>
            <TabsTrigger value="store">Store</TabsTrigger>
            <TabsTrigger value="tax">Tax</TabsTrigger>
            <TabsTrigger value="receipt">Receipt</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="users">Users & Permissions</TabsTrigger>
          </TabsList>
          <TabsContent value="store" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Store Details</CardTitle>
                <CardDescription>Manage your store's basic information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store-name">Store Name</Label>
                  <Input id="store-name" name="name" value={storeDetails.name} onChange={handleStoreDetailsChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-address">Address</Label>
                  <Textarea
                    id="store-address"
                    name="address"
                    value={storeDetails.address}
                    onChange={handleStoreDetailsChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-phone">Phone</Label>
                  <Input id="store-phone" name="phone" value={storeDetails.phone} onChange={handleStoreDetailsChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store-email">Email</Label>
                  <Input
                    id="store-email"
                    name="email"
                    type="email"
                    value={storeDetails.email}
                    onChange={handleStoreDetailsChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="tax" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tax Settings</CardTitle>
                <CardDescription>Configure your store's tax rates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
                  <Input id="tax-rate" type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="receipt" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Receipt Customization</CardTitle>
                <CardDescription>Customize your receipt's appearance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="receipt-footer">Receipt Footer</Label>
                  <Textarea
                    id="receipt-footer"
                    value={receiptFooter}
                    onChange={(e) => setReceiptFooter(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Preferences</CardTitle>
                <CardDescription>Configure system-wide settings.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                      <SelectItem value="JPY">Japanese Yen (JPY)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger id="date-format">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="loyalty-program"
                    checked={enableLoyaltyProgram}
                    onCheckedChange={setEnableLoyaltyProgram}
                  />
                  <Label htmlFor="loyalty-program">Enable Loyalty Program</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Roles & Permissions</CardTitle>
                <CardDescription>Manage users and their access levels.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(newRole: "Admin" | "Cashier" | "Manager") =>
                              handleUpdateUser(user.id, newRole)
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Admin">Admin</SelectItem>
                              <SelectItem value="Cashier">Cashier</SelectItem>
                              <SelectItem value="Manager">Manager</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="ml-2"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Add New User</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>Enter the details for the new user.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-user-email">Email</Label>
                        <Input
                          id="new-user-email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-user-password">Password</Label>
                        <Input
                          id="new-user-password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-user-role">Role</Label>
                        <Select
                          value={newUser.role}
                          onValueChange={(role: "Admin" | "Cashier" | "Manager") => setNewUser({ ...newUser, role })}
                        >
                          <SelectTrigger id="new-user-role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Cashier">Cashier</SelectItem>
                            <SelectItem value="Manager">Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddUser}>Add User</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
                <CardDescription>Define access levels for each role.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Permission</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Cashier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(rolePermissions.Admin).map(([permission, _]) => (
                      <TableRow key={permission}>
                        <TableCell>{permission}</TableCell>
                        {(["Admin", "Manager", "Cashier"] as const).map((role) => (
                          <TableCell key={role}>
                            <Checkbox
                              checked={rolePermissions[role][permission as keyof (typeof rolePermissions)[typeof role]]}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(role, permission, checked as boolean)
                              }
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <Button onClick={handleSaveSettings}>Save All Settings</Button>
      </div>
    </div>
  )
}

