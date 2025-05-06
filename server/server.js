const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swaggerConfig');
const db = require('./database');

const SECRET_KEY = 'BANANA_STAND';

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

db.databaseInit(); // Initialize database
// Middleware: Authenticate JWT Token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);

        // Log before calling next() to ensure user is populated
        req.user = user;
        console.log(`Authenticated user: ${req.user.username}, Role: ${req.user.user_role}`);

        next();
    });
};

/**
 *  POST REQUESTS ========================================================================
 */

// Register a new user
/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username of the new user
 *               email:
 *                 type: string
 *                 description: The email of the new user
 *               password:
 *                 type: string
 *                 description: The password for the new user
 *               first_name:
 *                 type: string
 *                 description: The first name of the new user
 *               last_name:
 *                 type: string
 *                 description: The last name of the new user
 *               user_role:
 *                 type: string
 *                 description: The role of the user (default is 'player')
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request, missing required fields
 *       500:
 *         description: Error inserting data into database
 */

app.post('/register', async (req, res) => {
    console.log("Received registration request:", req.body); // Log incoming request data
    
    const { first_name, last_name, username, email, password, user_role } = req.body;

    if (!first_name || !last_name || !username || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    db.database_commands.insertUser(
      { first_name, last_name, username, email, password: hashedPassword, user_role },
      (err, result) => {
          if (err) {
              console.error("Error inserting user:", err);
              return res.status(500).json({ error: "Error inserting user into database" });
          }
          console.log("User registered successfully:", result);  // Log the result of the insertion
          res.status(201).json({ message: "User registered successfully!" });
      }
    );
});

// Guest login route
app.post('/guest-login', async (req, res) => {
    console.log('Guest login request received');

    // Generate a random username and email for guest (you can modify this as needed)
    const guestUsername = `GuestUser_${Date.now()}`;
    const guestEmail = `${guestUsername}@example.com`;

    const guestUser = {
        first_name: 'Admin',
        last_name: 'User',
        username: guestUsername,
        email: 'g@g',
        password: 'admin', // You can use a default password for guest users
    };

    // Hash the password for the guest user (similar to regular user registration)
    const hashedPassword = await bcrypt.hash(guestUser.password, 10);

    db.database_commands.insertUser(
        { 
            first_name: guestUser.first_name,
            last_name: guestUser.last_name,
            username: guestUser.username,
            email: guestUser.email,
            password: hashedPassword,
        },
        (err, result) => {
            if (err) {
                console.error("Error inserting guest user:", err);
                return res.status(500).json({ error: "Error inserting guest user into database" });
            }

            // Create a JWT token for the guest user
            const token = jwt.sign({ id: result.insertId, username: guestUser.username, user_role: guestUser.user_role }, 'your_jwt_secret', { expiresIn: '1h' });

            console.log("Guest user registered successfully:", result);
            res.status(200).json({ 
                message: 'Guest user registered successfully!',
                token, // Send token along with the response
                user: {
                    id: result.insertId,
                    username: guestUser.username,
                    user_role: guestUser.user_role,
                }
            });
        }
    );
});


/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login a user and get a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email of the user
 *               password:
 *                 type: string
 *                 description: The password of the user
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: The JWT token for authentication
 *       400:
 *         description: Invalid email or password
 *       500:
 *         description: Error during login process
 */

// Login user
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    db.database_commands.getUserByEmail(email, async (err, user) => {
        if (err || !user) return res.status(400).send('Invalid email or password');
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return res.status(400).send('Invalid email or password');

        const token = jwt.sign(
            { id: user.id, first_name: user.first_name, username: user.username, user_role: user.user_role }, 
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.json({ token });
    });
});

/**
 * @swagger
 * /game-round:
 *   post:
 *     summary: Record a new game round
 *     tags: [Game]
 *     description: Records the user's selected group and action for a game round and calculates happiness scores.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - round_number
 *               - action
 *               - circle_selected
 *             properties:
 *               round_number:
 *                 type: integer
 *                 description: The round number for the game.
 *               action:
 *                 type: string
 *                 description: The action performed by the user. (compliment, offer help, invite to event)
 *               circle_selected:
 *                 type: integer
 *                 description: The circle selected by the user (1, 2, or 3)
 *     responses:
 *       201:
 *         description: Game round recorded successfully
 *       500:
 *         description: Error saving game round
 */

