import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import './Home.scss';
import NavigationBar from "../components/NavigationBar";

function Home() {
    
    return (                      
            <div className="gray-background">                                                     
                <NavigationBar />
                <div className="content">                                                                        
                    <h1>g</h1>
                    <h2>ss</h2>
                    <h3>ddasd</h3>
                </div>                                            
            </div>      
        
    );
}

export default Home;