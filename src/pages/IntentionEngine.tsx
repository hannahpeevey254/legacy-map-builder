import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { ArrowLeft, Shield, Zap, AlertTriangle, ChevronDown } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DigitalAsset {
  id: string;
  name: string;
  type: string;
}

interface RelationalAssignment {
  id: string;
  asset_id: string;
  contact_id: string | null;
  intent_action: string | null;
}

interface SocialIntention {
  id?: string;
  platform: string;
  intention: string;
  notes: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  master_scrub_enabled: boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

export const INTENT_ACTIONS = [
  {
    value: "keep_and_share",
    label: "Keep & Share",
    description: "Preserve the data and pass access to a specific person.",
    color: "hsl(149 28% 79%)",
  },
  {
    value: "archive_quietly",
    label: "Archive Quietly",
    description: "Store in a private vault. No one receives it unless specified.",
    color: "hsl(45 60% 65%)",
  },
  {
    value: "clear_my_path",
    label: "Clear My Path",
    description: "Erase permanently after the wait period. No trace.",
    color: "hsl(0 55% 60%)",
  },
  {
    value: "donate_to_history",
    label: "Donate to History",
    description: "Send to a public archive, museum, or institution.",
    color: "hsl(220 40% 65%)",
  },
];

const SOCIAL_PLATFORMS = [
  {
    key: "instagram",
    label: "Instagram",
    emoji: "📸",
    group: "Instagram / Facebook",
    options: [
      { value: "memorialize", label: "Memorialize", description: "Keep posts, lock the account in remembrance." },
      { value: "delete", label: "Delete Permanently", description: "Remove the profile and all associated data." },
    ],
  },
  {
    key: "facebook",
    label: "Facebook",
    emoji: "👥",
    group: "Instagram / Facebook",
    options: [
      { value: "memorialize", label: "Memorialize", description: "Keep posts, lock the account in remembrance." },
      { value: "delete", label: "Delete Permanently", description: "Remove the profile and all associated data." },
    ],
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    emoji: "🐦",
    group: "X / Threads",
    options: [
      { value: "archive", label: "Archive Posts", description: "Preserve all historical posts in a private archive." },
      { value: "digital_scrub", label: "Digital Scrub", description: "Delete all posts, likes, and account data." },
    ],
  },
  {
    key: "threads",
    label: "Threads",
    emoji: "🧵",
    group: "X / Threads",
    options: [
      { value: "archive", label: "Archive Posts", description: "Preserve all historical posts in a private archive." },
      { value: "digital_scrub", label: "Digital Scrub", description: "Delete all posts and account data." },
    ],
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    emoji: "💼",
    group: "LinkedIn",
    options: [
      { value: "final_post_then_close", label: "Final Post & Close", description: "Post a professional farewell announcement, then close the account." },
      { value: "delete", label: "Close Quietly", description: "Close the account without a public announcement." },
    ],
  },
  {
    key: "discord",
    label: "Discord",
    emoji: "🎮",
    group: "Discord / WhatsApp",
    options: [
      { value: "preserve_threads", label: "Preserve Threads", description: "Keep selected conversations for specific people." },
      { value: "wipe", label: "Wipe Account", description: "Delete all messages and close the account." },
    ],
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    emoji: "💬",
    group: "Discord / WhatsApp",
    options: [
      { value: "preserve_threads", label: "Preserve Threads", description: "Keep selected conversations for specific people." },
      { value: "wipe", label: "Wipe Account", description: "Delete all messages and close the account." },
    ],
  },
  {
    key: "youtube",
    label: "YouTube",
    emoji: "🎬",
    group: "YouTube / TikTok",
    options: [
      { value: "transfer", label: "Transfer Creative IP", description: "Hand ownership of the channel to a named person." },
      { value: "delete", label: "Delete Channel", description: "Permanently remove all videos and the channel." },
    ],
  },
  {
    key: "tiktok",
    label: "TikTok",
    emoji: "🎵",
    group: "YouTube / TikTok",
    options: [
      { value: "transfer", label: "Transfer Creative IP", description: "Hand ownership of the account to a named person." },
      { value: "delete", label: "Delete Account", description: "Permanently remove all content and the account." },
    ],
  },
];

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle = {
  backgroundColor: "hsl(179 100% 8%)",
  border: "1.5px solid hsl(149 28% 79% / 0.18)",
  color: "hsl(149 28% 79%)",
  caretColor: "hsl(149 28% 79%)",
};

// ─── SectionCard ──────────────────────────────────────────────────────────────

function SectionCard({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{
        backgroundColor: "hsl(179 100% 6%)",
        border: "1px solid hsl(149 28% 79% / 0.10)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Section A: Asset Intentions ─────────────────────────────────────────────

function AssetIntentionsSection({
  assets,
  assignments,
  onIntentChanged,
}: {
  assets: DigitalAsset[];
  assignments: RelationalAssignment[];
  onIntentChanged: () => void;
}) {
  const { user } = useAuth();
  const [saving, setSaving] = useState<string | null>(null);

  const getAssetIntent = (assetId: string): string | null => {
    const assignment = assignments.find((a) => a.asset_id === assetId);
    return assignment?.intent_action ?? null;
  };

  const hasContact = (assetId: string): boolean => {
    return assignments.some((a) => a.asset_id === assetId && a.contact_id);
  };

  const setAssetIntent = async (assetId: string, intentValue: string) => {
    if (!supabase || !user) return;
    setSaving(assetId);

    const existingAssignment = assignments.find((a) => a.asset_id === assetId);

    if (existingAssignment) {
      const { error } = await supabase
        .from("relational_assignments")
        .update({ intent_action: intentValue })
        .eq("id", existingAssignment.id);
      if (error) {
        toast({ title: "Error saving intent", description: error.message, variant: "destructive" });
      }
    } else {
      const { error } = await supabase.from("relational_assignments").insert([
        { asset_id: assetId, intent_action: intentValue, user_id: user.id },
      ]);
      if (error) {
        toast({ title: "Error saving intent", description: error.message, variant: "destructive" });
      }
    }

    setSaving(null);
    onIntentChanged();
  };

  return (
    <SectionCard>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-sans text-xs font-bold tracking-widest uppercase" style={{ color: "hsl(149 28% 79% / 0.35)" }}>
          Section A
        </span>
      </div>
      <h2 className="font-serif text-xl mb-1" style={{ color: "hsl(149 28% 79%)" }}>
        Your Assets
      </h2>
      <p className="font-sans text-sm mb-6" style={{ color: "hsl(149 28% 79% / 0.50)" }}>
        For each asset you've mapped, choose what should happen to it. These instructions activate after your Security Wait Period.
      </p>

      {assets.length === 0 ? (
        <div
          className="rounded-xl p-6 text-center"
          style={{ border: "1.5px dashed hsl(149 28% 79% / 0.15)" }}
        >
          <p className="font-sans text-sm" style={{ color: "hsl(149 28% 79% / 0.40)" }}>
            No assets mapped yet. Head back to the dashboard to add your first digital asset.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {assets.map((asset) => {
            const currentIntent = getAssetIntent(asset.id);
            const contactAssigned = hasContact(asset.id);
            const isSaving = saving === asset.id;

            return (
              <div
                key={asset.id}
                className="rounded-xl p-4"
                style={{
                  backgroundColor: "hsl(179 100% 7%)",
                  border: "1px solid hsl(149 28% 79% / 0.08)",
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-sans text-sm font-semibold" style={{ color: "hsl(149 28% 79%)" }}>
                      {asset.name}
                    </p>
                    <p className="font-sans text-xs capitalize" style={{ color: "hsl(149 28% 79% / 0.40)" }}>
                      {asset.type?.replace("_", " ")}
                    </p>
                  </div>
                  {isSaving && (
                    <div
                      className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin shrink-0 mt-1"
                      style={{ borderColor: "hsl(149 28% 79%)", borderTopColor: "transparent" }}
                    />
                  )}
                </div>

                {!contactAssigned && (
                  <p
                    className="font-sans text-xs mb-2.5 px-2.5 py-1.5 rounded-lg"
                    style={{
                      color: "hsl(45 60% 65% / 0.80)",
                      backgroundColor: "hsl(45 60% 65% / 0.06)",
                      border: "1px solid hsl(45 60% 65% / 0.15)",
                    }}
                  >
                    ⚠ Assign a contact first to fully activate this intention.
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {INTENT_ACTIONS.map((action) => {
                    const isSelected = currentIntent === action.value;
                    return (
                      <button
                        key={action.value}
                        onClick={() => setAssetIntent(asset.id, action.value)}
                        disabled={isSaving}
                        className="px-3 py-1.5 rounded-full font-sans text-xs font-semibold transition-all duration-150 disabled:opacity-50"
                        style={
                          isSelected
                            ? { backgroundColor: action.color, color: "hsl(179 100% 8%)" }
                            : {
                                backgroundColor: `${action.color}14`,
                                color: action.color,
                                border: `1px solid ${action.color}44`,
                              }
                        }
                      >
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

// ─── Section B: Social Legacy Checklist ──────────────────────────────────────

function SocialLegacySection({
  socialIntentions,
  onSocialIntentionChange,
}: {
  socialIntentions: Record<string, SocialIntention>;
  onSocialIntentionChange: (platform: string, intention: string, notes: string) => void;
}) {
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const toggleNotes = (platform: string) => {
    setExpandedNotes((prev) => ({ ...prev, [platform]: !prev[platform] }));
  };

  return (
    <SectionCard>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-sans text-xs font-bold tracking-widest uppercase" style={{ color: "hsl(149 28% 79% / 0.35)" }}>
          Section B
        </span>
      </div>
      <h2 className="font-serif text-xl mb-1" style={{ color: "hsl(149 28% 79%)" }}>
        Social Legacy
      </h2>
      <p className="font-sans text-sm mb-6" style={{ color: "hsl(149 28% 79% / 0.50)" }}>
        When you're no longer here to manage your presence, what should happen to your digital footprint? Set your wishes for each platform.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {SOCIAL_PLATFORMS.map((platform) => {
          const current = socialIntentions[platform.key];
          const notesOpen = expandedNotes[platform.key];

          return (
            <div
              key={platform.key}
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{
                backgroundColor: "hsl(179 100% 7%)",
                border: "1px solid hsl(149 28% 79% / 0.08)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl" role="img" aria-label={platform.label}>
                  {platform.emoji}
                </span>
                <div>
                  <p className="font-sans text-sm font-semibold" style={{ color: "hsl(149 28% 79%)" }}>
                    {platform.label}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {platform.options.map((option) => {
                  const isSelected = current?.intention === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() =>
                        onSocialIntentionChange(platform.key, option.value, current?.notes ?? "")
                      }
                      className="w-full text-left px-3 py-2.5 rounded-xl font-sans text-xs transition-all duration-150"
                      style={
                        isSelected
                          ? {
                              backgroundColor: "hsl(149 28% 79% / 0.12)",
                              border: "1.5px solid hsl(149 28% 79% / 0.40)",
                              color: "hsl(149 28% 79%)",
                            }
                          : {
                              backgroundColor: "transparent",
                              border: "1.5px solid hsl(149 28% 79% / 0.10)",
                              color: "hsl(149 28% 79% / 0.55)",
                            }
                      }
                    >
                      <span className="font-semibold block mb-0.5">{option.label}</span>
                      <span style={{ color: isSelected ? "hsl(149 28% 79% / 0.65)" : "hsl(149 28% 79% / 0.35)" }}>
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Notes toggle */}
              <button
                onClick={() => toggleNotes(platform.key)}
                className="flex items-center gap-1 font-sans text-xs transition-opacity hover:opacity-70"
                style={{ color: "hsl(149 28% 79% / 0.35)" }}
              >
                <ChevronDown
                  size={12}
                  className="transition-transform duration-200"
                  style={{ transform: notesOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
                {notesOpen ? "Hide note" : "Add a note"}
              </button>

              {notesOpen && (
                <textarea
                  value={current?.notes ?? ""}
                  onChange={(e) =>
                    onSocialIntentionChange(platform.key, current?.intention ?? "", e.target.value)
                  }
                  placeholder={`e.g. Delete my DMs but keep my photos for Mum`}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-xl font-sans text-xs outline-none resize-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.55)")}
                  onBlur={(e) => (e.target.style.borderColor = "hsl(149 28% 79% / 0.18)")}
                />
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

// ─── Section C: Master Intent / Digital Scrub ────────────────────────────────

function MasterIntentSection({
  scrubEnabled,
  onToggle,
  saving,
}: {
  scrubEnabled: boolean;
  onToggle: (val: boolean) => void;
  saving: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pendingValue, setPendingValue] = useState<boolean | null>(null);

  const handleToggle = (val: boolean) => {
    if (val === true) {
      setPendingValue(true);
      setConfirming(true);
    } else {
      onToggle(false);
      setConfirming(false);
      setPendingValue(null);
    }
  };

  const confirmActivation = () => {
    if (pendingValue !== null) {
      onToggle(pendingValue);
    }
    setConfirming(false);
    setPendingValue(null);
  };

  const cancelActivation = () => {
    setConfirming(false);
    setPendingValue(null);
  };

  return (
    <SectionCard
      style={{
        border: scrubEnabled
          ? "1px solid hsl(0 55% 60% / 0.30)"
          : "1px solid hsl(149 28% 79% / 0.10)",
        backgroundColor: "hsl(179 100% 6%)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="font-sans text-xs font-bold tracking-widest uppercase" style={{ color: "hsl(149 28% 79% / 0.35)" }}>
          Section C
        </span>
      </div>

      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} style={{ color: scrubEnabled ? "hsl(0 55% 60%)" : "hsl(149 28% 79% / 0.40)" }} />
            <h2 className="font-serif text-xl" style={{ color: "hsl(149 28% 79%)" }}>
              Master Intent
            </h2>
          </div>
          <p className="font-sans text-sm" style={{ color: "hsl(149 28% 79% / 0.50)" }}>
            The Full Digital Scrub — a global command for your entire digital presence.
          </p>
        </div>

        {/* Toggle */}
        <div className="shrink-0 flex flex-col items-center gap-1.5">
          <button
            onClick={() => handleToggle(!scrubEnabled)}
            disabled={saving}
            className="relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 disabled:opacity-50"
            style={{
              backgroundColor: scrubEnabled ? "hsl(0 55% 60%)" : "hsl(149 28% 79% / 0.15)",
              border: scrubEnabled ? "1px solid hsl(0 55% 60%)" : "1px solid hsl(149 28% 79% / 0.25)",
            }}
            role="switch"
            aria-checked={scrubEnabled}
          >
            <span
              className="inline-block h-5 w-5 rounded-full transition-transform duration-300"
              style={{
                backgroundColor: "hsl(149 28% 79%)",
                transform: scrubEnabled ? "translateX(1.75rem)" : "translateX(0.25rem)",
              }}
            />
          </button>
          <span
            className="font-sans text-xs font-semibold"
            style={{ color: scrubEnabled ? "hsl(0 55% 60%)" : "hsl(149 28% 79% / 0.35)" }}
          >
            {scrubEnabled ? "Active" : "Off"}
          </span>
        </div>
      </div>

      <div
        className="rounded-xl p-4 mb-4"
        style={{
          backgroundColor: "hsl(179 100% 7%)",
          border: "1px solid hsl(149 28% 79% / 0.07)",
        }}
      >
        <p className="font-sans text-sm leading-relaxed" style={{ color: "hsl(149 28% 79% / 0.65)" }}>
          If activated, Safe Hands will attempt to delete all connected accounts and cloud data —
          leaving behind only the specific assets you have manually marked as{" "}
          <span style={{ color: "hsl(149 28% 79%)" }}>"Keep & Share"</span>.
          This instruction activates only after your Security Wait Period is fully exhausted.
        </p>
      </div>

      {/* Confirmation step */}
      {confirming && (
        <div
          className="rounded-xl p-4 flex flex-col gap-3 mb-4"
          style={{
            backgroundColor: "hsl(0 55% 60% / 0.06)",
            border: "1px solid hsl(0 55% 60% / 0.25)",
          }}
        >
          <p className="font-sans text-sm font-semibold" style={{ color: "hsl(0 55% 60%)" }}>
            Are you certain?
          </p>
          <p className="font-sans text-sm" style={{ color: "hsl(149 28% 79% / 0.65)" }}>
            This instruction will activate after your Security Wait Period is exhausted.
            You can change your mind at any time — simply toggle it off.
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmActivation}
              className="px-4 py-2 rounded-full font-sans text-xs font-semibold transition-all duration-150"
              style={{ backgroundColor: "hsl(0 55% 60%)", color: "hsl(149 28% 79%)" }}
            >
              Yes, activate
            </button>
            <button
              onClick={cancelActivation}
              className="px-4 py-2 rounded-full font-sans text-xs font-semibold transition-all duration-150"
              style={{
                backgroundColor: "transparent",
                color: "hsl(149 28% 79% / 0.55)",
                border: "1px solid hsl(149 28% 79% / 0.20)",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {scrubEnabled && !confirming && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-2"
          style={{
            backgroundColor: "hsl(0 55% 60% / 0.06)",
            border: "1px solid hsl(0 55% 60% / 0.20)",
          }}
        >
          <Zap size={13} className="shrink-0" style={{ color: "hsl(0 55% 60%)" }} />
          <p className="font-sans text-xs" style={{ color: "hsl(0 55% 60% / 0.80)" }}>
            Full Digital Scrub is active. Toggle off above to change your mind at any time.
          </p>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Main IntentionEngine Page ────────────────────────────────────────────────

export default function IntentionEngine() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [assignments, setAssignments] = useState<RelationalAssignment[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [socialIntentions, setSocialIntentions] = useState<Record<string, SocialIntention>>({});
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSocial, setSavingSocial] = useState(false);

  // ── Fetch all data ──────────────────────────────────────────────────────────

  const fetchAll = async () => {
    if (!supabase || !user) return;
    setLoading(true);

    const [assetsRes, assignRes, profileRes, socialRes] = await Promise.all([
      supabase.from("digital_assets").select("id, name, type").order("created_at", { ascending: false }),
      supabase.from("relational_assignments").select("*"),
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("social_intentions").select("*").eq("user_id", user.id),
    ]);

    if (!assetsRes.error) setAssets(assetsRes.data ?? []);
    if (!assignRes.error) setAssignments(assignRes.data ?? []);
    if (!profileRes.error) setProfile((profileRes.data as UserProfile) ?? null);

    if (!socialRes.error && socialRes.data) {
      const map: Record<string, SocialIntention> = {};
      for (const row of socialRes.data) {
        map[row.platform] = { id: row.id, platform: row.platform, intention: row.intention, notes: row.notes ?? "" };
      }
      setSocialIntentions(map);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [user]);

  // ── Assignment refresh ──────────────────────────────────────────────────────

  const refreshAssignments = async () => {
    if (!supabase || !user) return;
    const { data, error } = await supabase.from("relational_assignments").select("*");
    if (!error) setAssignments(data ?? []);
  };

  // ── Social intention change (debounced save) ────────────────────────────────

  const handleSocialIntentionChange = async (platform: string, intention: string, notes: string) => {
    const updated = { ...socialIntentions, [platform]: { ...socialIntentions[platform], platform, intention, notes } };
    setSocialIntentions(updated);

    // Debounced save
    if (!supabase || !user) return;
    setSavingSocial(true);

    const existing = socialIntentions[platform];

    if (existing?.id) {
      await supabase
        .from("social_intentions")
        .update({ intention, notes })
        .eq("id", existing.id);
    } else if (intention) {
      const { data } = await supabase
        .from("social_intentions")
        .insert([{ user_id: user.id, platform, intention, notes }])
        .select("id")
        .single();
      if (data) {
        setSocialIntentions((prev) => ({
          ...prev,
          [platform]: { ...prev[platform], id: data.id },
        }));
      }
    }

    setSavingSocial(false);
  };

  // ── Master scrub toggle ─────────────────────────────────────────────────────

  const handleMasterScrubToggle = async (val: boolean) => {
    if (!supabase || !user) return;
    setSavingProfile(true);

    const payload = { master_scrub_enabled: val };
    const { error } = profile
      ? await supabase.from("profiles").update(payload).eq("user_id", user.id)
      : await supabase.from("profiles").insert([{ ...payload, user_id: user.id }]);

    setSavingProfile(false);

    if (error) {
      toast({ title: "Error saving preference", description: error.message, variant: "destructive" });
    } else {
      setProfile((prev) =>
        prev ? { ...prev, master_scrub_enabled: val } : { id: "", user_id: user.id, master_scrub_enabled: val }
      );
      toast({
        title: val ? "Full Digital Scrub activated." : "Full Digital Scrub deactivated.",
        description: val
          ? "This instruction will fire after your Security Wait Period."
          : "Your accounts are no longer set for automatic deletion.",
      });
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(179 100% 8%)" }}>
      <Toaster />

      {/* Top nav */}
      <header
        className="sticky top-0 z-40 px-6 py-4 flex items-center gap-4"
        style={{
          backgroundColor: "hsl(179 100% 8% / 0.92)",
          borderBottom: "1px solid hsl(149 28% 79% / 0.08)",
          backdropFilter: "blur(16px)",
        }}
      >
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1.5 font-sans text-sm transition-opacity hover:opacity-70"
          style={{ color: "hsl(149 28% 79% / 0.55)" }}
        >
          <ArrowLeft size={14} /> Dashboard
        </button>
        <span style={{ color: "hsl(149 28% 79% / 0.20)" }}>·</span>
        <span className="font-serif text-lg" style={{ color: "hsl(149 28% 79%)" }}>
          Intentionality Engine
        </span>
        {(savingSocial || savingProfile) && (
          <div
            className="ml-auto flex items-center gap-1.5 font-sans text-xs"
            style={{ color: "hsl(149 28% 79% / 0.40)" }}
          >
            <div
              className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
              style={{ borderColor: "hsl(149 28% 79% / 0.40)", borderTopColor: "transparent" }}
            />
            Saving…
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} style={{ color: "hsl(149 28% 79% / 0.45)" }} />
            <span
              className="font-sans text-xs font-semibold tracking-widest uppercase"
              style={{ color: "hsl(149 28% 79% / 0.40)" }}
            >
              Your Intentions
            </span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-medium mb-3" style={{ color: "hsl(149 28% 79%)" }}>
            Tell Safe Hands what you want to happen<br className="hidden md:block" /> to your digital world.
          </h1>
          <p className="font-sans text-sm max-w-xl" style={{ color: "hsl(149 28% 79% / 0.50)" }}>
            These instructions are private, revisable at any time, and only activate after your
            Security Wait Period has passed. No urgent decisions required — just thoughtful ones.
          </p>
        </div>

        {/* Intent action legend */}
        <div
          className="rounded-2xl p-5 mb-8 grid sm:grid-cols-4 gap-3"
          style={{ backgroundColor: "hsl(179 100% 5%)", border: "1px solid hsl(149 28% 79% / 0.08)" }}
        >
          {INTENT_ACTIONS.map((action) => (
            <div key={action.value} className="flex flex-col gap-1">
              <span
                className="inline-flex self-start px-2.5 py-1 rounded-full font-sans text-xs font-semibold"
                style={{ backgroundColor: `${action.color}18`, color: action.color, border: `1px solid ${action.color}40` }}
              >
                {action.label}
              </span>
              <p className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.40)" }}>
                {action.description}
              </p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "hsl(149 28% 79%)", borderTopColor: "transparent" }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Section A */}
            <AssetIntentionsSection
              assets={assets}
              assignments={assignments}
              onIntentChanged={refreshAssignments}
            />

            {/* Section B */}
            <SocialLegacySection
              socialIntentions={socialIntentions}
              onSocialIntentionChange={handleSocialIntentionChange}
            />

            {/* Section C */}
            <MasterIntentSection
              scrubEnabled={profile?.master_scrub_enabled ?? false}
              onToggle={handleMasterScrubToggle}
              saving={savingProfile}
            />
          </div>
        )}
      </main>
    </div>
  );
}
