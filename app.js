// app.js
// Weather App: fetches current weather, renders the UI, handles errors and connectivity, with interactive theming.

// ---------- Elements ----------
const form = document.getElementById('weatherForm');
const cityInput = document.getElementById('cityInput');
const submitBtn = document.getElementById('submitBtn');

const statusMsg = document.getElementById('statusMsg');  // polite status
const errorMsg = document.getElementById('errorMsg');    // assertive errors
const netStatus = document.getElementById('netStatus');  // online/offline chip

const wrap = document.getElementById('weatherWrap');
const iconEl = document.getElementById('weatherIcon');
const tempEl = document.getElementById('temp');
const cityNameEl = document.getElementById('cityName');
const dateTimeEl = document.getElementById('dateTime');
const descEl = document.getElementById('description');
const windEl = document.getElementById('windSpeed');
const humidityEl = document.getElementById('humidity');
const pressureEl = document.getElementById('pressure');
const sunWrap = document.getElementById('sunriseSunset');

// ---------- UI helpers ----------
function setLoading(on = false) {
  document.body.classList.toggle('loading', !!on);
  submitBtn.disabled = !!on;
  submitBtn.textContent = on ? 'Loading…' : 'Search';
}

function setStatus(msg = '') {
  statusMsg.textContent = msg;
}

function showError(msg = 'Something went wrong.') {
  errorMsg.textContent = msg;
  if (msg) {
    errorMsg.style.opacity = '1';
  } else {
    errorMsg.style.opacity = '0';
  }
  wrap.style.opacity = 0;
  wrap.style.display = 'none';
}

// ---------- Time helpers ----------
function formatUnixTime(ts, tzOffset) {
  const d = new Date((ts + tzOffset) * 1000);
  const h = d.getUTCHours().toString().padStart(2, '0');
  const m = d.getUTCMinutes().toString().padStart(2, '0');
  return h + ':' + m;
}

function formatLocalDateTime(tzOffsetSeconds) {
  const nowUtcSeconds = Math.floor(Date.now() / 1000) + new Date().getTimezoneOffset() * 60;
  const target = new Date((nowUtcSeconds + tzOffsetSeconds) * 1000);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const hh = String(target.getUTCHours()).padStart(2,'0');
  const mm = String(target.getUTCMinutes()).padStart(2,'0');
  return `${days[target.getUTCDay()]}, ${months[target.getUTCMonth()]} ${target.getUTCDate()} ${hh}:${mm}`;
}

// ---------- Connectivity indicator ----------
function updateNetworkUI() {
  const online = navigator.onLine;
  const conn = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
  let label = online ? 'Online' : 'Offline';
  if (conn) {
    const parts = [];
    if (conn.type) parts.push(conn.type);               // wifi/cellular if available
    if (conn.effectiveType) parts.push(conn.effectiveType); // 4g/3g if available
    if (typeof conn.downlink === 'number') parts.push(`${conn.downlink.toFixed(1)} Mbps`);
    if (parts.length) label += ` • ${parts.join(' · ')}`;
  }
  netStatus.classList.toggle('online', online);
  netStatus.classList.toggle('offline', !online);
  netStatus.innerHTML = `<span class="dot" aria-hidden="true"></span><span>${label}</span>`;
}
window.addEventListener('online', updateNetworkUI);
window.addEventListener('offline', updateNetworkUI);
const _conn = navigator.connection || navigator.webkitConnection || navigator.mozConnection;
if (_conn && typeof _conn.addEventListener === 'function') _conn.addEventListener('change', updateNetworkUI);

// ---------- Weather-adaptive theme ----------
function applyThemeByWeather(data) {
  const id = (data.weather && data.weather[0] && data.weather[0].id) || 800;
  let theme = 'theme-clear';
  if (id >= 200 && id < 300) theme = 'theme-thunder';
  else if (id >= 300 && id < 600) theme = 'theme-rain';
  else if (id >= 600 && id < 700) theme = 'theme-snow';
  else if (id >= 700 && id < 800) theme = 'theme-clouds';
  else if (id === 800) theme = 'theme-clear';
  else if (id > 800) theme = 'theme-clouds';
  document.body.classList.remove('theme-clear','theme-clouds','theme-rain','theme-snow','theme-thunder');
  document.body.classList.add(theme);
}

