document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const authForm = document.getElementById("auth-form");
  const registerButton = document.getElementById("register-button");
  const logoutButton = document.getElementById("logout-button");
  const authStatus = document.getElementById("auth-status");
  let currentUser = null;
  let accessToken = localStorage.getItem("access_token");

  async function apiFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
    return fetch(url, { ...options, headers });
  }

  function updateAuthStatus() {
    const authenticated = Boolean(currentUser);
    authStatus.textContent = authenticated
      ? `Signed in as ${currentUser.email} (${currentUser.role})`
      : "Log in or register to manage activities.";
    logoutButton.classList.toggle("hidden", !authenticated);
    authForm.querySelector('[data-action="login"]').classList.toggle("hidden", authenticated);
    registerButton.classList.toggle("hidden", authenticated);
  }

  async function loadCurrentUser() {
    if (!accessToken) {
      updateAuthStatus();
      return;
    }
    const response = await apiFetch("/auth/me");
    if (response.ok) {
      currentUser = await response.json();
    } else {
      accessToken = null;
      localStorage.removeItem("access_token");
    }
    updateAuthStatus();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await apiFetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await apiFetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const activity = document.getElementById("activity").value;

    try {
      const response = await apiFetch(
        `/activities/${encodeURIComponent(activity)}/signup`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const credentials = {
      email: document.getElementById("auth-email").value,
      password: document.getElementById("auth-password").value,
    };
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const result = await response.json();
    if (!response.ok) {
      authStatus.textContent = result.detail || "Unable to log in.";
      authStatus.className = "error";
      return;
    }
    accessToken = result.access_token;
    localStorage.setItem("access_token", accessToken);
    currentUser = result.user;
    authStatus.className = "info";
    authForm.reset();
    updateAuthStatus();
  });

  registerButton.addEventListener("click", async () => {
    const credentials = {
      email: document.getElementById("auth-email").value,
      password: document.getElementById("auth-password").value,
    };
    const response = await fetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const result = await response.json();
    authStatus.textContent = response.ok
      ? "Account created. Log in to continue."
      : result.detail || "Unable to register.";
    authStatus.className = response.ok ? "success" : "error";
  });

  logoutButton.addEventListener("click", () => {
    accessToken = null;
    currentUser = null;
    localStorage.removeItem("access_token");
    updateAuthStatus();
  });

  // Initialize app
  loadCurrentUser().then(fetchActivities);
});
