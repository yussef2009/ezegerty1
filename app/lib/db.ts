import { supabase } from "../context/AuthContext";

const TABLE_NAME = "kv_store_97c3633e";

export type DatabaseStatus = "ok" | "missing_table" | "permission_denied" | "error";

function isTableMissingError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    !!error.message?.includes("relation") ||
    !!error.message?.includes("does not exist")
  );
}

function isPermissionError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "42501" || !!error.message?.toLowerCase().includes("permission");
}

const isLocalFallbackMode = (): boolean => {
  return localStorage.getItem("db_fallback_mode") === "true";
};

const enableLocalFallback = () => {
  if (localStorage.getItem("db_fallback_mode") !== "true") {
    localStorage.setItem("db_fallback_mode", "true");
    console.warn(
      `Supabase table '${TABLE_NAME}' is not available. Using browser localStorage (data will not sync across devices). Run supabase/migrations/001_kv_store.sql in your Supabase project.`
    );
  }
};

/** Call on app load; clears stale fallback flag when the table exists again. */
export const probeDatabase = async (): Promise<DatabaseStatus> => {
  try {
    const { error } = await supabase.from(TABLE_NAME).select("key").limit(1);
    if (error) {
      if (isTableMissingError(error)) return "missing_table";
      if (isPermissionError(error)) {
        console.error(
          "Supabase RLS blocked access to kv_store. Run supabase/migrations/001_kv_store.sql.",
          error
        );
        return "permission_denied";
      }
      console.error("Supabase database probe failed:", error);
      return "error";
    }
    if (isLocalFallbackMode()) {
      localStorage.removeItem("db_fallback_mode");
    }
    return "ok";
  } catch (err) {
    console.error("Supabase database probe failed:", err);
    return "error";
  }
};

export const dbSet = async (key: string, value: any): Promise<void> => {
  if (isLocalFallbackMode()) {
    localStorage.setItem(`kv:${key}`, JSON.stringify(value));
    return;
  }

  const { error } = await supabase.from(TABLE_NAME).upsert({ key, value });
  if (!error) return;

  if (isTableMissingError(error)) {
    enableLocalFallback();
    localStorage.setItem(`kv:${key}`, JSON.stringify(value));
    return;
  }

  if (isPermissionError(error)) {
    console.error("Database write denied (check Supabase RLS policies):", error);
    throw error;
  }

  throw error;
};

export const dbGet = async (key: string): Promise<any> => {
  if (isLocalFallbackMode()) {
    const val = localStorage.getItem(`kv:${key}`);
    return val ? JSON.parse(val) : null;
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (!error) return data?.value ?? null;

  if (isTableMissingError(error)) {
    enableLocalFallback();
    const val = localStorage.getItem(`kv:${key}`);
    return val ? JSON.parse(val) : null;
  }

  if (isPermissionError(error)) {
    console.error("Database read denied (check Supabase RLS policies):", error);
    throw error;
  }

  throw error;
};

export const dbGetByPrefix = async (prefix: string): Promise<any[]> => {
  if (isLocalFallbackMode()) {
    const results: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith(`kv:${prefix}`)) {
        const val = localStorage.getItem(storageKey);
        if (val) results.push(JSON.parse(val));
      }
    }
    return results;
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("value")
    .like("key", prefix + "%");

  if (!error) return data?.map((d) => d.value) || [];

  if (isTableMissingError(error)) {
    enableLocalFallback();
    const results: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith(`kv:${prefix}`)) {
        const val = localStorage.getItem(storageKey);
        if (val) results.push(JSON.parse(val));
      }
    }
    return results;
  }

  if (isPermissionError(error)) {
    console.error("Database read denied (check Supabase RLS policies):", error);
    throw error;
  }

  throw error;
};

export const resetDatabaseConnection = () => {
  localStorage.removeItem("db_fallback_mode");
};
