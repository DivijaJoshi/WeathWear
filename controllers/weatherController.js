const axios = require('axios').default;

//weather api to get data based on city 
const GetWeather = async (city) => {
    const options = {
        method: 'GET',
        url: 'https://api.weatherapi.com/v1/forecast.json',
        params: {
            q: city,
            days: '3',
            aqi: 'yes',
            key: process.env.WEATHER_API_KEY
        },
        headers: { Accept: 'application/json,application/xml' }
    };

    try {
        console.log('Weather API Key:', process.env.WEATHER_API_KEY ? '✅' : '❌ missing');
        const { data } = await axios.request(options);
        console.log('WeatherData received:', data?.location?.name);
    return data;
    } catch (error) {
        console.error(error);
    }
};

module.exports = GetWeather;