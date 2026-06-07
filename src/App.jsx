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
  AudioLines,
Lightbulb,
Waves,
Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import {
ResponsiveContainer,
LineChart,
ComposedChart,
Area,
Line,
XAxis,
YAxis,
} from "recharts";
const env = typeof import.meta !== "undefined" && import.meta?.env ? import.meta.env : {};
const supabaseUrl = env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
const isAdminMode =
  window.location.pathname === "/Rebel_1970";
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
      <div style={{ width: "100%", height: 420 }}>
          <ResponsiveContainer width="100%" height="100%">
 <ComposedChart data={data}>
  <defs>
    <linearGradient id="dbFill" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.35} />
  <stop offset="40%" stopColor="#6366f1" stopOpacity={0.25} />
  <stop offset="100%" stopColor="#0b1020" stopOpacity={0} />
</linearGradient>
    <filter id="dbNeonGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <XAxis dataKey="time" />
  <YAxis />
<Area
  type="monotone"
  dataKey="db"
  stroke="none"
  fill="url(#dbFill)"
/>
  <Line type="monotone" dataKey="db" stroke="#c084fc" dot={false} strokeWidth={8} opacity={0.18} />
  <Line type="monotone" dataKey="db" stroke="#c084fc" dot={false} strokeWidth={3} filter="url(#dbNeonGlow)" />

  <Line type="monotone" dataKey="norm" stroke="#f59e0b" dot={false} strokeDasharray="5 5" strokeWidth={2} />
  <Line type="monotone" dataKey="peak" stroke="#ef4444" dot={false} strokeDasharray="3 3" strokeWidth={2} />
</ComposedChart>
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
function extractDbAnalysisField(description, label) {
  const match = String(description || "").match(new RegExp(`${label}: ([^\\n]+)`));
  return match?.[1]?.trim() || "-";
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
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [selectedDashboardCategory, setSelectedDashboardCategory] = useState(null);
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
  const [selectedDbPrintId, setSelectedDbPrintId] = useState("");
  const [selectedDashboardDbIndex, setSelectedDashboardDbIndex] = useState(0);
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

const rawDateTime = String(rawTime || "").trim();

const [datePartRaw, timePartRaw = "00:00:00"] = rawDateTime.split(",");
const [dayRaw, monthRaw, yearRaw] = datePartRaw.trim().split("-");

const [hourRaw = "00", minuteRaw = "00", secondRaw = "00"] =
  timePartRaw.trim().split(":");

const day = String(dayRaw).padStart(2, "0");
const month = String(monthRaw).padStart(2, "0");
const year = String(yearRaw);

const hour = String(hourRaw).padStart(2, "0");
const minute = String(minuteRaw).padStart(2, "0");
const second = String(secondRaw).padStart(2, "0");

const time = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);

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
    .filter((r) => r.datetime instanceof Date && !Number.isNaN(r.datetime.getTime()) && !Number.isNaN(r.db));

  setDbExcelData(parsed);

  if (!parsed.length) {
    setDbAnalysis(null);
    return;
  }

  const total =
    parsed.reduce((sum, item) => sum + item.db, 0) / parsed.length;

  const max = Math.max(...parsed.map((x) => x.db));
  const min = Math.min(...parsed.map((x) => x.db));
 const sortedDates = parsed.map((x) => new Date(x.datetime));

const startTime = sortedDates[0];
const endTime = new Date(sortedDates[sortedDates.length - 1]);

const fixedEndTime = new Date(endTime);

if (fixedEndTime < startTime) {
  fixedEndTime.setDate(fixedEndTime.getDate() + 1);
}

const durationMs = fixedEndTime - startTime;
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
 startTime: parsed[0]?.datetime
  ? new Date(parsed[0].datetime).toLocaleString("nl-NL")
  : "-",

endTime: fixedEndTime.toLocaleString("nl-NL"),
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
     const matchesCategory =
  filterCategory === "Alles" ||
  incident.category === filterCategory ||
  (filterCategory === "dB analyse" && incident.source === "PCE dB analyse");
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
  const dossierStats = useMemo(() => {
  const avondDb = incidents
    .filter((i) => {
      const db = getDbValue(i.db);
      const hour = new Date(i.datetime).getHours();
      return db !== null && hour >= 19 && hour < 23;
    })
    .map((i) => getDbValue(i.db));

  const nachtDb = incidents
    .filter((i) => {
      const db = getDbValue(i.db);
      const hour = new Date(i.datetime).getHours();
      return db !== null && (hour >= 23 || hour < 7);
    })
    .map((i) => getDbValue(i.db));

  const avg = (values) =>
    values.length
      ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)
      : "-";

  return {
    total: incidents.length,
    night: incidents.filter((i) => isNightIncident(i.datetime)).length,
    media: allMedia.length,
    avgEveningDb: avg(avondDb),
    avgNightDb: avg(nachtDb),
   last: incidentsSorted[0]
  ? new Intl.DateTimeFormat("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(incidentsSorted[0].datetime))
  : "-",
  };
}, [incidents, incidentsSorted, allMedia]);
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
const dashboardDbAnalyses = useMemo(() => {
  return incidents
    .filter((incident) => incident.source === "PCE dB analyse" && incident.chart_data?.length)
    .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
}, [incidents]);

