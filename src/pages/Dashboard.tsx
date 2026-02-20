import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import {
  Plus, LogOut, Image, Mic, MessageSquare, BookOpen, Link, Palette,
  Users, Trash2, X, UserCheck, Upload, FolderPlus, Shield, Clock,
  ChevronDown, ArrowRight, Sparkles, Folder, Zap
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type AssetType = "photo" | "voice_note" | "message" | "journal" | "creative_work" | "account";
type IntentAction = "Preserve" | "Transfer" | "Delete";

interface DigitalAsset {
  id: string;
  name: string;
  type: AssetType;
  mapping_source: string | null;
  file_path: string | null;
  collection_id: string | null;
  created_at: string;
}

interface TrustedContact {
  id: string;
  name: string;
  email: string;
  relationship: string | null;
  phone_number: string | null;
  personalized_message: string | null;
  created_at: string;
}

interface RelationalAssignment {
  id: string;
  asset_id: string;
  contact_id: string;
  intent_action: string | null;
}

interface Collection {
  id: string;
  name: string;
  user_id: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  wait_period_days: number;
  executor_contact_id: string | null;
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

const INTENT_ACTIONS: { value: IntentAction; label: string; description: string; color: string }[] = [
  { value: "Preserve", label: "Keep & Share", description: "Preserve and pass to someone", color: "hsl(149 28% 79%)" },
  { value: "Transfer", label: "Archive Quietly", description: "Store privately, share if specified", color: "hsl(45 60% 65%)" },
  { value: "Delete", label: "Clear My Path", description: "Erase after wait period", color: "hsl(0 55% 60%)" },
];

const ACCEPTED_FILE_TYPES = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.ogg,.mp4,.mov,.webm";
const ACCEPTED_IMAGE_TYPES = ".jpg,.jpeg,.png,.gif,.webp,.heic";
const MAX_PHOTOS_PER_UPLOAD = 30;

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle = {
  backgroundColor: "hsl(179 100% 8%)",
  border: "1.5px solid hsl(149 28% 79% / 0.18)",
  color: "hsl(149 28% 79%)",
  caretColor: "hsl(149 28% 79%)",
};

const focusBorder = "hsl(149 28% 79% / 0.55)";
const blurBorder = "hsl(149 28% 79% / 0.18)";

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{ backgroundColor: "hsl(179 100% 6%)", border: "1px solid hsl(149 28% 79% / 0.10)" }}
    >
      {children}
    </div>
  );
}

function AssetTypePill({ type }: { type: AssetType }) {
  const found = ASSET_TYPES.find((t) => t.value === type);
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-sans text-xs"
      style={{ backgroundColor: "hsl(149 28% 79% / 0.10)", color: "hsl(149 28% 79% / 0.75)" }}>
      {found?.icon}{found?.label ?? type}
    </span>
  );
}

function IntentBadge({ action }: { action: string | null }) {
  if (!action) return null;
  const found = INTENT_ACTIONS.find((a) => a.value === action);
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-sans text-xs font-semibold"
      style={{ backgroundColor: `${found?.color ?? "hsl(149 28% 79%)"}22`, color: found?.color ?? "hsl(149 28% 79%)", border: `1px solid ${found?.color ?? "hsl(149 28% 79%)"}44` }}>
      {action}
    </span>
  );
}

function ContactChip({ name, intent }: { name: string; intent?: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-sans text-xs"
      style={{ backgroundColor: "hsl(149 28% 79% / 0.08)", color: "hsl(149 28% 79% / 0.60)", border: "1px solid hsl(149 28% 79% / 0.15)" }}>
      <UserCheck size={10} />
      {name}
      {intent && <IntentBadge action={intent} />}
    </span>
  );
}

// ─── Drag-and-drop file zone ───────────────────────────────────────────────────

function FileDropZone({ onFile, file }: { onFile: (f: File | null) => void; file: File | null }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (f: File | null) => { if (f) onFile(f); };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0] ?? null); }}
      className="rounded-xl p-5 text-center cursor-pointer transition-all duration-150 flex flex-col items-center gap-2"
      style={{
        border: `1.5px dashed ${dragging ? "hsl(149 28% 79% / 0.60)" : "hsl(149 28% 79% / 0.20)"}`,
        backgroundColor: dragging ? "hsl(149 28% 79% / 0.05)" : "transparent",
      }}
    >
      <Upload size={18} style={{ color: "hsl(149 28% 79% / 0.40)" }} />
      {file ? (
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs font-medium" style={{ color: "hsl(149 28% 79%)" }}>{file.name}</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); onFile(null); }}
            style={{ color: "hsl(149 28% 79% / 0.40)" }}><X size={12} /></button>
        </div>
      ) : (
        <p className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.40)" }}>
          Drop a file here, or <span style={{ color: "hsl(149 28% 79% / 0.70)" }}>click to browse</span>
          <br /><span style={{ color: "hsl(149 28% 79% / 0.28)" }}>PDF, DOCX, images, audio, video · max 50 MB</span>
        </p>
      )}
      <input ref={inputRef} type="file" accept={ACCEPTED_FILE_TYPES} className="hidden"
        onChange={(e) => handle(e.target.files?.[0] ?? null)} />
    </div>
  );
}

// ─── Multi-photo drop zone (albums, up to 30) ───────────────────────────────────

