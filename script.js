document.addEventListener("DOMContentLoaded", function () {
  AP.context.getContext(function (context) {
    const issueKey = context?.jira?.issue?.key;

    if (!issueKey) return;

    // Call Jira REST API to get full issue details
    AP.request({
      url: `/rest/api/3/issue/${issueKey}`,
      type: "GET",
      success: function (responseText) {
        const issue = JSON.parse(responseText);
        const issueType = issue.fields.issuetype.name;

        if (issueType !== "Bug") {
          // Hides the entire panel if not Bug
          const panel = document.getElementById("run-script-panel");
          if (panel) panel.style.display = "none";
        }
      },
      error: function () {
        console.error("Failed to retrieve issue details");
      }
    });
  });

  const btn = document.getElementById("run-script-btn");
  const statusDiv = document.getElementById("run-script-status");

  if (btn) {
    btn.addEventListener("click", function () {
      statusDiv.textContent = "Running...";

      fetch("http://internal-server/run-script", { method: "POST" })
        .then((res) => {
          if (!res.ok) throw new Error("Failed");
          return res.json();
        })
        .then((data) => {
          statusDiv.textContent = "✅ Success: " + (data.message || "Done");
        })
        .catch((err) => {
          statusDiv.textContent = "❌ Error: " + err.message;
        });
    });
  }
});