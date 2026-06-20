const ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbxsVJhL7TISFibQinogezwO7LJRoiC8kv7vXNOHH1O3ryO-FdrfthrPMX_BIafy4NM4Jw/exec";
let assignments = {};
let order = [];
let idx = 0;
let rows = [];

const $ = (id) => document.getElementById(id);

function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s;
}

function csvText() {
  const fields = ["timestamp","participant_id","order_index","segment_id","clip_id","source_folder","segment_position","is_common","enjoyment_speaker_a","enjoyment_speaker_b","shared_reality","comment","duration_s"];
  return [fields.join(","), ...rows.map(r => fields.map(f => csvEscape(r[f])).join(","))].join("\n");
}

function showClip() {
  const clip = order[idx];
  $("progressText").textContent = `Clip ${idx + 1} of ${order.length}`;
  $("clipTitle").textContent = `Conversation segment ${idx + 1}`;
  $("audio").src = clip.audio_url;
  $("audio").currentTime = 0;
  $("transcript").textContent = clip.transcript;
  $("transcriptPanel").classList.add("hidden");
  $("nextBtn").disabled = true;
  $("enjoymentA").value = 5;
  $("enjoymentB").value = 5;
  $("shared").value = 4;
  $("enjoymentAValue").textContent = 5;
  $("enjoymentBValue").textContent = 5;
  $("sharedValue").textContent = 4;
  $("comment").value = "";
}

async function submitRows() {
  if (!ENDPOINT_URL) {
    $("status").textContent = "No endpoint configured. Download the backup CSV and send it to the instructor.";
    return;
  }
  await fetch(ENDPOINT_URL, {method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain"}, body:JSON.stringify({rows})});
  $("status").textContent = `Submitted ${rows.length} rows.`;
}

function downloadCsv() {
  const blob = new Blob([csvText()], {type:"text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `jsalt_listening_test_${$("participantId").value || "participant"}.csv`;
  a.click();
}

fetch("assignments.json").then(r => r.json()).then(data => {
  assignments = data;
  $("startBtn").disabled = false;
  $("startBtn").textContent = "Start";
  $("setupStatus").textContent = "Use your assigned participant ID, for example P001.";
});

$("enjoymentA").addEventListener("input", e => $("enjoymentAValue").textContent = e.target.value);
$("enjoymentB").addEventListener("input", e => $("enjoymentBValue").textContent = e.target.value);
$("shared").addEventListener("input", e => $("sharedValue").textContent = e.target.value);
$("audio").addEventListener("ended", () => {
  $("transcriptPanel").classList.remove("hidden");
  $("nextBtn").disabled = false;
});
$("startBtn").addEventListener("click", () => {
  const pid = $("participantId").value.trim().toUpperCase();
  if (!assignments[pid]) {
    alert("Unknown participant ID. Please use the ID assigned by the instructor, e.g. P001.");
    return;
  }
  $("participantId").value = pid;
  order = assignments[pid];
  idx = 0;
  rows = [];
  $("setup").classList.add("hidden");
  $("instructions").classList.add("hidden");
  $("test").classList.remove("hidden");
  showClip();
});
$("nextBtn").addEventListener("click", () => {
  const clip = order[idx];
  rows.push({
    timestamp: new Date().toISOString(),
    participant_id: $("participantId").value.trim().toUpperCase(),
    order_index: idx + 1,
    segment_id: clip.segment_id,
    clip_id: clip.clip_id,
    source_folder: clip.source_folder,
    segment_position: clip.segment_position,
    is_common: clip.is_common,
    enjoyment_speaker_a: $("enjoymentA").value,
    enjoyment_speaker_b: $("enjoymentB").value,
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
