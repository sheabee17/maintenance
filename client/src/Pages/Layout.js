import React from "react";
import { Outlet, Link, useNavigate } from "react-router-dom"; // Keep Link here
import "./css/Layout.css"; 

//layout of top part of the website
const Layout = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = token ? JSON.parse(atob(token.split('.')[1])) : null;

  const handleLogout = () => {
      localStorage.removeItem("token");
      navigate("/login");
  };
//html to display it
  return (
      <div className="layout">
          <nav className="navbar">
              <h1>Social Circles Game</h1>
              <ul>
                  <li><Link to="/">Home</Link></li>
                  <li><Link to="/game/1">Play Game</Link></li>
                  <li><Link to="/leaderboard">Leaderboard</Link></li>
                  <li><Link to="/characters">Characters</Link></li>
                  {/* Change this to link to the Profile page */}
                  <li><Link to="/profile/me">My Profile</Link></li> 
                  {user ? (
                      <>
                          <li>Welcome, {user.first_name}!</li>
                          <li><button className="logout-btn" onClick={handleLogout}>Logout</button></li>
                      </>
                  ) : (
                      <>
                          <li><Link to="/login">Login</Link></li>
                          <li><Link to="/register">Register</Link></li>
                      </>
                  )}
              </ul>
          </nav>

          <main>
              <Outlet />
          </main>

          <footer>
              <p>&copy; 2025 Social Circles Game</p>
          </footer>
      </div>
  );
};

export default Layout;
