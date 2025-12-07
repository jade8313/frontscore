const API_BASE_URL = "https://apiscore-o0uq.onrender.com/";

document.addEventListener("DOMContentLoaded", () => {
    loadMatches();
    document.getElementById("add-match-form").addEventListener("submit", addMatchFormHandler);
});

// -------------------------
// Chargement des matchs
// -------------------------
async function loadMatches() {
    try {
        const response = await fetch(`${API_BASE_URL}api/matches`);
        const matches = await response.json();
        renderAdminTable(matches);
    } catch (error) {
        showError("Impossible de charger les matchs.");
    }
}

function renderAdminTable(matches) {
    const tbody = document.getElementById("matches-admin-body");
    tbody.innerHTML = "";

    matches.sort((a, b) => new Date(a.match_date) - new Date(b.match_date));

    matches.forEach((match) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${formatMatchDate(match.match_date)}</td>
            <td>${match.home_team}</td>
            <td>${match.away_team}</td>
            <td>${match.home_score ?? "-"} - ${match.away_score ?? "-"}</td>
            <td>${match.status}</td>
            <td>
                <button class="btn btn-edit" onclick="editMatch(${match.id})">Modifier</button>
                <button class="btn btn-delete" onclick="deleteMatch(${match.id})">Supprimer</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// -------------------------
// Ajouter un match
// -------------------------
async function addMatchFormHandler(e) {
    e.preventDefault();

    const matchData = {
        home_team: document.getElementById("home_team").value,
        away_team: document.getElementById("away_team").value,
        home_score: document.getElementById("home_score").value,
        away_score: document.getElementById("away_score").value,
        match_date: document.getElementById("match_date").value,
        status: document.getElementById("status").value,
        notes: document.getElementById("notes").value,
    };

    await addMatch(matchData);
    loadMatches(); // rafraîchir le tableau
}

async function addMatch(data) {
    try {
        const response = await fetch(`${API_BASE_URL}api/matches`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error("Erreur API");
    } catch (err) {
        showError("Impossible d’ajouter le match.");
    }
}

// -------------------------
// Modifier un match
// -------------------------
async function editMatch(id) {

    // récupérer le match existant
    const res = await fetch(`${API_BASE_URL}api/matches/${id}`);
    const match = await res.json();

    const home_team = prompt("Équipe domicile :", match.home_team);
    const away_team = prompt("Équipe extérieur :", match.away_team);
    const home_score = prompt("Score équipe domicile :", match.home_score);
    const away_score = prompt("Score équipe extérieur :", match.away_score);
    const status = prompt("Statut (scheduled / played) :", match.status);
    const notes = prompt("Notes :", match.notes);
    const match_date = prompt("Date du match (YYYY-MM-DD HH:MM:SS) :", match.match_date);

    const updateData = {
        home_team: home_team || match.home_team,
        away_team: away_team || match.away_team,
        home_score: home_score ? Number(home_score) : match.home_score,
        away_score: away_score ? Number(away_score) : match.away_score,
        status: status || match.status,
        notes: notes || match.notes,
        match_date: match_date || match.match_date   // ⬅ jamais vide !
    };

    await updateMatch(id, updateData);
    loadMatches();
}


async function updateMatch(id, data) {
    try {
        const response = await fetch(`${API_BASE_URL}api/matches/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (!response.ok) throw new Error("Erreur API");
    } catch (err) {
        showError("Impossible de modifier le match.");
    }
}

// -------------------------
// Supprimer un match
// -------------------------
async function deleteMatch(id) {
    if (!confirm("Supprimer ce match ?")) return;

    try {
        await fetch(`${API_BASE_URL}api/matches/${id}`, {
            method: "DELETE"
        });

        loadMatches();

    } catch (err) {
        showError("Impossible de supprimer le match.");
    }
}

// -------------------------
function showError(msg) {
    const div = document.getElementById("error-message");
    div.textContent = msg;
    div.style.color = "red";
}

function formatMatchDate(date) {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()} ${d.getHours()}h${d.getMinutes().toString().padStart(2,"0")}`;
}