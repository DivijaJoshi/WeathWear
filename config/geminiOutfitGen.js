

const axios = require('axios');
const { ai } = require('../config/gemini');


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


    //set base prompt 
    const basePrompt = `You are an expert fashion stylist. Select the best outfit from the user's wardrobe and generate a photorealistic full body image of the user wearing it with white background.

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
            - Occasion: ${inputs.occasion}
            - Style: ${inputs.style}
            - Time of Day: ${inputs.timeOfDay}



            AVAILABLE CLOTHES:
            ${clothingList} `;


    //create test prompt for when mode==='test
    const testPrompt = `${basePrompt}

        Select the most suitable items based on weather, occasion, style and user skin tone and color palette.
        
        Respond with this exact JSON format:
        {
            "clothingIds": ["id1", "id2"],
            "occasion": "${inputs.occasion}",
            "style": "${inputs.style}",
            "weather": "${weather.condition}, ${weather.temp_c}°C",
            "comfortScore": 4,
            "Reasoning": "why this outfit was selected",
            "imagePrompt": "A photorealistic full body image of a ${user.gender} with ${user.skinTone} skin tone wearing [describe the selected outfit in detail] against a white background"
        }`;


    //Main prompt for image generation 
    const imagePrompt = `${basePrompt}
        
        Select the most suitable items based on weather, occasion, style and user skin tone and color palette. 
        Generate a photorealistic full body image of the user wearing the selected outfit using the provided photo. Match their exact face, body type and skin tone.
        
        First respond with this exact JSON:
        {
            "clothingIds": ["id1", "id2"],
            "occasion": "${inputs.occasion}",
            "style": "${inputs.style}",
            "weather": "${weather.condition}, ${weather.temp_c}°C",
            "comfortScore": 4,
            "Reasoning": "why this outfit was selected"
        }
        
        Then generate the outfit image.`;

    let outfitData;
    let imageData;


    // if mode is test
    if (inputs.mode === 'test') {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    inlineData: {
                        mimeType: user.ImageMimeType,
                        data: user.userImage,
                    },
                },
                { text: testPrompt }
            ],
            config: {
                responseMimeType: 'application/json'
            }
        });

        outfitData = JSON.parse(response.text);
        return {
            outfitData,
            imageData: outfitData.imagePrompt
        };

    }






    const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
            model: 'google/gemini-3.1-flash-image-preview',
            messages: [
                {
                    role: 'user', //user input
                    content: [
                        { type: 'text', text: imagePrompt },
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
            }
        }
    );



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