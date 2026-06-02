import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Loader2, User, Camera } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import type { DeliveryProfile } from "../lib/deliveryProfile";

type Props = {
  userId: string;
  initial?: DeliveryProfile | null;
  title?: string;
  onSave: (profile: DeliveryProfile) => Promise<void>;
  requireForGps?: boolean;
};

export function DeliveryProfileGate({ userId, initial, title, onSave, requireForGps }: Props) {
  const { t } = useLanguage();
  const d = t.delivery;
  const [name, setName] = useState(initial?.name || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handlePhoto = (file: File | null) => {
    if (!file) return;
    if (file.size > 800_000) {
      setError(d.photoTooLarge || "Photo must be under 800KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!name.trim() || !phone.trim()) {
      setError(d.profileRequired || "Name and phone are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        userId,
        name: name.trim(),
        phone: phone.trim(),
        photoUrl: photoUrl || undefined,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      setError(d.saveFailed || "Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 dark:border dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
          {title || d.profileTitle || "Delivery driver profile"}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {requireForGps
            ? d.profileForGps || "Enter your details before enabling GPS tracking."
            : d.profileSubtitle || "Required to access the delivery dashboard."}
        </p>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden flex items-center justify-center shrink-0">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <div>
              <Label className="text-xs text-gray-500">{d.photo || "Photo (optional)"}</Label>
              <Input
                type="file"
                accept="image/*"
                className="mt-1 text-sm"
                onChange={(e) => handlePhoto(e.target.files?.[0] || null)}
              />
              <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                <Camera className="h-3 w-3" /> {d.photoHint || "JPG/PNG, max 800KB"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dp-name">{d.driverName || "Full name"}</Label>
            <Input id="dp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={d.namePlaceholder || "Ahmed Hassan"} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dp-phone">{d.driverPhone || "Phone number"}</Label>
            <Input id="dp-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 1xx xxx xxxx" />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : d.saveProfile || "Save & continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
