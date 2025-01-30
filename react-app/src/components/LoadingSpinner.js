import React from 'react';
import './LoadingSpinner.scss';

function LoadingSpinner() {
  return (    
    <>
        <div className="loading">
            <svg className="spinner" viewBox="0 0 50 50">
                <circle
                    className="path"
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    strokeWidth="4"
                />
            </svg>
        </div>
    </>
  );
}

export default LoadingSpinner;