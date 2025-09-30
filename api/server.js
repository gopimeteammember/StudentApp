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

// Optional: Simple root route for Vercel health check
app.get('/', (req, res) => {
    res.status(200).send('Student App API is running.');
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


//-------------------------------------------------------
// // 1. Load environment variables from .env file
// require('dotenv').config(); 

// const express = require('express');
// const { Pool } = require('pg'); // PostgreSQL client
// const cors = require('cors');
// // const serverless = require('serverless-http');

// const app = express();
// const port = process.env.port || 3000;

// // Middleware
// app.use(express.json()); // To parse JSON bodies from Angular
// // Configure CORS to allow requests from your Angular application's origin
// app.use(cors({
//     origin: ['http://localhost:4200', 'https://student-app-dun.vercel.app'],
//     // methods: ['GET', 'POST'],
//     // credentials: true // <-- Adjust if your Angular app runs on a different port/host
// }));

// //
// //  
// // 2. PostgreSQL Connection Pool Setup
// const pool = new Pool({
//     user: process.env.PGUSER,
//     host: process.env.PGHOST,
//     database: process.env.PGDATABASE,
//     password: process.env.PGPASSWORD,
//     port: process.env.PGPORT,
//     // connectionString: process.env.DATABASE_URL,
//     // ssl: {
//     //     rejectUnauthorized: false
//     // } 
// });

// // Test the database connection
// pool.connect()
//   .then(() => console.log('Successfully connected to PostgreSQL!'))
//   .catch(err => console.error('Database connection error:', err));


// // 3. API Route to Handle Registration (POST /api/students)
// app.post('/api/student', async (req, res) => {
//     // Data sent from the Angular form (reg-form.component.ts)
//     const { firstName, lastName, email, course } = req.body; 

//     // SQL query to insert data into the 'students' table
//     const queryText = `
//         INSERT INTO students(first_name, last_name, email, course) 
//         VALUES($1, $2, $3, $4) 
//         RETURNING *;
//     `;
//     const values = [firstName, lastName, email, course];

//     try {
//         const result = await pool.query(queryText, values);
//         console.log('New student registered:', result.rows[0]);
//         // Send a success response back to Angular
//         res.status(201).json({ 
//             message: 'Student registered successfully', 
//             student: result.rows[0] 
//         });
//     } catch (err) {
//         console.error('Database insertion error:', err.stack);
//         // Send an error response back to Angular
//         res.status(500).json({ 
//             message: 'Error registering student', 
//             error: err.message 
//         });
//     }
// });

// // Start the server
// app.listen(port, () => {
//     console.log(`Server listening at http://localhost:${port}`);
// });
//-----------------------------------------