function MultiPhotoDropZone({ files, onFiles }: { files: File[]; onFiles: (f: File[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles?.length) return;
    const imageFiles = Array.from(newFiles).filter((f) =>
      /\.(jpe?g|png|gif|webp|heic)$/i.test(f.name)
    );
    const combined = [...files, ...imageFiles].slice(0, MAX_PHOTOS_PER_UPLOAD);
    onFiles(combined);
  };

  const removeFile = (index: number) => {
    onFiles(files.filter((_, i) => i !== index));
  };

  const clearAll = () => onFiles([]);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
      className="rounded-xl p-5 text-center cursor-pointer transition-all duration-150 flex flex-col items-center gap-2"
      style={{
        border: `1.5px dashed ${dragging ? "hsl(149 28% 79% / 0.60)" : "hsl(149 28% 79% / 0.20)"}`,
        backgroundColor: dragging ? "hsl(149 28% 79% / 0.05)" : "transparent",
      }}
    >
      <Upload size={18} style={{ color: "hsl(149 28% 79% / 0.40)" }} />
      {files.length > 0 ? (
        <div className="w-full flex flex-col gap-2">
          <p className="font-sans text-xs font-medium" style={{ color: "hsl(149 28% 79%)" }}>
            {files.length} photo{files.length !== 1 ? "s" : ""} selected (max {MAX_PHOTOS_PER_UPLOAD})
          </p>
          <div className="max-h-32 overflow-y-auto rounded-lg flex flex-col gap-1" style={{ backgroundColor: "hsl(179 100% 7%)" }}>
            {files.map((file, i) => (
              <div key={`${file.name}-${i}`} className="flex items-center justify-between px-3 py-1.5">
                <span className="font-sans text-xs truncate flex-1" style={{ color: "hsl(149 28% 79% / 0.80)" }} title={file.name}>
                  {file.name}
                </span>
                <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(i); }} aria-label="Remove"
                  style={{ color: "hsl(149 28% 79% / 0.50)" }}><X size={12} /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); clearAll(); }}
            className="font-sans text-xs font-medium" style={{ color: "hsl(149 28% 79% / 0.55)" }}>
            Clear all
          </button>
        </div>
      ) : (
        <p className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.40)" }}>
          Drop photos here or <span style={{ color: "hsl(149 28% 79% / 0.70)" }}>click to browse</span>
          <br /><span style={{ color: "hsl(149 28% 79% / 0.28)" }}>JPG, PNG, GIF, WebP, HEIC · up to {MAX_PHOTOS_PER_UPLOAD} photos · max 50 MB each</span>
        </p>
      )}
      <input ref={inputRef} type="file" accept={ACCEPTED_IMAGE_TYPES} multiple className="hidden"
        onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
    </div>
  );
}

// ─── Add Asset Modal ───────────────────────────────────────────────────────────

