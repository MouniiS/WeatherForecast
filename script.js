const API_KEY = "3ef03e54fc162351a6354fa6e1645a61";

class WeatherApp {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.initializeDateTime();
        this.loadLastCity();
        this.startTimeUpdate();
    }

    initializeElements() {
        this.elements = {
            dayEl: document.querySelector('.default_day'),
            dateEl: document.querySelector('.default_date'),
            timeEl: document.querySelector('.current_time'),
            searchForm: document.querySelector('.search_form'),
            inputEl: document.querySelector('.input_field'),
            locationBtn: document.querySelector('.btn_location'),
            locationName: document.querySelector('.location_name'),
            weatherImg: document.querySelector('.weather_img'),
            weatherTemp: document.querySelector('.weather_temp'),
            cloudText: document.querySelector('.cloudtxt'),
            feelsLike: document.querySelector('.feels_like'),
            humidity: document.querySelector('.humidity'),
            windSpeed: document.querySelector('.wind_speed'),
            pressure: document.querySelector('.pressure'),
            forecastList: document.querySelector('.forecast_list'),
            loadingSpinner: document.querySelector('.loading_spinner'),
            errorMessage: document.querySelector('.error_message')
        };
    }

    initializeEventListeners() {
        this.elements.searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSearch();
        });

        this.elements.locationBtn.addEventListener('click', () => {
            this.getCurrentLocation();
        });
    }

    initializeDateTime() {
        const date = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        this.elements.dayEl.textContent = days[date.getDay()];
        this.elements.dateEl.textContent = date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        this.updateTime();
    }

    startTimeUpdate() {
        setInterval(() => this.updateTime(), 1000);
    }

    updateTime() {
        const now = new Date();
        this.elements.timeEl.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }

    async getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by your browser');
            return;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const { latitude, longitude } = position.coords;
            this.fetchWeatherByCoords(latitude, longitude);
        } catch (error) {
            this.showError('Unable to get your location');
        }
    }

    async fetchWeatherByCoords(lat, lon) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
            );
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            const data = await response.json();
            this.updateWeatherData(data);
            this.fetchForecast(data.name);
        } catch (error) {
            this.showError('Error fetching weather data');
        }
    }

    async handleSearch() {
        const city = this.elements.inputEl.value.trim();
        if (!city) return;

        this.showLoading();
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
            );
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            const data = await response.json();

            if (data.cod === '404') {
                this.showError('City not found');
                return;
            }

            this.updateWeatherData(data);
            this.fetchForecast(city);
            localStorage.setItem('lastCity', city);
        } catch (error) {
            this.showError('Error fetching weather data');
        } finally {
            this.hideLoading();
            this.elements.inputEl.value = '';
        }
    }

    updateWeatherData(data) {
        this.elements.locationName.textContent = `${data.name}, ${data.sys.country}`;
        this.elements.weatherTemp.textContent = `${Math.round(data.main.temp)}°C`;
        this.elements.cloudText.textContent = data.weather[0].description;
        this.elements.feelsLike.textContent = `Feels like: ${Math.round(data.main.feels_like)}°C`;
        this.elements.humidity.textContent = `${data.main.humidity}%`;
        this.elements.windSpeed.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
        this.elements.pressure.textContent = `${data.main.pressure} hPa`;
        this.elements.weatherImg.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
        this.elements.weatherImg.alt = data.weather[0].description;
    }

    async fetchForecast(city) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
            );
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            const data = await response.json();

            if (!Array.isArray(data.list) || data.list.length === 0) {
                this.showError('No forecast data available');
                return;
            }

            this.updateForecast(data.list);
        } catch (error) {
            this.showError('Error fetching forecast data');
        }
    }

    updateForecast(forecastData) {
        const dailyForecasts = forecastData.filter(item =>
            item.dt_txt.includes('12:00:00')
        ).slice(0, 5);

        this.elements.forecastList.innerHTML = dailyForecasts.map(day => {
            const date = new Date(day.dt * 1000);
            const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
            return `
                <div class="forecast_item">
                    <div class="forecast_date">${weekday}</div>
                    <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}">
                    <div class="forecast_temp">${Math.round(day.main.temp)}°C</div>
                    <div class="forecast_desc">${day.weather[0].description}</div>
                </div>
            `;
        }).join('');
    }

    showLoading() {
        this.elements.loadingSpinner.classList.remove('hidden');
        this.elements.errorMessage.classList.add('hidden');
    }

    hideLoading() {
        this.elements.loadingSpinner.classList.add('hidden');
    }

    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.classList.remove('hidden');
        this.hideLoading();
    }

    loadLastCity() {
        const lastCity = localStorage.getItem('lastCity');
        if (lastCity) {
            this.elements.inputEl.value = lastCity;
            this.handleSearch();
        } else {
            this.getCurrentLocation();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});