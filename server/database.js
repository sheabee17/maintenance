const mysql = require("mysql2");

// MySQL Configuration
const mysqlConfig = {
    host: process.env.DB_HOST || "db",
    port: process.env.DB_PORT || "3306",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "pass123",
    database: process.env.DB_NAME || "gamedb",
};

let con = null;

// Initialize Database Connection
const databaseInit = () => {
    con = mysql.createConnection(mysqlConfig);
    con.connect((err) => {
        if (err) {
            console.error("Error connecting to the database: ", err);
            return;
        }
        console.log("Connected to the database");
    });
};

// Ensure the Database Connection is Active
const checkDB = () => {
    if (!con) {
        databaseInit();
    }
};

const database_commands = {
    /**
     *  USER MANAGEMENT ========================================================================
     */

    // Insert a New User (Registration)
    insertUser: (user, res) => {
        checkDB();
        con.query(
            "INSERT INTO user (first_name, last_name, username, email, password, user_role) VALUES (?, ?, ?, ?, ?, ?)",
            [user.first_name, user.last_name, user.username, user.email, user.password, user.role_user],  // Make sure to include role
            (err, results) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log("User registered successfully:", results);
                }
            }
        );
    },

    

    // Retrieve User by Email (Login)
    getUserByEmail: (email, callback) => {
        checkDB();
        con.query("SELECT * FROM user WHERE email = ?", [email], (err, results) => {
            if (err || results.length === 0) {
                return callback(err || new Error("User not found"));
            }
            callback(null, results[0]);
        });
    },

    // Retrieve User by ID (Profile)
    getUserByID: (id, callback) => {
        checkDB();
        con.query("SELECT id, first_name, last_name, username, email, best_score, user_role FROM user WHERE id = ?", [id], (err, results) => {
            if (err) {
                console.error(err);
                return callback(err, null);
            }
            if (results.length === 0) {
                return callback(null, null);
            }
            callback(null, results[0]);
        });
    },

    // Delete User Account
    deleteUser: (id, callback) => {
        checkDB();
        con.query("DELETE FROM user WHERE id = ?", [id], (err, results) => {
            if (err) {
                console.error("Error deleting user:", err);
                return callback(err, null);
            }
            callback(null, results);
        });
    },


    /**
     *  GAME LOGIC ========================================================================
     */

    // Fetch All Game Characters
    getAllCharacters: (callback) => {
        checkDB();
        con.query("SELECT * FROM characters", (err, results) => {
            if (err) {
                console.error("Error fetching characters:", err);
                return callback(err, null);
            }
            callback(null, results);
        });
    },

    // Insert a New Game Round
    insertGameRound: (gameData, callback) => {
        checkDB();
        con.query(
            "INSERT INTO game_round (user_id, round_number, action, circle_selected, happiness_score) VALUES (?, ?, ?, ?, ?)",
            [gameData.user_id, gameData.round_number, gameData.action, gameData.circle_selected, gameData.happiness_score],
            (err, results) => {
                if (err) {
                    console.error("Error saving game round:", err);
                    return callback(err, null);
                }
                callback(null, results);
            }
        );
    },
    getAllCharacters: (callback) => {
        checkDB();
        con.query("SELECT * FROM characters", (err, results) => {
            if (err) {
                console.error(err);
                return callback(err, null);
            }
            callback(null, results);
        });
    },
    // Retrieve Game History for a User
    getGameHistory: (user_id, callback) => {
        checkDB();
        con.query("SELECT * FROM game_round WHERE user_id = ?", [user_id], (err, results) => {
            if (err) {
                console.error("Error fetching game history:", err);
                return callback(err, null);
            }
            callback(null, results);
        });
    },
    // Fetch leaderboard data
    getLeaderboard: (query, callback) => {
        checkDB();
        con.query(query, (err, results) => {
            if (err) {
                console.error("Error fetching leaderboard:", err);
                return callback(err, null);
            }
            callback(null, results);
        });
    },

    // Insert a Score (Game Round) and update user's highscore if necessary
    insertScore: (scoreData, callback) => {
        checkDB();
        con.query(
            "UPDATE user SET best_score = ? WHERE id=? AND best_score < ?",
            [scoreData.happiness_score, scoreData.user_id, scoreData.happiness_score],
            (err, res) => {
                if (err) {
                    console.error("Error saving highscore:", err);
                    return callback(err, null);
                }
                else {
                    console.log("Updated high score:", res);
                    const query = "INSERT INTO game_round (user_id, round_number, action, circle_selected, happiness_score) VALUES (?, ?, ?, ?, ?)";

                    console.log("Executing query with values:", scoreData);  // Log the values

                    con.query(query, [scoreData.user_id, scoreData.round_number, scoreData.action, scoreData.circle_selected, scoreData.happiness_score],
                        (err, results) => {
                            if (err) {
                                console.error("Error saving score:", err);  // Log any error
                                return callback(err, null);
                            }
                            console.log("Insert result:", results);  // Log the results from the database
                            callback(null, results);
                        }
                    );
                }
            }
        );
    },


    /**
     *  REVIEWS ========================================================================
     */

    // Insert a Review
    insertReview: (reviewData, callback) => {
        checkDB();
        con.query(
            "INSERT INTO review (user_id, rating, comment, timestamp) VALUES (?, ?, ?, NOW())",
            [reviewData.user_id, reviewData.rating, reviewData.comment],
            (err, results) => {
                if (err) {
                    console.error("Error submitting review:", err);
                    return callback(err, null);
                }
                callback(null, results);
            }
        );
    },


    // Retrieve All Reviews
    getAllReviews: (callback) => {
        checkDB();
        con.query("SELECT * FROM review r JOIN user u ON r.user_id = u.id ORDER BY r.timestamp DESC;", (err, results) => { //reviews + UserId to username
            if (err) {
                console.error("Error fetching reviews:", err);
                return callback(err, null);
            }
            callback(null, results);
        });
    }

};



module.exports = { databaseInit, checkDB, database_commands };