// Start a game round (assumes user has already selected a group and action)
app.post('/game-round', authenticateToken, (req, res) => {
    const { round_number, action, circle_selected } = req.body;
    // Fetch characters based on the circle selected (could be hardcoded or randomized)
    const selectedCircle = getCircle(circle_selected); // This should return 3 characters
    const happinessScores = calculateHappiness(selectedCircle, action); // Function that calculates each character's happiness based on the action

    // Calculate total happiness for the circle
    const totalHappiness = happinessScores.reduce((total, score) => total + score, 0);

    // Save round result
    db.database_commands.insertGameRound({
        user_id: req.user.id,
        round_number,
        action,
        circle_selected,
        happiness_score: totalHappiness,
    }, (err, result) => {
        if (err) return res.status(500).send('Error saving game round');
        res.status(201).json({ message: 'Game round recorded!', happinessScores });
    });
});

// Helper function to calculate happiness based on action
function calculateHappiness(circle, action) {
    return circle.map((character) => {
        let happinessChange = 0;
        if (action === 'compliment' && character.likes === 'compliment') {
            happinessChange = 2;
        } else if (action === 'offer help' && character.likes === 'offer help') {
            happinessChange = 2;
        } else if (action === 'invite to event' && character.likes === 'invite to event') {
            happinessChange = 2;
        }

        // Subtract for dislikes
        if (character.dislikes === action) {
            happinessChange -= 1;
        }
        return happinessChange;
    });
}

/**
 * @swagger
 * /review:
 *   post:
 *     summary: Submit a review for the game
 *     tags: [Reviews]
 *     description: Allows a user to submit a review and rating for the game.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 format: float
 *                 description: The rating provided by the user (1 to 5).
 *               comment:
 *                 type: string
 *                 description: The feedback comment provided by the user.
 *     responses:
 *       201:
 *         description: Review submitted successfully
 *       400:
 *         description: Bad request, missing required fields
 *       500:
 *         description: Error submitting the review
 */
// Review submission endpoint
app.post('/review', authenticateToken, (req, res) => {
    const { rating, comment } = req.body;
  
    if (!rating || !comment) {
      return res.status(400).send('Rating and comment are required');
    }

    db.database_commands.insertReview({
      user_id: req.user.id,
      rating,
      comment
    }, (err, result) => {
      if (err) return res.status(500).send('Error submitting review');
      res.status(201).json({ message: 'Review submitted successfully!' });
    });
  });
  
  // POST request to save player score to game_round table
app.post('/save-score', authenticateToken, (req, res) => {
  //const { roundNumber, action, circleSelected, happinessScore } = req.body;
  const userId = req.user.id;
  const roundNumber = req.body.round_number;
  const action = req.body.action;
  const circleSelected = req.body.circle_selected;
  const happinessScore = req.body.happiness_score;
  // Log the received data and userId to ensure it's correct
  console.log("Received score data:", req.body);
  console.log("Authenticated user ID:", userId);
  
  if (!userId || !roundNumber || !action || !circleSelected || !happinessScore) {
    console.log('Missing required fields. UserId:', userId, 'Round:', roundNumber, 'Action:', action, 'Circle:', circleSelected, 'Happiness:', happinessScore);
    return res.status(400).json({ error: 'Missing required fields check server.js' });
    
  }

  const scoreData = {
    user_id: userId,
    round_number: parseInt(roundNumber,10),
    action: action,
    circle_selected: parseInt(circleSelected, 10),
    happiness_score: parseInt(happinessScore,10)
  };

  db.database_commands.insertScore(scoreData, (err, result) => {
    if (err) {
      console.error("Error saving score:", err);
      return res.status(500).json({ error: 'Failed to save score' });
    }
    res.status(201).json({ message: 'Score saved successfully!' });
  });
});

  

  

/**
 *  GET REQUESTS ========================================================================
 */
/**
 * @swagger
 * /characters:
 *   get:
 *     summary: Get a list of all characters
 *     tags: [Characters]
 *     responses:
 *       200:
 *         description: A list of all characters in the game
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   likes:
 *                     type: string
 *                   dislikes:
 *                     type: string
 *       500:
 *         description: Error fetching characters from the database
 */