function AddAssetModal({
  onClose, onSaved, contacts, collections,
}: {
  onClose: () => void;
  onSaved: () => void;
  contacts: TrustedContact[];
  collections: Collection[];
}) {
  const { user } = useAuth();
  const [assetName, setAssetName] = useState("");
  const [type, setType] = useState<AssetType>("photo");
  const [mappingSource, setMappingSource] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [collectionId, setCollectionId] = useState<string>("");
  const [contactIntents, setContactIntents] = useState<Record<string, IntentAction | null>>({});
  const [saving, setSaving] = useState(false);

  // When switching asset type, clear the other type's selection
  const setTypeWithReset = (newType: AssetType) => {
    if (newType !== type) {
      if (newType === "photo") setSelectedFile(null);
      else setSelectedPhotos([]);
    }
    setType(newType);
  };

  const toggleContact = (id: string) => {
    setContactIntents((prev) => {
      if (id in prev) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: "Preserve" };
    });
  };

  const setIntent = (contactId: string, action: IntentAction) => {
    setContactIntents((prev) => ({ ...prev, [contactId]: action }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;
    setSaving(true);

    const isMultiPhoto = type === "photo" && selectedPhotos.length > 0;
    const isSingleFile = type !== "photo" && selectedFile;

    if (isMultiPhoto) {
      // Upload up to 30 photos and create one asset per photo (same title, collection, contacts)
      const baseName = assetName.trim();
      const selectedContactIds = Object.keys(contactIntents);
      let created = 0;
      for (let i = 0; i < selectedPhotos.length; i++) {
        const file = selectedPhotos[i];
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}-${i}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("assets").upload(path, file);
        if (uploadError) {
          toast({ title: "Upload failed", description: `${file.name}: ${uploadError.message}`, variant: "destructive" });
          setSaving(false);
          return;
        }
        const { data: assetData, error: assetError } = await supabase
          .from("digital_assets")
          .insert([{
            name: baseName,
            type: "photo",
            mapping_source: mappingSource.trim() || null,
            file_path: path,
            collection_id: collectionId || null,
            user_id: user.id,
          }])
          .select("id")
          .single();
        if (assetError || !assetData) {
          toast({ title: "Error saving asset", description: assetError?.message, variant: "destructive" });
          setSaving(false);
          return;
        }
        if (selectedContactIds.length > 0) {
          const rows = selectedContactIds.map((contact_id) => ({
            asset_id: assetData.id,
            contact_id,
            intent_action: contactIntents[contact_id] ?? "Preserve",
            user_id: user.id,
          }));
          await supabase.from("relational_assignments").insert(rows);
        }
        created++;
      }
      setSaving(false);
      toast({
        title: "Photos saved!",
        description: `${created} photo${created !== 1 ? "s" : ""} added as "${baseName}"${selectedContactIds.length > 0 ? ` and assigned to ${selectedContactIds.length} contact${selectedContactIds.length > 1 ? "s" : ""}` : ""}.`,
      });
      onSaved();
      onClose();
      return;
    }

    let filePath: string | null = null;
    if (isSingleFile) {
      const ext = selectedFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("assets").upload(path, selectedFile);
      if (uploadError) {
        toast({ title: "File upload failed", description: uploadError.message, variant: "destructive" });
        setSaving(false);
        return;
      }
      filePath = path;
    }

    const { data: assetData, error: assetError } = await supabase
      .from("digital_assets")
      .insert([{
        name: assetName.trim(),
        type,
        mapping_source: mappingSource.trim() || null,
        file_path: filePath,
        collection_id: collectionId || null,
        user_id: user.id,
      }])
      .select("id")
      .single();

    if (assetError || !assetData) {
      toast({ title: "Error saving asset", description: assetError?.message, variant: "destructive" });
      setSaving(false);
      return;
    }

    const selectedContactIds = Object.keys(contactIntents);
    if (selectedContactIds.length > 0) {
      const rows = selectedContactIds.map((contact_id) => ({
        asset_id: assetData.id,
        contact_id,
        intent_action: contactIntents[contact_id] ?? "Preserve",
        user_id: user.id,
      }));
      const { error: assignError } = await supabase.from("relational_assignments").insert(rows);
      if (assignError) {
        toast({ title: "Asset saved, but assignments failed", description: assignError.message, variant: "destructive" });
      }
    }

    setSaving(false);
    toast({
      title: "Asset saved!",
      description: selectedContactIds.length > 0
        ? `"${assetName}" assigned to ${selectedContactIds.length} contact${selectedContactIds.length > 1 ? "s" : ""}.`
        : `"${assetName}" has been mapped.`,
    });
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "hsl(179 100% 4% / 0.85)", backdropFilter: "blur(8px)" }}>
      <div className="relative w-full max-w-lg rounded-2xl p-8 max-h-[92vh] overflow-y-auto"
        style={{ backgroundColor: "hsl(179 100% 6%)", border: "1px solid hsl(149 28% 79% / 0.14)" }}>
        <button onClick={onClose} className="absolute top-5 right-5" style={{ color: "hsl(149 28% 79% / 0.40)" }}>
          <X size={18} />
        </button>

        <h2 className="font-serif text-xl mb-1" style={{ color: "hsl(149 28% 79%)" }}>Add a digital asset</h2>
        <p className="font-sans text-sm mb-6" style={{ color: "hsl(149 28% 79% / 0.45)" }}>Map something meaningful and assign it to the right people.</p>

        <form onSubmit={handleSave} className="flex flex-col gap-5">
          {/* Asset title */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>Asset title</label>
            <input value={assetName} onChange={(e) => setAssetName(e.target.value)}
              placeholder="e.g. Family photos – iCloud 2019" required
              className="px-4 py-3 rounded-xl font-sans text-sm outline-none transition-all" style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = focusBorder)}
              onBlur={(e) => (e.target.style.borderColor = blurBorder)} />
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>Type</label>
            <div className="flex flex-wrap gap-2">
              {ASSET_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => setTypeWithReset(t.value)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full font-sans text-xs font-medium transition-all duration-150"
                  style={type === t.value
                    ? { backgroundColor: "hsl(149 28% 79%)", color: "hsl(179 100% 8%)" }
                    : { backgroundColor: "hsl(149 28% 79% / 0.08)", color: "hsl(149 28% 79% / 0.60)", border: "1px solid hsl(149 28% 79% / 0.15)" }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* File upload: multi-photo for Photos, single file for other types */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>
              {type === "photo" ? `Photos (up to ${MAX_PHOTOS_PER_UPLOAD})` : "Attach a file"} <span style={{ color: "hsl(149 28% 79% / 0.30)" }}>(optional)</span>
            </label>
            {type === "photo" ? (
              <MultiPhotoDropZone files={selectedPhotos} onFiles={setSelectedPhotos} />
            ) : (
              <FileDropZone file={selectedFile} onFile={setSelectedFile} />
            )}
          </div>

          {/* Collection */}
          {collections.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>
                Add to collection <span style={{ color: "hsl(149 28% 79% / 0.30)" }}>(optional)</span>
              </label>
              <div className="relative">
                <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl font-sans text-sm outline-none appearance-none transition-all"
                  style={{ ...inputStyle }}>
                  <option value="">— No collection —</option>
                  {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "hsl(149 28% 79% / 0.40)" }} />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>
              Notes <span style={{ color: "hsl(149 28% 79% / 0.30)" }}>(optional)</span>
            </label>
            <textarea value={mappingSource} onChange={(e) => setMappingSource(e.target.value)}
              placeholder="Any notes about this asset, access instructions, or intent…"
              rows={3} className="px-4 py-3 rounded-xl font-sans text-sm outline-none resize-none transition-all" style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = focusBorder)}
              onBlur={(e) => (e.target.style.borderColor = blurBorder)} />
          </div>

          {/* Assign to contacts + intent actions */}
          <div className="flex flex-col gap-2">
            <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>
              Assign to <span style={{ color: "hsl(149 28% 79% / 0.30)" }}>(optional)</span>
            </label>
            {contacts.length === 0 ? (
              <p className="font-sans text-xs px-3 py-2.5 rounded-xl"
                style={{ color: "hsl(149 28% 79% / 0.35)", backgroundColor: "hsl(149 28% 79% / 0.05)", border: "1px dashed hsl(149 28% 79% / 0.15)" }}>
                Add a trusted contact first to assign this asset.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {contacts.map((contact) => {
                  const isSelected = contact.id in contactIntents;
                  const intent = contactIntents[contact.id];
                  return (
                    <div key={contact.id} className="rounded-xl p-3 transition-all duration-150"
                      style={{ backgroundColor: isSelected ? "hsl(149 28% 79% / 0.06)" : "transparent", border: `1px solid ${isSelected ? "hsl(149 28% 79% / 0.20)" : "hsl(149 28% 79% / 0.08)"}` }}>
                      <div className="flex items-center justify-between">
                        <button type="button" onClick={() => toggleContact(contact.id)}
                          className="flex items-center gap-2 font-sans text-sm font-medium transition-colors"
                          style={{ color: isSelected ? "hsl(149 28% 79%)" : "hsl(149 28% 79% / 0.55)" }}>
                          <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                            style={{ borderColor: isSelected ? "hsl(149 28% 79%)" : "hsl(149 28% 79% / 0.25)", backgroundColor: isSelected ? "hsl(149 28% 79%)" : "transparent" }}>
                            {isSelected && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(179 100% 8%)" }} />}
                          </div>
                          {contact.name}
                          {contact.relationship && <span className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.35)" }}>· {contact.relationship}</span>}
                        </button>
                      </div>
                      {/* Intent action selector */}
                      {isSelected && (
                        <div className="flex gap-1.5 mt-2.5 ml-6">
                          {INTENT_ACTIONS.map((a) => (
                            <button key={a.value} type="button" onClick={() => setIntent(contact.id, a.value)}
                              className="px-2.5 py-1 rounded-full font-sans text-xs font-semibold transition-all duration-150"
                              style={intent === a.value
                                ? { backgroundColor: a.color, color: "hsl(179 100% 8%)" }
                                : { backgroundColor: `${a.color}18`, color: a.color, border: `1px solid ${a.color}44` }}>
                              {a.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button type="submit" disabled={saving}
            className="mt-2 py-3 rounded-full font-sans text-sm font-semibold transition-all duration-300 disabled:opacity-60"
            style={{ backgroundColor: "hsl(149 28% 79%)", color: "hsl(179 100% 8%)" }}>
            {saving ? "Saving…" : Object.keys(contactIntents).length > 0 ? "Save & Assign" : "Save Asset"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Add Contact Modal ─────────────────────────────────────────────────────────

function AddContactModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [personalizedMessage, setPersonalizedMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // Count words in personalized message
  const wordCount = personalizedMessage.trim() ? personalizedMessage.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
  const maxWords = 200;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName) {
      toast({ title: "Full name required", description: "Please enter the contact's full name.", variant: "destructive" });
      return;
    }
    if (!trimmedEmail) {
      toast({ title: "Email required", description: "Please enter the contact's email address.", variant: "destructive" });
      return;
    }
    if (wordCount > maxWords) {
      toast({ title: "Message too long", description: `Please keep your message under ${maxWords} words. Currently ${wordCount} words.`, variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("trusted_contacts").insert([
      { 
        name: trimmedName, 
        email: trimmedEmail, 
        relationship: relationship.trim() || null,
        phone_number: phoneNumber.trim() || null,
        personalized_message: personalizedMessage.trim() || null,
        user_id: user.id 
      },
    ]);
    setSaving(false);
    if (error) {
      toast({ title: "Error saving contact", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contact added!", description: `${trimmedName} is now a trusted contact.` });
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "hsl(179 100% 4% / 0.85)", backdropFilter: "blur(8px)" }}>
      <div className="relative w-full max-w-md rounded-2xl p-8"
        style={{ backgroundColor: "hsl(179 100% 6%)", border: "1px solid hsl(149 28% 79% / 0.14)" }}>
        <button onClick={onClose} className="absolute top-5 right-5" style={{ color: "hsl(149 28% 79% / 0.40)" }}>
          <X size={18} />
        </button>
        <h2 className="font-serif text-xl mb-1" style={{ color: "hsl(149 28% 79%)" }}>Add a trusted contact</h2>
        <p className="font-sans text-sm mb-6" style={{ color: "hsl(149 28% 79% / 0.45)" }}>Someone who will receive parts of your legacy.</p>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {[
            { label: "Full name", value: name, setter: setName, placeholder: "e.g. Sarah Chen", type: "text", required: true },
            { label: "Email address", value: email, setter: setEmail, placeholder: "sarah@example.com", type: "email", required: true },
            { label: "Relationship", value: relationship, setter: setRelationship, placeholder: "e.g. Sister, Best friend, Partner", type: "text", required: false },
            { label: "Phone number", value: phoneNumber, setter: setPhoneNumber, placeholder: "e.g. +1 234 567 8900", type: "tel", required: false },
          ].map((field) => (
            <div key={field.label} className="flex flex-col gap-1.5">
              <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>
                {field.label} {!field.required && <span style={{ color: "hsl(149 28% 79% / 0.30)" }}>(optional)</span>}
              </label>
              <input type={field.type} value={field.value} onChange={(e) => field.setter(e.target.value)}
                placeholder={field.placeholder} required={field.required}
                className="px-4 py-3 rounded-xl font-sans text-sm outline-none transition-all" style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = focusBorder)}
                onBlur={(e) => (e.target.style.borderColor = blurBorder)} />
            </div>
          ))}
          
          {/* Personalized Message */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>
              Personalized message <span style={{ color: "hsl(149 28% 79% / 0.30)" }}>(optional)</span>
            </label>
            <p className="font-sans text-xs mb-1.5" style={{ color: "hsl(149 28% 79% / 0.45)" }}>
              Write a personal message (up to {maxWords} words) that this contact will receive when you've passed away.
            </p>
            <textarea
              value={personalizedMessage}
              onChange={(e) => setPersonalizedMessage(e.target.value)}
              placeholder="e.g. Thank you for being such an important part of my life. I wanted you to know how much your friendship meant to me..."
              rows={6}
              maxLength={1400}
              className="px-4 py-3 rounded-xl font-sans text-sm outline-none resize-none transition-all"
              style={{
                ...inputStyle,
                borderColor: wordCount > maxWords ? "hsl(0 55% 60%)" : inputStyle.border,
              }}
              onFocus={(e) => (e.target.style.borderColor = wordCount > maxWords ? "hsl(0 55% 60%)" : focusBorder)}
              onBlur={(e) => (e.target.style.borderColor = wordCount > maxWords ? "hsl(0 55% 60%)" : blurBorder)}
            />
            <div className="flex items-center justify-between">
              <p className="font-sans text-xs" style={{ color: wordCount > maxWords ? "hsl(0 55% 60%)" : "hsl(149 28% 79% / 0.40)" }}>
                {wordCount > maxWords ? `⚠ ${wordCount} words (max ${maxWords})` : `${wordCount} / ${maxWords} words`}
              </p>
            </div>
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

// ─── Add Collection Modal ──────────────────────────────────────────────────────

function AddCollectionModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const PRESETS = ["For Maya", "Delete Upon Death", "Family Archive", "Business Accounts", "Personal Letters"];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;
    setSaving(true);
    const { error } = await supabase.from("collections").insert([{ name: name.trim(), user_id: user.id }]);
    setSaving(false);
    if (error) {
      toast({ title: "Error creating collection", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Collection created!", description: `"${name}" is ready for assets.` });
      onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "hsl(179 100% 4% / 0.85)", backdropFilter: "blur(8px)" }}>
      <div className="relative w-full max-w-md rounded-2xl p-8"
        style={{ backgroundColor: "hsl(179 100% 6%)", border: "1px solid hsl(149 28% 79% / 0.14)" }}>
        <button onClick={onClose} className="absolute top-5 right-5" style={{ color: "hsl(149 28% 79% / 0.40)" }}>
          <X size={18} />
        </button>
        <h2 className="font-serif text-xl mb-1" style={{ color: "hsl(149 28% 79%)" }}>Create a collection</h2>
        <p className="font-sans text-sm mb-4" style={{ color: "hsl(149 28% 79% / 0.45)" }}>Group assets that belong together — like "For Maya" or "Delete Upon Death".</p>
        {/* Presets */}
        <div className="flex flex-wrap gap-2 mb-5">
          {PRESETS.map((p) => (
            <button key={p} type="button" onClick={() => setName(p)}
              className="px-3 py-1.5 rounded-full font-sans text-xs transition-all duration-150"
              style={{ backgroundColor: "hsl(149 28% 79% / 0.08)", color: "hsl(149 28% 79% / 0.60)", border: "1px solid hsl(149 28% 79% / 0.15)" }}>
              {p}
            </button>
          ))}
        </div>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>Collection name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. For Maya" required
              className="px-4 py-3 rounded-xl font-sans text-sm outline-none transition-all" style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = focusBorder)}
              onBlur={(e) => (e.target.style.borderColor = blurBorder)} />
          </div>
          <button type="submit" disabled={saving}
            className="py-3 rounded-full font-sans text-sm font-semibold transition-all duration-300 disabled:opacity-60"
            style={{ backgroundColor: "hsl(149 28% 79%)", color: "hsl(179 100% 8%)" }}>
            {saving ? "Creating…" : "Create Collection"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Reflection Engine Prompts ────────────────────────────────────────────────

function ReflectionPrompts({
  assets, assignments, onAddContact, onAddAsset,
}: {
  assets: DigitalAsset[];
  assignments: RelationalAssignment[];
  onAddContact: () => void;
  onAddAsset: () => void;
}) {
  const prompts: { icon: React.ReactNode; text: string; cta: string; action: () => void }[] = [];

  // Unassigned assets
  const unassigned = assets.filter((a) => !assignments.some((r) => r.asset_id === a.id));
  if (unassigned.length > 0) {
    const byType = unassigned.reduce<Record<string, number>>((acc, a) => {
      acc[a.type] = (acc[a.type] ?? 0) + 1;
      return acc;
    }, {});
    const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
    const typeLabel = ASSET_TYPES.find((t) => t.value === topType[0])?.label ?? topType[0];
    prompts.push({
      icon: <Sparkles size={16} />,
      text: `You have ${unassigned.length} unassigned asset${unassigned.length !== 1 ? "s" : ""}${topType[1] > 1 ? ` — including ${topType[1]} ${typeLabel}` : ""}. Who should receive them?`,
      cta: "Assign now",
      action: onAddAsset,
    });
  }

  // Assets with no intent action
  const noIntent = assignments.filter((a) => !a.intent_action);
  if (noIntent.length > 0) {
    prompts.push({
      icon: <Shield size={16} />,
      text: `${noIntent.length} assignment${noIntent.length !== 1 ? "s" : ""} ${noIntent.length !== 1 ? "have" : "has"} no intent set. Should they be Preserved, Transferred, or Deleted?`,
      cta: "Review assets",
      action: onAddAsset,
    });
  }

  if (prompts.length === 0) return null;

  return (
    <div className="mb-8 flex flex-col gap-3">
      <p className="font-sans text-xs font-semibold tracking-widest uppercase" style={{ color: "hsl(149 28% 79% / 0.35)" }}>
        Reflection Engine
      </p>
      {prompts.slice(0, 3).map((prompt, i) => (
        <div key={i} className="rounded-2xl p-5 flex items-start gap-4"
          style={{ backgroundColor: "hsl(179 100% 5%)", border: "1px solid hsl(149 28% 79% / 0.12)" }}>
          <div className="shrink-0 mt-0.5 rounded-full p-2"
            style={{ backgroundColor: "hsl(149 28% 79% / 0.08)", color: "hsl(149 28% 79% / 0.60)" }}>
            {prompt.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans text-sm" style={{ color: "hsl(149 28% 79% / 0.75)" }}>{prompt.text}</p>
          </div>
          <button onClick={prompt.action}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-xs font-semibold transition-all duration-200"
            style={{ backgroundColor: "hsl(149 28% 79% / 0.10)", color: "hsl(149 28% 79%)", border: "1px solid hsl(149 28% 79% / 0.20)" }}>
            {prompt.cta} <ArrowRight size={11} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Empty State Onboarding ───────────────────────────────────────────────────

function EmptyStateOnboarding({ onAddContact, onAddAsset }: { onAddContact: () => void; onAddAsset: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="mb-10 rounded-2xl p-8" style={{ backgroundColor: "hsl(179 100% 5%)", border: "1px dashed hsl(149 28% 79% / 0.15)" }}>
      <p className="font-sans text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "hsl(149 28% 79% / 0.35)" }}>
        Getting started
      </p>
      <h2 className="font-serif text-2xl mb-2" style={{ color: "hsl(149 28% 79%)" }}>
        Your vault is empty. Let's change that.
      </h2>
      <p className="font-sans text-sm mb-8 max-w-md" style={{ color: "hsl(149 28% 79% / 0.50)" }}>
        Safe Hands works best when you start with the people you trust — then map the things you want them to have.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { step: "01", title: "Add a trusted contact", description: "Name someone you'd trust with your most personal memories.", action: onAddContact, cta: "Add Contact", primary: true },
          { step: "02", title: "Map a digital asset", description: "Photos, voice notes, accounts — anything that matters.", action: onAddAsset, cta: "Add Asset", primary: false },
          { step: "03", title: "Set your intentions", description: "Choose what happens to each asset and account — Keep, Archive, Clear, or Donate.", action: () => navigate("/intentions"), cta: "Set Intentions", primary: false },
        ].map((item) => (
          <div key={item.step} className="rounded-xl p-5 flex flex-col gap-3"
            style={{ backgroundColor: "hsl(149 28% 79% / 0.03)", border: "1px solid hsl(149 28% 79% / 0.08)" }}>
            <span className="font-sans text-xs font-bold" style={{ color: "hsl(149 28% 79% / 0.25)" }}>{item.step}</span>
            <div>
              <p className="font-sans text-sm font-semibold mb-1" style={{ color: "hsl(149 28% 79% / 0.85)" }}>{item.title}</p>
              <p className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.45)" }}>{item.description}</p>
            </div>
            {item.action && item.cta && (
              <button onClick={item.action}
                className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-xs font-semibold mt-auto transition-all duration-200"
                style={item.primary
                  ? { backgroundColor: "hsl(149 28% 79%)", color: "hsl(179 100% 8%)" }
                  : { backgroundColor: "hsl(149 28% 79% / 0.10)", color: "hsl(149 28% 79%)", border: "1px solid hsl(149 28% 79% / 0.20)" }}>
                {item.cta} <ArrowRight size={11} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Executor Section ─────────────────────────────────────────────────────────

function ExecutorSection({ contacts, profile, onProfileSaved }: {
  contacts: TrustedContact[];
  profile: UserProfile | null;
  onProfileSaved: () => void;
}) {
  const { user } = useAuth();
  const [executorId, setExecutorId] = useState(profile?.executor_contact_id ?? "");
  const [waitDays, setWaitDays] = useState(profile?.wait_period_days ?? 14);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setExecutorId(profile?.executor_contact_id ?? "");
    setWaitDays(profile?.wait_period_days ?? 14);
  }, [profile]);

  const handleSave = async () => {
    if (!supabase || !user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      executor_contact_id: executorId || null,
      wait_period_days: waitDays,
    };
    const { error } = profile
      ? await supabase.from("profiles").update(payload).eq("user_id", user.id)
      : await supabase.from("profiles").insert([payload]);
    setSaving(false);
    if (error) {
      toast({ title: "Error saving executor settings", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Executor settings saved." });
      onProfileSaved();
    }
  };

  const executor = contacts.find((c) => c.id === executorId);

  return (
    <SectionCard className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={16} style={{ color: "hsl(149 28% 79% / 0.50)" }} />
        <h2 className="font-serif text-lg font-medium" style={{ color: "hsl(149 28% 79%)" }}>Digital Executor</h2>
        {executor && (
          <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-sans text-xs font-semibold"
            style={{ backgroundColor: "hsl(149 28% 79% / 0.10)", color: "hsl(149 28% 79%)", border: "1px solid hsl(149 28% 79% / 0.20)" }}>
            <UserCheck size={11} /> {executor.name}
          </span>
        )}
      </div>
      <p className="font-sans text-sm mb-5" style={{ color: "hsl(149 28% 79% / 0.45)" }}>
        Your Digital Executor gets access to your vault after a security wait period. They can't act immediately — this protects you from impersonation.
      </p>

      {contacts.length === 0 ? (
        <p className="font-sans text-sm px-4 py-3 rounded-xl"
          style={{ color: "hsl(149 28% 79% / 0.40)", backgroundColor: "hsl(149 28% 79% / 0.05)", border: "1px dashed hsl(149 28% 79% / 0.15)" }}>
          Add a trusted contact first, then designate them as your executor.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Executor picker */}
          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>Designate executor</label>
            <div className="relative">
              <select value={executorId} onChange={(e) => setExecutorId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl font-sans text-sm outline-none appearance-none transition-all" style={inputStyle}>
                <option value="">— Choose a contact —</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.name} {c.relationship ? `(${c.relationship})` : ""}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "hsl(149 28% 79% / 0.40)" }} />
            </div>
          </div>

          {/* Wait period slider */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.55)" }}>Security wait period</label>
              <span className="font-sans text-sm font-semibold" style={{ color: "hsl(149 28% 79%)" }}>
                <Clock size={12} className="inline mr-1" style={{ color: "hsl(149 28% 79% / 0.50)" }} />
                {waitDays} days
              </span>
            </div>
            <input type="range" min={7} max={30} step={1} value={waitDays}
              onChange={(e) => setWaitDays(Number(e.target.value))}
              className="w-full accent-current"
              style={{ accentColor: "hsl(149 28% 79%)" }} />
            <div className="flex justify-between">
              <span className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.30)" }}>7 days</span>
              <span className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.30)" }}>30 days</span>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving || !executorId}
            className="self-start px-5 py-2.5 rounded-full font-sans text-sm font-semibold transition-all duration-300 disabled:opacity-40"
            style={{ backgroundColor: "hsl(149 28% 79%)", color: "hsl(179 100% 8%)" }}>
            {saving ? "Saving…" : "Save Executor Settings"}
          </button>
        </div>
      )}
    </SectionCard>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, signOut, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const [assets, setAssets] = useState<DigitalAsset[]>([]);
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [assignments, setAssignments] = useState<RelationalAssignment[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);

  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddCollection, setShowAddCollection] = useState(false);

  const fetchAssets = async () => {
    if (!supabase || !user) return;
    setLoadingAssets(true);
    const { data, error } = await supabase.from("digital_assets").select("*").order("created_at", { ascending: false });
    if (!error) setAssets((data ?? []) as DigitalAsset[]);
    setLoadingAssets(false);
  };

  const fetchContacts = async () => {
    if (!supabase || !user) return;
    setLoadingContacts(true);
    const { data, error } = await supabase.from("trusted_contacts").select("*").order("created_at", { ascending: false });
    if (!error) setContacts(data ?? []);
    setLoadingContacts(false);
  };

  const fetchAssignments = async () => {
    if (!supabase || !user) return;
    const { data, error } = await supabase.from("relational_assignments").select("*");
    if (!error) setAssignments(data ?? []);
  };

  const fetchCollections = async () => {
    if (!supabase || !user) return;
    const { data, error } = await supabase.from("collections").select("*").order("created_at", { ascending: true });
    if (!error) setCollections(data ?? []);
  };

  const fetchProfile = async () => {
    if (!supabase || !user) return;
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
    setProfile(data ?? null);
  };

  useEffect(() => {
    fetchAssets();
    fetchContacts();
    fetchAssignments();
    fetchCollections();
    fetchProfile();
  }, [user]);

  const getAssignedContacts = (assetId: string): { contact: TrustedContact; intent: string | null }[] => {
    return assignments
      .filter((a) => a.asset_id === assetId)
      .map((a) => ({ contact: contacts.find((c) => c.id === a.contact_id)!, intent: a.intent_action }))
      .filter((x) => !!x.contact);
  };

  const getCollectionName = (collectionId: string | null) => {
    if (!collectionId) return null;
    return collections.find((c) => c.id === collectionId)?.name ?? null;
  };

  const deleteAsset = async (id: string) => {
    if (!supabase) return;
    await supabase.from("digital_assets").delete().eq("id", id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setAssignments((prev) => prev.filter((a) => a.asset_id !== id));
    toast({ title: "Asset removed." });
  };

  const deleteContact = async (id: string) => {
    if (!supabase) return;
    await supabase.from("trusted_contacts").delete().eq("id", id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
    setAssignments((prev) => prev.filter((a) => a.contact_id !== id));
    toast({ title: "Contact removed." });
  };

  const deleteCollection = async (id: string) => {
    if (!supabase) return;
    await supabase.from("collections").delete().eq("id", id);
    setCollections((prev) => prev.filter((c) => c.id !== id));
    setAssets((prev) => prev.map((a) => a.collection_id === id ? { ...a, collection_id: null } : a));
    toast({ title: "Collection removed." });
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const handleAssetSaved = () => { fetchAssets(); fetchAssignments(); };

  const isEmpty = assets.length === 0 && contacts.length === 0;
  const completionScore = Math.min(
    100,
    Math.round(
      (assets.length > 0 ? 30 : 0) +
      (contacts.length > 0 ? 25 : 0) +
      (profile?.executor_contact_id ? 25 : 0) +
      (assignments.filter((a) => a.intent_action).length > 0 ? 20 : 0)
    )
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "hsl(179 100% 8%)" }}>
      <Toaster />

      {/* Modals */}
      {showAddAsset && (
        <AddAssetModal onClose={() => setShowAddAsset(false)} onSaved={handleAssetSaved}
          contacts={contacts} collections={collections} />
      )}
      {showAddContact && <AddContactModal onClose={() => setShowAddContact(false)} onSaved={fetchContacts} />}
      {showAddCollection && <AddCollectionModal onClose={() => setShowAddCollection(false)} onSaved={fetchCollections} />}

      {/* Top nav */}
      <header className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between"
        style={{ backgroundColor: "hsl(179 100% 8% / 0.90)", borderBottom: "1px solid hsl(149 28% 79% / 0.08)", backdropFilter: "blur(16px)" }}>
        <a href="/" className="font-serif text-xl font-medium" style={{ color: "hsl(149 28% 79%)" }}>SafeHands</a>
        <div className="flex items-center gap-4">
          <span className="font-sans text-xs hidden sm:block" style={{ color: "hsl(149 28% 79% / 0.40)" }}>{user?.email}</span>
          {isSuperAdmin && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full font-sans text-xs font-semibold hidden sm:inline-flex"
              style={{ backgroundColor: "hsl(149 28% 79% / 0.15)", color: "hsl(149 28% 79%)", border: "1px solid hsl(149 28% 79% / 0.30)" }}>
              Super Admin
            </span>
          )}
          <button
            onClick={() => navigate("/intentions")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-xs font-semibold transition-all duration-200"
            style={{ backgroundColor: "hsl(149 28% 79% / 0.10)", color: "hsl(149 28% 79%)", border: "1px solid hsl(149 28% 79% / 0.20)" }}>
            <Zap size={11} /> My Intentions
          </button>
          <button onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 font-sans text-sm transition-opacity hover:opacity-70"
            style={{ color: "hsl(149 28% 79% / 0.55)" }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Page title + completion score */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
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
          {/* Vault completeness */}
          <div className="shrink-0 rounded-2xl p-4 min-w-[140px]"
            style={{ backgroundColor: "hsl(179 100% 6%)", border: "1px solid hsl(149 28% 79% / 0.10)" }}>
            <p className="font-sans text-xs mb-1" style={{ color: "hsl(149 28% 79% / 0.45)" }}>Vault completeness</p>
            <p className="font-serif text-3xl font-medium mb-2" style={{ color: "hsl(149 28% 79%)" }}>{completionScore}%</p>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "hsl(149 28% 79% / 0.12)" }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${completionScore}%`, backgroundColor: "hsl(149 28% 79%)" }} />
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Digital Assets", value: assets.length },
            { label: "Trusted Contacts", value: contacts.length },
            { label: "Assignments", value: assignments.length },
            { label: "Collections", value: collections.length },
          ].map((stat) => (
            <SectionCard key={stat.label}>
              <p className="font-sans text-xs mb-1" style={{ color: "hsl(149 28% 79% / 0.45)" }}>{stat.label}</p>
              <p className="font-serif text-3xl font-medium" style={{ color: "hsl(149 28% 79%)" }}>{stat.value}</p>
            </SectionCard>
          ))}
        </div>

        {/* Empty state onboarding */}
        {isEmpty && (
          <EmptyStateOnboarding onAddContact={() => setShowAddContact(true)} onAddAsset={() => setShowAddAsset(true)} />
        )}

        {/* Reflection Engine prompts */}
        {!isEmpty && (
          <ReflectionPrompts assets={assets} assignments={assignments}
            onAddContact={() => setShowAddContact(true)} onAddAsset={() => setShowAddAsset(true)} />
        )}

        {/* Executor section */}
        <ExecutorSection contacts={contacts} profile={profile} onProfileSaved={fetchProfile} />

        {/* Collections row */}
        {collections.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-lg font-medium" style={{ color: "hsl(149 28% 79%)" }}>Collections</h2>
              <button onClick={() => setShowAddCollection(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-xs font-semibold transition-all duration-200"
                style={{ backgroundColor: "hsl(149 28% 79% / 0.08)", color: "hsl(149 28% 79% / 0.70)", border: "1px solid hsl(149 28% 79% / 0.15)" }}>
                <FolderPlus size={12} /> New
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {collections.map((col) => {
                const count = assets.filter((a) => a.collection_id === col.id).length;
                return (
                  <div key={col.id} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full font-sans text-sm"
                    style={{ backgroundColor: "hsl(179 100% 6%)", border: "1px solid hsl(149 28% 79% / 0.14)", color: "hsl(149 28% 79% / 0.80)" }}>
                    <Folder size={12} style={{ color: "hsl(149 28% 79% / 0.45)" }} />
                    {col.name}
                    <span className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.35)" }}>{count}</span>
                    <button onClick={() => deleteCollection(col.id)} className="transition-opacity hover:opacity-70 ml-1" style={{ color: "hsl(149 28% 79% / 0.25)" }}>
                      <X size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* ─── Digital Assets ─── */}
          <SectionCard>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-lg font-medium" style={{ color: "hsl(149 28% 79%)" }}>Digital Assets</h2>
              <div className="flex gap-2">
                <button onClick={() => setShowAddAsset(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-sans text-xs font-semibold transition-all duration-200"
                  style={{ backgroundColor: "hsl(149 28% 79%)", color: "hsl(179 100% 8%)" }}>
                  <Plus size={12} /> Add Asset
                </button>
              </div>
            </div>

            {loadingAssets ? (
              <p className="font-sans text-sm" style={{ color: "hsl(149 28% 79% / 0.35)" }}>Loading…</p>
            ) : assets.length === 0 ? (
              <div className="rounded-xl p-6 text-center" style={{ border: "1.5px dashed hsl(149 28% 79% / 0.15)" }}>
                <p className="font-sans text-sm" style={{ color: "hsl(149 28% 79% / 0.40)" }}>No assets yet. Add your first one above.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {assets.map((asset) => {
                  const assignedContacts = getAssignedContacts(asset.id);
                  const collectionName = getCollectionName(asset.collection_id);
                  return (
                    <li key={asset.id} className="flex items-start justify-between gap-3 py-3"
                      style={{ borderBottom: "1px solid hsl(149 28% 79% / 0.07)" }}>
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <span className="font-sans text-sm font-medium truncate" style={{ color: "hsl(149 28% 79%)" }}>
                          {asset.name}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <AssetTypePill type={asset.type} />
                          {collectionName && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-sans text-xs"
                              style={{ backgroundColor: "hsl(149 28% 79% / 0.06)", color: "hsl(149 28% 79% / 0.50)", border: "1px solid hsl(149 28% 79% / 0.12)" }}>
                              <Folder size={9} /> {collectionName}
                            </span>
                          )}
                          {asset.file_path && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-sans text-xs"
                              style={{ backgroundColor: "hsl(149 28% 79% / 0.06)", color: "hsl(149 28% 79% / 0.50)" }}>
                              <Upload size={9} /> File attached
                            </span>
                          )}
                        </div>
                        {asset.mapping_source && (
                          <p className="font-sans text-xs line-clamp-2" style={{ color: "hsl(149 28% 79% / 0.40)" }}>
                            {asset.mapping_source}
                          </p>
                        )}
                        {assignedContacts.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {assignedContacts.map(({ contact, intent }) => (
                              <ContactChip key={contact.id} name={contact.name} intent={intent} />
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={() => deleteAsset(asset.id)} className="mt-0.5 shrink-0 transition-opacity hover:opacity-70" style={{ color: "hsl(149 28% 79% / 0.30)" }}>
                        <Trash2 size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          {/* ─── Trusted Contacts ─── */}
          <SectionCard>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-lg font-medium" style={{ color: "hsl(149 28% 79%)" }}>Trusted Contacts</h2>
              <div className="flex gap-2">
                <button onClick={() => setShowAddContact(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-sans text-xs font-semibold transition-all duration-200"
                  style={{ backgroundColor: "hsl(149 28% 79% / 0.12)", color: "hsl(149 28% 79%)", border: "1px solid hsl(149 28% 79% / 0.20)" }}>
                  <Users size={12} /> Add Contact
                </button>
                <button onClick={() => setShowAddCollection(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full font-sans text-xs font-semibold transition-all duration-200"
                  style={{ backgroundColor: "hsl(149 28% 79% / 0.06)", color: "hsl(149 28% 79% / 0.60)", border: "1px solid hsl(149 28% 79% / 0.12)" }}>
                  <FolderPlus size={12} />
                </button>
              </div>
            </div>

            {loadingContacts ? (
              <p className="font-sans text-sm" style={{ color: "hsl(149 28% 79% / 0.35)" }}>Loading…</p>
            ) : contacts.length === 0 ? (
              <div className="rounded-xl p-6 text-center" style={{ border: "1.5px dashed hsl(149 28% 79% / 0.15)" }}>
                <p className="font-sans text-sm" style={{ color: "hsl(149 28% 79% / 0.40)" }}>No trusted contacts yet. Add the people who matter.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {contacts.map((contact) => {
                  const assignedCount = assignments.filter((a) => a.contact_id === contact.id).length;
                  const isExecutor = profile?.executor_contact_id === contact.id;
                  return (
                    <li key={contact.id} className="flex items-center justify-between gap-3 py-3"
                      style={{ borderBottom: "1px solid hsl(149 28% 79% / 0.07)" }}>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-sm font-medium" style={{ color: "hsl(149 28% 79%)" }}>{contact.name}</span>
                          {isExecutor && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-sans text-xs font-semibold"
                              style={{ backgroundColor: "hsl(149 28% 79% / 0.15)", color: "hsl(149 28% 79%)", border: "1px solid hsl(149 28% 79% / 0.30)" }}>
                              <Shield size={9} /> Executor
                            </span>
                          )}
                        </div>
                        <span className="font-sans text-xs truncate" style={{ color: "hsl(149 28% 79% / 0.45)" }}>{contact.email}</span>
                        {contact.relationship && (
                          <span className="font-sans text-xs" style={{ color: "hsl(149 28% 79% / 0.30)" }}>{contact.relationship}</span>
                        )}
                        {assignedCount > 0 && (
                          <span className="font-sans text-xs mt-0.5" style={{ color: "hsl(149 28% 79% / 0.40)" }}>
                            {assignedCount} asset{assignedCount !== 1 ? "s" : ""} assigned
                          </span>
                        )}
                      </div>
                      <button onClick={() => deleteContact(contact.id)} className="shrink-0 transition-opacity hover:opacity-70" style={{ color: "hsl(149 28% 79% / 0.30)" }}>
                        <Trash2 size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </div>
      </main>
    </div>
  );
}
