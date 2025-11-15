# Time Tracker by DMHS AI

This is a simple, accessible time tracking application designed to help individuals and companies log and manage work hours. It includes an AI assistant, detailed calendar views, and features specifically designed for users with visual disabilities.

## Known Issues (PLEASE READ)
Upon initially launching the app, all 3 tabs are combined into one view. To fix this, navigate to another tab using the menu and navigate back. We are working on an offical fix soon.

The settings menu will not open if you are on the AI assistant tab. Fix: navigate to a different tab then open the settings menu. We are working on a fix and it should be ready soon.

## Credits
Many components of this app are shared code from the DMHS AI (https://dmhs-ai.gt.tc) application made by Agastya Mishra. This code was used with permission.

## Installation and Instructions

This is a standalone web application that runs directly in your browser. No installation is required.

1.  Download the files: Ensure you have all the project files (`index.html`, `style.css`, `script.js`, `gemini-chatbot.js`) in the same folder.
2.  Open in Browser: Open the `index.html` file in a modern web browser such as Google Chrome, Mozilla Firefox, or Microsoft Edge.
3.  Set API Key: To use the AI Assistant, you must provide your own Google Gemini API key. Click the "Settings" button in the application, enter your key in the "Gemini API Key" field, and click "Save Settings".

The application uses your browser's local storage to save all data, so your employee lists and time entries will be preserved between sessions on the same computer and browser.

## Method of Delivery

The decision to develop this time-tracking application as a pure HTML, CSS, and JavaScript web application was deliberate, prioritizing accessibility and simplicity. This approach ensures the software is universally accessible from any modern web browser, regardless of the user's operating system, without requiring any complex installation or dependency management. By avoiding frameworks and build tools, the application remains lightweight and fast, providing a seamless user experience. This simplicity also translates to easier maintenance and debugging. Furthermore, leveraging native browser APIs for features like local storage and text-to-speech guarantees a consistent and reliable performance across different platforms. This method of delivery empowers users to get started immediately, simply by opening a web link, which aligns perfectly with the goal of creating an inclusive and user-friendly tool for everyone, including those who may not be technically savvy.

## Sources Cited

"Gemini API." *Google AI for Developers*, Google, ai.google.dev/docs/gemini_api. Accessed 14 Nov. 2025.

Google. "Material Icons." *Google Fonts*, Google, fonts.google.com/icons. Accessed 14 Nov. 2025.

"Web Speech API." *MDN Web Docs*, Mozilla, developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API. Accessed 14 Nov. 2025.

"Web Storage API." *MDN Web Docs*, Mozilla, developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API. Accessed 14 Nov. 2025.

## Developers
Developed by Agastya Mishra, Pratham Tippi, Dhiraj Javvadi, and Siddhant Shukla

## LICENSE
This application is covered under the Mishra-CSIL-2025 Liscense. See liscense.md for more details.
