import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/mvp.css";

function Home() {
  const [user, setUser] = useState(null);
  //fetches user data
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      // Fetch User Info
      axios
        .get("http://localhost:3000/profile/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUser(response.data);
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
        });
    }
  }, []);
//homepage html code
  return (
    <div className="home-page">
      <h1>Welcome to the Social Circles Game</h1>

      {user && (
        <div>
          <h2>Welcome, {user.username}</h2>
          {/* Navigate to profile page */}
          <button onClick={() => window.location.href = `/profile/me`}>Go to your profile</button>
        </div>
      )}

      <section className="game-description">
        <h2>About the Social Circles Game</h2>
        <p>
          The Social Circles Game involves three groups of people (circles), with three characters in each circle. Your objective is to choose one action to maximize the overall happiness of a group. Actions include giving compliments, offering help, or inviting someone to an event.
        </p>
      </section>

      <section className="creators-description">
        <h2>Meet the Creators</h2>
        <ul>
          <li><strong>Neil:</strong> Passionate about logic games and challenge-driven design.</li>
          <li><strong>Liam:</strong> Creative thinker focused on fun, dynamic gameplay.</li>
          <li><strong>JD:</strong> Developer dedicated to storytelling and character design.</li>
        </ul>
      </section>
    </div>
  );
}

export default Home;
