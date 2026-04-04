
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  AlertTriangle,
  BarChart3,
  Camera,
  CheckSquare,
  Download,
  FileText,
  Filter,
  Home,
  Plus,
  Search,
  Trash2,
  Upload,
  Pencil,
  X,
  Expand,
  Loader2,
  Cloud,
  Moon,
  Printer,
} from "lucide-react";
import { motion } from "framer-motion";

const env = typeof import.meta !== "undefined" && import.meta?.env ? import.meta.env : {};
const supabaseUrl = env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const defaultProfile = {
  resident_name: "Theo",
  location: "Oostvoorne / thuis",
  standard_location: "Slaapkamer / tuinzijde",
  authority1: "Gemeente Voorne aan Zee",
  authority2: "DCMR",
};

function cn(...parts) {
  return parts.filter(Boolean).join(" ");
}

function Card({ className = "", children }) {
  return <div className={cn("card", className)}>{children}</div>;
}
function CardHeader({ className = "", children }) {
  return <div className={cn("card-header", className)}>{children}</div>;
}
function CardTitle({ className = "", children }) {
  return <h2 className={cn("card-title", className)}>{children}</h2>;
}
function CardDescription({ className = "", children }) {
  return <p className={cn("card-description", className)}>{children}</p>;
}
function CardContent({ className = "", children }) {
  return <div className={cn("card-content", className)}>{children}</div>;
}
function Button({ className = "", variant = "default", size = "md", children, ...props }) {
  return (
    <button
      className={cn(
        "btn",
        variant !== "default" && `btn-${variant}`,
        size === "sm" && "btn-sm",
        size === "icon" && "btn-icon",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
function Input(props) {
  return <input className={cn("input", props.className)} {...props} />;
}
function Textarea(props) {
  return <textarea className={cn("textarea", props.className)} {...props} />;
}
function Checkbox({ checked, onCheckedChange }) {
  return (
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className="checkbox"
    />
  );
}
function Badge({ className = "", variant = "default", children }) {
  return <span className={cn("badge", variant !== "default" && `badge-${variant}`, className)}>{children}</span>;
}
function Label({ children }) {
  return <label className="label">{children}</label>;
}

function formatDateTimeLocal(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toLocalInputValue(value) {
  if (!value) return formatDateTimeLocal();
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function formatDisplayDateTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function downloadTextFile(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function isNightIncident(value) {
  if (!value) return false;
  const hour = new Date(value).getHours();
  return hour >= 23 || hour < 7;
}

function safeLower(value) {
  return String(value || "").toLowerCase();
}

async function signedUrlsForMedia(items) {
  if (!supabase || !items.length) return {};
  const results = await Promise.all(
    items.map(async (item) => {
      const { data } = await supabase.storage.from("evidence").createSignedUrl(item.file_path, 3600);
      return [item.id, data?.signedUrl || null];
    })
  );
  return Object.fromEntries(results);
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [profile, setProfile] = useState(defaultProfile);
  const [incidents, setIncidents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allMedia, setAllMedia] = useState([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("Alles");
  const [filterSource, setFilterSource] = useState("Alles");
  const [filterNightOnly, setFilterNightOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [editingIncidentId, setEditingIncidentId] = useState(null);
  const [activePreviewMedia, setActivePreviewMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState([]);
  const [noteInput, setNoteInput] = useState("");
  const [taskInput, setTaskInput] = useState("");
  const mediaInputRef = useRef(null);
  const incidentMediaInputRef = useRef(null);

  const [incidentForm, setIncidentForm] = useState({
    datetime: formatDateTimeLocal(),
    category: "Geluid",
    severity: "Middel",
    location: defaultProfile.standard_location,
    title: "",
    description: "",
    db: "",
    weather: "",
    source: "",
    actions: "",
  });

  const mediaByIncident = useMemo(() => {
    const map = {};
    for (const item of allMedia) {
      if (!map[item.incident_id]) map[item.incident_id] = [];
      map[item.incident_id].push(item);
    }
    return map;
  }, [allMedia]);

  const sourceOptions = useMemo(() => {
    const values = Array.from(new Set(incidents.map((i) => i.source).filter(Boolean)));
    return ["Alles", ...values.sort((a, b) => a.localeCompare(b))];
  }, [incidents]);

  const incidentsSorted = useMemo(() => {
    return [...incidents].sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    return incidentsSorted.filter((incident) => {
      const matchesCategory = filterCategory === "Alles" || incident.category === filterCategory;
      const matchesSource = filterSource === "Alles" || (incident.source || "") === filterSource;
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        safeLower(incident.title).includes(q) ||
        safeLower(incident.description).includes(q) ||
        safeLower(incident.location).includes(q) ||
        safeLower(incident.source).includes(q);
      const matchesNight = !filterNightOnly || isNightIncident(incident.datetime);
      const incidentDate = new Date(incident.datetime);
      const matchesFrom = !dateFrom || incidentDate >= new Date(`${dateFrom}T00:00`);
      const matchesTo = !dateTo || incidentDate <= new Date(`${dateTo}T23:59`);
      return matchesCategory && matchesSource && matchesSearch && matchesNight && matchesFrom && matchesTo;
    });
  }, [incidentsSorted, filterCategory, filterSource, search, filterNightOnly, dateFrom, dateTo]);

  const dashboard = useMemo(() => {
    const total = incidents.length;
    const high = incidents.filter((i) => i.severity === "Hoog").length;
    const sound = incidents.filter((i) => i.category === "Geluid").length;
    const light = incidents.filter((i) => i.category === "Licht").length;
    const smell = incidents.filter((i) => i.category === "Geur").length;
    const night = incidents.filter((i) => isNightIncident(i.datetime)).length;
    const avgDbValues = incidents.map((i) => Number(i.db)).filter((n) => !Number.isNaN(n) && n > 0);
    const avgDb = avgDbValues.length ? (avgDbValues.reduce((a, b) => a + b, 0) / avgDbValues.length).toFixed(1) : "-";
    return { total, high, sound, light, smell, night, avgDb };
  }, [incidents]);

  const sourceSummary = useMemo(() => {
    const counts = {};
    incidents.forEach((incident) => {
      const key = incident.source || "Onbekend";
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [incidents]);

  const categorySummary = useMemo(() => {
    const counts = {};
    incidents.forEach((incident) => {
      counts[incident.category] = (counts[incident.category] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [incidents]);

  const recentTimeline = useMemo(() => filteredIncidents.slice(0, 10), [filteredIncidents]);

  const showMessage = (message, error = false) => {
    setFormMessage(message);
    setIsError(error);
  };

  const resetIncidentForm = () => {
    setEditingIncidentId(null);
    setIncidentForm({
      datetime: formatDateTimeLocal(),
      category: "Geluid",
      severity: "Middel",
      location: profile.standard_location || "Slaapkamer / tuinzijde",
      title: "",
      description: "",
      db: "",
      weather: "",
      source: "",
      actions: "",
    });
    setSelectedMediaIds([]);
    setFormMessage("");
    setIsError(false);
  };

  const clearFilters = () => {
    setSearch("");
    setFilterCategory("Alles");
    setFilterSource("Alles");
    setFilterNightOnly(false);
    setDateFrom("");
    setDateTo("");
  };

  const refreshData = async () => {
    if (!supabase) {
      showMessage("Supabase variabelen ontbreken. Voeg je VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY toe.", true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [profileRes, incidentsRes, notesRes, tasksRes, mediaRes] = await Promise.all([
        supabase.from("profiles").select("*").limit(1).maybeSingle(),
        supabase.from("incidents").select("*").order("datetime", { ascending: false }),
        supabase.from("notes").select("*").order("created_at", { ascending: false }),
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("media").select("*").order("created_at", { ascending: false }),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      else {
        const { data: insertedProfile } = await supabase.from("profiles").insert(defaultProfile).select().single();
        if (insertedProfile) setProfile(insertedProfile);
      }

      const mediaRows = mediaRes.data || [];
      const urlMap = await signedUrlsForMedia(mediaRows);
      const enrichedMedia = mediaRows.map((item) => ({
        ...item,
        url: urlMap[item.id] || null,
        type: item.mime_type?.startsWith("video/") ? "video" : "image",
      }));

      setIncidents(incidentsRes.data || []);
      setNotes(notesRes.data || []);
      setTasks(tasksRes.data || []);
      setAllMedia(enrichedMedia);
    } catch {
      showMessage("Laden uit Supabase mislukt.", true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleMediaUpload = async (e, incidentId = null, selectForForm = false) => {
    if (!supabase) return;
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name}`;
        const path = incidentId ? `incidents/${incidentId}/${safeName}` : `unassigned/${safeName}`;

        const { error: uploadError } = await supabase.storage.from("evidence").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (uploadError) throw uploadError;

        const rowToInsert = {
          incident_id: incidentId,
          file_name: file.name,
          file_path: path,
          mime_type: file.type || "application/octet-stream",
          size_bytes: file.size,
        };

        const { data: inserted, error: insertError } = await supabase.from("media").insert(rowToInsert).select().single();
        if (insertError) throw insertError;

        const { data: signed } = await supabase.storage.from("evidence").createSignedUrl(path, 3600);
        uploaded.push({
          ...inserted,
          url: signed?.signedUrl || null,
          type: file.type?.startsWith("video/") ? "video" : "image",
        });
      }

      setAllMedia((prev) => [...uploaded, ...prev]);
      if (selectForForm) {
        setSelectedMediaIds((prev) => [...new Set([...prev, ...uploaded.map((item) => item.id)])]);
      }
      showMessage("Bestand(en) geüpload.");
    } catch {
      showMessage("Uploaden van bestand mislukt.", true);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const attachUnassignedMediaToIncident = async (incidentId) => {
    const items = allMedia.filter((item) => selectedMediaIds.includes(item.id));
    for (const item of items) {
      if (item.incident_id === incidentId) continue;
      await supabase.from("media").update({ incident_id: incidentId }).eq("id", item.id);
    }
  };

  const saveProfile = async () => {
    if (!supabase || !profile.id) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        resident_name: profile.resident_name,
        location: profile.location,
        standard_location: profile.standard_location,
        authority1: profile.authority1,
        authority2: profile.authority2,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) showMessage("Profiel opslaan mislukt.", true);
    else showMessage("Instellingen opgeslagen.");
  };

  const addIncident = async () => {
    if (!supabase) return;
    if (!incidentForm.title.trim()) return showMessage("Vul eerst een titel in.", true);
    if (!incidentForm.description.trim()) return showMessage("Vul eerst een beschrijving in.", true);

    setSaving(true);
    try {
      if (editingIncidentId) {
        const { error } = await supabase
          .from("incidents")
          .update({
            ...incidentForm,
            datetime: new Date(incidentForm.datetime).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingIncidentId);
        if (error) throw error;
        await attachUnassignedMediaToIncident(editingIncidentId);
        showMessage("Incident bijgewerkt.");
      } else {
        const { data, error } = await supabase
          .from("incidents")
          .insert({
            ...incidentForm,
            datetime: new Date(incidentForm.datetime).toISOString(),
          })
          .select()
          .single();
        if (error) throw error;
        await attachUnassignedMediaToIncident(data.id);
        showMessage("Incident opgeslagen.");
      }

      await refreshData();
      resetIncidentForm();
      setActiveTab("incidenten");
    } catch {
      showMessage("Incident opslaan mislukt.", true);
    } finally {
      setSaving(false);
    }
  };

  const addQuickIncident = async (category) => {
    if (!supabase) return;
    const titles = {
      Geluid: "Geluidsoverlast waargenomen",
      Licht: "Lichthinder waargenomen",
      Geur: "Geuroverlast waargenomen",
    };

    const { error } = await supabase.from("incidents").insert({
      datetime: new Date().toISOString(),
      category,
      severity: "Middel",
      location: profile.standard_location || "Slaapkamer / tuinzijde",
      title: titles[category],
      description: "Korte snelle registratie. Werk details later uit.",
      db: "",
      weather: "",
      source: "",
      actions: "",
    });

    if (error) showMessage("Snel incident opslaan mislukt.", true);
    else {
      showMessage("Snel incident opgeslagen.");
      refreshData();
    }
  };

  const startEditIncident = (incident) => {
    setEditingIncidentId(incident.id);
    setIncidentForm({
      datetime: toLocalInputValue(incident.datetime),
      category: incident.category || "Geluid",
      severity: incident.severity || "Middel",
      location: incident.location || profile.standard_location || "Slaapkamer / tuinzijde",
      title: incident.title || "",
      description: incident.description || "",
      db: incident.db || "",
      weather: incident.weather || "",
      source: incident.source || "",
      actions: incident.actions || "",
    });
    setSelectedMediaIds((mediaByIncident[incident.id] || []).map((item) => item.id));
    setFormMessage("");
    setIsError(false);
    setActiveTab("registratie");
  };

  const addNote = async () => {
    if (!supabase || !noteInput.trim()) return;
    const { error } = await supabase.from("notes").insert({ text: noteInput.trim() });
    if (error) showMessage("Notitie opslaan mislukt.", true);
    else {
      setNoteInput("");
      refreshData();
    }
  };

  const addTask = async () => {
    if (!supabase || !taskInput.trim()) return;
    const { error } = await supabase.from("tasks").insert({ text: taskInput.trim(), done: false });
    if (error) showMessage("Taak opslaan mislukt.", true);
    else {
      setTaskInput("");
      refreshData();
    }
  };

  const toggleTask = async (task) => {
    if (!supabase) return;
    await supabase.from("tasks").update({ done: !task.done }).eq("id", task.id);
    refreshData();
  };

  const deleteIncident = async (id) => {
    if (!supabase) return;
    await supabase.from("incidents").delete().eq("id", id);
    refreshData();
  };

  const deleteNote = async (id) => {
    if (!supabase) return;
    await supabase.from("notes").delete().eq("id", id);
    refreshData();
  };

  const deleteTask = async (id) => {
    if (!supabase) return;
    await supabase.from("tasks").delete().eq("id", id);
    refreshData();
  };

  const deleteMedia = async (id) => {
    if (!supabase) return;
    const item = allMedia.find((entry) => entry.id === id);
    if (!item) return;
    await supabase.storage.from("evidence").remove([item.file_path]);
    await supabase.from("media").delete().eq("id", id);
    setSelectedMediaIds((prev) => prev.filter((itemId) => itemId !== id));
    refreshData();
  };

  const toggleSelectedMedia = (id) => {
    setSelectedMediaIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const removeSelectedMediaFromForm = (id) => {
    setSelectedMediaIds((prev) => prev.filter((item) => item !== id));
  };

  const openMediaPreview = (item) => setActivePreviewMedia(item);
  const closeMediaPreview = () => setActivePreviewMedia(null);

  const exportJSON = () => {
    downloadTextFile(
      `overlast-backup-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ profile, incidents, notes, tasks, media: allMedia }, null, 2),
      "application/json;charset=utf-8"
    );
  };

  const exportCSV = () => {
    const headers = ["datum_tijd", "categorie", "ernst", "locatie", "titel", "beschrijving", "db", "weer", "bron", "acties", "nacht", "bestanden"];
    const rows = filteredIncidents.map((i) => [
      i.datetime,
      i.category,
      i.severity,
      i.location,
      i.title,
      i.description,
      i.db,
      i.weather,
      i.source,
      i.actions,
      isNightIncident(i.datetime) ? "ja" : "nee",
      (mediaByIncident[i.id] || []).map((m) => m.file_name).join(", "),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(";")).join("\n");
    downloadTextFile(`overlast-incidenten-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv;charset=utf-8");
  };

  const exportReport = () => {
    const sorted = [...filteredIncidents].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    const lines = [
      "OVERLASTRAPPORT",
      "",
      `Naam: ${profile.resident_name || "-"}`,
      `Locatie: ${profile.location || "-"}`,
      `Datum export: ${new Intl.DateTimeFormat("nl-NL", { dateStyle: "full", timeStyle: "short" }).format(new Date())}`,
      `Bestemd voor: ${profile.authority1 || "-"} / ${profile.authority2 || "-"}`,
      "",
      "SAMENVATTING",
      `Totaal incidenten: ${filteredIncidents.length}`,
      `Geluid: ${filteredIncidents.filter((i) => i.category === "Geluid").length}`,
      `Licht: ${filteredIncidents.filter((i) => i.category === "Licht").length}`,
      `Geur: ${filteredIncidents.filter((i) => i.category === "Geur").length}`,
      `Nachtincidenten: ${filteredIncidents.filter((i) => isNightIncident(i.datetime)).length}`,
      "",
      "TIJDLIJN (chronologisch)",
      ...sorted.flatMap((incident, index) => [
        `${index + 1}. ${formatDisplayDateTime(incident.datetime)} | ${incident.category} | ${incident.severity}${isNightIncident(incident.datetime) ? " | NACHT" : ""}`,
        `Titel: ${incident.title}`,
        `Locatie: ${incident.location}`,
        `Bron: ${incident.source || "-"}`,
        `Beschrijving: ${incident.description}`,
        `dB: ${incident.db || "-"}`,
        `Weer: ${incident.weather || "-"}`,
        `Vastlegging / actie: ${incident.actions || "-"}`,
        `Gekoppelde bestanden: ${(mediaByIncident[incident.id] || []).map((m) => m.file_name).join(", ") || "-"}`,
        "",
      ]),
    ].join("\n");
    downloadTextFile(`overlastrapport-${new Date().toISOString().slice(0, 10)}.txt`, lines);
  };

  const printReport = () => {
    const sorted = [...filteredIncidents].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    const html = `
      <html>
        <head>
          <title>Overlastrapport</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1,h2 { margin-bottom: 8px; }
            .meta { margin-bottom: 16px; color: #374151; }
            .item { border-top: 1px solid #d1d5db; padding: 12px 0; }
            .small { color: #4b5563; }
          </style>
        </head>
        <body>
          <h1>Overlastrapport</h1>
          <div class="meta">
            <div><strong>Naam:</strong> ${profile.resident_name || "-"}</div>
            <div><strong>Locatie:</strong> ${profile.location || "-"}</div>
            <div><strong>Export:</strong> ${new Intl.DateTimeFormat("nl-NL", { dateStyle: "full", timeStyle: "short" }).format(new Date())}</div>
            <div><strong>Bestemd voor:</strong> ${profile.authority1 || "-"} / ${profile.authority2 || "-"}</div>
          </div>
          <h2>Samenvatting</h2>
          <div class="meta">
            <div>Totaal incidenten: ${filteredIncidents.length}</div>
            <div>Nachtincidenten: ${filteredIncidents.filter((i) => isNightIncident(i.datetime)).length}</div>
            <div>Gemiddelde dB: ${dashboard.avgDb}</div>
          </div>
          <h2>Tijdlijn</h2>
          ${sorted.map((incident, index) => `
            <div class="item">
              <div><strong>${index + 1}. ${formatDisplayDateTime(incident.datetime)}</strong> ${isNightIncident(incident.datetime) ? "(NACHT)" : ""}</div>
              <div class="small">${incident.category} | ${incident.severity} | ${incident.location || "-"}</div>
              <div><strong>Titel:</strong> ${incident.title}</div>
              <div><strong>Beschrijving:</strong> ${incident.description}</div>
              <div><strong>Bron:</strong> ${incident.source || "-"}</div>
              <div><strong>dB:</strong> ${incident.db || "-"}</div>
            </div>
          `).join("")}
        </body>
      </html>
    `;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  const tabs = [
    { id: "home", label: "Start", icon: Home },
    { id: "registratie", label: editingIncidentId ? "Incident bewerken" : "Nieuw incident", icon: Plus },
    { id: "incidenten", label: "Incidenten", icon: AlertTriangle },
    { id: "media", label: "Foto's / video's", icon: Camera },
    { id: "notities", label: "Notities", icon: FileText },
    { id: "checklist", label: "Checklist", icon: CheckSquare },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "instellingen", label: "Instellingen", icon: Filter },
  ];

  if (!supabase) {
    return (
      <div className="app-shell">
        <div className="container">
          <Card>
            <CardHeader>
              <CardTitle>Supabase configuratie ontbreekt</CardTitle>
              <CardDescription>Voeg je VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY toe.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="container">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="hero-grid">
          <Card>
            <CardHeader>
              <div className="between">
                <div>
                  <CardTitle className="big-title">Overlast Logboek Live — Level 2</CardTitle>
                  <CardDescription>Filters, nachtlabels, bronoverzicht, chronologische rapportage en printbare export.</CardDescription>
                </div>
                <div className="badge-row">
                  <Badge><Cloud className="icon-inline" /> Cloud opslag</Badge>
                  <Badge variant="secondary">Dossiermodus</Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardContent className="stats-grid">
              <div className="stat-box"><p className="muted">Incidenten</p><p className="stat">{dashboard.total}</p></div>
              <div className="stat-box"><p className="muted">Nacht</p><p className="stat">{dashboard.night}</p></div>
              <div className="stat-box"><p className="muted">Gem. dB</p><p className="stat">{dashboard.avgDb}</p></div>
              <div className="stat-box"><p className="muted">Bestanden</p><p className="stat">{allMedia.length}</p></div>
            </CardContent>
          </Card>
        </motion.div>

        {loading && (
          <Card>
            <CardContent className="loading-row">
              <Loader2 className="spin" /> Gegevens laden uit Supabase...
            </CardContent>
          </Card>
        )}

        {!loading && (
          <div className="main-grid">
            <Card>
              <CardContent>
                <div className="side-nav">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("nav-item", active && "nav-item-active")}>
                        <Icon className="icon-sm" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="stack">
              {activeTab === "home" && (
                <div className="stack">
                  <div className="quick-grid">
                    {[{ label: "Snel geluid registreren", category: "Geluid" }, { label: "Snel licht registreren", category: "Licht" }, { label: "Snel geur registreren", category: "Geur" }].map((item) => (
                      <Button key={item.category} onClick={() => addQuickIncident(item.category)} className="quick-btn">
                        <div><div className="bold">{item.label}</div><div className="tiny">Slaat direct op in cloud</div></div>
                      </Button>
                    ))}
                  </div>

                  <div className="content-grid">
                    <Card>
                      <CardHeader><CardTitle>Recente tijdlijn</CardTitle><CardDescription>Laatste 10 op incidentdatum</CardDescription></CardHeader>
                      <CardContent className="stack">
                        {recentTimeline.map((incident) => (
                          <div key={incident.id} className="incident-card">
                            <div className="badge-row">
                              <Badge>{incident.category}</Badge>
                              <Badge variant="outline">{incident.severity}</Badge>
                              {isNightIncident(incident.datetime) && <Badge variant="secondary"><Moon className="icon-inline" /> Nacht</Badge>}
                            </div>
                            <p className="bold mt">{incident.title}</p>
                            <p className="muted mt-sm">{formatDisplayDateTime(incident.datetime)} • {incident.location}</p>
                            <p className="mt">{incident.description}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle>Export & rapport</CardTitle><CardDescription>Klaar voor dossier en print</CardDescription></CardHeader>
                      <CardContent className="stack">
                        <Button onClick={exportReport}><Download className="icon-inline" /> Exporteer rapport (.txt)</Button>
                        <Button onClick={exportCSV} variant="secondary"><Download className="icon-inline" /> Exporteer incidenten (.csv)</Button>
                        <Button onClick={printReport} variant="outline"><Printer className="icon-inline" /> Print / PDF rapport</Button>
                        <Button onClick={exportJSON} variant="outline"><Download className="icon-inline" /> Maak back-up (.json)</Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "registratie" && (
                <Card>
                  <CardHeader>
                    <CardTitle>{editingIncidentId ? "Incident bewerken" : "Nieuw incident registreren"}</CardTitle>
                    <CardDescription>Nu met Level 2 filters, nachtlabels en betere rapportage.</CardDescription>
                  </CardHeader>
                  <CardContent className="stack">
                    {formMessage && <div className={cn("message", isError ? "message-error" : "message-ok")}>{formMessage}</div>}

                    <div className="form-grid-3">
                      <div><Label>Datum en tijd</Label><Input type="datetime-local" value={incidentForm.datetime} onChange={(e) => setIncidentForm({ ...incidentForm, datetime: e.target.value })} /></div>
                      <div><Label>Categorie</Label><select className="input" value={incidentForm.category} onChange={(e) => setIncidentForm({ ...incidentForm, category: e.target.value })}><option>Geluid</option><option>Licht</option><option>Geur</option><option>Terras</option><option>Overig</option></select></div>
                      <div><Label>Ernst</Label><select className="input" value={incidentForm.severity} onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}><option>Laag</option><option>Middel</option><option>Hoog</option></select></div>
                    </div>

                    <div className="form-grid-3">
                      <div><Label>Locatie</Label><Input value={incidentForm.location} onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })} /></div>
                      <div><Label>Bron / oorzaak</Label><Input value={incidentForm.source} onChange={(e) => setIncidentForm({ ...incidentForm, source: e.target.value })} /></div>
                      <div><Label>dB meting</Label><Input value={incidentForm.db} onChange={(e) => setIncidentForm({ ...incidentForm, db: e.target.value })} /></div>
                    </div>

                    <div><Label>Titel</Label><Input value={incidentForm.title} onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })} /></div>
                    <div><Label>Beschrijving</Label><Textarea value={incidentForm.description} onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })} /></div>

                    <div className="form-grid-2">
                      <div><Label>Weersituatie</Label><Input value={incidentForm.weather} onChange={(e) => setIncidentForm({ ...incidentForm, weather: e.target.value })} /></div>
                      <div><Label>Vastlegging / actie</Label><Input value={incidentForm.actions} onChange={(e) => setIncidentForm({ ...incidentForm, actions: e.target.value })} /></div>
                    </div>

                    <div className="stack">
                      <div className="between">
                        <Label>Koppel foto's of video's aan dit incident</Label>
                        <label className="btn btn-outline">
                          <Upload className="icon-inline" /> {uploading ? "Uploaden..." : "Upload direct in incident"}
                          <input ref={incidentMediaInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => handleMediaUpload(e, null, true)} />
                        </label>
                      </div>

                      <div className="media-wrap">
                        {!allMedia.length && <p className="muted">Nog geen bestanden toegevoegd.</p>}
                        {!!allMedia.length && (
                          <div className="media-grid">
                            {allMedia.map((item) => (
                              <div key={item.id} className={cn("media-card", selectedMediaIds.includes(item.id) && "media-selected")}>
                                <button type="button" className="media-preview-btn" onClick={() => openMediaPreview(item)}>
                                  {item.type === "video" ? <video src={item.url || undefined} className="media-thumb" muted playsInline preload="metadata" /> : <img src={item.url || undefined} alt={item.file_name} className="media-thumb" />}
                                  <div className="preview-chip"><Expand className="icon-sm" /></div>
                                </button>
                                <div className="media-body">
                                  <p className="truncate bold">{item.file_name}</p>
                                  <p className="muted tiny">{item.mime_type?.startsWith("video/") ? "Video" : "Foto"}</p>
                                  <div className="badge-row mt">
                                    <Button type="button" variant={selectedMediaIds.includes(item.id) ? "secondary" : "outline"} onClick={() => toggleSelectedMedia(item.id)}>
                                      {selectedMediaIds.includes(item.id) ? "Geselecteerd" : "Kies voor incident"}
                                    </Button>
                                    {selectedMediaIds.includes(item.id) && <Button type="button" variant="ghost" onClick={() => removeSelectedMediaFromForm(item.id)}>Verwijder</Button>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="badge-row">
                      <Button type="button" onClick={addIncident} disabled={saving}><Plus className="icon-inline" /> {saving ? "Opslaan..." : editingIncidentId ? "Incident bijwerken" : "Incident opslaan"}</Button>
                      <Button type="button" variant="outline" onClick={resetIncidentForm}>Formulier leegmaken</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "incidenten" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Incidentenoverzicht</CardTitle>
                    <CardDescription>Nu met filters, bronselectie en chronologische sortering op incidentdatum</CardDescription>
                  </CardHeader>
                  <CardContent className="stack">
                    <div className="filters-grid">
                      <div className="search-wrap">
                        <Search className="search-icon" />
                        <Input className="search-input" placeholder="Zoek op titel, bron, locatie of beschrijving" value={search} onChange={(e) => setSearch(e.target.value)} />
                      </div>
                      <select className="input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        <option>Alles</option><option>Geluid</option><option>Licht</option><option>Geur</option><option>Terras</option><option>Overig</option>
                      </select>
                      <select className="input" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
                        {sourceOptions.map((source) => <option key={source}>{source}</option>)}
                      </select>
                      <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                      <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                      <div className="filter-check">
                        <Checkbox checked={filterNightOnly} onCheckedChange={setFilterNightOnly} />
                        <span>Alleen nacht</span>
                      </div>
                    </div>

                    <div className="badge-row">
                      <Button type="button" variant="outline" onClick={clearFilters}><Filter className="icon-inline" /> Filters wissen</Button>
                      <Badge variant="secondary">{filteredIncidents.length} resultaten</Badge>
                    </div>

                    <div className="stack">
                      {filteredIncidents.map((incident) => (
                        <div key={incident.id} className="incident-card">
                          <div className="between">
                            <div>
                              <div className="badge-row">
                                <p className="bold">{incident.title}</p>
                                <Badge>{incident.category}</Badge>
                                <Badge variant="outline">{incident.severity}</Badge>
                                {isNightIncident(incident.datetime) && <Badge variant="secondary"><Moon className="icon-inline" /> Nacht</Badge>}
                              </div>
                              <p className="muted mt-sm">{formatDisplayDateTime(incident.datetime)} • {incident.location}</p>
                            </div>
                            <div className="badge-row">
                              <Button type="button" variant="outline" size="sm" onClick={() => startEditIncident(incident)}><Pencil className="icon-inline" /> Bewerk</Button>
                              <Button type="button" variant="ghost" size="icon" onClick={() => deleteIncident(incident.id)}><Trash2 className="icon-sm" /></Button>
                            </div>
                          </div>
                          <div className="stack mt">
                            <p><strong>Beschrijving:</strong> {incident.description}</p>
                            <p><strong>Bron:</strong> {incident.source || "-"}</p>
                            <p><strong>dB:</strong> {incident.db || "-"}</p>
                            <p><strong>Weer:</strong> {incident.weather || "-"}</p>
                            <p><strong>Vastlegging:</strong> {incident.actions || "-"}</p>
                            <div>
                              <p><strong>Gekoppelde bestanden:</strong>{(mediaByIncident[incident.id] || []).length ? "" : " -"}</p>
                              {!!(mediaByIncident[incident.id] || []).length && (
                                <div className="media-grid mt">
                                  {(mediaByIncident[incident.id] || []).map((item) => (
                                    <div key={item.id} className="media-card">
                                      <button type="button" className="media-preview-btn" onClick={() => openMediaPreview(item)}>
                                        {item.type === "video" ? <video src={item.url || undefined} className="media-thumb" muted playsInline preload="metadata" /> : <img src={item.url || undefined} alt={item.file_name} className="media-thumb" />}
                                        <div className="preview-chip"><Expand className="icon-sm" /></div>
                                      </button>
                                      <div className="media-body tiny">{item.file_name}</div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "media" && (
                <Card>
                  <CardHeader><CardTitle>Foto's en video's</CardTitle><CardDescription>Bestanden worden opgeslagen in Supabase Storage</CardDescription></CardHeader>
                  <CardContent className="stack">
                    <label className="upload-drop">
                      <Upload className="upload-icon" />
                      <p className="bold">Klik om bestanden te kiezen</p>
                      <p className="muted">Deze bestanden komen in de cloudbucket evidence</p>
                      <input ref={mediaInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => handleMediaUpload(e, null, false)} />
                    </label>

                    <div className="media-grid">
                      {allMedia.map((item) => (
                        <div key={item.id} className="media-card">
                          <button type="button" className="media-preview-btn" onClick={() => openMediaPreview(item)}>
                            {item.type === "video" ? <video src={item.url || undefined} className="media-thumb-large" muted playsInline preload="metadata" /> : <img src={item.url || undefined} alt={item.file_name} className="media-thumb-large" />}
                            <div className="preview-chip"><Expand className="icon-sm" /></div>
                          </button>
                          <div className="media-body">
                            <p className="truncate bold">{item.file_name}</p>
                            <p className="muted tiny">{item.type === "video" ? "Video" : "Foto"} • {formatDisplayDateTime(item.created_at)}</p>
                            <Button type="button" variant="ghost" onClick={() => deleteMedia(item.id)}><Trash2 className="icon-inline" /> Verwijderen</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "notities" && (
                <Card>
                  <CardHeader><CardTitle>Notities</CardTitle></CardHeader>
                  <CardContent className="stack">
                    <Textarea placeholder="Nieuwe notitie" value={noteInput} onChange={(e) => setNoteInput(e.target.value)} />
                    <Button onClick={addNote}><Plus className="icon-inline" /> Notitie toevoegen</Button>
                    <div className="stack">
                      {notes.map((note) => (
                        <div key={note.id} className="note-row">
                          <p>{note.text}</p>
                          <Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)}><Trash2 className="icon-sm" /></Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "checklist" && (
                <Card>
                  <CardHeader><CardTitle>Checklist</CardTitle></CardHeader>
                  <CardContent className="stack">
                    <div className="badge-row"><Input placeholder="Nieuwe taak" value={taskInput} onChange={(e) => setTaskInput(e.target.value)} /><Button onClick={addTask}><Plus className="icon-inline" /> Toevoegen</Button></div>
                    <div className="stack">
                      {tasks.map((task) => (
                        <div key={task.id} className="task-row">
                          <div className="badge-row">
                            <Checkbox checked={task.done} onCheckedChange={() => toggleTask(task)} />
                            <p className={task.done ? "line-through muted" : ""}>{task.text}</p>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}><Trash2 className="icon-sm" /></Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "dashboard" && (
                <div className="stack">
                  <div className="stats-page-grid">
                    {[["Totaal incidenten", dashboard.total], ["Geluid", dashboard.sound], ["Licht", dashboard.light], ["Geur", dashboard.smell], ["Nachtincidenten", dashboard.night], ["Ernstig", dashboard.high], ["Gem. dB", dashboard.avgDb], ["Bestanden", allMedia.length]].map(([label, value]) => (
                      <Card key={label}><CardContent><p className="muted">{label}</p><p className="stat">{value}</p></CardContent></Card>
                    ))}
                  </div>

                  <div className="content-grid">
                    <Card>
                      <CardHeader><CardTitle>Bronnenoverzicht</CardTitle><CardDescription>Welke bron komt het meest voor</CardDescription></CardHeader>
                      <CardContent className="stack">
                        {!sourceSummary.length && <p className="muted">Nog geen brongegevens.</p>}
                        {sourceSummary.map(([source, count]) => (
                          <div key={source} className="summary-row">
                            <div className="summary-label">{source}</div>
                            <div className="summary-bar-wrap"><div className="summary-bar" style={{ width: `${Math.max((count / Math.max(...sourceSummary.map(([, c]) => c))) * 100, 8)}%` }} /></div>
                            <div className="summary-count">{count}</div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader><CardTitle>Categorieoverzicht</CardTitle><CardDescription>Verdeling van type overlast</CardDescription></CardHeader>
                      <CardContent className="stack">
                        {!categorySummary.length && <p className="muted">Nog geen categorieën.</p>}
                        {categorySummary.map(([category, count]) => (
                          <div key={category} className="summary-row">
                            <div className="summary-label">{category}</div>
                            <div className="summary-bar-wrap"><div className="summary-bar" style={{ width: `${Math.max((count / Math.max(...categorySummary.map(([, c]) => c))) * 100, 8)}%` }} /></div>
                            <div className="summary-count">{count}</div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {activePreviewMedia && (
                <div className="modal-backdrop" onClick={closeMediaPreview}>
                  <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                    <div className="between">
                      <div>
                        <p className="bold">{activePreviewMedia.file_name}</p>
                        <p className="muted">{activePreviewMedia.type === "video" ? "Video" : "Foto"}</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={closeMediaPreview}><X className="icon-sm" /></Button>
                    </div>

                    <div className="badge-row mt">
                      <Button type="button" variant="outline" onClick={() => activePreviewMedia.url && window.open(activePreviewMedia.url, "_blank")}>Open bestand apart</Button>
                    </div>

                    <div className="modal-media mt">
                      {activePreviewMedia.type === "video" ? (
                        <video key={activePreviewMedia.id} src={activePreviewMedia.url || undefined} controls playsInline preload="metadata" className="modal-media-el" />
                      ) : (
                        <img src={activePreviewMedia.url || undefined} alt={activePreviewMedia.file_name} className="modal-media-el" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "instellingen" && (
                <Card>
                  <CardHeader><CardTitle>Instellingen</CardTitle><CardDescription>Pas standaardvelden aan en sla ze op in Supabase</CardDescription></CardHeader>
                  <CardContent className="stack">
                    <div className="form-grid-2">
                      <div><Label>Naam</Label><Input value={profile.resident_name || ""} onChange={(e) => setProfile({ ...profile, resident_name: e.target.value })} /></div>
                      <div><Label>Locatie / adresomschrijving</Label><Input value={profile.location || ""} onChange={(e) => setProfile({ ...profile, location: e.target.value })} /></div>
                      <div><Label>Standaard meetlocatie</Label><Input value={profile.standard_location || ""} onChange={(e) => setProfile({ ...profile, standard_location: e.target.value })} /></div>
                      <div><Label>Instantie 1</Label><Input value={profile.authority1 || ""} onChange={(e) => setProfile({ ...profile, authority1: e.target.value })} /></div>
                      <div><Label>Instantie 2</Label><Input value={profile.authority2 || ""} onChange={(e) => setProfile({ ...profile, authority2: e.target.value })} /></div>
                    </div>
                    <div className="badge-row">
                      <Button variant="outline" onClick={saveProfile}>Instellingen opslaan</Button>
                      <Button variant="outline" onClick={refreshData}>Ververs uit cloud</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
