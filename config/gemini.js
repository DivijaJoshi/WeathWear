const {
    GoogleGenAI,
    createUserContent,
    createPartFromUri,
} = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


const geminiCall = async (content, isSkinAnalyser, isClothingAnalyser) => {


    const AnalyseOutfitPrompt = `You are a fashion expert and image analyst. Analyse this clothing item in extreme visual detail. 
    Respond in this exact JSON format:
    {
        "description": "Describe the following in extreme detail:
            - Exact garment type and cut (e.g. relaxed fit crew neck t-shirt, high waisted straight leg jeans)
            - Exact primary color with shade (e.g. not just 'blue' but 'washed medium blue' or 'navy blue')
            - All secondary colors, patterns, prints (e.g. thin white horizontal stripes, small black polka dots)
            - Fabric texture appearance (e.g. smooth matte cotton, ribbed knit, distressed denim, shiny satin)
            - Every design detail:
                * Collar/neckline type and shape
                * Sleeve type and length
                * Hem style (e.g. raw hem, ribbed cuff)
                * Closure type (e.g. 5 button fly, invisible zip, pullover)
                * Pockets (number, position, style)
                * Any embroidery, logos, graphics, text (exact position and color)
                * Stitching details (e.g. contrast orange stitching, double hem stitching)
                * Any distressing, fading, or washing effects
            - Fit and silhouette on the body
            - Approximate length (e.g. cropped above waist, hip length, ankle length)"
    }
    
    Be extremely precise with colors and details. Every detail matters for recreating this item visually. Do not include any text outside the JSON.`;



    const analyseSkinPrompt = `You are an expert color analyst and skin tone specialist. Analyse the person's skin tone, undertone and overall complexion in this image in extreme detail.
Respond in this exact JSON format:

If the image does not contain a clearly visible human face, skin, or is not a valid person photo, respond with:
{"skinTone": null, "colorPalette": null}

Otherwise respond with:
{
    "skinTone": "A single detailed paragraph covering: base complexion, undertone, overtone, complexion characteristics, hair color and how it complements skin, eye color and how it relates to skin tone, suiting colors with reasons, colors to avoid with reasons, best neutral base colors. Be extremely descriptive and precise.",
    "colorPalette": "one of: spring, summer, autumn, winter"
}

Analyse only what is clearly visible — skin, hair, eyes, neck and face. Do not include any text outside the JSON.`;



    // if skinAnalyser flag is true then set prompt to analyse skin else set prompt for analysing clothing
    const prompt = isSkinAnalyser ? analyseSkinPrompt : isClothingAnalyser ? AnalyseOutfitPrompt : null;

    if (!prompt) {
        throw new Error('No prompt found');
    }

    //returns json string
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: createUserContent([
            createPartFromUri(content.uri, content.mimeType),
            prompt,
        ]),
        config: {
            responseMimeType: 'application/json'

        }
    });

    //coverts json string to json object
    return JSON.parse(response.text);

};



module.exports = { geminiCall, ai };