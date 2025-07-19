

import dotenv from 'dotenv';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userDb from '../models/userModel.js';





dotenv.config({ override: true, quiet: true });
const router = express.Router();




/**
 * @swagger
 * /api/user/signup:
 *   post:
 *     summary: Skapa ett nytt konto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Konto skapat
 *       400:
 *         description: Ogiltiga inloggningsuppgifter
 */


router.post('/signup', async (req, res) => {

    const { username, password } = req.body;
    console.log('Inloggningsförsök:', username, password);

    if (!username || !password || password.length < 5) {
        return res.status(400).json({ error: 'Ogiltiga inloggningsuppgifter' });
    }


    const existingUser = await userDb.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ error: 'Användarnamn finns redan' });
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const newUser = await userDb.insert({ username, password: hashedPassword });


    res.status(200).json({ message: 'Konto skapat' });
});



/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Logga in en användare och få en JWT-token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inloggning lyckades, JWT-token returneras
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Fel användarnamn eller lösenord
 */


router.post('/login', async (req, res) => {

    const { username, password } = req.body;


    const user = await userDb.findOne({ username });
    console.log('Hittad användare:', user);

    if (!user) return res.status(400).json({ error: 'Fel användarnamn eller lösenord' });


    const valid = await bcrypt.compare(password, user.password);
    console.log('Lösenord matchar?', valid);

    if (!valid) return res.status(400).json({ error: 'Fel användarnamn eller lösenord' });


    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );


    res.status(200).json({ token });
});


export default router;