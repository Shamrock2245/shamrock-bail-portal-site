// Filename: public/react-setup.js

// Code written in public files is shared by your site's
// Backend, page code, and site code environments.

// Use public files to hold utility functions that can
// be called from multiple locations in your site's code.
// Include React and ReactDOM libraries

const reactScript = document.createElement("script");
reactScript.src = "https://unpkg.com/react@17/umd/react.production.min.js";
document.head.appendChild(reactScript);

const reactDOMScript = document.createElement("script");
reactDOMScript.src = "https://unpkg.com/react-dom@17/umd/react-dom.production.min.js";
document.head.appendChild(reactDOMScript);

// The following code demonstrates how to call the add
// function from your site's page code or site code.
/*
import {add} from 'public/react-setup.js'
$w.onReady(function () {
    let sum = add(6,7);
    console.log(sum);
});
*/