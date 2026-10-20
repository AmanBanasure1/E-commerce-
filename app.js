
const form = document.getElementById("productForm");
const button = document.getElementById("generateBtn");
const statusBox = document.getElementById("status");
const resultBox = document.getElementById("result");
const outputBox = document.getElementById("output");

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const data = Object.fromEntries(new FormData(form).entries());

  if (!data.name.trim() || !data.features.trim()) {
    statusBox.textContent = "Enter product name and features.";
    return;
  }

  button.disabled = true;
  button.textContent = "Generating...";
  statusBox.textContent = "Please wait...";
  resultBox.hidden = true;

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Request failed.");
    }

    outputBox.textContent = result.text;
    resultBox.hidden = false;
    statusBox.textContent = "Listing generated successfully.";
  } catch (error) {
    statusBox.textContent =
      "Error: " + error.message +
      " Please check deployment and API settings.";
  } finally {
    button.disabled = false;
    button.textContent = "Generate Listing";
  }
});

document.getElementById("copyBtn").addEventListener("click",
  async function () {
    try {
      await navigator.clipboard.writeText(outputBox.textContent);
      statusBox.textContent = "Copied!";
    } catch {
      statusBox.textContent =
        "Copy unavailable. Please select and copy the text manually.";
    }
  }
);
