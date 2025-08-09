function findElementByTextDebug(tag, text) {
	const wpar = window.parent;
	
    const elements = Array.from(window.parent.document.getElementsByTagName(tag));
    console.log(`Found ${elements.length} <${tag}> elements`);

    elements.forEach((el, index) => {
        console.log(`[#${index}]`, el, "TEXT:", el.textContent.trim());
    });

	const match = elements.find(el => el.textContent.includes(text));
    if (match) {
        console.log("✅ Found match:", match);
    } else {
        console.warn(`❌ No element with exact text "${text}" found`);
    }
    return match;
}

// Example usage:
const el = findElementByTextDebug("span", "Fragment");
if (el) el.click();





function attachScriptRunnerButtonListener() {
	const button = document.getElementById("run-custom-script");
	const button2 = document.getElementById("run-custom-script2");
	const messageBox = document.getElementById("script-response-message");

	if (button) {
		button.addEventListener("click", function() {
			button2.style.display = "block";
			button.style.display = "none";
			messageBox.innerText = "Button 1"; 
			
			const issueKey = window.AdaptavistBridgeContext?.context?.issueKey;
			if (issueKey) {
			  console.log("Issue key is:", issueKey);
			} else {
			  console.error("Issue key not found. Are you inside a ScriptRunner Cloud webPanel?");
			}
			fetch('https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/ping', {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			})
				.then(response => response.json())
				.then(data => {
					//messageBox.innerText = data.message || "Action completed!";
					//messageBox.style.color = "green";
					
					messageBox.innerText = JSON.stringify(data, null, 2); // Prettified JSON
          			messageBox.style.whiteSpace = "pre-wrap"; // preserve line breaks
          			messageBox.style.color = "black";
				})
				.catch(error => {
					messageBox.innerText = "Error: " + error;
					messageBox.style.color = "red";
				});
		});
	} else {
		// Retry after a short delay
		setTimeout(attachScriptRunnerButtonListener, 200);
	}
	if (button2) {
		button2.addEventListener("click", function() {
			button.style.display = "block";
			button2.style.display = "none";
			messageBox.innerText = "Button 2" ;
		});
	} else {
		// Retry after a short delay
		setTimeout(attachScriptRunnerButtonListener, 200);
	}
}

document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);