import { supabase } from "./supabase"

export interface Customer {
  id: number
  name: string
  phone: string
  email: string
  loyalty_points: number
  total_spent: number
  created_at: string
  updated_at: string
}

export async function createCustomer(
  customer: Omit<Customer, "id" | "loyalty_points" | "total_spent" | "created_at" | "updated_at">,
): Promise<Customer> {
  const { data, error } = await supabase
    .from("customers")
    .insert([{ ...customer, loyalty_points: 0, total_spent: 0 }])
    .select()
    .single()

  if (error) {
    console.error("Error creating customer:", error)
    throw new Error("Failed to create customer")
  }

  return data
}

export async function updateCustomer(id: number, customer: Partial<Customer>): Promise<Customer> {
  const { data, error } = await supabase.from("customers").update(customer).eq("id", id).select().single()

  if (error) {
    console.error("Error updating customer:", error)
    throw new Error("Failed to update customer")
  }

  return data
}

export async function deleteCustomer(id: number): Promise<void> {
  const { error } = await supabase.from("customers").delete().eq("id", id)

  if (error) {
    console.error("Error deleting customer:", error)
    throw new Error("Failed to delete customer")
  }
}

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from("customers").select("*").order("name")

  if (error) {
    console.error("Error fetching customers:", error)
    throw new Error("Failed to fetch customers")
  }

  // Ensure all numerical values have defaults
  return (data || []).map((customer) => ({
    ...customer,
    loyalty_points: customer.loyalty_points || 0,
    total_spent: customer.total_spent || 0,
  }))
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  if (!query || query.length < 2) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%,email.ilike.%${query}%`)
      .order("name")
      .limit(10)

    if (error) {
      console.error("Supabase search error:", error)
      throw new Error(`Database search failed: ${error.message}`)
    }

    // Ensure all numerical values have defaults
    return (data || []).map((customer) => ({
      ...customer,
      loyalty_points: customer.loyalty_points || 0,
      total_spent: customer.total_spent || 0,
    }))
  } catch (error) {
    console.error("Customer search error:", error)
    throw error instanceof Error ? error : new Error("Failed to search customers")
  }
}

