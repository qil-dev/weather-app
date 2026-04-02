const apiKey = "fc8e5c868a0eefa9bc4caba40c3e65a3";

function getWeather() {
  let city = document.getElementById("cityInput").value;

  let url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      document.getElementById("cityName").textContent = data.name;
      document.getElementById("temperature").textContent = data.main.temp + "°C";
      document.getElementById("description").textContent = data.weather[0].description;

      let icon = data.weather[0].icon;
      document.getElementById("weatherIcon").src =
        `https://openweathermap.org/img/wn/${icon}@2x.png`;
    })
    .catch(() => {
      alert("City not found!");
    });
}