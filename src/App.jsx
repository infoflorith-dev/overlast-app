import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Mic,
  Sun,
  Wind,
} from "lucide-react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
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

function getDbNorm(value) {
  if (!value) return 50;
  const hour = new Date(value).getHours();
  if (hour >= 23 || hour < 7) return 40;
  if (hour >= 19) return 45;
  return 50;
}
function DbChart({ data }) {
  if (!data?.length) return null;

  return (
    <Card className="mt">
      <CardHeader>
        <CardTitle>dB tijdlijn</CardTitle>
        <CardDescription>
          Grafische weergave van de meting
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
  <LineChart data={data}>
    <XAxis dataKey="time" />
    <YAxis />
    <Line type="monotone" dataKey="db" stroke="#2563eb" dot={false} strokeWidth={2} />
    <Line type="monotone" dataKey="norm" stroke="#f59e0b" dot={false} strokeDasharray="5 5" />
    <Line type="monotone" dataKey="peak" stroke="#ef4444" dot={false} strokeDasharray="3 3" />
  </LineChart>
</ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
function getDbValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(String(value).replace(",", "."));
  return Number.isNaN(num) ? null : num;
}

function getDbExceedance(incident) {
  const dbValue = getDbValue(incident?.db);
  const norm = getDbNorm(incident?.datetime);

  if (dbValue === null) {
    return {
      dbValue: null,
      norm,
      exceedance: null,
      exceeded: false,
    };
  }

  const exceedance = Number((dbValue - norm).toFixed(1));

  return {
    dbValue,
    norm,
    exceedance,
    exceeded: exceedance > 0,
  };
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
  const [mediaUrls, setMediaUrls] = useState({});
  const [thumbnailUrls, setThumbnailUrls] = useState({});
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
  const [quickCaptureCategory, setQuickCaptureCategory] = useState(null);
const [dbExcelData, setDbExcelData] = useState([]);
const [dbAnalysis, setDbAnalysis] = useState(null);
const [dbUploadName, setDbUploadName] = useState("");
  const [dbUploadFile, setDbUploadFile] = useState(null);
  const mediaInputRef = useRef(null);
  const incidentMediaInputRef = useRef(null);
  const previewVideoRef = useRef(null);
  const quickCaptureRef = useRef(null);
async function handleDbExcelUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  setDbUploadName(file.name);
setDbUploadFile(file);
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, { range: 5 });

  console.log(rows[0]);

  const parsed = rows
    .map((row) => {
const rawTime =
  row.DateTime ||
  row.datetime ||
  row.Time ||
  row.time ||
  row.Datum ||
  row.Date;

const [datePart, timePart] = String(rawTime).split(",");
const [day, month, year] = datePart.split("-");

const time = new Date(`${year}-${month}-${day}T${timePart || "00:00:00"}`);

      const db =
        row.Value ||
        row.value ||
        row.dB ||
        row.DB ||
        row.db;

      const dbValue = Number(String(db).replace(",", "."));

      return {
        datetime: time,
        db: dbValue,
      };
    })
    .filter((r) => r.datetime && !Number.isNaN(r.db));

  setDbExcelData(parsed);

  if (!parsed.length) {
    setDbAnalysis(null);
    return;
  }

  const total =
    parsed.reduce((sum, item) => sum + item.db, 0) / parsed.length;

  const max = Math.max(...parsed.map((x) => x.db));
  const min = Math.min(...parsed.map((x) => x.db));
  const sortedDates = parsed
  .map((x) => new Date(x.datetime))
  .sort((a, b) => a - b);

const startTime = sortedDates[0];
const endTime = sortedDates[sortedDates.length - 1];

const durationMs = endTime - startTime;
const durationHours = Math.floor(durationMs / 1000 / 60 / 60);
const durationMinutes = Math.floor((durationMs / 1000 / 60) % 60);
const averageExceedances = parsed.filter((item) => {
  const date = new Date(item.datetime);
  const hour = date.getHours();

  let norm = 50;

  if (hour >= 23 || hour < 7) {
    norm = 40;
  } else if (hour >= 19) {
    norm = 45;
  }

  return item.db > norm;
}).length;

const peakExceedances = parsed.filter((item) => {
  const date = new Date(item.datetime);
  const hour = date.getHours();

  let peakNorm = 70;

  if (hour >= 23 || hour < 7) {
    peakNorm = 60;
  } else if (hour >= 19) {
    peakNorm = 65;
  }

  return item.db > peakNorm;
}).length;
 setDbAnalysis({
  totalAverage: total.toFixed(1),
  max: max.toFixed(1),
  min: min.toFixed(1),
  count: parsed.length,
  averageExceedances,
  peakExceedances,
   startTime: startTime.toLocaleString("nl-NL"),
endTime: endTime.toLocaleString("nl-NL"),
duration: `${durationHours}u ${durationMinutes}m`,
   chartData: parsed
  .filter((_, index) => index % Math.max(1, Math.ceil(parsed.length / 500)) === 0)
  .map((item) => {
  const date = new Date(item.datetime);
  const hour = date.getHours();
const getNormPeak = (date) => {
  const hour = date.getHours();

  if (hour >= 23 || hour < 7) {
    return { norm: 40, peak: 60 };
  }

  if (hour >= 19) {
    return { norm: 45, peak: 65 };
  }

  return { norm: 50, peak: 70 };
};

const { norm, peak } = getNormPeak(date);
  return {
    time: date.toLocaleTimeString("nl-NL", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    db: item.db,
    norm,
    peak,
  };
}),
});
}
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
  const dbSummary = useMemo(() => {
    const incidentsWithExceedance = incidents
      .map((incident) => {
        const dbInfo = getDbExceedance(incident);
        const hour = incident?.datetime ? new Date(incident.datetime).getHours() : null;

        let period = "Dag";
        if (hour !== null) {
          if (hour >= 23 || hour < 7) period = "Nacht";
          else if (hour >= 19) period = "Avond";
        }

        return {
          ...incident,
          ...dbInfo,
          period,
        };
      })
      .filter((incident) => incident.exceeded);

    const total = incidentsWithExceedance.length;

    const highest = total
      ? Math.max(...incidentsWithExceedance.map((i) => i.exceedance))
      : 0;

    const night = incidentsWithExceedance.filter((i) => i.period === "Nacht").length;
    const evening = incidentsWithExceedance.filter((i) => i.period === "Avond").length;
    const day = incidentsWithExceedance.filter((i) => i.period === "Dag").length;

    const periodChart = [
      { label: "Dag", value: day },
      { label: "Avond", value: evening },
      { label: "Nacht", value: night },
    ];

    const topExceedances = [...incidentsWithExceedance]
      .sort((a, b) => b.exceedance - a.exceedance)
      .slice(0, 5)
      .map((incident) => ({
        label: incident.title || "Incident",
        shortLabel:
          (incident.title || "Incident").length > 24
            ? `${(incident.title || "Incident").slice(0, 24)}...`
            : incident.title || "Incident",
        value: incident.exceedance,
        datetime: incident.datetime,
      }));

    return {
      total,
      highest,
      night,
      evening,
      day,
      periodChart,
      topExceedances,
    };
  }, [incidents]);
  const analyse = useMemo(() => {
    
    if (!incidents.length) return null;

    const avgDb = incidents
      .map((i) => Number(i.db))
      .filter((n) => !isNaN(n) && n > 0);

    const avg = avgDb.length
      ? (avgDb.reduce((a, b) => a + b, 0) / avgDb.length).toFixed(1)
      : "-";

    const night = incidents.filter((i) => {
      const h = new Date(i.datetime).getHours();
      return h >= 23 || h < 7;
    }).length;

    const categories = {};
    incidents.forEach((i) => {
      categories[i.category] = (categories[i.category] || 0) + 1;
    });

    const topCategory = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    return {
      total: incidents.length,
      night,
      avg,
      topCategory,
    };
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
const enrichedMedia = mediaRows.map((item) => ({
  ...item,
  url: null,
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
    if (!supabase) return [];
    const files = Array.from(e.target.files || []);
    if (!files.length) return [];

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

        uploaded.push({
  ...inserted,
  url: null,
  type: file.type?.startsWith("video/") ? "video" : "image",
});
      }

      setAllMedia((prev) => [...uploaded, ...prev]);
      if (selectForForm) {
        setSelectedMediaIds((prev) => [...new Set([...prev, ...uploaded.map((item) => item.id)])]);
      }
      showMessage("Bestand(en) geüpload.");
      return uploaded;
    } catch {
      showMessage("Uploaden van bestand mislukt.", true);
      return [];
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
const saveDbAnalysisAsIncident = async () => {
  if (!supabase || !dbAnalysis) return;

  const severity =
    dbAnalysis.averageExceedances > 0 ||
    dbAnalysis.peakExceedances > 0
      ? "Hoog"
      : "Middel";

  const title = `dB analyse ${dbAnalysis.startTime}`;

  const description = `
PCE dB analyse

Start meting: ${dbAnalysis.startTime}
Einde meting: ${dbAnalysis.endTime}
Duur: ${dbAnalysis.duration}

Gemiddelde dB: ${dbAnalysis.totalAverage}
Maximum dB: ${dbAnalysis.max}
Minimum dB: ${dbAnalysis.min}

Metingen: ${dbAnalysis.count}
Norm overschrijdingen: ${dbAnalysis.averageExceedances}
Piek overschrijdingen: ${dbAnalysis.peakExceedances}
`;

 const { data, error } = await supabase
    .from("incidents")
    .insert({
 datetime: new Date(
  dbAnalysis.chartData?.[0]?.rawTime || dbAnalysis.chartData?.[0]?.date || Date.now()
).toISOString(),
      category: "Geluid",
      severity,
      location: profile.standard_location || "Slaapkamer / tuinzijde",
      title,
      description,
      chart_data: dbAnalysis.chartData,
          db: dbAnalysis.totalAverage,
      weather: "",
      source: "PCE dB analyse",
         actions: "",
  })
.select()
.single();
const insertedIncident = data;

if (insertedIncident && dbUploadFile) {
  const filePath = `db-analyses/${insertedIncident.id}/${dbUploadFile.name}`;

const { error: uploadError } = await supabase.storage
  .from("evidence")
  .upload(filePath, dbUploadFile, {
    upsert: true,
  });

if (uploadError) throw uploadError;
const { error: mediaError } = await supabase.from("media").insert({
  incident_id: insertedIncident.id,
  file_name: dbUploadName,
  file_path: filePath,
  mime_type:
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  size_bytes: dbUploadFile.size,
});

if (mediaError) throw mediaError;
}
  if (error) {
    showMessage("Opslaan dB analyse mislukt.", true);
  } else {
    showMessage("dB analyse opgeslagen als incident.");
    refreshData();
  }
};
  const startQuickCapture = (category) => {
    setQuickCaptureCategory(category);
    quickCaptureRef.current?.click();
  };

  const handleQuickCapture = async (e) => {
    if (!supabase || !quickCaptureCategory) return;
    const category = quickCaptureCategory;
    const uploaded = await handleMediaUpload(e, null, false);

    if (!uploaded.length) {
      setQuickCaptureCategory(null);
      return;
    }

    const now = new Date();
    const nowIso = now.toISOString();

    const defaultTitles = {
      Geluid: "Snelle opname geluidsoverlast",
      Licht: "Snelle opname lichthinder",
      Geur: "Snelle opname geuroverlast",
    };

    const defaultDescriptions = {
      Geluid: "Incident direct vastgelegd via 1 klik opname. Vul details later aan.",
      Licht: "Incident direct vastgelegd via 1 klik opname. Vul details later aan.",
      Geur: "Incident direct vastgelegd via 1 klik opname. Vul details later aan.",
    };

    try {
      const { data, error } = await supabase
        .from("incidents")
        .insert({
          datetime: nowIso,
          category,
          severity: isNightIncident(nowIso) ? "Hoog" : "Middel",
          location: profile.standard_location || "Slaapkamer / tuinzijde",
          title: defaultTitles[category],
          description: defaultDescriptions[category],
          db: "",
          weather: "",
          source: "Nog aan te vullen",
          actions: "Directe opname via snelle knop.",
        })
        .select()
        .single();

      if (error) throw error;

      await Promise.all(uploaded.map((item) => supabase.from("media").update({ incident_id: data.id }).eq("id", item.id)));
      await refreshData();

      setEditingIncidentId(data.id);
      setIncidentForm({
        datetime: formatDateTimeLocal(now),
        category,
        severity: isNightIncident(nowIso) ? "Hoog" : "Middel",
        location: profile.standard_location || "Slaapkamer / tuinzijde",
        title: defaultTitles[category],
        description: defaultDescriptions[category],
        db: "",
        weather: "",
        source: "Nog aan te vullen",
        actions: "Directe opname via snelle knop.",
      });
      setSelectedMediaIds(uploaded.map((item) => item.id));
      setActiveTab("registratie");
      showMessage(`Snelle ${category.toLowerCase()}-opname opgeslagen. Vul nu eventueel bron, dB en beschrijving aan.`);
    } catch {
      showMessage("Snelle opname opslaan mislukt.", true);
    } finally {
      setQuickCaptureCategory(null);
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

  const stopPreviewVideo = useCallback(() => {
    const video = previewVideoRef.current;
    if (!video) return;
    try {
      video.pause();
      video.currentTime = 0;
      video.removeAttribute("src");
      video.load();
    } catch {
      // ignore cleanup errors on mobile browsers
    }
  }, []);

  const openMediaPreview = async (item) => {
  if (!supabase || !item?.file_path) return;

  if (mediaUrls[item.id]) {
    setActivePreviewMedia({ ...item, url: mediaUrls[item.id] });
    return;
  }

  const { data, error } = await supabase.storage
    .from("evidence")
    .createSignedUrl(item.file_path, 3600);

  if (error || !data?.signedUrl) {
    showMessage("Bestand openen mislukt.", true);
    return;
  }

  setMediaUrls((prev) => ({
    ...prev,
    [item.id]: data.signedUrl,
  }));

  setActivePreviewMedia({ ...item, url: data.signedUrl });
    if (!thumbnailUrls[item.id]) {
  setThumbnailUrls((prev) => ({
    ...prev,
    [item.id]: data.signedUrl,
  }));
}
};
  const closeMediaPreview = () => {
    stopPreviewVideo();
    setActivePreviewMedia(null);
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) stopPreviewVideo();
    };

    const handlePageHide = () => {
      stopPreviewVideo();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
      stopPreviewVideo();
    };
  }, [stopPreviewVideo]);

  useEffect(() => {
    if (!activePreviewMedia) {
      stopPreviewVideo();
    }
  }, [activePreviewMedia, stopPreviewVideo]);

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
    const exceedances = sorted.filter((incident) => getDbExceedance(incident).exceeded);

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
      `dB-overschrijdingen: ${exceedances.length}`,
      "",
      "TIJDLIJN (chronologisch)",
      ...sorted.flatMap((incident, index) => {
        const dbInfo = getDbExceedance(incident);
        return [
          `${index + 1}. ${formatDisplayDateTime(incident.datetime)} | ${incident.category} | ${incident.severity}${isNightIncident(incident.datetime) ? " | NACHT" : ""}`,
          `Titel: ${incident.title}`,
          `Locatie: ${incident.location}`,
          `Bron: ${incident.source || "-"}`,
          `Beschrijving: ${incident.description}`,
          `dB: ${incident.db || "-"} | Norm: ${dbInfo.norm} | Overschrijding: ${dbInfo.exceeded ? `+${dbInfo.exceedance} dB` : "geen"}`,
          `Weer: ${incident.weather || "-"}`,
          `Vastlegging / actie: ${incident.actions || "-"}`,
          `Gekoppelde bestanden: ${(mediaByIncident[incident.id] || []).map((m) => m.file_name).join(", ") || "-"}`,
          "",
        ];
      }),
    ].join("\n");

    downloadTextFile(`overlastrapport-${new Date().toISOString().slice(0, 10)}.txt`, lines);
  };

  const printReport = () => {
    let filtered = [...filteredIncidents];

if (options.laatste4Weken) {
  const vierWekenGeleden = new Date();
  vierWekenGeleden.setDate(vierWekenGeleden.getDate() - 28);
  filtered = filtered.filter(i => new Date(i.datetime) >= vierWekenGeleden);
}

if (options.alleenNacht) {
  filtered = filtered.filter(i => {
    const h = new Date(i.datetime).getHours();
    return h >= 23 || h < 7;
  });
}

const overschrijdingen = filtered.filter(i => {
  const db = Number(i.db);
  const hour = new Date(i.datetime).getHours();

  if (!db) return false;
  if (hour >= 23 || hour < 7) return db > 40;
  if (hour >= 19) return db > 45;
  return db > 50;
});
  const sorted = [...filtered].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    const exceedances = sorted.filter((incident) => getDbExceedance(incident).exceeded);
    const highestExceedance = exceedances.length
      ? Math.max(...exceedances.map((incident) => getDbExceedance(incident).exceedance))
      : 0;

    const categoryCounts = sorted.reduce((acc, incident) => {
      acc[incident.category] = (acc[incident.category] || 0) + 1;
      return acc;
    }, {});

    const dayCounts = sorted.reduce((acc, incident) => {
      const key = new Intl.DateTimeFormat("nl-NL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(incident.datetime));
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const sourceCounts = sorted.reduce((acc, incident) => {
      const key = incident.source || "Onbekend";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topSources = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const categoryEntries = Object.entries(categoryCounts);
    const dayEntries = Object.entries(dayCounts);

    const makeBarChartSvg = (entries, title, color = "#0f172a") => {
      if (!entries.length) {
        return `<div class="chart-empty">Geen gegevens beschikbaar</div>`;
      }

      const width = 760;
      const height = Math.max(220, entries.length * 44 + 50);
      const left = 170;
      const right = 30;
      const top = 24;
      const rowHeight = 36;
      const barMax = width - left - right;
      const maxValue = Math.max(...entries.map(([, value]) => value), 1);

      const rows = entries
        .map(([label, value], index) => {
          const y = top + index * rowHeight;
          const barWidth = Math.max((value / maxValue) * barMax, 6);
          return `
            <text x="12" y="${y + 16}" font-size="13" fill="#334155">${String(label).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>
            <rect x="${left}" y="${y}" width="${barWidth}" height="18" rx="9" fill="${color}" opacity="0.9"></rect>
            <text x="${left + barWidth + 10}" y="${y + 14}" font-size="13" fill="#0f172a">${value}</text>
          `;
        })
        .join("");

      return `
        <div class="chart-block">
          <div class="chart-title">${title}</div>
          <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" role="img" aria-label="${title}">
            ${rows}
          </svg>
        </div>
      `;
    };

    const timelineSvg = (() => {
      if (!dayEntries.length) return `<div class="chart-empty">Geen tijdlijn beschikbaar</div>`;
      const width = 760;
      const height = 280;
      const left = 52;
      const right = 20;
      const top = 24;
      const bottom = 54;
      const chartWidth = width - left - right;
      const chartHeight = height - top - bottom;
      const maxValue = Math.max(...dayEntries.map(([, value]) => value), 1);
      const step = chartWidth / Math.max(dayEntries.length, 1);
      const barWidth = Math.max(Math.min(step * 0.65, 42), 12);

      const bars = dayEntries
        .map(([label, value], index) => {
          const x = left + index * step + (step - barWidth) / 2;
          const barHeight = (value / maxValue) * chartHeight;
          const y = top + chartHeight - barHeight;
          const shortLabel = label.slice(0, 5);
          return `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="8" fill="#2563eb"></rect>
            <text x="${x + barWidth / 2}" y="${top + chartHeight + 18}" text-anchor="middle" font-size="11" fill="#475569">${shortLabel}</text>
            <text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="11" fill="#0f172a">${value}</text>
          `;
        })
        .join("");

      const grid = [0, 0.25, 0.5, 0.75, 1]
        .map((fraction) => {
          const y = top + chartHeight - fraction * chartHeight;
          const val = Math.round(fraction * maxValue);
          return `
            <line x1="${left}" y1="${y}" x2="${width - right}" y2="${y}" stroke="#e2e8f0" stroke-width="1"></line>
            <text x="${left - 10}" y="${y + 4}" text-anchor="end" font-size="11" fill="#64748b">${val}</text>
          `;
        })
        .join("");

      return `
        <div class="chart-block">
          <div class="chart-title">Incidenten per dag</div>
          <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" role="img" aria-label="Incidenten per dag">
            ${grid}
            ${bars}
          </svg>
        </div>
      `;
    })();

const html = `
<html>
<head>
  <title>Overlastrapport</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #111;
      line-height: 1.5;
    }

    h1 {
      font-size: 24px;
      margin-bottom: 10px;
    }

    h2 {
      margin-top: 30px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
    }

    .meta {
      margin-bottom: 20px;
      color: #555;
    }

    .box {
      background: #f8f8f8;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .incident {
      border-bottom: 1px solid #ddd;
      padding: 10px 0;
    }

    .incident:last-child {
      border-bottom: none;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 12px;
      background: #eee;
      margin-right: 5px;
    }

    .nacht {
      background: #333;
      color: white;
    }

    .db {
      color: #c00;
      font-weight: bold;
    }

    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>

<body>

<h1>OVERLASTRAPPORT</h1>

<div class="meta">
  Naam: ${profile.resident_name || "-"}<br/>
  Locatie: ${profile.location || "-"}<br/>
  Datum export: ${new Date().toLocaleString()}<br/>
  Bestemd voor: ${profile.authority1 || "gemeente"}
</div>

<h2>FEITELIJK BEELD</h2>
<div class="box">
  ${generateSmartSummary(incidents, overschrijdingen)}
</div>

${options.juridisch ? `
<h2>JURIDISCHE DUIDING</h2>
<div class="box">
Daarnaast lijkt de huidige situatie in de praktijk niet in lijn met de geldende kaders rondom woon- en leefklimaat, exploitatie en de algemene zorgplicht.
</div>
` : ""}

<h2>SAMENVATTING</h2>
<div class="box">
Totaal incidenten: ${incidents.length}<br/>
dB-overschrijdingen: ${overschrijdingen.length}<br/>
Nachtincidenten: ${incidents.filter(i => {
  const h = new Date(i.datetime).getHours();
  return h >= 23 || h < 7;
}).length}
</div>

<h2>VOORBEELDEN (laatste 4 weken)</h2>

${filtered.slice(0,10).map(i => `
<div class="incident">
  <div>
    <span class="badge">${i.category}</span>
    <span class="badge">${i.severity}</span>
    ${isNightIncident(i.datetime) ? `<span class="badge nacht">Nacht</span>` : ""}
  </div>

  <strong>${i.title}</strong><br/>
  ${formatDisplayDateTime(i.datetime)}<br/>
  ${i.db ? `<span class="db">${i.db} dB</span><br/>` : ""}
  ${i.description}
</div>
`).join("")}

<div style="margin-top:30px;">
De overlast is structureel en duurt al geruime tijd voort.<br/><br/>

Ik verzoek u om:<br/>
- Handhavend op te treden<br/>
- Concrete en afdwingbare maatregelen op te leggen<br/>
- Controle en toezicht uit te voeren<br/><br/>

Met vriendelijke groet,<br/>
${profile.resident_name || ""}
</div>

</body>
</html>
`;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };
  const [options, setOptions] = useState({
  juridisch: false,
  laatste4Weken: false,
  alleenNacht: false
});
 const generateSmartSummary = (incidents, overschrijdingen) => {
  const totaal = incidents.length;

  const nacht = incidents.filter(i => {
    const h = new Date(i.datetime).getHours();
    return h >= 23 || h < 7;
  }).length;

  const overs = overschrijdingen.length;

  let tekst = "";

  if (overs > 5) {
    tekst += "Er is sprake van herhaaldelijke normoverschrijding. ";
  }

  if (nacht > 0) {
    tekst += "De overlast vindt tevens plaats in de nachtperiode, wat als extra belastend wordt ervaren. ";
  }

  if (totaal > 10) {
    tekst += "Het aantal incidenten wijst op een structureel patroon en niet op incidentele overlast. ";
  }

  if (!tekst) {
    tekst = "Er is sprake van overlast die nader beoordeeld dient te worden.";
  }

  return tekst;
}; 
const generateHandhavingRequest = () => {
  const incidentsWithDb = incidents.filter(i => Number(i.db) > 0);

let filtered = incidentsWithDb;

if (options.laatste4Weken) {
  const vierWekenGeleden = new Date();
  vierWekenGeleden.setDate(vierWekenGeleden.getDate() - 28);
  filtered = filtered.filter(i => new Date(i.datetime) >= vierWekenGeleden);
}

if (options.alleenNacht) {
  filtered = filtered.filter(i => {
    const h = new Date(i.datetime).getHours();
    return h >= 23 || h < 7;
  });
}
const geluidIncidenten = filtered.filter(i => i.category === "Geluid");
const lichtIncidenten = filtered.filter(i => i.category === "Licht");
const geurIncidenten = filtered.filter(i => i.category === "Geur");
const overschrijdingen = filtered.filter(i => {
  const db = Number(i.db);
  const hour = new Date(i.datetime).getHours();

  if (hour >= 23 || hour < 7) return db > 40;
  if (hour >= 19) return db > 45;
  return db > 50;
});

  const tekst = `
VERZOEK HANDHAVING
Geachte ${profile.authority1 || "gemeente"},
FEITELIJK BEELD:
${generateSmartSummary(incidents, overschrijdingen)}
${options.juridisch ? `
JURIDISCHE DUIDING:
Daarnaast lijkt de huidige situatie in de praktijk niet in lijn met de geldende kaders rondom woon- en leefklimaat, exploitatie en de algemene zorgplicht.
` : ""}
SAMENVATTING:
- Totaal aantal incidenten: ${incidents.length}
- Aantal dB-overschrijdingen: ${overschrijdingen.length}
- Nachtincidenten: ${incidents.filter(i => {
    const h = new Date(i.datetime).getHours();
    return h >= 23 || h < 7;
  }).length}

VOORBEELDEN (laatste 4 weken, selectie van max 10):
Let op: dit betreft slechts een selectie van recente incidenten. De volledige registratie bevat aanzienlijk meer meldingen.
${filtered
  .sort((a, b) => (b.db || 0) - (a.db || 0))
  .slice(0,10)
  .map(i => `
- ${formatDisplayDateTime(i.datetime)}
  ${i.category} | ${i.db} dB
  ${i.title}
`)
  .join("")}

De overlast is structureel en duurt al geruime tijd voort.

Ik verzoek u om:
- Handhavend op te treden
- Concrete en afdwingbare maatregelen op te leggen
- Controle en toezicht uit te voeren

Met vriendelijke groet,  
${profile.resident_name}
`;

  downloadTextFile("handhaving-verzoek.txt", tekst);
};
  const tabs = [
    { id: "home", label: "Start", icon: Home },
    { id: "registratie", label: editingIncidentId ? "Incident bewerken" : "Nieuw incident", icon: Plus },
    { id: "incidenten", label: "Incidenten", icon: AlertTriangle },
    { id: "media", label: "Foto's / video's", icon: Camera },
    { id: "notities", label: "Notities", icon: FileText },
    { id: "checklist", label: "Checklist", icon: CheckSquare },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "db-analyse", label: "dB Analyse", icon: BarChart3 },
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
                 <CardTitle className="big-title">Overlast door Cuisine by Tromp – Logboek</CardTitle>
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
                  <Card>
                    <CardHeader>
                      <CardTitle>1 klik opname</CardTitle>
                      <CardDescription>
                        Op je telefoon opent dit direct de camera-opnamekeuze. Na stoppen wordt incident + bestand automatisch opgeslagen. Daarna hoef je alleen nog details aan te vullen.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="quick-grid">
                        <Button onClick={() => startQuickCapture("Geluid")} className="quick-btn">
                          <Mic className="icon-inline" />
                          <div><div className="bold">Geluid</div><div className="tiny">Direct opnemen en als geluidincident opslaan</div></div>
                        </Button>
                        <Button onClick={() => startQuickCapture("Licht")} className="quick-btn" variant="secondary">
                          <Sun className="icon-inline" />
                          <div><div className="bold">Licht</div><div className="tiny">Direct opnemen en als lichthinder opslaan</div></div>
                        </Button>
                        <Button onClick={() => startQuickCapture("Geur")} className="quick-btn" variant="outline">
                          <Wind className="icon-inline" />
                          <div><div className="bold">Geur</div><div className="tiny">Direct vastleggen en later aanvullen</div></div>
                        </Button>
                      </div>
                      <input
                        ref={quickCaptureRef}
                        type="file"
                        accept="video/*,image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleQuickCapture}
                      />
                    </CardContent>
                  </Card>

                  <div className="quick-grid">
                    {[{ label: "Snel geluid registreren", category: "Geluid" }, { label: "Snel licht registreren", category: "Licht" }, { label: "Snel geur registreren", category: "Geur" }].map((item) => (
                      <Button key={item.category} onClick={() => addQuickIncident(item.category)} className="quick-btn">
                        <div><div className="bold">{item.label}</div><div className="tiny">Slaat direct op in cloud</div></div>
                      </Button>
                    ))}
                  </div>

                <div className="content-grid">
  <Card>
    <CardHeader>
      <CardTitle>Recente tijdlijn</CardTitle>
      <CardDescription>Laatste 10 op incidentdatum</CardDescription>
    </CardHeader>
    <CardContent className="stack">
      {recentTimeline.map((incident) => (
        <div key={incident.id} className="incident-card">
          <div className="badge-row">
            <Badge>{incident.category}</Badge>
            <Badge variant="outline">{incident.severity}</Badge>
            {isNightIncident(incident.datetime) && (
              <Badge variant="secondary">
                <Moon className="icon-inline" /> Nacht
              </Badge>
            )}
          </div>
          <p className="bold mt">{incident.title}</p>
          <p className="muted mt-sm">
            {formatDisplayDateTime(incident.datetime)} • {incident.location}
          </p>
          <p className="mt">{incident.description}</p>
        </div>
      ))}
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Export & rapport</CardTitle>
      <CardDescription>Klaar voor dossier en print</CardDescription>
    </CardHeader>
    <CardContent className="stack">
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px" }}>
        <label>
          <input
            type="checkbox"
            checked={options.juridisch}
            onChange={(e) => setOptions({ ...options, juridisch: e.target.checked })}
          />{" "}
          Juridische onderbouwing toevoegen
        </label>

        <label>
          <input
            type="checkbox"
            checked={options.laatste4Weken}
            onChange={(e) => setOptions({ ...options, laatste4Weken: e.target.checked })}
          />{" "}
          Alleen laatste 4 weken
        </label>

        <label>
          <input
            type="checkbox"
            checked={options.alleenNacht}
            onChange={(e) => setOptions({ ...options, alleenNacht: e.target.checked })}
          />{" "}
          Alleen nachtincidenten
        </label>
      </div>

      <Button onClick={exportReport}>
        <Download className="icon-inline" /> Exporteer rapport (.txt)
      </Button>

      <Button onClick={exportCSV} variant="secondary">
        <Download className="icon-inline" /> Exporteer incidenten (.csv)
      </Button>

      <Button onClick={printReport} variant="outline">
        <Printer className="icon-inline" /> Print / PDF rapport
      </Button>

      <Button onClick={exportJSON} variant="outline">
        <Download className="icon-inline" /> Maak back-up (.json)
      </Button>

      <Button onClick={generateHandhavingRequest} variant="secondary">
        <FileText className="icon-inline" /> Genereer handhavingsverzoek
      </Button>
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
                                {thumbnailUrls[item.id] ? (
  item.type === "video" ? (
    <video
      src={thumbnailUrls[item.id]}
      className="media-thumb"
      muted
      playsInline
      preload="metadata"
    />
  ) : (
    <img
      src={thumbnailUrls[item.id]}
      alt={item.file_name}
      className="media-thumb"
    />
  )
) : (
  <div className="media-thumb">
    {item.mime_type?.includes("spreadsheet")
  ? "📄 Excel"
  : item.type === "video"
  ? "▶ Video"
  : "🖼 Foto"}
  </div>
)}
                                  <div className="preview-chip"><Expand className="icon-sm" /></div>
                                </button>
                                <div className="media-body">
                                  <p className="truncate bold">{item.file_name}</p>
                                <p className="muted tiny">
  {item.mime_type?.includes("spreadsheet")
    ? "Excel bestand"
    : item.mime_type?.startsWith("video/")
    ? "Video"
    : "Foto"}
</p>
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
                      {filteredIncidents.map((incident) => {
                        const dbInfo = getDbExceedance(incident);
                  const chartNorm =
  incident.chart_data?.[0]?.norm || dbInfo.norm;
                        return (
                          <div key={incident.id} className="incident-card">
                            <div className="between">
                              <div>
                                <div className="badge-row">
                                  <p className="bold">{incident.title}</p>
                                  <Badge>{incident.category}</Badge>
                                  <Badge variant="outline">{incident.severity}</Badge>
                                  {isNightIncident(incident.datetime) && <Badge variant="secondary"><Moon className="icon-inline" /> Nacht</Badge>}
                                  {dbInfo.exceeded && <Badge variant="secondary">+{dbInfo.exceedance} dB boven norm</Badge>}
                                </div>
                                <p className="muted mt-sm">{formatDisplayDateTime(incident.datetime)} • {incident.location}</p>
                              </div>
                              <div className="badge-row">
                                <Button type="button" variant="outline" size="sm" onClick={() => startEditIncident(incident)}><Pencil className="icon-inline" /> Bewerk</Button>
                                <Button type="button" variant="ghost" size="icon" onClick={() => deleteIncident(incident.id)}><Trash2 className="icon-sm" /></Button>
                              </div>
                            </div>
                            <div className="stack mt">
                         {incident.source === "PCE dB analyse" ? (
  <div className="stack mt">
    <div className="stats-page-grid mt">
      <Card>
        <CardContent>
          <p className="muted">Gemiddelde dB</p>
          <p className="stat">{incident.db}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="muted">Norm</p>
         <p className="stat">
  {chartNorm}
</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="muted">Overschrijding</p>
          <p className="stat">
           {`+${(Number(incident.db) - Number(chartNorm)).toFixed(1)} dB`}
          </p>
        </CardContent>
      </Card>
    </div>
<div className="stats-page-grid mt">
  <Card>
    <CardContent>
      <p className="muted">Metingen</p>
      <p className="stat">
        {incident.description?.match(/Metingen: (\d+)/)?.[1] || "-"}
      </p>
    </CardContent>
  </Card>

  <Card>
    <CardContent>
      <p className="muted">Norm overschrijdingen</p>
      <p className="stat">
        {incident.description?.match(/Norm overschrijdingen: (\d+)/)?.[1] || "-"}
      </p>
    </CardContent>
  </Card>

  <Card>
    <CardContent>
      <p className="muted">Piek overschrijdingen</p>
      <p className="stat">
        {incident.description?.match(/Piek overschrijdingen: (\d+)/)?.[1] || "-"}
      </p>
    </CardContent>
  </Card>
</div>
    <p><strong>Vastlegging:</strong> Gecertificeerde PCE dB meter</p>
  </div>
) : (
  <p><strong>Beschrijving:</strong> {incident.description}</p>
)}
                                  <div>
                                    {incident.chart_data?.length > 0 && (
  <DbChart data={incident.chart_data} />
)}
                                <p><strong>Gekoppelde bestanden:</strong>{(mediaByIncident[incident.id] || []).length ? "" : " -"}</p>
                                {!!(mediaByIncident[incident.id] || []).length && (
                                  <div className="media-grid mt">
                                    {(mediaByIncident[incident.id] || []).map((item) => (
                                      <div key={item.id} className="media-card">
<button
  type="button"
  className="media-preview-btn"
  onClick={async () => {
    if (item.mime_type?.includes("spreadsheet")) {
      const { data, error } = await supabase.storage
        .from("evidence")
        .createSignedUrl(item.file_path, 3600, {
          download: item.file_name || "pce-meting.xlsx",
        });

      if (error || !data?.signedUrl) {
        showMessage("Excel openen mislukt.", true);
        return;
      }

      window.location.href = data.signedUrl;
      return;
    }

    openMediaPreview(item);
  }}
>
     <div className="media-thumb">
  <div style={{ fontWeight: 700 }}>
    {item.mime_type?.includes("spreadsheet")
  ? "📄 Excel"
  : item.type === "video"
  ? "🎥 Video"
  : "🖼 Foto"}
  </div>
  <div style={{ fontSize: "11px", opacity: 0.7 }}>
    Klik om te openen
  </div>
</div>
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
                        );
                      })}
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
          <div className="media-thumb-large">
  <div style={{ fontWeight: 700 }}>
    {item.type === "video" ? "🎥 Video" : "🖼 Foto"}
  </div>
  <div style={{ fontSize: "11px", opacity: 0.7 }}>
    Klik om te openen
  </div>
</div>
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
  {[
    ["Totaal incidenten", dashboard.total],
    ["Geluid", dashboard.sound],
    ["Licht", dashboard.light],
    ["Geur", dashboard.smell],
    ["Nachtincidenten", dashboard.night],
    ["Ernstig", dashboard.high],
    ["Gem. dB", dashboard.avgDb],
    ["Bestanden", allMedia.length],
    ["dB-overschrijdingen", dbSummary.total],
    ["Hoogste overschr.", dbSummary.total ? `+${dbSummary.highest} dB` : "-"],
    ["Avond overschr.", dbSummary.evening],
    ["Nacht overschr.", dbSummary.night],
  ].map(([label, value]) => (
    <Card key={label}>
      <CardContent>
        <p className="muted">{label}</p>
        <p className="stat">{value}</p>
      </CardContent>
    </Card>
  ))}
</div>
  <div className="content-grid">
  <Card>
    <CardHeader>
      <CardTitle>Normoverschrijdingen</CardTitle>
      <CardDescription>Verdeling van dB-overschrijdingen per normperiode</CardDescription>
    </CardHeader>
    <CardContent className="stack">
      {!dbSummary.total && <p className="muted">Nog geen dB-overschrijdingen gevonden.</p>}
      {!!dbSummary.total && dbSummary.periodChart.map((item) => (
        <div key={item.label} className="summary-row">
          <div className="summary-label">{item.label}</div>
          <div className="summary-bar-wrap">
            <div
   className="summary-bar"
style={{
  width: `${Math.max(
    (item.value / Math.max(...dbSummary.periodChart.map((x) => x.value), 1)) * 100,
    item.value > 0 ? 8 : 0
  )}%`,
  height: "8px",
  background: "#2563eb",
  borderRadius: "4px"
}}
/>
          </div>
          <div className="summary-count">{item.value}</div>
        </div>
      ))}
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Zwaarste overschrijdingen</CardTitle>
      <CardDescription>Top 5 hoogste dB-overschrijdingen</CardDescription>
    </CardHeader>
    <CardContent className="stack">
      {!dbSummary.topExceedances.length && <p className="muted">Nog geen overschrijdingen met dB-waarde.</p>}
      {!!dbSummary.topExceedances.length && dbSummary.topExceedances.map((item, index) => (
        <div key={`${item.label}-${index}`} className="summary-row">
          <div className="summary-label" title={item.label}>{item.shortLabel}</div>
          <div className="summary-bar-wrap">
            <div
         className="summary-bar"
style={{
  width: `${Math.max(
    (item.value / Math.max(...dbSummary.topExceedances.map((x) => x.value), 1)) * 100,
    8
  )}%`,
  height: "8px",
  background: "#2563eb",
  borderRadius: "4px"
}}
            />
          </div>
          <div className="summary-count">+{item.value}</div>
        </div>
      ))}
    </CardContent>
  </Card>
</div>                
                  <Card>
                    <CardHeader>
                      <CardTitle>Automatische analyse</CardTitle>
                      <CardDescription>Snelle samenvatting van patroon en zwaarte</CardDescription>
                    </CardHeader>
                    <CardContent className="stack">
                      <div className="stats-grid">
                        <div className="stat-box">
                          <p className="muted">Totaal</p>
                          <p className="stat">{analyse?.total}</p>
                        </div>
                        <div className="stat-box">
                          <p className="muted">Nacht</p>
                          <p className="stat">{analyse?.night}</p>
                        </div>
                        <div className="stat-box">
                          <p className="muted">Gem. dB</p>
                          <p className="stat">{analyse?.avg}</p>
                        </div>
                        <div className="stat-box">
                          <p className="muted">Meest</p>
                          <p className="stat">{analyse?.topCategory}</p>
                        </div>
                      </div>

                      <div className="incident-card">
                        <p className="bold">Korte conclusie</p>
                        <p className="mt">
                          {(analyse?.night ?? 0) > 0
                            ? `Er is sprake van terugkerende overlast, met ${analyse?.night ?? 0} nachtincidenten en ${(analyse?.topCategory || "-").toLowerCase()} als meest voorkomende categorie.`
                            : `Er is sprake van terugkerende overlast, waarbij ${(analyse?.topCategory || "-").toLowerCase()} momenteel de meest voorkomende categorie is.`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

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
                        <video ref={previewVideoRef} key={activePreviewMedia.id} src={activePreviewMedia.url || undefined} controls playsInline preload="metadata" className="modal-media-el" />
                      ) : (
                        <img src={activePreviewMedia.url || undefined} alt={activePreviewMedia.file_name} className="modal-media-el" />
                      )}
                    </div>
                  </div>
                </div>
              )}
{activeTab === "db-analyse" && (
  <Card>
    <CardHeader>
      <CardTitle>dB Analyse</CardTitle>
      <CardDescription>
        Importeer een PCE Excel-bestand voor automatische analyse
      </CardDescription>
    </CardHeader>

    <CardContent className="stack">
      <Input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleDbExcelUpload}
      />

      {dbUploadName && (
        <p className="muted">
          Bestand: {dbUploadName}
        </p>
      )}
{dbAnalysis && (
  <div className="badge-row">
    <Button onClick={saveDbAnalysisAsIncident}>
      Opslaan als incident
    </Button>
  </div>
)}
      {dbAnalysis && (
  <>
        <div className="stats-page-grid">
          <Card>
            <CardContent>
              <p className="muted">Gemiddelde dB</p>
              <p className="stat">{dbAnalysis.totalAverage}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="muted">Maximum</p>
              <p className="stat">{dbAnalysis.max}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="muted">Minimum</p>
              <p className="stat">{dbAnalysis.min}</p>
            </CardContent>
          </Card>
<Card>
  <CardContent>
    <p className="muted">Metingen</p>
    <p className="stat">{dbAnalysis.count}</p>
  </CardContent>
</Card>

<Card>
  <CardContent>
    <p className="muted">Norm overschrijdingen</p>
    <p className="stat">{dbAnalysis.averageExceedances}</p>
  </CardContent>
</Card>

<Card>
  <CardContent>
    <p className="muted">Piek overschrijdingen</p>
    <p className="stat">{dbAnalysis.peakExceedances}</p>
  </CardContent>
</Card>
          <Card>
  <CardContent>
    <p className="muted">Start meting</p>
    <p className="stat">{dbAnalysis.startTime}</p>
  </CardContent>
</Card>

<Card>
  <CardContent>
    <p className="muted">Einde meting</p>
    <p className="stat">{dbAnalysis.endTime}</p>
  </CardContent>
</Card>

<Card>
  <CardContent>
    <p className="muted">Duur meting</p>
    <p className="stat">{dbAnalysis.duration}</p>
  </CardContent>
</Card>
            </div>
  <DbChart data={dbAnalysis.chartData} />
 </>
)}
    </CardContent>
  </Card>
)}
                         {activeTab === "instellingen" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Instellingen</CardTitle>
                    <CardDescription>Pas standaardvelden aan en sla ze op in Supabase</CardDescription>
                  </CardHeader>
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
