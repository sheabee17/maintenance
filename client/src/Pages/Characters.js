import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/Characters.css"; 
const Characters = () => {
  const [characters, setCharacters] = useState([]);

  //fetches characters
  useEffect(() => {
    axios
      .get("http://localhost:3000/characters") // Ensure this API endpoint exists in your backend
      .then((response) => {
        setCharacters(response.data);
      })
      .catch((error) => {
        console.error("Error fetching characters:", error);
      });
  }, []);

  //html that shows all the characters
  return (
    <div className="characters-page">
      <h1>Game Characters</h1>
      <div className="characters-list">
        {characters.length > 0 ? (
          characters.map((character) => (
            <div key={character.id} className="character-card">
              <h2>{character.name}</h2>
              <p><strong>Likes:</strong> {character.likes}</p>
              <p><strong>Dislikes:</strong> {character.dislikes}</p>
            </div>
          ))
        ) : (
          <p>Loading characters...</p>
        )}
      </div>
    </div>
  );
};

export default Characters;
