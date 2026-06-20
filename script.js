const ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbz91FMEdvsbhcTp8KFn0KijJYYJfyv8Rh7kU31jP1IfG3KhIOItoZ9Uaavc8N2dSE7G3Q/exec";
let manifest = [];
let order = [];
let idx = 0;
let rows = [];

const $ = (id) => document.getElementById(id);

function shuffle(a, seedText) {
  let seed = 0;
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    seed = (1664525 * seed + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function showClip() {
  const clip = order[idx];
  $("progressText").textContent = `Clip ${idx + 1} of ${order.length}`;
  $("clipTitle").textContent = `Conversation clip ${idx + 1}`;
  $("audio").src = clip.audio_url;
  $("audio").currentTime = 0;
  $("nextBtn").disabled = true;
  $("enjoyment").value = 5;
  $("shared").value = 4;
  $("enjoymentValue").textContent = 5;
  $("sharedValue").textContent = 4;
  $("comment").value = "";
}

function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s;
}

function csvText() {
  const fields = ["timestamp","participant_id","clip_id","source_folder","order_index","conversation_enjoyment","shared_reality","comment","duration_s"];
  return [fields.join(","), ...rows.map(r => fields.map(f => csvEscape(r[f])).join(","))].join("\n");
}

async function submitRows() {
  if (!ENDPOINT_URL) {
    $("status").textContent = "No endpoint configured. Download the backup CSV and send it to the instructor.";
    return;
  }
  const res = await fetch(ENDPOINT_URL, {method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain"}, body:JSON.stringify({rows})});
  $("status").textContent = `Submitted ${rows.length} rows.`;
}

function downloadCsv() {
  const blob = new Blob([csvText()], {type:"text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `jsalt_listening_test_${$("participantId").value || "participant"}.csv`;
  a.click();
}

fetch("manifest.json").then(r => r.json()).then(data => {
  manifest = data;
  $("startBtn").disabled = false;
  $("startBtn").textContent = "Start";
});
$("enjoyment").addEventListener("input", e => $("enjoymentValue").textContent = e.target.value);
$("shared").addEventListener("input", e => $("sharedValue").textContent = e.target.value);
$("audio").addEventListener("ended", () => $("nextBtn").disabled = false);
$("startBtn").addEventListener("click", () => {
  const pid = $("participantId").value.trim();
  if (!pid) { alert("Please enter a participant ID."); return; }
  order = shuffle(manifest, pid);
  idx = 0;
  $("setup").classList.add("hidden");
  $("test").classList.remove("hidden");
  showClip();
});
$("nextBtn").addEventListener("click", () => {
  const clip = order[idx];
  rows.push({
    timestamp: new Date().toISOString(),
    participant_id: $("participantId").value.trim(),
    clip_id: clip.clip_id,
    source_folder: clip.source_folder,
    order_index: idx + 1,
    conversation_enjoyment: $("enjoyment").value,
    shared_reality: $("shared").value,
    comment: $("comment").value,
    duration_s: clip.duration_s
  });
  idx += 1;
  if (idx < order.length) showClip();
  else {
    $("test").classList.add("hidden");
    $("done").classList.remove("hidden");
    $("status").textContent = `${rows.length} ratings ready.`;
  }
});
$("submitBtn").addEventListener("click", submitRows);
$("downloadBtn").addEventListener("click", downloadCsv);
