import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const { username, password, role } = await req.json();
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert user into database
  const { data, error } = await supabase
    .from("users")
    .insert([{ username, password: hashedPassword, role }]);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ message: "User registered successfully" }), { status: 200 });
}

