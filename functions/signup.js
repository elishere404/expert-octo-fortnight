const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config(); // Load environment variables from .env file

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL; 
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; 
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// PostgreSQL client initialization
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Export the function
module.exports = async (req, res) => {
    if (req.method === 'POST') {
        const { firstName, lastName, email, password } = req.body;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Sign up the user with Supabase
        const { user, error } = await supabase.auth.signUp({
            email,
            password: hashedPassword,
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Insert additional user information into the users table in PostgreSQL
        try {
            const result = await pool.query(
                'INSERT INTO users (email, first_name, last_name, password) VALUES ($1, $2, $3, $4) RETURNING *',
                [email, firstName, lastName, hashedPassword]
            );
            return res.status(200).json({ user, data: result.rows[0] });
        } catch (insertError) {
            return res.status(400).json({ error: insertError.message });
        }
    } else {
        // Handle any other HTTP method
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}; 