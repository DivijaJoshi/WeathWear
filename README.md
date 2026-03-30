WeathWear (Weather Based AI Stylist)


So I woke up one morning, Getting ready to go to my office. My closet was full(no space literally)
Yet I always said I have nothing to wear. 

The weather was hot(12 pm in summer), Half my clothes didn't even go together.
Some felt comfy but didn't look good, some looked good but not suitable with the weather.

And I knew I would'nt put more than 5 minutes into thinking what I am gonna wear today, or else I would be late to office.

And at the end, I ended up wearing the same outfit again. 


This is when I thought, What if my wardrobe could decide it for me.
(Why it would help?)
1) I always forget what clothes I have
2) Too many clothes stacked on each other, and you never see them making out of your closet
3) Wearing same outfit often makes you get bored and wears your clothes early.
4) Depending on your (skin tone), the weather, ocassion and comfort, You could rock the day wearing what suits you.
5) Organises and Saves time that goes into thinking about what I actually own




So what you need to do? (as a user)

1) Upload clothes images
step 1) Take individual pictures of your clothes in good lighting( tops seperate, bottom seperate, dresses seperate etc)
step 2) Label your clothes based on comfort level(1-5)
step 3) Label your clothes with material type(woolen,cotton,silk etc) 


2) Skin tone analysis

Skin tone analysis:

User uploads his photo in good lighting with visible hair,face,neck
Gemini ai will analyse skintone and categorise user as Spring,summer,autmn,winter type and save in db

Spring: light skin Warm/golden undertone golden shades
Autumn: Medium to dark skin golden/olive undetone
Winter: Dark skin with cool undertone
Summer: Light skin pinkish undertone


generateOutfit inputs

user skintone
user color palette
List of available clothing items
ocassion office/party
style  casual/formal/sports/party etc

weather data (fetch from weather api)
preferred comfort








DB Schema:

User

_id
name
email
password
skintone (gemini saves it after analysis)eg, wheatish warm etc
colorPalette: (gemini saves it after analysis) (enum: spring, summer, autumn, winter)
user image



closet

_id
userId references user collection _id (which user's closet)
clothingName( user can name item so he remembers it later eg. white shirt)
clothingType (top,bottom,dress,sweater,jacket etc)
clothingMaterial (cotton,leather,denim,silk,woollen etc)
ClothingDescription (gemini sets it)
comfort (rate (1-5))


Outfits (stores generated outfits)

_id
userId references user collection _id
clothingId [array] references closet collection _id //generated image will have multiple clothing items so store their id's in db
ocassion
weather
ocassion (casual/formal etc)
comfortScore 
generatedImage
isFavourite (user can mark as favourite if user likes)
generatedImgUrl
cloudinaryPublicId





API's:

authRoutes

1)signup
2)login
3)refresh token

userRoutes

1) upload clothes to gemini, gemini analyses it and generates descriptive details about it and stores in db 
2) Analyse skin tone  /analyseSkinTone
3) get all clothes /getCloset
4) delete clothes /deleteClothes/:id
5) generate outfits /generateOutfits
6) set an outfit as favourite /favourite/:id
7) get favourites /getFavourites
8) Get all generated outfites /getAllOutfits
9) set an outfit as favourite /setFavourite


weatherRoute
1) get weather data  get weather location from user like cty in generate outfits, sep funct for weather route and call it in genrate route
