# WeathWear (Weather Based AI Stylist)

## The Problem

So I woke up one morning, Getting ready to go to my office. My closet was full(no space literally)
Yet I always said I have nothing to wear. 

The weather was hot(12 pm in summer), Half my clothes didn't even go together.
Some felt comfy but didn't look good, some looked good but not suitable with the weather.

And I knew I would'nt put more than 5 minutes into thinking what I am gonna wear today, or else I would be late to office.

And at the end, I ended up wearing the same outfit again. 

## The Solution

This is when I thought, What if my wardrobe could decide it for me.

**(Why it would help?)**
1) I always forget what clothes I have
2) Too many clothes stacked on each other, and you never see them making out of your closet
3) Wearing same outfit often makes you get bored and wears your clothes early.
4) Depending on your (skin tone), the weather, ocassion and comfort, You could rock the day wearing what suits you.
5) Organises and Saves time that goes into thinking about what I actually own

---

## So what you need to do? (as a user)

### 1) Upload clothes images
- **step 1)** Take individual pictures of your clothes in good lighting( tops seperate, bottom seperate, dresses seperate etc)
- **step 2)** Label your clothes based on comfort level(1-5)
- **step 3)** Label your clothes with clothing name, clothing type(top,bottom,dress etc),materialType(woolen,cotton,silk etc)

### 2) Skin tone analysis

**Skin tone analysis:**

User uploads his photo in good lighting with visible hair,face,neck
Gemini ai will analyse skintone and categorise user as Spring,summer,autmn,winter type and save in db

- **Spring:** light skin Warm/golden undertone golden shades
- **Autumn:** Medium to dark skin golden/olive undetone
- **Winter:** Dark skin with cool undertone
- **Summer:** Light skin pinkish undertone

### 3) generateOutfit 

**//inputs**
- user skintone (fetched from db)
- user color palette (fetched from db)
- List of available clothing items (fetched from db)
- ocassion office/party (user input)
- style  casual/formal/sports/party etc amongst predefined values of array  (user input)
- timeofday (morning,evening,night)etc (user input)
- weather data (fetch from weather api)
- preferred comfort (user input)

**example:**
```json
user req.body : {
    "ocassion": "A movie night out at a theatre with girl-friends",
    "style": "date night",
    "city": "Bangalore",
    "comfortScore": 2,
    "timeOfDay": "evening"
}
```

---

## DB Schema:

### User

- _id
- name
- email
- password
- skintone (gemini saves it after analysis)eg, wheatish warm etc
- colorPalette: (gemini saves it after analysis) (enum: spring, summer, autumn, winter)
- user image

### closet

- _id
- userId references user collection _id (which user's closet)
- clothingName( user can name item so he remembers it later eg. white shirt)
- clothingType (top,bottom,dress,sweater,jacket etc)
- clothingMaterial (cotton,leather,denim,silk,woollen etc)
- ClothingDescription (gemini sets it)
- comfort (rate (1-5))
- imageURI (uploaded to cloudinary)
- cloudinaryPublicId (used to delete items later from cloudinary)

### Outfits (stores generated outfits)

- _id
- userId references user collection _id
- clothingId [array] references closet collection _id //generated image will have multiple clothing items so store their id's in db
- ocassion
- style
- weather
- ocassion (casual/formal etc)
- comfortScore 
- reasoning (why ai chose this outfit)
- isFavourite (user can mark as favourite if user likes)
- generatedImgUrl
- cloudinaryPublicId

---

## API's:

### authRoutes

1) signup
2) login
3) refresh token

### userRoutes

1) upload clothes to gemini, gemini analyses it and generates descriptive details about it and stores in db 
2) Analyse skin tone  /analyseSkinTone
3) get all clothes /getCloset
4) delete clothes /deleteClothes/:id
5) generate outfits /generateOutfits
6) set an outfit as favourite /favourite/:id
7) get favourites /getFavourites
8) Get all generated outfites /getAllOutfits
9) set an outfit as favourite /setFavourite
10) get user profile /getProfile

