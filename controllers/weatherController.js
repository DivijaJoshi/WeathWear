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
        const { data } = await axios.request(options);
        return data;
    } catch (error) {
        const err = new Error('Failed to fetch weather data for the given city'); 
        err.code = 502;
        throw err;
    }
};

module.exports = GetWeather;