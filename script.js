let studies = JSON.parse(localStorage.getItem("studies")) || [];

const relaxMusic = document.getElementById("relaxMusic");
const alarmSound = document.getElementById("alarmSound");
const volumeSlider = document.getElementById("volumeSlider");

relaxMusic.loop = true;
relaxMusic.volume = volumeSlider.value;

volumeSlider.addEventListener("input", () => {
  relaxMusic.volume = volumeSlider.value;
});

function saveData() {
  localStorage.setItem("studies", JSON.stringify(studies));
}

function addStudy() {
  const subject = document.getElementById("subject").value;
  const sessions = parseInt(document.getElementById("sessions").value);

  if (!subject || !sessions) {
    alert("Isi materi dan target sesi dulu!");
    return;
  }

  studies.push({
    id: Date.now(),
    subject,
    sessions,
    completedSessions: 0,
    completed: false,
    timer: 25 * 60,
    interval: null,
    lastCompletedDate: null
  });

  saveData();
  render();

  document.getElementById("subject").value = "";
  document.getElementById("sessions").value = "";
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function fadeIn(audio, duration = 1000) {
  audio.volume = 0;
  audio.play();
  let step = 0.05;
  let interval = setInterval(() => {
    if (audio.volume < volumeSlider.value) {
      audio.volume = Math.min(audio.volume + step, volumeSlider.value);
    } else clearInterval(interval);
  }, duration / (1 / step));
}

function fadeOut(audio, duration = 1000) {
  let step = 0.05;
  let interval = setInterval(() => {
    if (audio.volume > 0.05) {
      audio.volume -= step;
    } else {
      clearInterval(interval);
      audio.pause();
      audio.currentTime = 0;
      audio.volume = volumeSlider.value;
    }
  }, duration / (1 / step));
}

function startTimer(id) {
  const task = studies.find(s => s.id === id);
  if (!task || task.interval) return;

  fadeIn(relaxMusic);

  task.interval = setInterval(() => {
    if (task.timer > 0) {
      task.timer--;
      document.getElementById("timer-" + id).innerText =
        formatTime(task.timer);
    } else {
      clearInterval(task.interval);
      task.interval = null;

      fadeOut(relaxMusic);
      alarmSound.play();

      task.completedSessions++;
      task.timer = 25 * 60;
      task.lastCompletedDate = new Date().toDateString();

      if (task.completedSessions >= task.sessions) {
        task.completed = true;
      }

      saveData();
      render();
    }
  }, 1000);
}

function pauseTimer(id) {
  const task = studies.find(s => s.id === id);
  if (task && task.interval) {
    clearInterval(task.interval);
    task.interval = null;
    fadeOut(relaxMusic);
  }
}

function resetTimer(id) {
  const task = studies.find(s => s.id === id);
  if (!task) return;

  if (task.interval) clearInterval(task.interval);

  task.timer = 25 * 60;
  task.interval = null;
  fadeOut(relaxMusic);
  render();
}

function deleteStudy(id) {
  studies = studies.filter(item => item.id !== id);
  saveData();
  render();
}

function updateProgress() {
  const total = studies.length;
  const completed = studies.filter(s => s.completed).length;
  const percent = total === 0 ? 0 : (completed / total) * 100;

  document.getElementById("progressFill").style.width =
    percent + "%";
  document.getElementById("progressText").innerText =
    `Progress tugas: ${completed}/${total}`;
}

function updateStats() {
  const today = new Date().toDateString();
  let todayCount = 0;
  let totalCount = 0;

  studies.forEach(task => {
    totalCount += task.completedSessions;
    if (task.lastCompletedDate === today) {
      todayCount += 1;
    }
  });

  document.getElementById("todayStats").innerText =
    `Sesi hari ini: ${todayCount}`;

  document.getElementById("totalStats").innerText =
    `Total sesi keseluruhan: ${totalCount}`;
}

function render() {
  const list = document.getElementById("studyList");
  list.innerHTML = "";

  studies.forEach(item => {
    const li = document.createElement("li");
    if (item.completed) li.classList.add("completed");

    li.innerHTML = `
      <div>
        <strong>${item.subject}</strong><br>
        Sesi: ${item.completedSessions} / ${item.sessions}<br>
        <span id="timer-${item.id}">
          ${formatTime(item.timer)}
        </span>
      </div>
      <div>
        <button onclick="startTimer(${item.id})">Start</button>
        <button onclick="pauseTimer(${item.id})">Pause</button>
        <button onclick="resetTimer(${item.id})">Reset</button>
        <button onclick="deleteStudy(${item.id})">✖</button>
      </div>
    `;
    list.appendChild(li);
  });

  updateProgress();
  updateStats();
}

render();
