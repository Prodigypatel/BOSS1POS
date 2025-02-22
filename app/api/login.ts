import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  console.log("Login Attempt:", username); // Debugging log

  // Fetch user from Supabase
  const { data: user, error } = await supabase
    .from("users")
    .select("id, username, password, role")
    .eq("username", username)
    .single();

  if (error || !user) {
    console.error("User Not Found:", error);
    return new Response(JSON.stringify({ error: "Invalid username or password." }), { status: 400 });
  }

  // Compare hashed password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    console.error("Incorrect Password");
    return new Response(JSON.stringify({ error: "Incorrect password." }), { status: 400 });
  }

  console.log("Login Successful:", user.role);

  // Return user data without password
  return new Response(JSON.stringify({ id: user.id, username: user.username, role: user.role }), { status: 200 });
}

