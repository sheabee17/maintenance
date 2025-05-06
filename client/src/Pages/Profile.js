import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
//shows the user their profile
const Profile = () => {
  const { userId } = useParams(); // Get user ID from URL if viewing another profile
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login"); // Redirect if user is not logged in
      return;
    }
    //gets the user
    const fetchUser = async () => {
      try {
        const endpoint = userId ? `/user/${userId}` : "/profile/me";
        const response = await axios.get(`http://localhost:3000${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUser();
  }, [userId, navigate]);

  const handleMakeInactive = async () => {
    const confirm = window.confirm("Are you sure you want to make your account inactive?");
    if (!confirm) return;
  
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://localhost:3000/profile/me/inactive`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Account marked as inactive.");
      navigate("/");
    } catch (error) {
      console.error("Error making user inactive:", error);
      alert("Failed to make account inactive. Please try again.");
    }
  };
  

  if (!user) return <div>Loading...</div>;

  //main html code
  return (
    <div className="profile">
      <h1>{user.username}'s Profile</h1>
      <p>Email: {user.email}</p>
      <p>Best Score: {user.best_score}</p>

      {/* Navigation Links */}
      <nav>
        <Link to="/leaderboard">View Leaderboard</Link> |{" "}
        <Link to="/profile/me">My Profile</Link> |{" "}
        <Link to="/">Home</Link>
      </nav>
      <button onClick={handleMakeInactive}>Make Inactive</button>
      
      {/*shows list of user's game history*/}
     <h3>Game History</h3> 
      <ul>
        {user.history && user.history.length > 0 ? (
          user.history.map((game, index) => (
            <li key={index}>
              Game {game.id}: {game.happiness_score} points {" "}
              <Link to={`/game/${game.id}`}>View Game</Link>
            </li>
          ))
        ) : (
          <p>No past games found.</p>
        )}
      </ul>
    </div>
  );
};

export default Profile;
