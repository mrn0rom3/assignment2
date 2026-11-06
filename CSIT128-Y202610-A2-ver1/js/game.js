/* ============================================================
   CSIT128 Assignment 2 - Part 2: Game logic
   ------------------------------------------------------------
   Rules (from the brief):
   - The player types a name and picks a target character.
   - The name is REQUIRED; all game features are disabled
     until a name is entered.
   - On "Start Game": every 2 seconds, 3 random, NON-REPEATING
     characters are shown.
   - Clicking the character that matches the chosen one: +3.
     Clicking a wrong character: -2. The score may go negative.
   - The chosen character cannot be changed while the game runs.
   - On "Stop Game": generation stops and the screen freezes.
     The player's name + score are added to a list that is shown
     in ASCENDING order of score. No permanent storage is used.
   - Starting again resets the score to 0 and lets the player
     change the chosen character again.
   ============================================================ */

// The set of characters the game can generate (matches the list box).
var CHARACTERS = ["B", "G", "$", "#", "7", "4"];

// Grab the page elements we need to read from or update.
var nameInput    = document.getElementById("playerName");
var chosenSelect = document.getElementById("chosenChar");
var startBtn     = document.getElementById("startBtn");
var stopBtn      = document.getElementById("stopBtn");
var scoreSpan    = document.getElementById("currentScore");
var charCells    = [
    document.getElementById("char1"),
    document.getElementById("char2"),
    document.getElementById("char3")
];
var highestList  = document.getElementById("highest");

// Game state.
var score       = 0;      // current score for the round in progress
var timerId     = null;   // id returned by setInterval (null when stopped)
var isRunning   = false;  // true while a round is in progress
var players     = [];     // {name, score} records, kept in memory only

/* ------------------------------------------------------------
   Enable/disable the game features based on whether a name has
   been entered. Called on page load and whenever the name box
   changes. While a round is running the Start button and list
   box stay locked regardless of the name.
   ------------------------------------------------------------ */
function updateControls() {
    var hasName = nameInput.value.trim() !== "";

    // Without a name, nothing is usable.
    startBtn.disabled     = !hasName || isRunning;
    stopBtn.disabled      = !hasName || !isRunning;
    // The chosen character is locked while a round runs.
    chosenSelect.disabled = !hasName || isRunning;
}

/* ------------------------------------------------------------
   Pick 3 distinct random characters from CHARACTERS.
   "Distinct" satisfies the no-repeat rule (e.g. never "4 B 4").
   ------------------------------------------------------------ */
function pickThreeCharacters() {
    // Copy the array so we don't disturb the original.
    var pool = CHARACTERS.slice();
    var result = [];

    for (var i = 0; i < 3; i++) {
        // Random index into whatever is left in the pool.
        var index = Math.floor(Math.random() * pool.length);
        // Remove that character so it cannot be picked again.
        result.push(pool.splice(index, 1)[0]);
    }
    return result;
}

/* ------------------------------------------------------------
   Generate a fresh batch of 3 characters and show them in the
   three cells. Runs immediately on Start and then every 2s.
   ------------------------------------------------------------ */
function generateCharacters() {
    var picks = pickThreeCharacters();
    for (var i = 0; i < charCells.length; i++) {
        charCells[i].textContent = picks[i];
    }
}

/* ------------------------------------------------------------
   Handle a click on one of the three character cells.
   Matching the chosen character scores +3, otherwise -2.
   Clicks are ignored when no round is running (frozen screen).
   ------------------------------------------------------------ */
function handleCharacterClick(event) {
    if (!isRunning) {
        return; // screen is frozen - ignore clicks
    }

    var clicked = event.currentTarget.textContent;
    if (clicked === "") {
        return; // empty cell, nothing to score
    }

    if (clicked === chosenSelect.value) {
        score += 3;
    } else {
        score -= 2;
    }

    // Update the score display in real time.
    scoreSpan.textContent = score;
}

/* ------------------------------------------------------------
   Start Game: reset score, unlock nothing (lock the chosen
   character), begin generating every 2 seconds.
   ------------------------------------------------------------ */
function startGame() {
    // A name is required to start.
    if (nameInput.value.trim() === "") {
        return;
    }

    // Reset for a new round.
    score = 0;
    scoreSpan.textContent = score;
    isRunning = true;

    // Show the first batch straight away, then every 2 seconds.
    generateCharacters();
    timerId = setInterval(generateCharacters, 2000);

    updateControls();
}

/* ------------------------------------------------------------
   Stop Game: stop generation and freeze the screen. Record the
   player's name + score and redraw the list (ascending score).
   ------------------------------------------------------------ */
function stopGame() {
    if (!isRunning) {
        return;
    }

    // Stop the 2-second timer; the last 3 characters stay on screen.
    clearInterval(timerId);
    timerId = null;
    isRunning = false;

    // Record this player's result (in memory only - no storage).
    players.push({name: nameInput.value.trim(), score: score});
    renderPlayers();

    updateControls();
}

/* ------------------------------------------------------------
   Redraw the player list, sorted in ascending order of score.
   Format matches the brief, e.g. "David (25)".
   ------------------------------------------------------------ */
function renderPlayers() {
    // Sort a copy so the display order does not depend on insertion order.
    var sorted = players.slice().sort(function (a, b) {
        return a.score - b.score; // ascending
    });

    // Clear the list, then add one <li> per player.
    highestList.innerHTML = "";
    for (var i = 0; i < sorted.length; i++) {
        var li = document.createElement("li");
        li.textContent = sorted[i].name + " (" + sorted[i].score + ")";
        highestList.appendChild(li);
    }
}

/* ------------------------------------------------------------
   Wire up the event handlers once the page is ready.
   ------------------------------------------------------------ */
// Enable/disable features as the name is typed.
nameInput.addEventListener("input", updateControls);

// Start / Stop buttons.
startBtn.addEventListener("click", startGame);
stopBtn.addEventListener("click", stopGame);

// Clicking any of the three character cells tries to score.
for (var i = 0; i < charCells.length; i++) {
    charCells[i].addEventListener("click", handleCharacterClick);
}

// Set the initial locked/unlocked state (no name yet => disabled).
updateControls();