const selectedDashboardDb =
  dashboardDbAnalyses[selectedDashboardDbIndex] || null;
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
datetime: (() => {
  const [datePart, timePart] = dbAnalysis.startTime.split(", ");
  const [day, month, year] = datePart.split("-");

  return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${timePart}`).toISOString();
})(),
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
const printDbAnalysisReport = () => {
  if (!selectedDbPrintId) {
    alert("Kies eerst een dB analyse");
    return;
  }

  const selectedIncident = incidents.find(
    (i) => i.id === selectedDbPrintId
  );

  if (!selectedIncident) {
    alert("dB analyse niet gevonden");
    return;
  }

  const chartNorm =
    selectedIncident.chart_data?.[0]?.norm || 45;

  const metingen =
    selectedIncident.description?.match(/Metingen: (\d+)/)?.[1] || "-";

  const normOverschrijdingen =
    selectedIncident.description?.match(/Norm overschrijdingen: (\d+)/)?.[1] || "-";

  const piekOverschrijdingen =
    selectedIncident.description?.match(/Piek overschrijdingen: (\d+)/)?.[1] || "-";

  const maxDb =
    selectedIncident.description?.match(/Maximum dB: ([\d.,]+)/)?.[1] || "-";

  const minDb =
    selectedIncident.description?.match(/Minimum dB: ([\d.,]+)/)?.[1] || "-";

  const duration =
    selectedIncident.description?.match(/Duur: ([^\n]+)/)?.[1] || "-";

  const html = `
<html>
<head>
<title>dB analyse rapport</title>

<style>
body{
  font-family: Arial, sans-serif;
  padding:18px;
  color:#111;
  background:#fff;
  font-size:13px;
}

.report{
  max-width:980px;
  margin:0 auto;
}

.header{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  margin-bottom:18px;
  border-bottom:1px solid #ddd;
  padding-bottom:12px;
}

.title{
  font-size:24px;
  font-weight:700;
  margin-bottom:4px;
}

.subtitle{
  color:#666;
  font-size:14px;
}

.meta{
  text-align:right;
  font-size:12px;
  line-height:1.5;
}

.info-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:14px;
  margin-bottom:16px;
}

.info-box{
  border:1px solid #ddd;
  border-radius:12px;
  padding:16px;
background:#f1f3f6;
}

.info-title{
  font-size:18px;
  font-weight:700;
  margin-bottom:12px;
}

.info-line{
  margin-bottom:8px;
  font-size:13px;
  line-height:1.4;
}

.stats-grid{
  display:grid;
  grid-template-columns:repeat(3, 1fr);
  gap:14px;
  margin-bottom:12px;
}

.stat-card{
  border:1px solid #ddd;
  border-radius:12px;
  padding:16px;
  background:white;
}

.stat-label{
  color:#666;
  font-size:13px;
  margin-bottom:10px;
}

.stat-value{
  font-size:26px;
  font-weight:700;
}

.chart-box{
  border:1px solid #ddd;
  border-radius:12px;
  padding:16px;
  margin-top:16px;
}

.chart-title{
  font-size:18px;
  font-weight:700;
  margin-bottom:4px;
}
.chart-sub{
  color:#666;
  margin-bottom:20px;
}

.footer{
  margin-top:30px;
  background:#f5f5f5;
  padding:20px;
  border-radius:10px;
  color:#555;
  font-size:14px;
}

@media print{
  body{
    padding:20px;
  }
}
</style>
</head>

<body>

<div class="report">

<div class="header">
  <div>
    <div class="title">dB analyse incidentrapport</div>
    <div class="subtitle">PCE dB analyse</div>
  </div>

  <div class="meta">
    Datum rapport: ${new Date().toLocaleDateString("nl-NL")}<br/>
    Pagina: 1 van 1
  </div>
</div>

<div class="info-grid">

<div class="info-box">
    <div class="info-line"><strong>Start meting:</strong> ${selectedIncident.description?.match(/Start meting: ([^\n]+)/)?.[1] || "-"}</div>
  <div class="info-line"><strong>Einde meting:</strong> ${selectedIncident.description?.match(/Einde meting: ([^\n]+)/)?.[1] || "-"}</div>
  <div class="info-line"><strong>Locatie:</strong> ${selectedIncident.location || "-"}</div>
  <div class="info-line"><strong>Bron:</strong> ${selectedIncident.source || "-"}</div>
  <div class="info-line"><strong>Opmerking:</strong> ${selectedIncident.actions || "-"}</div>
</div>

<div class="info-box">
  <div class="info-title">Samenvatting</div>

  <div class="info-line">Duur: ${duration}</div>
  <div class="info-line">Gemiddelde dB: ${selectedIncident.db}</div>
  <div class="info-line">Maximum dB: ${maxDb}</div>
  <div class="info-line">Minimum dB: ${minDb}</div>
  <div class="info-line">Metingen: ${metingen}</div>
  <div class="info-line">Norm overschrijdingen: ${normOverschrijdingen}</div>
  <div class="info-line">Piek overschrijdingen: ${piekOverschrijdingen}</div>
</div>

</div>

<div class="stats-grid">

<div class="stat-card">
  <div class="stat-label">Gemiddelde dB</div>
  <div class="stat-value">${selectedIncident.db}</div>
</div>

<div class="stat-card">
  <div class="stat-label">Norm</div>
  <div class="stat-value">${chartNorm}</div>
</div>

<div class="stat-card">
  <div class="stat-label">Gem. overschrijding</div>
  <div class="stat-value">
    +${Math.max(0, Number(selectedIncident.db) - Number(chartNorm)).toFixed(1)} dB
  </div>
</div>

<div class="stat-card">
  <div class="stat-label">Metingen</div>
  <div class="stat-value">${metingen}</div>
</div>

<div class="stat-card">
  <div class="stat-label">Norm overschrijdingen</div>
  <div class="stat-value">${normOverschrijdingen}</div>
</div>

<div class="stat-card">
  <div class="stat-label">Piek overschrijdingen</div>
  <div class="stat-value">${piekOverschrijdingen}</div>
</div>

</div>

<div class="chart-box">
  <div class="chart-title">dB tijdlijn</div>
  <div class="chart-sub">Grafische weergave van de meting</div>

${selectedIncident.chart_data?.length ? `
<svg viewBox="0 0 800 260" width="100%" height="260" style="background:#fff;border:1px solid #ddd;border-radius:10px;">
  <line x1="55" y1="20" x2="55" y2="210" stroke="#999" stroke-width="1" />
  <line x1="55" y1="210" x2="770" y2="210" stroke="#999" stroke-width="1" />

  ${[40, 60, 80].map((v) => {
    const y = 210 - ((v - 30) / 60) * 180;
    return `
      <line x1="55" y1="${y}" x2="770" y2="${y}" stroke="#eee" stroke-width="1" />
      <text x="22" y="${y + 4}" font-size="12" fill="#555">${v}</text>
    `;
  }).join("")}

  <text x="12" y="25" font-size="12" font-weight="700" fill="#333">dB</text>

  ${[0, 0.25, 0.5, 0.75, 1].map((part) => {
    const data = selectedIncident.chart_data;
    const index = Math.min(data.length - 1, Math.round((data.length - 1) * part));
    const x = 55 + part * 715;
    return `
      <line x1="${x}" y1="210" x2="${x}" y2="216" stroke="#999" />
      <text x="${x}" y="234" font-size="11" fill="#555" text-anchor="middle">${data[index]?.time || ""}</text>
    `;
  }).join("")}

  <polyline fill="none" stroke="#2563eb" stroke-width="2"
    points="${selectedIncident.chart_data.map((p, i) => {
      const x = 55 + (i / Math.max(selectedIncident.chart_data.length - 1, 1)) * 715;
      const y = 210 - ((Number(p.db) - 30) / 60) * 180;
      return `${x},${Math.max(20, Math.min(210, y))}`;
    }).join(" ")}" />

  <polyline fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5 5"
    points="${selectedIncident.chart_data.map((p, i) => {
      const x = 55 + (i / Math.max(selectedIncident.chart_data.length - 1, 1)) * 715;
      const y = 210 - ((Number(p.norm) - 30) / 60) * 180;
      return `${x},${Math.max(20, Math.min(210, y))}`;
    }).join(" ")}" />

  <polyline fill="none" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3 3"
    points="${selectedIncident.chart_data.map((p, i) => {
      const x = 55 + (i / Math.max(selectedIncident.chart_data.length - 1, 1)) * 715;
      const y = 210 - ((Number(p.peak) - 30) / 60) * 180;
      return `${x},${Math.max(20, Math.min(210, y))}`;
    }).join(" ")}" />

<text x="520" y="24" font-size="11" fill="#2563eb">Gemeten dB</text>
<text x="520" y="40" font-size="11" fill="#f59e0b">Norm tijdvak: ${selectedIncident.chart_data?.[0]?.norm || "-"} dB(A)</text>
<text x="520" y="56" font-size="11" fill="#ef4444">Pieknorm tijdvak: ${selectedIncident.chart_data?.[0]?.peak || "-"} dB(A)</text>
</svg>
` : `
<div style="padding:40px;text-align:center;color:#666;">
  Geen grafiek beschikbaar
</div>
`}
</div>

<div class="footer">
Deze rapportage is automatisch gegenereerd op basis van dB metingen.<br/>
De metingen zijn uitgevoerd met een gecertificeerde PCE dB meter.
</div>

</div>

</body>
</html>
`;

 const win = window.open("", "_blank");

if (!win) return;

win.document.write(html);
win.document.close();
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
  const overlastMomenten = useMemo(() => {
  const dag = incidents.filter((i) => {
    const h = new Date(i.datetime).getHours();
    return h >= 7 && h < 17;
  }).length;

  const avond = incidents.filter((i) => {
    const h = new Date(i.datetime).getHours();
    return h >= 17 && h < 23;
  }).length;

  const nacht = incidents.filter((i) => {
    const h = new Date(i.datetime).getHours();
    return h >= 23 || h < 7;
  }).length;

  const totaal = dag + avond + nacht || 1;

  return {
    dag,
    avond,
    nacht,
    dagPct: Math.round((dag / totaal) * 100),
    avondPct: Math.round((avond / totaal) * 100),
    nachtPct: Math.round((nacht / totaal) * 100),
  };
}, [incidents]);
 const allTabs = [
    { id: "home", label: "Start", icon: Home },
    { id: "registratie", label: editingIncidentId ? "Incident bewerken" : "Nieuw incident", icon: Plus },
    { id: "incidenten", label: "Incidenten", icon: AlertTriangle },
    { id: "media", label: "Foto's / video's", icon: Camera },
    { id: "notities", label: "Notities", icon: FileText },
    { id: "checklist", label: "Checklist", icon: CheckSquare },
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "db-analyse", label: "dB Analyse", icon: BarChart3 },
    { id: "instellingen", label: "Meer", icon: Filter },
  ];
const tabs = isAdminMode
  ? allTabs
  : [
      allTabs.find((tab) => tab.id === "home"),
      allTabs.find((tab) => tab.id === "incidenten"),
      allTabs.find((tab) => tab.id === "media"),
      allTabs.find((tab) => tab.id === "notities"),
      allTabs.find((tab) => tab.id === "checklist"),
      allTabs.find((tab) => tab.id === "db-analyse"),
      allTabs.find((tab) => tab.id === "dashboard"),
      allTabs.find((tab) => tab.id === "instellingen"),
    ].filter(Boolean);
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
                <CardTitle className="big-title">
  Overlastregistratie
</CardTitle>

<CardDescription>
 Cuisine by Tromp – Oostvoorne | Geluid, geur, licht, terras en dossieropbouw..
</CardDescription>

<div className="hero-status-row">
  <div className="hero-status-pill">
    ☁️ Cloud opslag actief
  </div>

  <div className="hero-status-pill secondary">
    Dossiermodus
  </div>
</div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
           <CardContent className="stats-grid">
             <div
  className="stat-box"
  onClick={() => {
    setFilterCategory("Alles");
    setActiveTab("incidenten");
  }}
  style={{ cursor: "pointer" }}
>
  <p className="muted">Totaal</p>
  <p className="stat">{dashboard.total}</p>
</div>
<div
  className="stat-box"
  onClick={() => {
    setFilterCategory("Geluid");
    setActiveTab("incidenten");
  }}
  style={{ cursor: "pointer" }}
>
<p
  className="muted"
  style={{
  color: "#ef4444",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    textShadow: "0 0 8px rgba(239,68,68,.6)"
  }}
>
  <AudioLines size={18} color="#ef4444" />
  Geluid
</p>
    <p
  className="stat"
  style={{
    color: "#ef4444",
   textShadow: "0 0 10px rgba(239,68,68,.75)"
  }}
>
  {dashboard.sound}
</p>
  </div>

 <div
  className="stat-box"
  onClick={() => {
    setFilterCategory("Licht");
    setActiveTab("incidenten");
  }}
  style={{ cursor: "pointer" }}
>
   <p className="muted" style={{ color: "#f59e0b", display: "flex", alignItems: "center", gap: "8px" }}>
  <Lightbulb size={18} color="#f59e0b" />
  Licht
</p>
    <p
  className="stat"
  style={{
    color: "#f59e0b",
    textShadow: "0 0 14px rgba(245,158,11,.85)"
  }}
>
  {dashboard.light}
</p>
  </div>

  <div
  className="stat-box"
  onClick={() => {
    setFilterCategory("Geur");
    setActiveTab("incidenten");
  }}
  style={{ cursor: "pointer" }}
>
    <p className="muted" style={{ color: "#22c55e", display: "flex", alignItems: "center", gap: "8px" }}>
  <Wind size={18} color="#22c55e" />
  Geur
</p>
   <p
  className="stat"
  style={{
    color: "#22c55e",
    textShadow: "0 0 14px rgba(34,197,94,.85)"
  }}
>
  {dashboard.smell}
</p>
  </div>

 <div
  className="stat-box"
  onClick={() => {
    setFilterCategory("Terras");
    setActiveTab("incidenten");
  }}
  style={{ cursor: "pointer" }}
>
   <p className="muted" style={{ color: "#a855f7", display: "flex", alignItems: "center", gap: "8px" }}>
  <Wind size={18} color="#a855f7" />
  Terras
</p>
    <p
  className="stat"
  style={{
    color: "#a855f7",
    textShadow: "0 0 14px rgba(168,85,247,.85)"
  }}
>
  {incidents.filter(i => i.category === "Terras").length}
</p>
  </div>

  <div
  className="stat-box"
  onClick={() => {
    setFilterCategory("Overig");
    setActiveTab("incidenten");
  }}
  style={{ cursor: "pointer" }}
>
  <p className="muted" style={{ color: "#f97316", display: "flex", alignItems: "center", gap: "8px" }}>
  <AlertTriangle size={18} color="#f97316" />
  Overig
</p>
    <p
  className="stat"
  style={{
    color: "#f97316",
    textShadow: "0 0 14px rgba(249,115,22,.85)"
  }}
>
  {incidents.filter(i => i.category === "Overig").length}
</p>
  </div>
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
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={cn("nav-item", active && "nav-item-active")}
      >
        <Icon className="icon-sm" />
        <span>{tab.label}</span>
      </button>
    );
  })}
</div>

<div className="sidebar-neon-visual" aria-hidden="true">
  <div className="neon-wave">
    <span></span>
    <span></span>
    <span></span>
  </div>

  <div className="neon-beam"></div>

  <div className="neon-orbit orbit-1"></div>
  <div className="neon-orbit orbit-2"></div>
  <div className="neon-orbit orbit-3"></div>
</div>
                <div
  style={{
    textAlign: "center",
    fontSize: "13px",
 opacity: 0.85,
    marginTop: "14px",
    lineHeight: "1.5"
  }}
>
  <div>Overlastregistratie v1.0</div>
  <div>© Theo Verdooren 2026</div>
  <div>Alle rechten voorbehouden</div>
</div>
              </CardContent>
            </Card>

            <div className="stack">
              {activeTab === "home" && (
                <div className="stack">
                 
                                <div className="content-grid">
 <Card>
  <CardHeader>
  <div className="between">
  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
    <div
      style={{
        width: "42px",
        height: "42px",
        borderRadius: "999px",
        display: "grid",
        placeItems: "center",
        background: "radial-gradient(circle, rgba(34,211,238,.35), rgba(37,99,235,.12) 60%, transparent 72%)",
        boxShadow: "0 0 18px rgba(34,211,238,.75)"
      }}
    >
      <AudioLines size={26} color="#22d3ee" />
    </div>

    <div>
      <CardTitle style={{ fontSize: "24px", lineHeight: "1.1" }}>
        Laatste dB analyse
      </CardTitle>
 <CardDescription style={{ marginTop: "8px", fontSize: "14px" }}>
  {selectedDashboardDb
    ? `${formatDisplayDateTime(selectedDashboardDb.datetime)}`
    : "Nog geen opgeslagen dB analyse"}
</CardDescription>
    </div>
  </div>

      <div className="badge-row">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!dashboardDbAnalyses.length}
          onClick={() =>
            setSelectedDashboardDbIndex((prev) =>
              prev === 0 ? dashboardDbAnalyses.length - 1 : prev - 1
            )
          }
        >
          ←
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!dashboardDbAnalyses.length}
          onClick={() =>
            setSelectedDashboardDbIndex((prev) =>
              prev === dashboardDbAnalyses.length - 1 ? 0 : prev + 1
            )
          }
        >
          →
        </Button>
      </div>
    </div>
  </CardHeader>

  <CardContent className="stack">
    {selectedDashboardDb ? (
      <>
       <div className="stats-page-grid db-home-kpi-grid">
         <Card>
  <CardContent className="db-kpi-card-content">
    <AudioLines size={24} color="#22d3ee" />
    <div>
      <p className="muted">Gemiddelde dB</p>
      <p className="stat">{selectedDashboardDb.db}</p>
    </div>
  </CardContent>
</Card>

         <Card>
  <CardContent className="db-kpi-card-content">
    <Activity size={24} color="#ef4444" />
    <div>
      <p className="muted">Maximum dB</p>
      <p className="stat">
        {extractDbAnalysisField(selectedDashboardDb.description, "Maximum dB")}
      </p>
    </div>
  </CardContent>
</Card>

       <Card>
  <CardContent className="db-kpi-card-content">
    <Moon size={24} color="#8b5cf6" />
    <div>
      <p className="muted">Periode</p>
      <p className="stat">
        {extractDbAnalysisField(selectedDashboardDb.description, "Duur")}
      </p>
    </div>
  </CardContent>
</Card>
    <Card>
  <CardContent className="db-kpi-card-content">
   <Activity size={24} color="#22d3ee" />
    <div>
      <p className="muted">Gem. overschr.</p>
      <p className="stat">
        +{(
          Number(selectedDashboardDb.db) -
          Number(selectedDashboardDb.chart_data?.[0]?.norm || 45)
        ).toFixed(1)}
      </p>
    </div>
  </CardContent>
</Card>
        </div>
<div style={{ width: "100%", height: 420 }}>
          <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={selectedDashboardDb.chart_data}>
  <defs>
   <linearGradient id="dashboardDbFill" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#c084fc" stopOpacity={0.38} />
<stop offset="28%" stopColor="#a855f7" stopOpacity={0.30} />
<stop offset="62%" stopColor="#8b5cf6" stopOpacity={0.22} />
<stop offset="100%" stopColor="#111827" stopOpacity={0.02} />
</linearGradient>
    <filter id="dashboardNeonGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

<XAxis dataKey="time" />
<YAxis />
          <Area
  type="monotone"
  dataKey="db"
  stroke="none"
  fill="url(#dashboardDbFill)"
/>
 <Line
  type="monotone"
  dataKey="db"
 stroke="#c084fc"
  dot={false}
strokeWidth={12}
opacity={0.12}
/>

  <Line
    type="monotone"
    dataKey="db"
  stroke="#c084fc"
    dot={false}
    strokeWidth={3}
    filter="url(#dashboardNeonGlow)"
  />

  <Line
    type="monotone"
    dataKey="norm"
    stroke="#f59e0b"
    dot={false}
    strokeDasharray="5 5"
    strokeWidth={2}
  />

  <Line
    type="monotone"
    dataKey="peak"
    stroke="#ef4444"
    dot={false}
    strokeDasharray="3 3"
    strokeWidth={2}
  />
</ComposedChart>
                </ResponsiveContainer>
        </div>
       <div 
  style={{
   marginTop: "0px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px"
  }}
>
         
<div style={{ border: "1px solid rgba(255,255,255,.1)", minHeight: "150px", borderRadius: "16px", padding: "12px" }}>
<div
  style={{
    fontWeight: 800,
    marginBottom: "14px",
    fontSize: "20px",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  }}
>
  <Activity size={20} color="#22d3ee" />
  Laatste meldingen
</div>

<div style={{ display: "grid", gap: "10px", fontSize: "15px" }}>
  {["Geluid","Licht","Geur","Terras","Overig"].map(type => {
    const lastIncident = incidentsSorted.find(inc => inc.category === type);
    const iconMap = {
      Geluid: <AudioLines size={17} color="#ef4444" />,
      Licht: <Lightbulb size={17} color="#f59e0b" />,
      Geur: <Wind size={17} color="#22c55e" />,
      Terras: <Wind size={17} color="#a855f7" />,
      Overig: <AlertTriangle size={17} color="#f97316" />,
    };

    return (
      <div
        key={type}
        onClick={() => {
  if (!lastIncident) return;
  setSelectedIncidentId(null);
  setFilterCategory(type);
  setActiveTab("incidenten");
}}
        style={{
          display: "grid",
          gridTemplateColumns: "18px 1fr",
          gap: "8px",
          cursor: lastIncident ? "pointer" : "default",
          opacity: lastIncident ? 1 : 0.55,
        }}
      >
        {iconMap[type]}

        <div>
          <div style={{ color: iconMap[type].props.color, fontWeight: 800 }}>
            {type}
          </div>
          <div style={{ color: "#dbe4ff", lineHeight: "1.25" }}>
      {lastIncident ? formatDisplayDateTime(lastIncident.datetime) : "Nog geen melding"}
          </div>
        </div>
      </div>
    );
  })}
</div>
</div>

<div style={{ border: "1px solid rgba(255,255,255,.1)", minHeight: "150px", borderRadius: "16px", padding: "12px" }}>
  <div style={{ fontWeight: 800, marginBottom: "10px" }}>
    Dossierstatus
  </div>

  <div style={{ display: "grid", gap: "6px", fontSize: "16px", fontWeight: 700 }}>
   <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
  <Activity size={16} color="#22d3ee" />
  <span>Totaal incidenten: {dossierStats.total}</span>
</div>

<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
  <Moon size={16} color="#8b5cf6" />
  <span>Nachtincidenten: {dossierStats.night}</span>
</div>

<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
  <Camera size={16} color="#38bdf8" />
  <span>Foto's/video's: {dossierStats.media}</span>
</div>

<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
  <Sun size={16} color="#f59e0b" />
  <span>Gem. dB avond: {dossierStats.avgEveningDb}</span>
</div>

<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
  <Moon size={16} color="#60a5fa" />
  <span>Gem. dB nacht: {dossierStats.avgNightDb}</span>
</div>

<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
  <Activity size={16} color="#ffffff" />
  <span>Laatste incident: {dossierStats.last}</span>
</div>
  </div>
</div>
</div>
        </>
       ) : (
      <p className="muted">Nog geen dB analyse opgeslagen als incident.</p>
    )}
  </CardContent>
</Card>

  <Card>
    <CardHeader>
   <CardTitle
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px"
  }}
>
  <FileText size={22} color="#8b5cf6" />
  Export & rapport
</CardTitle>
      <CardDescription>Klaar voor dossier en print</CardDescription>
    </CardHeader>
   <CardContent style={{ paddingTop: "12px" }} className="stack">
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
      <select
  className="input"
  value={selectedDbPrintId}
  onChange={(e) => setSelectedDbPrintId(e.target.value)}
>
  <option value="">Kies dB analyse</option>
  {incidents
    .filter(i => i.source === "PCE dB analyse")
    .map(i => (
      <option key={i.id} value={i.id}>
        {i.title}
      </option>
    ))}
</select>
      <Button onClick={printDbAnalysisReport} variant="outline">
  <Printer className="icon-inline" /> Print dB analyse
</Button>
      <Button onClick={exportJSON} variant="outline">
        <Download className="icon-inline" /> Maak back-up (.json)
      </Button>

   <Button
  onClick={generateHandhavingRequest}
  variant="secondary"
  className="handhaving-btn"
>
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
                       {!allMedia.filter((item) => item.mime_type?.startsWith("image/") || item.mime_type?.startsWith("video/")).length && <p className="muted">Nog geen foto's of video's toegevoegd.</p>}
                        {!!allMedia.length && (
                          <div className="media-grid">
                          {allMedia
  .filter((item) => item.mime_type?.startsWith("image/") || item.mime_type?.startsWith("video/"))
  .map((item) => (
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
                              {isAdminMode && selectedMediaIds.includes(item.id) && (
  <Button
    type="button"
    variant="ghost"
    onClick={() => removeSelectedMediaFromForm(item.id)}
  >
    Verwijder
  </Button>
)}
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
                       <option>Alles</option><option>Geluid</option><option>Licht</option><option>Geur</option><option>Terras</option><option>dB analyse</option><option>Overig</option>
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
                  if (selectedIncidentId !== incident.id) {
const categoryIcon =
incident.source === "PCE dB analyse"
  ? <Activity size={22} color="#3b82f6" />
  : incident.category === "Geluid"
  ? <AudioLines size={22} color="#ef4444" />
  : incident.category === "Licht"
  ? <Lightbulb size={22} color="#f59e0b" />
  : incident.category === "Geur"
  ? <Waves size={22} color="#22c55e" />
  : incident.category === "Terras"
  ? <Wind size={22} color="#a855f7" />
  : <AlertTriangle size={22} color="#f97316" />;
const categoryLabel =
  incident.source === "PCE dB analyse" ? "dB Analyse" : incident.category;

const categoryClass =
  incident.source === "PCE dB analyse"
    ? "db-analyse"
    : incident.category.toLowerCase().replace(" ", "-");
  return (
    <button
      key={incident.id}
      type="button"
      className="incident-card"
      onClick={() => setSelectedIncidentId(incident.id)}
      style={{ textAlign: "left", width: "100%" }}
    >
     <div className="between">
  <div className="badge-row">
<div className={`incident-list-icon incident-${categoryClass}`}>
      {categoryIcon}
    </div>

    <div>
      <p className="bold" style={{ color: "#f8fafc" }}>
        {incident.title}
      </p>
      <p className="muted mt-sm" style={{ color: "#94a3b8" }}>
        {formatDisplayDateTime(incident.datetime)} • {incident.category} • {incident.location}
      </p>
    </div>
  </div>

<span
  style={{
    color:
      categoryClass === "geluid" ? "#ef4444" :
      categoryClass === "licht" ? "#f59e0b" :
      categoryClass === "geur" ? "#22c55e" :
      categoryClass === "terras" ? "#a855f7" :
      categoryClass === "db-analyse" ? "#3b82f6" :
      "#f97316",
    fontWeight: 800,
    fontSize: "16px",
    whiteSpace: "nowrap"
    ,
textShadow:
  categoryClass === "geluid" ? "0 0 12px rgba(239,68,68,.8)" :
  categoryClass === "licht" ? "0 0 12px rgba(245,158,11,.8)" :
  categoryClass === "geur" ? "0 0 12px rgba(34,197,94,.8)" :
  categoryClass === "terras" ? "0 0 12px rgba(168,85,247,.8)" :
  categoryClass === "db-analyse" ? "0 0 12px rgba(59,130,246,.8)" :
  "0 0 12px rgba(249,115,22,.8)"
  }}
>
  {categoryLabel} ›
</span>
</div>
           </button>
  );
}
                        return (
                          <div key={incident.id} data-incident-id={incident.id} className="incident-card">
                            <Button
  type="button"
  variant="outline"
  size="sm"
  onClick={() => setSelectedIncidentId(null)}
>
  ← Terug naar lijst
</Button>
                            <div className="between">
                              <div>
                                <div className="badge-row">
                                  <p className="bold">{incident.title}</p>
                                  <Badge>{incident.category}</Badge>
                                  <Badge variant="outline">{incident.severity}</Badge>
                                  {isNightIncident(incident.datetime) && <Badge variant="secondary"><Moon className="icon-inline" /> Nacht</Badge>}
                                 {dbInfo.exceeded && (
  <Badge variant="secondary">
    +{(Number(incident.db) - chartNorm).toFixed(1)} dB boven norm
  </Badge>
)}
                                </div>
                                <p className="muted mt-sm">{formatDisplayDateTime(incident.datetime)} • {incident.location}</p>
                              </div>
                             {isAdminMode && (
  <div className="badge-row">
    <Button type="button" variant="outline" size="sm" onClick={() => startEditIncident(incident)}>
      <Pencil className="icon-inline" /> Bewerk
    </Button>
    <Button type="button" variant="ghost" size="icon" onClick={() => deleteIncident(incident.id)}>
      <Trash2 className="icon-sm" />
    </Button>
  </div>
)}
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
         <p className="muted">Gem. overschrijding</p>
          <p className="stat">
    {`+${Math.max(0, Number(incident.db) - Number(chartNorm)).toFixed(1)} dB`}
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
                          {isAdminMode && (
  <Button type="button" variant="ghost" onClick={() => deleteMedia(item.id)}>
    <Trash2 className="icon-inline" /> Verwijderen
  </Button>
)}
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
  {isAdminMode && (
    <>
      <Textarea
        placeholder="Nieuwe notitie"
        value={noteInput}
        onChange={(e) => setNoteInput(e.target.value)}
      />

      <Button onClick={addNote}>
        <Plus className="icon-inline" /> Notitie toevoegen
      </Button>
    </>
  )}

  <div className="stack">
    {notes.map((note) => (
      <div key={note.id} className="note-row">
        <p>{note.text}</p>

        {isAdminMode && (
          <Button variant="ghost" size="icon" onClick={() => deleteNote(note.id)}>
            <Trash2 className="icon-sm" />
          </Button>
        )}
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
                {isAdminMode && (
  <div className="badge-row">
    <Input
      placeholder="Nieuwe taak"
      value={taskInput}
      onChange={(e) => setTaskInput(e.target.value)}
    />
    <Button onClick={addTask}>
      <Plus className="icon-inline" /> Toevoegen
    </Button>
  </div>
)}
                    <div className="stack">
                      {tasks.map((task) => (
                        <div key={task.id} className="task-row">
                          <div className="badge-row">
                            <Checkbox checked={task.done} onCheckedChange={() => toggleTask(task)} />
                            <p className={task.done ? "line-through muted" : ""}>{task.text}</p>
                          </div>
                        {isAdminMode && (
  <Button variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
    <Trash2 className="icon-sm" />
  </Button>
)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "dashboard" && (
             <div className="stack dashboard-page">
        <div className="mobile-dashboard mobile-dashboard-alert">
  <Card>
    <CardContent>
      <div style={{ fontSize: "18px", fontWeight: 700, color: "#f59e0b" }}>
        Verhoogde overlast
      </div>

      <div className="muted" style={{ marginTop: "4px" }}>
        {dossierStats.night} nachtincidenten en verhoogde geluidsniveaus in de nacht.
      </div>
    </CardContent>
  </Card>
</div>
    <div className="mobile-dashboard-kpis mobile-dashboard-kpis-premium">

  <Card>
    <CardContent>
      <p className="muted">
        <Activity className="icon-inline" color="#22d3ee" /> Totaal incidenten
      </p>
      <p className="stat">{dossierStats.total}</p>
    </CardContent>
  </Card>

  <Card>
    <CardContent>
      <p className="muted">
        <Moon className="icon-inline" color="#a855f7" /> Nachtincidenten
      </p>
      <p className="stat">{dossierStats.night}</p>
    </CardContent>
  </Card>

  <Card>
    <CardContent>
      <p className="muted">
        <AudioLines className="icon-inline" color="#22c55e" /> Gemiddelde dB
      </p>
      <p className="stat">{analyse?.avg}</p>
    </CardContent>
  </Card>

  <Card>
    <CardContent>
      <p className="muted">
        <FileText className="icon-inline" color="#a855f7" /> Laatste incident
      </p>
      <p className="stat">{dossierStats.last}</p>
    </CardContent>
  </Card>

</div>
 <div className="mobile-dashboard mobile-dashboard-donut">
  <Card>
    <CardContent>
      <div style={{ fontSize: "18px", fontWeight: 800 }}>
        Overlastmomenten
      </div>

  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
 <div
  style={{
  width: "180px",
height: "180px",
borderRadius: "50%",
position: "relative",
boxShadow:
  "0 0 18px rgba(59,130,246,.35), 0 0 24px rgba(245,158,11,.25), 0 0 30px rgba(239,68,68,.35)",
background: `conic-gradient(
#3b82f6 0 ${overlastMomenten.dagPct}%,
#f59e0b ${overlastMomenten.dagPct}% ${overlastMomenten.dagPct + overlastMomenten.avondPct}%,
#ef4444 ${overlastMomenten.dagPct + overlastMomenten.avondPct}% 100%
`
)`
  }}
