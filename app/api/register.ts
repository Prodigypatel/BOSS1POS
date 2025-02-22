import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { username, password, role } = await req.json();

  // Check if the username already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("username")
    .eq("username", username)
    .single();

  if (existingUser) {
    return new Response(JSON.stringify({ error: "Username already taken." }), { status: 400 });
  }

  // Hash the password before storing
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert new user into Supabase
  const { data, error } = await supabase
    .from("users")
    .insert([{ username, password: hashedPassword, role }]);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ message: "User registered successfully" }), { status: 200 });
}

