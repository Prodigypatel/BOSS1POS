import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()
    console.log("Login Attempt:", username)

    // Fetch user from Supabase
    const { data: user, error } = await supabase
      .from("users")
      .select("id, username, password, role")
      .eq("username", username)
      .single()

    if (error || !user) {
      console.error("User Not Found:", error)
      return NextResponse.json({ error: "Invalid username or password." }, { status: 400 })
    }

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      console.error("Incorrect Password")
      return NextResponse.json({ error: "Invalid username or password." }, { status: 400 })
    }

    console.log("Login Successful:", user.role)

    // Return user data without password
    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: user.role,
    })
  } catch (error) {
    console.error("Login Error:", error)
    return NextResponse.json({ error: "An error occurred during login." }, { status: 500 })
  }
}

