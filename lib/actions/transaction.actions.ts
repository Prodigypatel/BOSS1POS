import { supabase } from "@/lib/supabase"

export interface Transaction {
  id?: number
  date?: string
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
  customer_id?: number
  cashier_id: string
}

export async function createTransaction(transaction: Omit<Transaction, "id" | "date">): Promise<Transaction> {
  console.log("Creating transaction:", transaction) // Debug log

  try {
    // Validate required fields
    if (!transaction.amount || !transaction.items || !transaction.cashier_id) {
      throw new Error("Missing required transaction fields")
    }

    // First, create the transaction record
    const { data: transactionData, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        type: transaction.type,
        amount: transaction.amount,
        status: transaction.status,
        payment_method: transaction.payment_method,
        items: transaction.items,
        customer_id: transaction.customer_id,
        cashier_id: transaction.cashier_id,
        date: new Date().toISOString(),
      })
      .select()
      .single()

    if (transactionError) {
      console.error("Transaction creation error:", transactionError)
      throw new Error(`Failed to create transaction: ${transactionError.message}`)
    }

    if (!transactionData) {
      throw new Error("No transaction data returned from database")
    }

    console.log("Transaction created:", transactionData) // Debug log

    // Then, update inventory quantities
    for (const item of transaction.items) {
      console.log(`Updating inventory for item ${item.id}`) // Debug log

      const { error: inventoryError } = await supabase
        .from("items")
        .update({
          quantity: supabase.raw(`quantity - ${item.quantity}`),
        })
        .eq("id", item.id)

      if (inventoryError) {
        console.error("Inventory update error:", inventoryError)
        // Mark transaction as failed if inventory update fails
        await supabase.from("transactions").update({ status: "cancelled" }).eq("id", transactionData.id)
        throw new Error(`Failed to update inventory: ${inventoryError.message}`)
      }
    }

    // If customer exists, update their total spent and loyalty points
    if (transaction.customer_id && transaction.type === "sale") {
      console.log(`Updating customer ${transaction.customer_id} stats`) // Debug log

      const pointsToAdd = Math.floor(transaction.amount) // 1 point per dollar spent
      const { error: customerError } = await supabase
        .from("customers")
        .update({
          total_spent: supabase.raw(`total_spent + ${transaction.amount}`),
          loyalty_points: supabase.raw(`loyalty_points + ${pointsToAdd}`),
        })
        .eq("id", transaction.customer_id)

      if (customerError) {
        console.error("Customer stats update error:", customerError)
        // Log error but don't fail transaction
      }
    }

    return transactionData
  } catch (error) {
    console.error("Transaction creation error:", error)
    throw error
  }
}

