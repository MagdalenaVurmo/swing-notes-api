        
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import { setupSwagger } from './swagger.js';
dotenv.config({ override: true, quiet: true });

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());


app.use('/api/user', userRoutes);
app.use('/api/notes', noteRoutes);


app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});


app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
    console.log(`Swagger UI körs på http://localhost:${PORT}/api-docs/`)
});

setupSwagger(app);