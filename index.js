import path from "path";
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import express from 'express';
import mongoose from "mongoose";
import multer from "multer";
import { authValidation, loginValidation, postCreateValidation } from "./validatios.js";

import { UserController, PostController } from './controllers/index.js';
import { handleValidationErrors, checkAuth } from "./utils/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const port = process.env.PORT || 4444

mongoose.connect(process.env.DB_URL)
    .then(() => console.log('DB connected'))
    .catch((err) => console.log(`DB error: ${err}`));

const app = express();

const uploadsDir = path.join(__dirname, 'uploads');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        cb(null, file.mimetype.match(/^image\//))
    },
    limits: {
        fileSize: 5 * 1024 * 1024,
    }
});

app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
    res.send('OK');
})

app.post('/login', loginValidation, handleValidationErrors, UserController.login);
app.post('/signup', authValidation, handleValidationErrors, UserController.signup);
app.get('/me', checkAuth, UserController.getMe);

app.get('/posts', PostController.getAll);
app.get('/posts/:id', PostController.getOne);
app.post('/posts', checkAuth, postCreateValidation, handleValidationErrors, PostController.create);
app.delete('/posts/:id', checkAuth, PostController.remove);
app.patch('/posts/:id', checkAuth, postCreateValidation, handleValidationErrors, PostController.update);



app.post('/upload', checkAuth, upload.single('image'), async (req, res) => {
    if(!req.file) {
        return res.status(404).json({
            message: "File must be image."
        })
    }
    res.json({
        url: `/uploads/${req.file.originalname}`,
    })
});

app.listen(port, (err) => {
    if(err) {
        return console.log(err)
    }
    console.log(`Server OK on: ${port}`);
})