require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Supabase client initialization using environment variables
const supabaseUrl = process.env.SUPABASE_URL; 
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; 
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// PostgreSQL client initialization
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Use the DATABASE_URL from .env
});

app.post('/api/signup', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); 
    const { user, error } = await supabase.auth.signUp({
        email,
        password: hashedPassword, 
    });

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    try {
        const result = await pool.query(
            'INSERT INTO users (email, first_name, last_name, password) VALUES ($1, $2, $3, $4) RETURNING *',
            [email, firstName, lastName, hashedPassword] 
        );
        return res.status(200).json({ user, data: result.rows[0] });
    } catch (insertError) {
        return res.status(400).json({ error: insertError.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 