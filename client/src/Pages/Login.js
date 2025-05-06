import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
//Login an account page
const Login = () => {
    const [credentials, setCredentials] = useState({
        email: "",
        password: "",
    });
    const navigate = useNavigate();
    //handles changes to login
    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials((prev) => ({
            ...prev,
            [name]: value,
        }));
    };
    //handles login submit button
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:3000/login", credentials);
            console.log("User logged in:", response.data);
            const token = response.data.token;
            localStorage.setItem("token", token);
            const profileResponse = await axios.get("http://localhost:3000/profile/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (profileResponse.data.active === false) {
                alert("Your account is inactive. Please contact support.");
                localStorage.removeItem("token");
                return;
            }
            navigate("/profile/me"); //navigates user to their profile
        } catch (error) {
            console.error("Error logging in:", error);
            alert("Failed to log in. Please try again.");
        }
    };
    //handles the guest login
    const handleGuestLogin = async () => {
        try {
            const response = await axios.post("http://localhost:3000/guest-login");
            console.log("Guest user logged in:", response.data);
            
            // Store token in local storage
            localStorage.setItem("token", response.data.token);
    
            // You can also store user information if needed
            localStorage.setItem("user", JSON.stringify(response.data.user));
    
            // Redirect to home page after guest login
            window.location.href = "/"; 
        } catch (error) {
            console.error("Error logging in as guest:", error);
            alert("Failed to log in as guest. Please try again.");
        }
    };
    
    //main html code
    return (
        <div className="container">
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Email:
                    <input
                        type="email"
                        name="email"
                        value={credentials.email}
                        onChange={handleChange}
                    />
                </label>
                <label>
                    Password:
                    <input
                        type="password"
                        name="password"
                        value={credentials.password}
                        onChange={handleChange}
                    />
                </label>
                <button type="submit">Login</button>
            </form>

            {/* Guest Login Button */}
            <button onClick={handleGuestLogin}>Login as Guest</button>
        </div>
    );
};

export default Login;