>
  <div
    style={{
      position: "absolute",
      inset: "34px",
      borderRadius: "50%",
      background: "#111827"
    }}
  />
</div>

<div style={{ display: "grid", gap: "12px", fontSize: "16px", flex: 1 }}>

  <div style={{ display: "grid", gridTemplateColumns: "18px 1fr auto", gap: "8px", alignItems: "center" }}>
  <span>🔵</span>
    <span>Dag</span>
  <strong>{overlastMomenten.dag} ({overlastMomenten.dagPct}%)</strong>
  </div>

  <div style={{ display: "grid", gridTemplateColumns: "18px 1fr auto", gap: "8px", alignItems: "center" }}>
    <span>🟠</span>
    <span>Avond</span>
    <strong>{overlastMomenten.avond} ({overlastMomenten.avondPct}%)</strong>
  </div>

  <div style={{ display: "grid", gridTemplateColumns: "18px 1fr auto", gap: "8px", alignItems: "center" }}>
    <span>🔴</span>
    <span>Nacht</span>
    <strong>{overlastMomenten.nacht} ({overlastMomenten.nachtPct}%)</strong>
  </div>
</div>
</div>
    </CardContent>
  </Card>
</div>              
 <div className="content-grid dashboard-desktop-block">
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
                 <Card className="mobile-hide-dashboard-analysis">
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

                 <div className="content-grid mobile-hide-dashboard-extra">
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
                       <video ref={previewVideoRef} key={activePreviewMedia.id} src={activePreviewMedia.url || undefined} controls playsInline preload="none" className="modal-media-el" />
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
   {isAdminMode && (
  <Input
    type="file"
    accept=".xlsx,.xls"
    onChange={handleDbExcelUpload}
  />
)}

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
           <CardContent style={{ padding: "8px 10px" }}>
              <p className="muted">Gemiddelde dB</p>
              <p className="stat">{dbAnalysis.totalAverage}</p>
            </CardContent>
          </Card>

          <Card>
           <CardContent style={{ padding: "8px 10px" }}>
              <p className="muted">Maximum</p>
              <p className="stat">{dbAnalysis.max}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent style={{ padding: "8px 10px" }}>
              <p className="muted">Minimum</p>
              <p className="stat">{dbAnalysis.min}</p>
            </CardContent>
          </Card>
<Card>
 <CardContent style={{ padding: "8px 10px" }}>
    <p className="muted">Metingen</p>
    <p className="stat">{dbAnalysis.count}</p>
  </CardContent>
</Card>

<Card>
 <CardContent style={{ padding: "8px 10px" }}>
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
                  <CardTitle>Meer</CardTitle>
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
