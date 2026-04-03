// ========== CONFIGURATION ==========
const apiKey = "fc8e5c868a0eefa9bc4caba40c3e65a3";
const appContainer = document.querySelector('body');
let isCelsius = true;
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

// ========== EVENT LISTENERS ==========
document.getElementById('cityInput').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') getWeather();
});

document.getElementById('unitToggle').addEventListener('click', toggleUnit);

// ========== MAIN WEATHER FETCH FUNCTION ==========
async function getWeather() {
  const city = document.getElementById('cityInput').value.trim();
  
  if (!city) {
    showError('Please enter a city name');
    return;
  }

  showLoading();

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );

    if (!response.ok) {
      if (response.status === 404) {
        showError('City not found. Please check the spelling and try again.');
      } else {
        showError('Unable to fetch weather data. Please try again.');
      }
      return;
    }

    const data = await response.json();
    
    // Add to recent searches
    addToRecentSearches(city);
    
    // Get 5-day forecast
    getForecast(data.coord.lat, data.coord.lon);
    
    // Display current weather
    displayWeather(data);
    
    // Clear input
    document.getElementById('cityInput').value = '';
    
  } catch (error) {
    console.error('Error:', error);
    showError('Connection error. Please check your internet and try again.');
  }
}

// ========== DISPLAY WEATHER DATA ==========
function displayWeather(data) {
  // Set theme based on weather
  setTheme(data.weather[0].main, new Date().getHours());

  // Location & Date
  document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById('currentDate').textContent = formatDate(new Date());

  // Temperature
  const temp = Math.round(data.main.temp);
  const displayTemp = isCelsius ? temp : Math.round((temp * 9/5) + 32);
  const unit = isCelsius ? '°C' : '°F';
  document.getElementById('temperature').textContent = `${displayTemp}${unit}`;

  // Feels Like
  const feelsLike = Math.round(data.main.feels_like);
  const displayFeelsLike = isCelsius ? feelsLike : Math.round((feelsLike * 9/5) + 32);
  document.getElementById('feelsLike').textContent = `Feels like ${displayFeelsLike}${unit}`;

  // Description
  document.getElementById('description').textContent = 
    data.weather[0].description.charAt(0).toUpperCase() + 
    data.weather[0].description.slice(1);

  // Weather Icon with animation
  const iconElement = document.getElementById('weatherIcon');
  iconElement.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
  iconElement.style.animation = 'none';
  setTimeout(() => {
    iconElement.style.animation = 'float 3s ease-in-out infinite';
  }, 10);

  // Weather Details
  document.getElementById('humidity').textContent = `${data.main.humidity}%`;
  document.getElementById('windSpeed').textContent = `${data.wind.speed.toFixed(1)} m/s`;
  document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
  document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;

  // Sunrise & Sunset
  document.getElementById('sunrise').textContent = formatTime(data.sys.sunrise);
  document.getElementById('sunset').textContent = formatTime(data.sys.sunset);

  // Sea Level Pressure
  document.getElementById('seaLevel').textContent = `${data.main.sea_level || data.main.pressure} hPa`;

  // UV Index (estimated based on time)
  const uvIndex = estimateUVIndex(data.weather[0].main, new Date().getHours());
  document.getElementById('uvIndex').textContent = uvIndex;

  // Show main content
  document.getElementById('mainContent').style.display = 'block';
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('errorState').style.display = 'none';
}

// ========== FETCH 5-DAY FORECAST ==========
async function getForecast(lat, lon) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );

    if (!response.ok) return;

    const data = await response.json();
    displayForecast(data.list);
  } catch (error) {
    console.error('Forecast error:', error);
  }
}

