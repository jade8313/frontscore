// URL de l'API
const API_BASE_URL = "https://apiscore-o0uq.onrender.com/";

// --- Initialisation selon la page ---
document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;

    if (page === "home") {
        initHomePage();

    } else if (page === "results") {
        initResultsPage();

    } else if (page === "admin") {
        loadMatches();
        const form = document.getElementById("add-match-form");
        if (form) {
            form.addEventListener("submit", addMatchFormHandler);
        }
    }
});


// -----------------------------
// 🔴 FONCTIONS UTILES
// -----------------------------
function showError(message) {
    const div = document.getElementById("error-message");

    if (div) {
        div.textContent = message;
        div.style.color = "red";
    } else {
        alert(message);
    }
}

function formatMatchDate(dateString) {
    const d = new Date(dateString);
    return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()} ${d.getHours()}h${d.getMinutes().toString().padStart(2,"0")}`;
}



// ===================================================================
// 🏠 PAGE HOME
// ===================================================================
async function initHomePage() {
    try {
        const response = await fetch(`${API_BASE_URL}api/match`);
        if (!response.ok) throw new Error();
        const matches = await response.json();

        const now = new Date();

        const played = matches.filter(m => m.status === "played" && new Date(m.match_date) <= now);
        const scheduled = matches.filter(m => m.status === "scheduled" && new Date(m.match_date) >= now);

        let lastMatch = null;
        if (played.length > 0) {
            played.sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
            lastMatch = played[played.length - 1];
        }

        let nextMatch = null;
        if (scheduled.length > 0) {
            scheduled.sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
            nextMatch = scheduled[0];
        }

        updateHomePage(nextMatch, lastMatch);

    } catch (err) {
        console.error(err);
        showError("Impossible de charger les données (API indisponible).");
    }
}

function updateHomePage(nextMatch, lastMatch) {
    const nextDiv = document.getElementById("next-match");
    const lastDiv = document.getElementById("last-match");

    // Prochain match
    if (nextMatch) {
        nextDiv.innerHTML = `
            <p><strong>${nextMatch.home_team}</strong> vs <strong>${nextMatch.away_team}</strong></p>
            <p>Date : ${formatMatchDate(nextMatch.match_date)}</p>
            <p>Statut : <span class="status-${nextMatch.status}">${nextMatch.status}</span></p>
        `;
    } else nextDiv.innerHTML = "<p>Aucun match à venir trouvé.</p>";

    // Dernier match
    if (lastMatch) {
        const score = (lastMatch.home_score != null && lastMatch.away_score != null)
            ? `${lastMatch.home_score} - ${lastMatch.away_score}`
            : "Score non renseigné";

        lastDiv.innerHTML = `
            <p><strong>${lastMatch.home_team}</strong> vs <strong>${lastMatch.away_team}</strong></p>
            <p>Date : ${formatMatchDate(lastMatch.match_date)}</p>
            <p>Score : ${score}</p>
            <p>Statut : <span class="status-${lastMatch.status}">${lastMatch.status}</span></p>
        `;
    } else lastDiv.innerHTML = "<p>Aucun match joué trouvé.</p>";
}



// ===================================================================
// 📋 PAGE RESULTS
// ===================================================================
async function initResultsPage() {
    try {
        const response = await fetch(`${API_BASE_URL}api/match`);
        if (!response.ok) throw new Error();
        const matches = await response.json();

        renderResults(matches);

    } catch (err) {
        console.error(err);
        showError("Impossible de charger la liste des matchs.");
    }
}

function renderResults(matches) {
    const tbody = document.getElementById("matches-body");
    tbody.innerHTML = "";

    if (!matches || matches.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 5;
        td.textContent = "Aucun match trouvé.";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    matches.sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

    matches.forEach(match => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${formatMatchDate(match.match_date)}</td>
            <td>${match.home_team}</td>
            <td>${match.away_team}</td>
            <td>${match.home_score ?? "—"} - ${match.away_score ?? "—"}</td>
            <td class="status-${match.status}">${match.status}</td>
        `;

        tbody.appendChild(tr);
    });
}



// ===================================================================
// 🔑 PAGE ADMIN
// ===================================================================
async function loadMatches() {
    try {
        const response = await fetch(`${API_BASE_URL}api/match`);
        const matches = await response.json();
        renderAdminTable(matches);
    } catch (err) {
        showError("Impossible de charger les matchs.");
    }
}

function renderAdminTable(matches) {
    const tbody = document.getElementById("matches-admin-body");
    tbody.innerHTML = "";

    matches.sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

    matches.forEach(match => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${formatMatchDate(match.match_date)}</td>
            <td>${match.home_team}</td>
            <td>${match.away_team}</td>
            <td>${match.home_score ?? "-"} - ${match.away_score ?? "-"}</td>
            <td>${match.status}</td>
            <td>${match.notes}</td>
            <td>
                <button class="btn btn-edit" onclick="editMatch(${match.id})">Modifier</button>
                <button class="btn btn-delete" onclick="deleteMatch(${match.id})">Supprimer</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}


// --- Ajouter un match ---
async function addMatchFormHandler(e) {
    e.preventDefault();

    const matchData = {
        home_team: document.getElementById("home_team").value,
        away_team: document.getElementById("away_team").value,
        match_date: document.getElementById("match_date").value,
        home_score: document.getElementById("home_score").value || null,
        away_score: document.getElementById("away_score").value || null,
        notes: document.getElementById("notes").value || null,
        status: document.getElementById("status").value,
    };

    await addMatch(matchData);
    loadMatches();
}

async function addMatch(data) {
    try {
        const response = await fetch(`${API_BASE_URL}api/match`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error();
    } catch (err) {
        showError("Impossible d’ajouter le match.");
    }
}


// --- Modifier un match ---
async function editMatch(id) {
    const home_team = prompt(" équipe domicile :");
    const away_team = prompt(" équipe extérieur :");
    const home_score = prompt("Score équipe domicile :");
    const away_score = prompt("Score équipe extérieur :");
    const status = prompt("Statut (scheduled / played) :");

    const data = {
        home_team: home_team ? Text(home_team) : null,
        away_team: home_team ? Text(away_team) : null,
        home_score: home_score ? Number(home_score) : null,
        away_score: away_score ? Number(away_score) : null,
        status: status || "played"
    };

    await updateMatch(id, data);
    loadMatches();
}

async function updateMatch(id, data) {
    try {
        const response = await fetch(`${API_BASE_URL}api/match/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error();
    } catch (err) {
        showError("Impossible de modifier le match.");
    }
}

// --- Supprimer ---
async function deleteMatch(id) {
    if (!confirm("Supprimer ce match ?")) return;

    try {
        await fetch(`${API_BASE_URL}api/match/${id}`, {
            method: "DELETE"
        });

        loadMatches();

    } catch (err) {
        showError("Impossible de supprimer le match.");
    }
}