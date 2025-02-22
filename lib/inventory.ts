import { supabase } from "./supabase"

export async function adjustInventory(itemId: number, quantity: number) {
  const { data, error } = await supabase.from("items").update({ quantity: quantity }).eq("id", itemId)

  if (error) {
    console.error("Error adjusting inventory:", error)
    throw new Error("Failed to adjust inventory")
  }

  return data
}

export async function checkLowStock() {
  const { data, error } = await supabase.from("items").select("*").lt("quantity", 10)

  if (error) {
    console.error("Error checking low stock:", error)
    throw new Error("Failed to check low stock")
  }

  return data
}

export async function sendRestockNotification(item: any) {
  // In a real application, this would send an email or notification to the appropriate staff
  console.log(`Low stock alert: ${item.name} (${item.quantity} remaining)`)
}

