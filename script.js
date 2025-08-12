
function attachScriptRunnerButtonListener() {
	const buttonIp = document.getElementById("run-ip-script1");
	const button1 = document.getElementById("run-custom-script1");
	const button2 = document.getElementById("run-custom-script2");
	const messageBox = document.getElementById("script-response-message");
	const issueKey = window.AdaptavistBridgeContext?.context?.issueKey;
	
	if (issueKey === "QA-6358" || issueKey === "QA-57546" || issueKey === "QA-45036") {
		button1.style.display = "block";
	} else {
		return;
	}
	
	if (buttonIp) {
		buttonIp.addEventListener("click", function() {
			messageBox.innerText = "Button Ip"; 
			
			fetch("https://api.ipify.org")
			  .then(res => res.text())
			  .then(ip => {
				  fetch(`https://ipinfo.io/${ip}/org`)
				  .then(res => res.text())
				  .then(data => {
					messageBox.innerText = "IP: " + ip + " - Info: " + data;
				  });
			  });
		});
	} else {
		// Retry after a short delay
		setTimeout(attachScriptRunnerButtonListener, 200);
	}

	if (button1) {
		button1.addEventListener("click", function() {
			button2.style.display = "block";
			button1.style.display = "none";
			messageBox.innerText = "Button 1"; 
			
			let i = 1;
			let max = 5;
			
			let intervalId = setInterval(function () {
				console.log("Iteration", i);
				messageBox.innerText = "Iteration: " + i;
				i++;
				
				if (i > max) {
				  	clearInterval(intervalId);
					messageBox.innerText = "Loop finished";
				}
			}, 150); // 1-second delay between iterations
		});
	} else {
		// Retry after a short delay
		setTimeout(attachScriptRunnerButtonListener, 200);
	}
	if (button2) {
		button2.addEventListener("click", function() {
			button1.style.display = "block";
			button2.style.display = "none";
			messageBox.innerText = "Button 2" ;

			fetch(`https://dcmcobwasqld01.ad.mvwcorp.com:8445/api/v1/xray/jiratype?JiraKey=${issueKey}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json'
				}
			})
			.then(response => {
			    if (!response.ok) {
			      throw new Error(`HTTP error! Status: ${response.status}`);
			    }
			    return response.json(); // parse JSON body
			  })
			.then(data => {
				const strIssueType = data.fields.issuetype.name.replace(/ /g, "");
				messageBox.innerText = strIssueType + "\n\n" + "issueKey" + " " + JSON.stringify(data, null, 2);
				messageBox.style.color = "black";
			})
			.catch(error => {
				console.error("Caught error in fetch:", error);
				messageBox.innerText = "Fetch error: " + error.message;
				messageBox.style.color = "red";
			});			
		});
	} else {
		// Retry after a short delay
		setTimeout(attachScriptRunnerButtonListener, 200);
	}
}

document.addEventListener("DOMContentLoaded", attachScriptRunnerButtonListener);