app.get('/characters', (req, res) => {
    db.database_commands.getAllCharacters((err, characters) => {
        if (err) return res.status(500).send('Error fetching characters');
        res.json(characters);
    });
});
// Get a user's game history
/**
 * @swagger
 * /game-history/{user_id}:
 *   get:
 *     summary: Get the game history of a specific user
 *     tags: [Game History]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of game history for the user
 *       500:
 *         description: Error fetching game history
 */
// Get a user's game history
app.get('/game-history/:user_id', authenticateToken, (req, res) => {
    const user_id = req.params.user_id;
    db.database_commands.getGameHistory(user_id, (err, history) => {
        if (err) return res.status(500).send('Error fetching game history');
        res.json(history);
    });
});
// Get all reviews
/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Get a list of all reviews
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: List of reviews
 *       500:
 *         description: Error fetching reviews
 */
// Get all reviews
app.get('/reviews', (req, res) => {
    db.database_commands.getAllReviews((err, reviews) => {
        if (err) return res.status(500).send('Error fetching reviews');
        res.json(reviews);
    });
});
/**
 * @swagger
 * /profile/me:
 *   get:
 *     summary: Get current user details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []  # Requires JWT token
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *       401:
 *         description: Unauthorized
 */
// Get current user profile
app.get('/profile/me', authenticateToken, (req, res) => {
    const userId = req.user.id;
    db.database_commands.getUserByID(userId, (err, user) => {
        if (err) {
            console.error('Error fetching user profile:', err);
            return res.status(500).send('Error fetching user profile');
        }
        db.database_commands.getGameHistory(user.id, (err, history) => {
            if (err) return res.status(500).send('Error fetching game history');
            res.json({
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                username: user.username,
                email: user.email,
                user_role: user.user_role,
                best_score: user.best_score,
                history:history
            });
        });
        
    });
});

/**
 * @swagger
 * /profile/me/inactive:
 *   patch:
 *     summary: Mark current user as inactive
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []  # Requires JWT token
 *     responses:
 *       200:
 *         description: User marked as inactive successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// Make current user inactive
app.patch('/profile/me/inactive', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const query = 'UPDATE `user` SET `active` = FALSE WHERE `id` = ?';
    db.pool.query(query, [userId], (err, result) => {
        if (err) {
            console.error('Error updating user to inactive:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        res.json({ message: 'User account marked as inactive.' });
    });
});


// get admin
app.get('/admin', authenticateToken, (req, res) => {
    if (req.user.user_role !== 'admin') {  
        return res.status(403).json({ message: "Access denied" });
    }
    res.json({ message: "Welcome, Admin!" });
});


/**
 *  DELETE REQUESTS ========================================================================
 */
/**
 * @swagger
 * /user/me:
 *   delete:
 *     summary: Delete current user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []  # Requires JWT token
 *     responses:
 *       200:
 *         description: User account deleted successfully
 *       401:
 *         description: Unauthorized
 */
// Delete user account
app.delete('/user/me', authenticateToken, (req, res) => {
    db.database_commands.deleteUser(req.user.id, (err, result) => {
        if (err) return res.status(500).send('Error deleting user');
        res.json({ message: 'User deleted successfully' });
    });
});
app.get('/characters', (req, res) => {
    db.database_commands.getAllCharacters((err, characters) => {
      if (err) {
        res.status(500).json({ error: "Error retrieving characters" });
      } else {
        res.json(characters);
      }
    });
  });


/**
 * @swagger
 * /leaderboard:
 *   get:
 *     summary: Get leaderboard
 *     tags: [Leaderboard]
 *     description: Fetches the top players ranked by their scores in the game.
 *     responses:
 *       200:
 *         description: A list of top players with their scores
 *       500:
 *         description: Error fetching leaderboard
 */
// Get leaderboard (Top players by score)
app.get('/leaderboard', (req, res) => {
    // const query = `
    //   SELECT user.username, user.id, MAX(game_round.happiness_score) AS score
    //   FROM user
    //   JOIN game_round ON game_round.user_id = user.id
    //   GROUP BY user.id
    //   ORDER BY score DESC
    //   LIMIT 10;
    // `;
    const query = `
      SELECT user.username, user.id, user.best_score AS score
      FROM user
      ORDER BY score DESC
      LIMIT 10;
    `;
    
    db.database_commands.getLeaderboard(query, (err, results) => {
        if (err) {
            console.error('Error fetching leaderboard:', err);
            return res.status(500).send('Error fetching leaderboard');
        }
        res.json(results);  // Return leaderboard data
    });
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
