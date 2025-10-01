// 1. Load environment variables from .env file
require('dotenv').config(); 

const express = require('express');
const { Pool } = require('pg'); 
const cors = require('cors');
// Import the serverless-http library for Vercel deployment
const serverless = require('serverless-http');

const app = express();
// Vercel handles the port, so this port variable is only used if running locally
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // To parse JSON bodies
// IMPORTANT: Configure CORS to allow requests from the deployed Vercel frontend
app.use(cors({
  // Allow the deployed frontend to access the backend API
  origin: ['https://student-app-dun.vercel.app', 'http://localhost:4200'],
}));

//
// 2. PostgreSQL Connection Pool Setup
// 
const isVercel = process.env.NODE_ENV === 'production';

const poolConfig = {
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT,
};

// Vercel deployment requires SSL configuration for most external databases
if (isVercel) {
  console.log("Running in Vercel environment: Applying SSL config.");
  poolConfig.ssl = {
    // This is necessary to avoid "The server does not support SSL" errors
    rejectUnauthorized: false
  };
  // If DATABASE_URL is available (common in hosting services), use it
  if (process.env.DATABASE_URL) {
    poolConfig.connectionString = process.env.DATABASE_URL;
  }
}

const pool = new Pool(poolConfig);

// Test the database connection
pool.connect()
 .then(() => console.log('Successfully connected to PostgreSQL!'))
 .catch(err => console.error('Database connection error:', err.message));


// 3. API Route to Handle Registration (POST /api/student)
app.post('/api/student', async (req, res) => {
  // Data sent from the Angular form (reg-form.component.ts)
  // Keys are expected to be: firstName, lastName, email, course
  const { firstName, lastName, email, course } = req.body; 

  // SQL query to insert data into the 'students' table
  // Rewritten to ensure no hidden characters cause syntax errors
  const queryText = `
INSERT INTO students(first_name, last_name, email, course) 
VALUES($1, $2, $3, $4) 
RETURNING *;
`;
  const values = [firstName, lastName, email, course];

  try {
    const result = await pool.query(queryText, values);
    console.log('New student registered:', result.rows[0]);
    // Send a success response back to Angular
    res.status(201).json({ 
      message: 'Student registered successfully', 
      student: result.rows[0] 
    });
  } catch (err) {
    console.error('Database insertion error:', err.stack);
    // Send an error response back to Angular
    res.status(500).json({ 
      message: 'Error registering student', 
      error: err.message 
    });
  }
});

// A. API Route to Fetch All Students (GET /api/student)
app.get('/api/student', async (req, res) => {
  try {
    // SQL query to select all columns for all students
    const queryText = `SELECT * FROM students ORDER BY id ASC;`;
    
    const result = await pool.query(queryText);
    
    // Send the array of students back to Angular
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Database retrieval error:', err.stack);
    res.status(500).json({ 
      message: 'Error fetching students', 
      error: err.message 
    });
  }
});
// Optional: Simple root route for Vercel health check
// app.get('/', (req, res) => {
//   res.status(200).send('Student App API is running.');
// });
// B. API Route to Update a Student (PUT /api/student/:id)
app.put('/api/student/:id', async (req, res) => {
    // Get the student ID from the URL parameters (comes in as a string)
    const id = parseInt(req.params.id, 10);
    
    // Check for invalid ID before proceeding
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid student ID provided.' });
    }
    
    // Data sent from the Angular form for updating (using front-end's camelCase names)
    const { firstName, lastName, email, course } = req.body; 

    // SQL query to update the specified student
    const queryText = 'UPDATE students SET first_name = $2, last_name = $3, email = $4, course = $5 WHERE id = $1 RETURNING *;';
    
    // Reorder values array to place 'id' first, corresponding to $1
    const values = [id, firstName, lastName, email, course]; 

    // --- CRITICAL DEBUGGING CHECK ---
    console.log('--- Attempting PUT Update ---');
    console.log('Query:', queryText);
    console.log('Values:', values);
    console.log('-----------------------------');

    try {
        const result = await pool.query(queryText, values);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        console.log('Student updated:', result.rows[0]);
        res.status(200).json({ 
            message: 'Student updated successfully', 
            student: result.rows[0] 
        });
    } catch (err) {
        console.error('Database update error:', err.stack);
        // Send a 500 status code back to the client
        res.status(500).json({ 
            message: 'Error updating student', 
            error: err.message 
        });
    }
});
// C. API Route to Delete a Student (DELETE /api/student/:id)
app.delete('/api/student/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10); 
    
    if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid student ID provided for deletion.' });
    }

  try {
    // Correct SQL command to delete the row where the ID matches
    const result = await pool.query('DELETE FROM students WHERE id = $1', [id]);
    
    // Check if a row was actually deleted
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    
    // Success: return 204 No Content
    res.status(204).send(); 
    
  } catch (error) {
    console.error("Database deletion error:", error); 
    // Send a 500 error back to the client
    res.status(500).json({ error: 'Failed to delete student due to a server error.' });
  }
});
// 4. Serverless Export (MANDATORY FOR VERCL)
// For local testing, we still listen to the port
if (!isVercel) {
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}

// Export the Express app wrapped by serverless-http to be used as a Vercel serverless function
module.exports = serverless(app);
