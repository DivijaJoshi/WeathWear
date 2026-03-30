

const axios = require('axios');
const https = require('https');


const GeminiOutfitGen = async (weatherData, closet, user, inputs) => {


    //extract weather details from weather api result
    const weather = {
        city: weatherData.location.name,
        country: weatherData.location.country,
        temp_c: weatherData.current.temp_c,
        feelslike_c: weatherData.current.feelslike_c,
        condition: weatherData.current.condition.text,
        humidity: weatherData.current.humidity,
        wind_kph: weatherData.current.wind_kph,
        uv: weatherData.current.uv
    };



    //create prompt for image generation

    //empty string to store closet items details
    let clothingList = '';

    // for each item in user's closet  get id,name,type,material,comfortScore,Description and add to prompt
    closet.forEach(item => {
        clothingList += `- ID: ${item._id} | Name: ${item.clothingName} | Type: ${item.clothingType} |
     Material: ${item.clothingMaterial} 
    | Comfort: ${item.comfort}/5 | Description: ${item.description}\n`;
    });


    //set complete prompt
    const prompt = [
        {
            text: `You are an expert fashion stylist. Select the best outfit from the user's wardrobe and generate a photorealistic full body image of the user wearing it with white background.

            USER DETAILS:
            - Gender: ${user.gender}
            - Skin Tone: ${user.skinTone}
            - Color Palette: ${user.colorPalette},

            WEATHER:
            - City: ${weather.city}, ${weather.country}
            - Temperature: ${weather.temp_c}°C (Feels like ${weather.feelslike_c}°C)
            - Condition: ${weather.condition}
            - Humidity: ${weather.humidity}%
            - Wind: ${weather.wind_kph} kph
            - UV Index: ${weather.uv}

            OCCASION & STYLE:
            - Occasion: ${inputs.ocassion}
            - Style: ${inputs.style}
            - Time of Day: ${inputs.timeOfDay}



            AVAILABLE CLOTHES:
            ${clothingList}



            Select the most suitable items based on weather, occasion, style and user skin tone and color palette.
            Generate a photorealistic full body image of the user wearing the selected outfit using 
            the provided photo. Match their exact face, body type and skin tone.




            First respond with this exact JSON:
            {
                "clothingIds": ["id1", "id2"],
                "occasion": "${inputs.ocassion}",
                "style": "${inputs.style}",
                "weather": "${weather.condition}, ${weather.temp_c}°C",
                "comfortScore": 4,
                "Reasoning": "why this outfit was selected"
            }


            Then generate the outfit image.`

        },
        {
            inlineData: {  //pass user image to gemini
                mimeType: user.ImageMimeType,
                data: user.userImage,
            },
        },
    ];

    const httpsAgent = new https.Agent({
        rejectUnauthorized: false
    });

    const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
            model: 'google/gemini-3.1-flash-image-preview',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt[0].text },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:${user.ImageMimeType};base64,${user.userImage}`
                            }
                        }
                    ]
                }
            ],
            modalities: ['image', 'text']
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            httpsAgent
        }
    );

    let outfitData;
    let imageData;

    console.log('OpenRouter Response:', JSON.stringify(response.data, null, 2));

    if (!response.data || !response.data.choices || response.data.choices.length === 0) {
        throw new Error(`Invalid response from OpenRouter: ${JSON.stringify(response.data)}`);
    }

    const message = response.data.choices[0].message;

    if (message.content) {
        const jsonMatch = message.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) outfitData = JSON.parse(jsonMatch[0]);
    }

    if (message.images && message.images.length > 0) {
        const imageUrl = message.images[0].image_url?.url || message.images[0].url;
        imageData = imageUrl.includes(',') ? imageUrl.split(',')[1] : imageUrl;
    }

    return {
        outfitData, imageData
    };

};

module.exports = GeminiOutfitGen;