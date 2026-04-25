import mongoose from "mongoose";
import { configDotenv } from "dotenv";
configDotenv();

const URL = process.env.MONGO_URI;

export async function connectDB(){
  try{

    await mongoose.connect(URL);
    console.log("MongoDB connected");
    
  }catch(err){
    console.log(err);
    
  }
} 
 