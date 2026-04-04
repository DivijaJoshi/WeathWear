require('dotenv').config();

const express=require('express');
const app=express();
const authRoutes=require('../routes/authRoutes');
const userRoutes=require('../routes/userRoutes');
const errorHandler=require('../middlewares/errorHandler')
const cookieParser = require('cookie-parser');


app.use(express.json())
app.use(cookieParser())
app.use('/api/auth',authRoutes)
app.use('/api/user',userRoutes)
app.use(errorHandler)

module.exports=app;

