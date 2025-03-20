(function() {
    'use strict';

    // Ensure this runs only on IXL
    if (!window.location.href.includes("ixl.com")) {
        console.error("This script only runs on IXL.");
        return;
    }

    // API Key Setup
    let API_KEY = localStorage.getItem("gpt4o-api-key") || prompt("Enter your OpenAI API key:");
    if (API_KEY) {
        localStorage.setItem("gpt4o-api-key", API_KEY);
    } else {
        console.error("API key is required.");
        return;
    }

    let API_BASE = "https://api.openai.com/v1/chat/completions";
    let selectedModel = "gpt-4o";

    function captureCanvasImage(htmlElement) {
        const canvas = htmlElement.querySelector('canvas');
        if (canvas) {
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = canvas.width;
            offscreenCanvas.height = canvas.height;
            const ctx = offscreenCanvas.getContext('2d');
            ctx.drawImage(canvas, 0, 0);
            return offscreenCanvas.toDataURL("image/png").split(",")[1];
        }
        return null;
    }

    function sendContentToGPT(htmlContent, canvasDataUrl) {
        const messages = [
            {
                "role": "system",
                "content": "You are a math assistant. Carefully analyze the provided HTML structure and canvas image (if available) to generate JavaScript code that fills in all required answer fields accurately. Use stable selectors such as XPath. Think step by step before answering."
            },
            {
                "role": "user",
                "content": `This is a math question. Use the following HTML structure to generate JavaScript code that fills each answer field without leaving any fields empty.\n\nHTML Structure:\n${htmlContent}`
            }
        ];
        if (canvasDataUrl) {
            messages.push({
                "role": "user",
                "content": {
                    "type": "image_url",
                    "image_url": {
                        "url": `data:image/png;base64,${canvasDataUrl}`
                    }
                }
            });
        }

        fetch(API_BASE, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({ model: selectedModel, messages: messages })
        })
        .then(response => response.json())
        .then(data => {
            if (data.choices && data.choices[0].message) {
                let code = sanitizeCode(data.choices[0].message.content.trim());
                try {
                    eval(code);
                    console.log("Answer filled successfully.");
                } catch (error) {
                    console.error("Execution error: ", error);
                }
            } else {
                console.error("Unexpected GPT response format:", data);
            }
        })
        .catch(error => {
            console.error("Request error:", error);
        });
    }

    function sanitizeCode(responseContent) {
        const regex = /```javascript\s+([\s\S]*?)\s+```/i;
        const match = responseContent.match(regex);
        return match && match[1] ? match[1].trim() : "";
    }

    function answerQuestion() {
        console.log("Analyzing question...");
        let targetDiv = document.evaluate(
            '/html/body/main/div/article/section/section/div/div[1]',
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null
        ).singleNodeValue;

        if (!targetDiv) {
            console.error("Error: HTML structure not found.");
            return;
        }

        let htmlContent = targetDiv.outerHTML;
        const canvasDataUrl = captureCanvasImage(targetDiv);
        sendContentToGPT(htmlContent, canvasDataUrl);
    }

    console.log("IXL Auto Answer Script Loaded. Type `answerQuestion()` in the console to start.");
})();
