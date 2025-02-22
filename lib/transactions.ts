import { supabase } from "./supabase"

export interface Transaction {
  id: number
  date: string
  type: "sale" | "refund"
  amount: number
  status: "completed" | "pending" | "cancelled"
  payment_method: string
  items: {
    id: number
    name: string
    quantity: number
    price: number
  }[]
  customer_id?: string
  cashier_id: string
}

export async function createTransaction(transaction: Omit<Transaction, "id" | "date">) {
  const { data, error } = await supabase
    .from("transactions")
    .insert([
      {
        ...transaction,
        date: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating transaction:", error)
    throw new Error("Failed to create transaction")
  }

  // Update inventory quantities
  for (const item of transaction.items) {
    const { error: inventoryError } = await supabase.rpc("update_inventory", {
      p_item_id: item.id,
      p_quantity: -item.quantity, // Negative for sales, positive for refunds
    })

    if (inventoryError) {
      console.error("Error updating inventory:", inventoryError)
      throw new Error("Failed to update inventory")
    }
  }

  return data
}

export async function getTransactions(dateRange?: { from: string; to: string }) {
  let query = supabase
    .from("transactions")
    .select(`
      *,
      items,
      cashier:cashier_id(username),
      customer:customer_id(name)
    `)
    .order("date", { ascending: false })

  if (dateRange) {
    query = query.gte("date", dateRange.from).lte("date", dateRange.to)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching transactions:", error)
    throw new Error("Failed to fetch transactions")
  }

  return data
}

