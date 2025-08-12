
function attachScriptRunnerButtonListener() {
	const buttonIp = document.getElementById("run-ip-script");
	const button1 = document.getElementById("run-custom-script1");
	const button2 = document.getElementById("run-custom-script2");
	const messageBox = document.getElementById("script-response-message");
	const issueKey = window.AdaptavistBridgeContext?.context?.issueKey;
	
	if (issueKey === "QA-6358" || issueKey === "QA-57546" || issueKey === "QA-45036") {
		buttonIp.style.display = "block";
		button1.style.display = "block";
	} else {
		return;
	}

	if (buttonIp) {
	  	buttonIp.addEventListener("click", async function () {
	    messageBox.innerText = "Fetching public IP...";
	    messageBox.style.color = "black";
	
	    try {
	      // Helper to add timeout to fetch
	      const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
	        return Promise.race([
	          fetch(url, options),
	          new Promise((_, reject) =>
	            setTimeout(() => reject(new Error("Request timed out")), timeout)
	          )
	        ]);
	      };
	
	      // 1. Get the public IP
	      const ipRes = await fetchWithTimeout("https://api.ipify.org?format=json");
	      if (!ipRes.ok) throw new Error(`IP API failed: ${ipRes.status}`);
	
	      const ipData = await ipRes.json();
	      const ip = ipData?.ip;
	      if (!ip) throw new Error("No IP address returned");
	
	      // Show IP while fetching org info
	      messageBox.innerText = `IP: ${ip} - Fetching organization info...`;
	
	      // 2. Get organization info for that IP
	      const orgRes = await fetchWithTimeout(
	        `https://ipinfo.io/${ip}/org`
	      );
	      if (!orgRes.ok) throw new Error(`Org API failed: ${orgRes.status}`);
	
	      const org = await orgRes.text();
	
	      // 3. Display final result
	      messageBox.innerText = `IP: ${ip} - Org: ${org}`;
	    } catch (err) {
	      console.error("Error fetching IP or Org:", err);
	      messageBox.innerText = `Fetch error: ${err.message}`;
	      messageBox.style.color = "red";
	    }
	  });
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
			}, 250); // 1-second delay between iterations

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