### weatherRoute
1) hit weather api data  (get weather location from user like city in generate outfits request)

---

## Thought Process:

### 1) AddClothes API

user uploads clothing image using multer in jpg/jpeg/png format
validate image extension
validate if clothing name already exists in db athrow error
user gives input with:
- -> 'clothingName', (so user can identify his owned outfits)
- -> 'clothingType', (categorise as top,bottom,dress etc)
- -> 'clothingMaterial', (fabric of cloth, used for generating weather based outfit suggesion using gemini)
- -> 'comfort'  (user marks comfort level between 1 to 5)

upload files to gemini
upload clothing image to cloudinary for persistant storage
create new document of clothing details
call Producer to publish image to queue
imageAnalyserWorker listens to queue and calls gemini
gemini returns detailed text description of clothing
worker extracts json data and updates db with clothing description

### 2) Skin analysis API

user uploads his image using multer in jpg/jpeg/png format
check if skin analysis already done or not(ie value not equal to null)
upload files to gemini
convert image file to base 64 to store in db, later used for outfit generation
call producer and send message to queue

**Things i kept in mind for this api:**
- ->Prevent double analysis, as user skintone,features remains same.

### 3) Generate outfit API

take user input 

**example**
```json
{
    "ocassion": "A movie night out at a theatre with girl-friends",
    "style": "date night",
    "city": "Bangalore",
    "comfortScore": 2,
    "timeOfDay": "evening"
}
```

- -> on city, hit weather api using axios and get forecast weather for 3 days
- -> get user profile stored in db (fetch skintone,colorPallette,userImage)
- -> filter closet for items >= comfortScore

- ->save all this in cache using node-cache module with key as roomID
- -> generate unique room id and return as response


- -> user joins the room with roomId ie emits joinRoom event
- -> socket.io listens to this event and calls Producer with cached data
- -> cached data lives for 5 min and survives server restart
- -> producer publishes message to queue
- -> GenerateOutfitWorker listens to queue and calls GeminiAPI
- -> created image is in base64 format, store it to disk as png and then upload to cloudinary to store permanently

**//things kept in mind for this api**

- -> if user skin analysis not done, throw error ask user to hit skinAnalysis api first
- -> if closet empty throw error, ask user to add more clothing to closet

---

## Challenges I Faced:

### 1) MongoDB Document size limitation

As a Weather based AI Styler app, it was important to store closet items .
Mongodb has document size of 16 mb and storing multiple images would have exceeded it. 
- -> one option was storing image as base65 but that increases the original size of image as well

**So to fix it,**
I stored Clothing images to cloudinary and saved their url and public id to db.

### 2) Storing user image to cloudinary and Gemini Input format for image

Instead of uploading user image to cloudinary i chose saving it as base64 image, as per user only one image is stored so document lies within 16 mb limit

and gemini takes image either as inline base64 data or files api upload,
since generateOutfit would require image to be passed later to gemini, Files api link would expire.
so stored as base64 and passed as inline data.

### 3) Another challenge was caching data

i used npm node-cache module for caching the inputs and data required to call gemini for generateOutfit api.
instead of storing it as an object in memory,
so server restart would save it with ttl of 5 minutes.

And if data already processed by gemini, then delete cache data automatically, so frees memory as well.
using myCache.del(roomId);
- ->prevents refetching weather data as well

### 4) Worker Manger scales up worker if too many messages in a particular queue.

```javascript
//assume 1 worker can handle 2 tasks without very long wait times
            if ((messageCount > defaultWorkers[queueName] * 2) && (defaultWorkers[queueName] < maxWorkers))
            //keep worker count under a threshold value
```

### 5) if user deleted a clothing from db, the cloudinary uploads of the clothing item as well as all generated outfits linked to that clothing should also be deleted 

so deleting uploaded image using publicID

```javascript
    await cloudinary.uploader.destroy(outfit.cloudinaryPublicId);
```












