import express from 'express';
import cors from "cors";
import mongoose from "mongoose";

import UserRoutes from './Users/routes.js';

const CONNECTION_STRING = process.env.MONGO_CONNECTION_STRING || "mongodb://127.0.0.1:27017/kambaz"
mongoose.connect(CONNECTION_STRING);

const app = express();
app.use(cors());  

UserRoutes(app);
app.listen(process.env.PORT || 4000);