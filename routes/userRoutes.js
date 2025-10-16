import dotenv from 'dotenv';
dotenv.config({ override: true, quiet: true }); 
// Laddar miljövariabler från .env-filen, med override och quiet för att undvika fel om filen inte finns

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userDb from '../models/UserModel.js';


const PORT = process.env.PORT || 3000; // Porten som servern kommer att lyssna på, standard är 3000.


const router = express.Router(); // Skapar en router för att hantera användarrelaterade endpoints.

const JWT_SECRET = process.env.JWT_SECRET; 
// Hämtar JWT_SECRET från miljövariablerna, som används för att signera och verifiera JSON Web Tokens (JWT).

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

router.post('/signup', async (req, res) => { // Endpoint för att skapa ett nytt konto.

    const { username, password } = req.body; // Hämtar användarnamn och lösenord från request body.
    console.log('Inloggningsförsök:', username, password); // Loggar inloggningsförsöket för felsökning.

    if (!username || !password || password.length < 5) { // Validerar inloggningsuppgifterna.
        return res.status(400).json({ error: 'Ogiltiga inloggningsuppgifter' }); 
        // Returnerar ett felmeddelande om uppgifterna inte stämmer eller är ogiltiga.
    }


    const existingUser = await userDb.findOne({ username }); // Kollar om användarnamnet redan finns i databasen.
    if (existingUser) { // Om användarnamnet redan finns, returnerar vi ett meddelande där det står Användarnamnet finns redan.
        return res.status(400).json({ error: 'Användarnamn finns redan' });
    }


    const hashedPassword = await bcrypt.hash(password, 10); 
    // Hashar lösenordet med bcrypt för att lagra det säkert i databasen.


    const newUser = await userDb.insert({ username, password: hashedPassword }); 
    // Skapar en ny användare i databasen med det hashade lösenord.


    res.status(200).json({ message: 'Konto skapat' }); 
    // Returnerar ett meddelande om att kontot har skapats och att det gick bra.
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
    // Skapar en POST-rutt på /login.
    // När någon skickar en inloggningsbegäran hit, körs funktionen.
   // async betyder att funktionen använder asynkrona operationer (t.ex. await).

    const { username, password } = req.body; // Hämtar username och password från det som klienten skickat i request body


    const user = await userDb.findOne({ username }); // Söker i databasen efter en användare med det angivna användarnamnet.
    console.log('Hittad användare:', user); // Loggar den hittade användaren för felsökning.

    if (!user) return res.status(400).json({ error: 'Fel användarnamn eller lösenord' }); 
    // Om ingen användare hittas, returneras ett felmeddelande.


    const valid = await bcrypt.compare(password, user.password); // Jämför det angivna lösenordet med det hashade lösenordet i databasen.
    // bcrypt.compare returnerar true om lösenorden matchar, annars false.
    console.log('Lösenord matchar?', valid);

    if (!valid) return res.status(400).json({ error: 'Fel användarnamn eller lösenord' }); // Om lösenorden inte matchar, returneras ett felmeddelande.


    const token = jwt.sign( // Skapar en JWT-token som innehåller användarens ID och användarnamn.
        // jwt.sign används för att signera en token med JWT_SECRET.
        { id: user._id, username: user.username }, // Innehåller användarens ID och användarnamn i token payload.
        // Payload är den information som vi vill inkludera i token.
        JWT_SECRET, // Använder JWT_SECRET för att signera token.
        // JWT_SECRET är en hemlig nyckel som används för att signera och verifiera JWT:er.
        // Den bör hållas hemlig och inte delas offentligt.
        { expiresIn: '1h' } // Token kommer att vara giltig i 1 timme.
    );


    res.status(200).json({ token }); // Returnerar den genererade JWT-token till klienten.
    // Token kan sedan användas för att autentisera framtida förfrågningar till skyddade rutter.
    // Klienten kan spara token i localStorage eller sessionStorage för att använda den vid framtida förfrågningar.
    // Det är viktigt att skydda token och inte exponera den offentligt, eftersom den ger åtkomst till användarens resurser.
});


export default router;