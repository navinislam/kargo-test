const button = document.getElementById("inject-btn");
const statusEl = document.getElementById("status");

function setStatus(message, level = "info") {
  statusEl.textContent = message;
  statusEl.dataset.level = level;
}

async function requestInjection() {
  button.disabled = true;
  setStatus("Injecting…");

  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!activeTab?.id) {
      throw new Error("No active tab found.");
    }

    const response = await chrome.tabs.sendMessage(activeTab.id, {
      type: "kargo:inject"
    });

    if (response?.ok) {
      setStatus("Control panel injected.", "success");
    } else {
      throw new Error(response?.error || "Unknown injection failure.");
    }
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Failed to inject.", "error");
  } finally {
    button.disabled = false;
  }
}

button.addEventListener("click", requestInjection);
