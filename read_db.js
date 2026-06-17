const projectId = "pezhnoaegqjbbyfqwavy";
const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlemhub2FlZ3FqYmJ5ZnF3YXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDU0NzEsImV4cCI6MjA4NzQ4MTQ3MX0.TzT7PBdlc5N02eIRgZ1s6jHlp2Ha51VNUFZnZcVMwmg";
const url = `https://${projectId}.supabase.co/rest/v1/kv_store_97c3633e?key=eq.clients_list`;

async function main() {
  try {
    const res = await fetch(url, {
      headers: {
        "apikey": publicAnonKey,
        "Authorization": `Bearer ${publicAnonKey}`
      }
    });
    const data = await res.json();
    console.log("DB DATA:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error fetching db data:", err);
  }
}
main();
