import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Plus, LogOut, Image, Mic, MessageSquare, BookOpen, Link, Palette, Users, Trash2, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AssetType = "photo" | "voice_note" | "message" | "journal" | "creative_work" | "account";

interface DigitalAsset {
  id: string;
  title: string;
  type: AssetType;
  description: string | null;
  created_at: string;
}

interface TrustedContact {
  id: string;
  name: string;
  email: string;
  relationship: string | null;
  created_at: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const ASSET_TYPES: { value: AssetType; label: string; icon: React.ReactNode }[] = [
  { value: "photo", label: "Photos", icon: <Image size={14} /> },
  { value: "voice_note", label: "Voice Notes", icon: <Mic size={14} /> },
  { value: "message", label: "Messages", icon: <MessageSquare size={14} /> },
  { value: "journal", label: "Journals", icon: <BookOpen size={14} /> },
  { value: "creative_work", label: "Creative Work", icon: <Palette size={14} /> },
  { value: "account", label: "Accounts", icon: <Link size={14} /> },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{
        backgroundColor: "hsl(179 100% 6%)",
        border: "1px solid hsl(149 28% 79% / 0.10)",
      }}
    >
      {children}
    </div>
  );
}

function AssetTypePill({ type }: { type: AssetType }) {
  const found = ASSET_TYPES.find((t) => t.value === type);
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-sans text-xs"
      style={{
        backgroundColor: "hsl(149 28% 79% / 0.10)",
        color: "hsl(149 28% 79% / 0.75)",
      }}
    >
      {found?.icon}
      {found?.label ?? type}
    </span>
  );
}

// ─── Add Asset Modal ───────────────────────────────────────────────────────────

function AddAssetModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<AssetType>("photo");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const inputStyle = {
    backgroundColor: "hsl(179 100% 8%)",
    border: "1.5px solid hsl(149 28% 79% / 0.18)",
    color: "hsl(149 28% 79%)",
    caretColor: "hsl(149 28% 79%)",
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;
    setSaving(true);
    const { error } = await supabase.from("digital_assets").insert([
      { title: title.trim(), type, description: description.trim() || null, user_id: user.id },
    ]);
    setSaving(false);
    if (error) {
      toast({ title: "Error saving asset", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Asset added!", description: `"${title}" has been mapped.` });
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "hsl(179 100% 4% / 0.85)", backdropFilter: "blur(8px)" }}>
      <div className="relative w-full max-w-md rounded-2xl p-8" style={{ backgroundColor: "hsl(179 100% 6%)", border: "1px solid hsl(149 28% 79% / 0.14)" }}>
        <button onClick={onClose} className="absolute top-5 right-5" style={{ color: "hsl(149 28% 79% / 0.40)" }}>
          <X size={18} />
        </button>

        <h2 className="font-serif text-xl mb-1" style={{ color: "hsl(149 28% 79%)" }}>Add a digital asset</h2>
        <p className="font-sans text-sm mb-6" style={{ color: "hsl(149 28% 79% / 0.45)" }}>Map something meaningful from your digital life.</p>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>Asset title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Family photos – iCloud 2019"
              required
              className="px-4 py-3 rounded-xl font-sans text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.55)")}
              onBlur={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.18)")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>Type</label>
            <div className="flex flex-wrap gap-2">
              {ASSET_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full font-sans text-xs font-medium transition-all duration-150"
                  style={
                    type === t.value
                      ? { backgroundColor: "hsl(149 28% 79%)", color: "hsl(179 100% 8%)" }
                      : { backgroundColor: "hsl(149 28% 79% / 0.08)", color: "hsl(149 28% 79% / 0.60)", border: "1px solid hsl(149 28% 79% / 0.15)" }
                  }
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>Description <span style={{ color: "hsl(149 28% 79% / 0.30)" }}>(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any notes about this asset, access instructions, or intent…"
              rows={3}
              className="px-4 py-3 rounded-xl font-sans text-sm outline-none resize-none transition-all"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.55)")}
              onBlur={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.18)")}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-2 py-3 rounded-full font-sans text-sm font-semibold transition-all duration-300 disabled:opacity-60"
            style={{ backgroundColor: "hsl(149 28% 79%)", color: "hsl(179 100% 8%)" }}
          >
            {saving ? "Saving…" : "Save Asset"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Add Contact Modal ─────────────────────────────────────────────────────────

function AddContactModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [saving, setSaving] = useState(false);

  const inputStyle = {
    backgroundColor: "hsl(179 100% 8%)",
    border: "1.5px solid hsl(149 28% 79% / 0.18)",
    color: "hsl(149 28% 79%)",
    caretColor: "hsl(149 28% 79%)",
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;
    setSaving(true);
    const { error } = await supabase.from("trusted_contacts").insert([
      { name: name.trim(), email: email.trim().toLowerCase(), relationship: relationship.trim() || null, user_id: user.id },
    ]);
    setSaving(false);
    if (error) {
      toast({ title: "Error saving contact", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contact added!", description: `${name} is now a trusted contact.` });
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ backgroundColor: "hsl(179 100% 4% / 0.85)", backdropFilter: "blur(8px)" }}>
      <div className="relative w-full max-w-md rounded-2xl p-8" style={{ backgroundColor: "hsl(179 100% 6%)", border: "1px solid hsl(149 28% 79% / 0.14)" }}>
        <button onClick={onClose} className="absolute top-5 right-5" style={{ color: "hsl(149 28% 79% / 0.40)" }}>
          <X size={18} />
        </button>

        <h2 className="font-serif text-xl mb-1" style={{ color: "hsl(149 28% 79%)" }}>Add a trusted contact</h2>
        <p className="font-sans text-sm mb-6" style={{ color: "hsl(149 28% 79% / 0.45)" }}>Someone who will receive parts of your legacy.</p>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah Chen" required
              className="px-4 py-3 rounded-xl font-sans text-sm outline-none transition-all" style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.55)")}
              onBlur={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.18)")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>Email address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@example.com" required
              className="px-4 py-3 rounded-xl font-sans text-sm outline-none transition-all" style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.55)")}
              onBlur={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.18)")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>Relationship <span style={{ color: "hsl(149 28% 79% / 0.30)" }}>(optional)</span></label>
            <input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g. Sister, Best friend, Partner"
              className="px-4 py-3 rounded-xl font-sans text-sm outline-none transition-all" style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.55)")}
              onBlur={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.18)")} />
          </div>
          <button type="submit" disabled={saving}
            className="mt-2 py-3 rounded-full font-sans text-sm font-semibold transition-all duration-300 disabled:opacity-60"
            style={{ backgroundColor: "hsl(149 28% 79%)", color: "hsl(179 100% 8%)" }}>
            {saving ? "Saving…" : "Add Contact"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  const fetchAssets = async () => {
    if (!supabase || !user) return;
    setLoadingAssets(true);
    const { data, error } = await supabase
      .from("digital_assets")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setAssets(data ?? []);
    setLoadingAssets(false);
  };

  const fetchContacts = async () => {
    if (!supabase || !user) return;
    setLoadingContacts(true);
    const { data, error } = await supabase
      .from("trusted_contacts")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setContacts(data ?? []);
    setLoadingContacts(false);
  };

  useEffect(() => {
    fetchAssets();
    fetchContacts();
  }, [user]);

  const deleteAsset = async (id: string) => {
    if (!supabase) return;
    await supabase.from("digital_assets").delete().eq("id", id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "Asset removed." });
  };

  const deleteContact = async (id: string) => {
    if (!supabase) return;
    await supabase.from("trusted_contacts").delete().eq("id", id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "Contact removed." });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const dividerStyle = { borderColor: "hsl(149 28% 79% / 0.08)" };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(179 100% 8%)" }}>
      <Toaster />

      {/* Modals */}
      {showAddAsset && <AddAssetModal onClose={() => setShowAddAsset(false)} onSaved={fetchAssets} />}
      {showAddContact && <AddContactModal onClose={() => setShowAddContact(false)} onSaved={fetchContacts} />}

      {/* Top nav */}
      <header
        className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: "hsl(179 100% 8% / 0.90)", borderBottom: "1px solid hsl(149 28% 79% / 0.08)", backdropFilter: "blur(16px)" }}
      >
        <a href="/" className="font-serif text-xl font-medium" style={{ color: "hsl(149 28% 79%)" }}>
          SafeHands
        </a>
        <div className="flex items-center gap-4">
          <span className="font-sans text-xs hidden sm:block" style={{ color: "hsl(149 28% 79% / 0.40)" }}>
            {user?.email}
          </span>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 font-sans text-sm transition-opacity hover:opacity-70"
            style={{ color: "hsl(149 28% 79% / 0.55)" }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      {/* Page body */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Page title */}
        <div className="mb-10">
          <span className="font-sans text-xs font-semibold tracking-widest uppercase block mb-2" style={{ color: "hsl(149 28% 79% / 0.40)" }}>
            Curation Dashboard
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-medium" style={{ color: "hsl(149 28% 79%)" }}>
            Your digital legacy, mapped.
          </h1>
          <p className="font-sans text-sm mt-2 max-w-md" style={{ color: "hsl(149 28% 79% / 0.50)" }}>
            Add the assets and people that matter. You're in full control of what gets passed on — and to whom.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {[
            { label: "Digital Assets", value: assets.length },
            { label: "Trusted Contacts", value: contacts.length },
            { label: "Assignments", value: 0 },
          ].map((stat) => (
            <SectionCard key={stat.label}>
              <p className="font-sans text-xs mb-1" style={{ color: "hsl(149 28% 79% / 0.45)" }}>
                {stat.label}
              </p>
              <p className="font-serif text-3xl font-medium" style={{ color: "hsl(149 28% 79%)" }}>
                {stat.value}
              </p>
            </SectionCard>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* ─── Digital Assets ─── */}
          <SectionCard>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-lg font-medium" style={{ color: "hsl(149 28% 79%)" }}>
                Digital Assets
              </h2>
              <button
                onClick={() => setShowAddAsset(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-sans text-xs font-semibold transition-all duration-200"
                style={{ backgroundColor: "hsl(149 28% 79%)", color: "hsl(179 100% 8%)" }}
              >
                <Plus size={12} /> Add Asset
              </button>
            </div>

            {loadingAssets ? (
              <p className="font-sans text-sm" style={{ color: "hsl(149 28% 79% / 0.35)" }}>Loading…</p>
            ) : assets.length === 0 ? (
              <div
                className="rounded-xl p-6 text-center"
                style={{ border: "1.5px dashed hsl(149 28% 79% / 0.15)" }}
              >
                <p className="font-sans text-sm" style={{ color: "hsl(149 28% 79% / 0.40)" }}>
                  No assets yet. Add your first one above.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {assets.map((asset) => (
                  <li
                    key={asset.id}
                    className="flex items-start justify-between gap-3 py-3"
                    style={{ borderBottom: "1px solid hsl(149 28% 79% / 0.07)" }}
                  >
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <span className="font-sans text-sm font-medium truncate" style={{ color: "hsl(149 28% 79%)" }}>
                        {asset.title}
                      </span>
                      <AssetTypePill type={asset.type} />
                      {asset.description && (
                        <p className="font-sans text-xs line-clamp-2" style={{ color: "hsl(149 28% 79% / 0.40)" }}>
                          {asset.description}
                        </p>
                      )}
                    </div>
                    <button onClick={() => deleteAsset(asset.id)} className="mt-0.5 shrink-0 transition-opacity hover:opacity-70" style={{ color: "hsl(149 28% 79% / 0.30)" }}>
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* ─── Trusted Contacts ─── */}
          <SectionCard>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-lg font-medium" style={{ color: "hsl(149 28% 79%)" }}>
                Trusted Contacts
              </h2>
              <button
                onClick={() => setShowAddContact(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-sans text-xs font-semibold transition-all duration-200"
                style={{ backgroundColor: "hsl(149 28% 79% / 0.12)", color: "hsl(149 28% 79%)", border: "1px solid hsl(149 28% 79% / 0.20)" }}
              >
                <Users size={12} /> Add Contact
              </button>
            </div>

            {loadingContacts ? (
              <p className="font-sans text-sm" style={{ color: "hsl(149 28% 79% / 0.35)" }}>Loading…</p>
            ) : contacts.length === 0 ? (
              <div
                className="rounded-xl p-6 text-center"
                style={{ border: "1.5px dashed hsl(149 28% 79% / 0.15)" }}
              >
                <p className="font-sans text-sm" style={{ color: "hsl(149 28% 79% / 0.40)" }}>
                  No trusted contacts yet. Add the people who matter.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {contacts.map((contact) => (
                  <li
                    key={contact.id}
                    className="flex items-center justify-between gap-3 py-3"
                    style={{ borderBottom: "1px solid hsl(149 28% 79% / 0.07)" }}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-sans text-sm font-medium" style={{ color: "hsl(149 28% 79%)" }}>
                        {contact.name}
                      </span>
                      <span className="font-sans text-xs truncate" style={{ color: "hsl(149 28% 79% / 0.45)" }}>
                        {contact.email}
                      </span>
                      {contact.relationship && (
                        <span className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.30)" }}>
                          {contact.relationship}
                        </span>
                      )}
                    </div>
                    <button onClick={() => deleteContact(contact.id)} className="shrink-0 transition-opacity hover:opacity-70" style={{ color: "hsl(149 28% 79% / 0.30)" }}>
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        {/* Assignments coming soon */}
        <SectionCard className="mt-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "hsl(149 28% 79% / 0.10)" }}>
              <Link size={14} style={{ color: "hsl(149 28% 79% / 0.55)" }} />
            </div>
            <div>
              <p className="font-sans text-sm font-medium" style={{ color: "hsl(149 28% 79%)" }}>
                Relational Assignments
              </p>
              <p className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.40)" }}>
                Link assets to contacts — coming next. Add assets and contacts above to get started.
              </p>
            </div>
          </div>
        </SectionCard>
      </main>
    </div>
  );
}
