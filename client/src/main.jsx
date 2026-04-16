import React from 'react';
import ReactDOM from 'react-dom/client'; //imports react shit
import App from './App.jsx'; // imports the app object from the source file?

ReactDOM.createRoot(document.getElementById('root')).render(<App />); // okay, this obvioulsy look for root div in the index file and replaces it with the generated structure for the app.