function displayForecast(forecastData) {
  const forecastContainer = document.getElementById('forecastContainer');
  forecastContainer.innerHTML = '';

  // Get forecast for next 5 days (one forecast per day at noon)
  const dailyForecasts = {};

  forecastData.forEach(forecast => {
    const date = new Date(forecast.dt * 1000);
    const dateKey = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    if (!dailyForecasts[dateKey]) {
      dailyForecasts[dateKey] = forecast;
    }
  });

  // Display up to 5 days
  Object.entries(dailyForecasts).slice(0, 5).forEach(([day, forecast]) => {
    const temp = Math.round(forecast.main.temp);
    const displayTemp = isCelsius ? temp : Math.round((temp * 9/5) + 32);
    const unit = isCelsius ? 'C' : 'F';

    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <div class="forecast-day">${day}</div>
      <div class="forecast-icon">
        <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png" alt="forecast-icon">
      </div>
      <div class="forecast-temp">${displayTemp}°${unit}</div>
      <div class="forecast-status">${forecast.weather[0].main}</div>
    `;
    forecastContainer.appendChild(card);
  });
}

// ========== THEME SYSTEM ==========
function setTheme(weatherCondition, hour) {
  const isNight = hour < 6 || hour > 18;

  let theme = 'sunny-day';

  switch (weatherCondition.toLowerCase()) {
    case 'clear':
      theme = isNight ? 'night' : 'sunny-day';
      break;
    case 'clouds':
      theme = 'cloudy';
      break;
    case 'rain':
    case 'drizzle':
    case 'thunderstorm':
      theme = 'rainy';
      break;
    case 'snow':
      theme = 'snow';
      break;
    default:
      theme = isNight ? 'night' : 'sunny-day';
  }

  // Remove all theme classes
  ['sunny-day', 'rainy', 'cloudy', 'night', 'snow'].forEach(cls => {
    appContainer.classList.remove(cls);
  });

  // Add new theme
  appContainer.classList.add(theme);
}

// ========== TEMPERATURE UNIT TOGGLE ==========
function toggleUnit() {
  isCelsius = !isCelsius;
  document.getElementById('unitToggle').textContent = isCelsius ? '°C' : '°F';
  
  // Refresh display if weather is shown
  if (document.getElementById('mainContent').style.display !== 'none') {
    const city = document.getElementById('cityName').textContent.split(',')[0];
    getWeather(); // This would require storing last searched city
  }
}

// ========== RECENT SEARCHES ==========
function addToRecentSearches(city) {
  recentSearches = recentSearches.filter(c => c.toLowerCase() !== city.toLowerCase());
  recentSearches.unshift(city);
  recentSearches = recentSearches.slice(0, 5);
  localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
  displayRecentSearches();
}

function displayRecentSearches() {
  const recentChips = document.getElementById('recentCities');
  const recentLabel = document.getElementById('recentLabel');

  recentChips.innerHTML = '';

  if (recentSearches.length > 0) {
    recentLabel.style.display = 'inline-block';
    recentSearches.forEach(city => {
      const chip = document.createElement('div');
      chip.className = 'chip';
      chip.textContent = city;
      chip.onclick = () => {
        document.getElementById('cityInput').value = city;
        getWeather();
      };
      recentChips.appendChild(chip);
    });
  } else {
    recentLabel.style.display = 'none';
  }
}

// ========== STATE MANAGEMENT ==========
function showLoading() {
  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('errorState').style.display = 'none';
  document.getElementById('loadingState').style.display = 'flex';
}

function showError(message) {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('errorState').style.display = 'block';
  document.getElementById('errorMessage').textContent = message;
}

function showEmpty() {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('mainContent').style.display = 'none';
  document.getElementById('errorState').style.display = 'none';
  document.getElementById('emptyState').style.display = 'block';
}

// ========== UTILITY FUNCTIONS ==========
function formatDate(date) {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function formatTime(timestamp) {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function estimateUVIndex(weatherCondition, hour) {
  // Simplified UV index estimation
  const baseUV = {
    'clear': 8,
    'clouds': 4,
    'rain': 2,
    'drizzle': 2,
    'thunderstorm': 1,
    'snow': 1
  };

  let uv = baseUV[weatherCondition.toLowerCase()] || 5;

  // Adjust for time of day
  if (hour < 6 || hour > 18) uv = Math.max(0, uv - 5);
  else if (hour >= 6 && hour < 9) uv = Math.max(0, uv - 3);
  else if (hour >= 15 && hour <= 18) uv = Math.max(0, uv - 2);

  return Math.max(0, Math.round(uv)).toString();
}

// ========== INITIALIZATION ==========
displayRecentSearches();
showEmpty();