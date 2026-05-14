import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Auth endpoints
app.post("/make-server-97c3633e/auth/signup", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      email_confirm: true
    });
    
    if (error) throw error;
    
    return c.json({ user: data.user });
  } catch (e) {
    console.error("Signup error:", e);
    return c.json({ error: e.message }, 500);
  }
});

// Health check endpoint
app.get("/make-server-97c3633e/health", (c) => {
  return c.json({ status: "ok" });
});

// KV Store Endpoints
app.post("/make-server-97c3633e/kv/set", async (c) => {
  try {
    const { key, value } = await c.req.json();
    if (!key || value === undefined) return c.json({ error: "Missing key or value" }, 400);
    await kv.set(key, value);
    return c.json({ success: true });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

app.get("/make-server-97c3633e/kv/get/:key", async (c) => {
  try {
    const key = c.req.param("key");
    const value = await kv.get(key);
    return c.json({ value });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

app.get("/make-server-97c3633e/kv/prefix/:prefix", async (c) => {
  try {
    const prefix = c.req.param("prefix");
    const values = await kv.getByPrefix(prefix);
    return c.json({ values });
  } catch (e) {
    return c.json({ error: e.message }, 500);
  }
});

Deno.serve(app.fetch);