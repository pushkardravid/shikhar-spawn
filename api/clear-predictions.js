import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function isAuthed(req) {
  const expected = process.env.ADMIN_PASSWORD || "";
  return Boolean(expected) && req.headers["x-admin-password"] === expected;
}

export default async function handler(req, res) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "Use DELETE" });
  if (!isAuthed(req)) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { error } = await supabase
      .from("guest_predictions")
      .delete()
      .not("id", "is", null);

    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error?.message || "Failed to clear predictions." });
  }
}
