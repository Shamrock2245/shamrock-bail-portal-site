// Filename: public/bailBondDashboard.js

// Code written in public files is shared by your site's
// Backend, page code, and site code environments.



// The following code demonstrates how to call the add
// function from your site's page code or site code.
/*
import {add} from 'public/bailBondDashboard.js'
$w.onReady(function () {
    let sum = add(6,7);
    console.log(sum);
});
*/
import wixWindow from 'wix-window';

$w.onReady(function () {
  const container = $w('#customElement1'); // Replace with your Custom Element's ID
  ReactDOM.render(
    React.createElement(BailBondDashboard),
    container.element
  );
});