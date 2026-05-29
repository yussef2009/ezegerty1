import { supabase } from "../context/AuthContext";

const TABLE_NAME = "kv_store_97c3633e";

// Check if we are running in local storage fallback mode
const isLocalFallbackMode = (): boolean => {
  return localStorage.getItem("db_fallback_mode") === "true";
};

// Enable fallback mode
const enableLocalFallback = () => {
  if (localStorage.getItem("db_fallback_mode") !== "true") {
    localStorage.setItem("db_fallback_mode", "true");
    console.warn("Supabase database table '" + TABLE_NAME + "' not found. Falling back to localStorage mode.");
  }
};

export const dbSet = async (key: string, value: any): Promise<void> => {
  if (isLocalFallbackMode()) {
    localStorage.setItem(`kv:${key}`, JSON.stringify(value));
    return;
  }

  try {
    const { error } = await supabase.from(TABLE_NAME).upsert({ key, value });
    if (error) {
      // Check if the error indicates table not found
      if (error.code === "PGRST205" || error.message?.includes("relation") || error.message?.includes("does not exist")) {
        enableLocalFallback();
        localStorage.setItem(`kv:${key}`, JSON.stringify(value));
        return;
      }
      throw error;
    }
  } catch (err) {
    console.error("Database upsert failed, switching to localStorage:", err);
    enableLocalFallback();
    localStorage.setItem(`kv:${key}`, JSON.stringify(value));
  }
};

export const dbGet = async (key: string): Promise<any> => {
  if (isLocalFallbackMode()) {
    const val = localStorage.getItem(`kv:${key}`);
    return val ? JSON.parse(val) : null;
  }

  try {
    const { data, error } = await supabase.from(TABLE_NAME).select("value").eq("key", key).maybeSingle();
    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("relation") || error.message?.includes("does not exist")) {
        enableLocalFallback();
        const val = localStorage.getItem(`kv:${key}`);
        return val ? JSON.parse(val) : null;
      }
      throw error;
    }
    return data?.value || null;
  } catch (err) {
    console.error("Database fetch failed, falling back to localStorage:", err);
    enableLocalFallback();
    const val = localStorage.getItem(`kv:${key}`);
    return val ? JSON.parse(val) : null;
  }
};

export const dbGetByPrefix = async (prefix: string): Promise<any[]> => {
  if (isLocalFallbackMode()) {
    const results: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`kv:${prefix}`)) {
        const val = localStorage.getItem(key);
        if (val) results.push(JSON.parse(val));
      }
    }
    return results;
  }

  try {
    const { data, error } = await supabase.from(TABLE_NAME).select("value").like("key", prefix + "%");
    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("relation") || error.message?.includes("does not exist")) {
        enableLocalFallback();
        // Fall back to local search
        const results: any[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`kv:${prefix}`)) {
            const val = localStorage.getItem(key);
            if (val) results.push(JSON.parse(val));
          }
        }
        return results;
      }
      throw error;
    }
    return data?.map((d) => d.value) || [];
  } catch (err) {
    console.error("Database prefix fetch failed, falling back to localStorage:", err);
    enableLocalFallback();
    const results: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`kv:${prefix}`)) {
        const val = localStorage.getItem(key);
        if (val) results.push(JSON.parse(val));
      }
    }
    return results;
  }
};

// Check database status and clear fallback mode if desired
export const resetDatabaseConnection = () => {
  localStorage.removeItem("db_fallback_mode");
};
