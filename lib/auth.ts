import { supabase } from "./supabase"

export async function getSession() {
  const userId = localStorage.getItem("userId")
  const userRole = localStorage.getItem("userRole")

  if (!userId || !userRole) {
    return null
  }

  return { user: { id: userId, role: userRole } }
}

export async function signIn(username: string, password: string) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, password, role")
      .eq("username", username)
      .single()

    if (error) {
      console.error("Supabase error:", error)
      throw new Error("Invalid username or password")
    }

    if (!data) {
      throw new Error("User not found")
    }

    // In a production environment, you should use proper password hashing
    if (data.password !== password) {
      throw new Error("Invalid username or password")
    }

    // Store user data in localStorage
    localStorage.setItem("userId", data.id)
    localStorage.setItem("userRole", data.role)
    localStorage.setItem("username", data.username)

    // Set cookies with proper attributes
    document.cookie = `userRole=${data.role}; path=/; SameSite=Strict`
    document.cookie = `userId=${data.id}; path=/; SameSite=Strict`

    return { user: { id: data.id, role: data.role } }
  } catch (error) {
    console.error("Sign in error:", error)
    throw error
  }
}

export async function signOut() {
  try {
    // Clear localStorage
    localStorage.removeItem("userId")
    localStorage.removeItem("userRole")
    localStorage.removeItem("username")

    // Clear cookies with proper attributes
    document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict"
    document.cookie = "userId=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict"
  } catch (error) {
    console.error("Sign out error:", error)
    throw error
  }
}

export function getUserRole(): string | null {
  return localStorage.getItem("userRole")
}

