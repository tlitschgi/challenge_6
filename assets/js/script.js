const searchFormEl = $("#search-form");
const cityListEl = $("#city-list");
const resultTextEl = $("#result-text");
const resultContentEl = $("#result-content");
const unit = "metric";
const limit = 1;
const appId = "748b7d2fa5ce7e17f9cfaba14ab05ac9";

$(document).ready(function () {
  loadSearchedCities();
});

// Convert celsius to fahrenheit for display
function celsiusToFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

// Assign emoji based on weather description
function getWeatherEmoji(description) {
  description = description.toLowerCase();
  if (description.includes("sun") || description.includes("clear")) {
    return "☀️";
  } else if (description.includes("cloud")) {
    return "☁️";
  } else if (description.includes("rain")) {
    return "🌧️";
  } else if (description.includes("snow")) {
    return "❄️";
  } else if (description.includes("thunder")) {
    return "⛈️";
  } else {
    return "🌤️";
  }
}

// Get the search params out of the URL
function getParams() {
  const searchParams = new URLSearchParams(window.location.search);
  const query = searchParams.get("q");

  if (!query) {
    console.log("No query parameter found in the URL.");
    return;
  }

  searchApi(query, limit, appId);
}

// Display weather results
function displayResults(weatherData) {
  // Clear any existing content
  resultContentEl.empty();
  $("#current-weather").empty();
  $("#forecast").empty();

  // Display current weather
  const currentWeather = weatherData.list[0];
  const cityName = weatherData.city ? weatherData.city.name : "Unknown City";

  // Create and format new Date object
  const currentDate = new Date();
  const formattedDate = `${(currentDate.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${currentDate
    .getDate()
    .toString()
    .padStart(2, "0")}/${currentDate.getFullYear()}`;

  // Get the weather emoji
  const weatherEmoji = getWeatherEmoji(currentWeather.weather[0].description);

  // Define and append current weather
  const currentWeatherHtml = `
    <div class="card">
      <div class="card-body">
        <h2 class="card-title">${cityName}  (${formattedDate}) ${weatherEmoji}</h2>
        <p class="card-text">Temperature: ${celsiusToFahrenheit(
          currentWeather.main.temp
        ).toFixed(1)}°F</p>
        <p class="card-text">Wind: ${currentWeather.wind.speed} m/s</p>
        <p class="card-text">Humidity: ${currentWeather.main.humidity}%</p>
      </div>
    </div>
  `;

  $("#current-weather").append(currentWeatherHtml);

  // Define and append 5-day forecast
  const forecastHtml = `
  <h3>5-Day Forecast</h3>
  <div class="row">
    ${weatherData.list
      .filter((item) => new Date(item.dt_txt).getHours() === 12)
      .slice(0, 5)
      .map((day) => {
        const dayWeatherEmoji = getWeatherEmoji(day.weather[0].description);
        return `
      <div class="col">
        <div class="card forecast-card">
          <div class="card-body">
            <h5 class="card-title">${new Date(
              day.dt * 1000
            ).toLocaleDateString()}</h5>
            <p>${dayWeatherEmoji}<p>
            <p class="card-text">Temp: ${celsiusToFahrenheit(
              day.main.temp
            ).toFixed(1)}°F</p>
            <p class="card-text">Wind: ${day.wind.speed}</p>
            <p class="card-text">Humidity: ${day.main.humidity}%</p>
            </div>
          </div>
        </div>
      `;
      })
      .join("")}
    </div>
  `;

  $("#forecast").append(forecastHtml);
}

// GET request to the openweathermap API using city name
function searchApi(query, limit, appId) {
  // The URL for the API request to get the latitude and longitude
  let geoQueryUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=${limit}&appid=${appId}`;

  console.log("Url ", geoQueryUrl);

  fetch(geoQueryUrl)
    .then(function (response) {
      if (!response.ok) {
        console.log("Response was not ok");
        throw response.json();
      }

      return response.json();
    })
    .then((data) => {
      // Extract latitude and longitude from the API response
      const latitude = data[0].lat;
      const longitude = data[0].lon;

      console.log("Latitude:", latitude);
      console.log("Longitude:", longitude);

      searchWeather(latitude, longitude, unit, appId);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

// GET request to the openweathermap API using latitude and longitude
function searchWeather(latitude, longitude, unit, appId2) {
  const weatherQueryUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=${unit}&appid=${appId}`;

  console.log("Url ", weatherQueryUrl);

  fetch(weatherQueryUrl)
    .then(function (response) {
      if (!response.ok) {
        console.log("Weather API response was not ok");
        throw response.json();
      }
      return response.json();
    })
    .then((weatherData) => {
      console.log("Weather Data:", weatherData);
      displayResults(weatherData);
    })
    .catch((error) => {
      console.error("Error fetching weather data:", error);
    });
}

// Keep list of cities previously searched beneath the form
const displayCity = function (searchInputVal) {
  // Get existing cities from local storage or initialize an empty array
  let cities = JSON.parse(localStorage.getItem("searchedCities")) || [];

  // Add the new city if it's not already in the list
  if (!cities.includes(searchInputVal)) {
    cities.unshift(searchInputVal); // Add to the beginning of the array
    // Keep only the last 10 cities
    if (cities.length > 10) {
      cities.pop();
    }
    // Save updated list to local storage
    localStorage.setItem("searchedCities", JSON.stringify(cities));
  }

  // Clear the existing list
  cityListEl.empty();

  // Display and append all cities in the list
  cities.forEach((city) => {
    const listEl = $("<li>");
    //   listEl.addClass("list-group-item list-group-item-action city-item").text(city);
    listEl.addClass("list-group-item city-item").text(city);
    listEl.appendTo(cityListEl);
  });
};

// Load previously searched cities
function loadSearchedCities() {
  const cities = JSON.parse(localStorage.getItem("searchedCities")) || [];
  cities.forEach((city) => {
    const listEl = $("<li>");
    listEl.addClass("list-group-item city-item").text(city);
    listEl.appendTo(cityListEl);
  });
}

// Process city entered
function handleSearchFormSubmit(event) {
  event.preventDefault();

  const searchInputVal = $("#search-input").val();

  if (!searchInputVal) {
    alert("City cannot be empty.");
    return;
  }

  const queryString = `?q=${encodeURIComponent(searchInputVal)}`;
  history.pushState(null, "", queryString);

  getParams();

  console.log("City is present: " + searchInputVal);
  displayCity(searchInputVal);

  // resets form
  $("#search-input").val("");
}

cityListEl.on("click", ".city-item", function () {
  const cityName = $(this).text();
  $("#search-input").val(cityName);
  handleSearchFormSubmit(new Event("submit"));
});

// On submit, process city entered
searchFormEl.on("submit", handleSearchFormSubmit);