// ---------- Render weather ----------
function updateUI(data) {
  const w = Array.isArray(data.weather) && data.weather.length ? data.weather[0] : null;
  const iconCode = w ? w.icon : '01d';
  const desc = w ? w.description : 'weather';
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  iconEl.src = iconUrl;
  iconEl.alt = desc;

  tempEl.textContent = Math.round(data.main?.temp) + '°C';   // °C via units=metric
  cityNameEl.textContent = `${data.name}, ${data.sys?.country || ''}`.trim();
  dateTimeEl.textContent = formatLocalDateTime(data.timezone || 0);
  descEl.textContent = desc;

  windEl.textContent = `${data.wind?.speed ?? '—'} m/s`;
  humidityEl.textContent = `${data.main?.humidity ?? '—'}%`;
  pressureEl.textContent = `${data.main?.pressure ?? '—'} hPa`;

  const sunrise = data.sys?.sunrise != null ? formatUnixTime(data.sys.sunrise, data.timezone || 0) : '—';
  const sunset  = data.sys?.sunset  != null ? formatUnixTime(data.sys.sunset,  data.timezone || 0) : '—';
  sunWrap.innerHTML = `
    <span class="chip"><img src="https://cdn-icons-png.flaticon.com/512/1163/1163657.png" alt="Sunrise" /> Sunrise: ${sunrise}</span>
    <span class="chip"><img src="https://cdn-icons-png.flaticon.com/512/2893/2893443.png" alt="Sunset" /> Sunset: ${sunset}</span>
  `;

  wrap.style.display = 'block';
  wrap.style.transform = 'translateY(20px)';
  requestAnimationFrame(() => {
    wrap.style.opacity = 1;
    wrap.style.transform = 'translateY(0)';
  });

  // Apply adaptive theme
  applyThemeByWeather(data);

  // Dynamic background color change based on weather condition
  const weatherId = w ? w.id : 800;
  let bgStart, bgEnd;

  if (weatherId >= 200 && weatherId < 300) { // Thunderstorm
    bgStart = '#3730a3';
    bgEnd = '#111827';
  } else if (weatherId >= 300 && weatherId < 600) { // Drizzle and Rain
    bgStart = '#0ea5e9';
    bgEnd = '#0c4a6e';
  } else if (weatherId >= 600 && weatherId < 700) { // Snow
    bgStart = '#93c5fd';
    bgEnd = '#60a5fa';
  } else if (weatherId >= 700 && weatherId < 800) { // Atmosphere (fog, mist, etc)
    bgStart = '#6b7280';
    bgEnd = '#374151';
  } else if (weatherId === 800) { // Clear
    bgStart = '#60a5fa';
    bgEnd = '#2563eb';
  } else if (weatherId > 800) { // Clouds
    bgStart = '#6b7280';
    bgEnd = '#374151';
  } else { // Default
    bgStart = '#4a69bd';
    bgEnd = '#1e3799';
  }

  document.documentElement.style.setProperty('--bg-start', bgStart);
  document.documentElement.style.setProperty('--bg-end', bgEnd);
}

// ---------- Timeout helper ----------
function makeTimeoutSignal(ms) {
  if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
    return AbortSignal.timeout(ms);          // modern browsers
  }
  const controller = new AbortController(); // fallback
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

// ---------- Fetch with retry ----------
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status < 500) return res; // success or client error, don't retry
      // Server error, retry
    } catch (err) {
      if (attempt === maxRetries - 1) throw err; // last attempt, throw
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * (2 ** attempt)));
    }
  }
}

// ---------- Input validation ----------
function validateCityName(city) {
  if (!city) return 'Please enter a city name';
  if (city.length < 2) return 'City name must be at least 2 characters long';
  if (/^\d+$/.test(city)) return 'City name cannot be just numbers';
  if (/[^a-zA-Z\s\-']/.test(city)) return 'City name can only contain letters, spaces, hyphens, and apostrophes';
  return null; // valid
}

// ---------- Submit handler ----------
let isLoading = false;

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (isLoading) return; // prevent multiple submissions

  const city = cityInput.value.trim();
  const validationError = validateCityName(city);
  if (validationError) { showError(validationError); return; }

  // Reset UI state
  errorMsg.textContent = '';
  errorMsg.style.opacity = '0';
  wrap.style.display = 'none';
  wrap.style.opacity = 0;
  wrap.style.transform = 'translateY(20px)';

  setStatus('Loading current weather…');
  setLoading(true);
  isLoading = true;

  try {
    if (!navigator.onLine) throw new Error('Offline: check internet connection');

    const signal = makeTimeoutSignal(10000); // abort after 10s
    const url = `https://api.openweathermap.org/data/2.5/weather?units=metric&q=${encodeURIComponent(city)}&appid=${apiKey}`;
    const res = await fetchWithRetry(url, { signal });

    if (!res.ok) {
      if (res.status === 404) throw new Error('City not found');
      if (res.status === 429) throw new Error('Rate limit reached, try later');
      throw new Error(`Request failed (${res.status})`);
    }

    const data = await res.json();
    updateUI(data);
    setStatus('');
  } catch (err) {
    const name = (err && err.name) || '';
    if (name === 'TimeoutError' || name === 'AbortError') {
      showError('Request timed out, please try again');
    } else {
      showError(err?.message || 'Something went wrong.');
    }
    setStatus('');
  } finally {
    setLoading(false);
    isLoading = false;
  }
});

// ---------- Interactive background color on mouse move ----------
document.body.addEventListener('mousemove', (e) => {
  const { innerWidth, innerHeight } = window;
  const xRatio = e.clientX / innerWidth;
  const yRatio = e.clientY / innerHeight;

  // Calculate color shift based on mouse position
  const startHue = 210; // base hue for bg-start (blue)
  const endHue = 270;   // base hue for bg-end (purple)
  const hue = startHue + (endHue - startHue) * xRatio;

  // Calculate lightness shift for subtle effect
  const lightnessStart = 50;
  const lightnessEnd = 30;
  const lightness = lightnessStart + (lightnessEnd - lightnessStart) * yRatio;

  // Construct HSL colors
  const bgStart = `hsl(${hue}, 70%, ${lightness}%)`;
  const bgEnd = `hsl(${hue + 30}, 70%, ${lightness - 10}%)`;

  // Update CSS variables for background gradient
  document.documentElement.style.setProperty('--bg-start', bgStart);
  document.documentElement.style.setProperty('--bg-end', bgEnd);
});

// ---------- Boot ----------
updateNetworkUI(); // draw initial connectivity
