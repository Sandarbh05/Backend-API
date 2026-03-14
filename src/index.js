// require('dotenv').config({path: './env'})

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config();


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at port: ${process.env.PORT}`);
        
    })
})
.catch((err)=>{
    console.log("MONGODB Connection failed: ", err);
    
})


// req.params--> take data directly from the url
// req.body--> take data from the body of the document for types like json, forms, cookies etc
// app.use() method is used for middlewares mostly
// for accepting body json we can use body-parser but it is not essential new express version, even though we still use multer for file uploads middleware
//express.urlencoded for taking info from the url but its in encoded format like + and %20 
//express.static helps the files static, locally at the system before sending or using it


// // iffy method: 
// import express from "express";

// dotenv.config();
// const app=express();

// ( async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

//         app.on("error", (error)=>{
//             console.log("ERROR: ", error);
//             throw error
//         })

//         app.listen(process.env.PORT, ()=>{
//             console.log(`App is listening on port ${process.env.PORT}`)
//         })

//     } catch (error) {
//         console.error("ERROR: ", error)
//         throw error
//     }
// })()

