import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { username, password, role } = await req.json()

    // Check if username already exists
    const { data: existingUser } = await supabase.from("users").select("username").eq("username", username).single()

    if (existingUser) {
      return NextResponse.json({ error: "Username already taken." }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert new user
    const { data, error } = await supabase
      .from("users")
      .insert([{ username, password: hashedPassword, role }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to create user." }, { status: 400 })
    }

    return NextResponse.json({
      message: "User registered successfully",
      user: {
        id: data.id,
        username: data.username,
        role: data.role,
      },
    })
  } catch (error) {
    console.error("Registration Error:", error)
    return NextResponse.json({ error: "An error occurred during registration." }, { status: 500 })
  }
}

