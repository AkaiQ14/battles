// Final Result Page JavaScript
// Load game data and display final results

// Game data variables
let gameSetupProgress = {};
let player1 = "لاعب 1";
let player2 = "لاعب 2";
let scores = {};
let winner = null;
let winnerName = "";

// Load game data from localStorage
function loadGameData() {
    try {
        // Load game setup progress
        const gameSetup = localStorage.getItem('gameSetupProgress');
        if (gameSetup) {
            gameSetupProgress = JSON.parse(gameSetup);
            
            // Get player names
            if (gameSetupProgress.player1?.name) {
                player1 = gameSetupProgress.player1.name;
            }
            if (gameSetupProgress.player2?.name) {
                player2 = gameSetupProgress.player2.name;
            }
        }
        
        // Load scores
        const scoresData = localStorage.getItem('scores');
        if (scoresData) {
            scores = JSON.parse(scoresData);
        } else {
            // Fallback: try to get from individual player data
            const player1Score = localStorage.getItem('player1Score');
            const player2Score = localStorage.getItem('player2Score');
            
            if (player1Score && player2Score) {
                scores[player1] = parseInt(player1Score);
                scores[player2] = parseInt(player2Score);
            } else {
                // Default scores
                scores[player1] = 0;
                scores[player2] = 0;
            }
        }
        
        console.log('Loaded game data:', { player1, player2, scores });
        
    } catch (error) {
        console.error('Error loading game data:', error);
        // Set default values
        player1 = "لاعب 1";
        player2 = "لاعب 2";
        scores = { [player1]: 0, [player2]: 0 };
    }
}

// Determine winner
function determineWinner() {
    if (scores[player1] > scores[player2]) {
        winner = player1;
        winnerName = player1;
        // إضافة نتيجة المباراة إلى لوحة المتصدرين
        addGameResultToLeaderboard(player1, player2);
    } else if (scores[player2] > scores[player1]) {
        winner = player2;
        winnerName = player2;
        // إضافة نتيجة المباراة إلى لوحة المتصدرين
        addGameResultToLeaderboard(player2, player1);
    } else {
        winner = "تعادل";
        winnerName = "تعادل";
        console.log("تعادل - لن يتم إضافة نتيجة إلى لوحة المتصدرين");
    }
    
    console.log('Winner determined:', winner);
}

// Add game result to leaderboard
function addGameResultToLeaderboard(winnerName, loserName) {
    try {
        // التحقق من تفعيل التحدي - يجب أن يكون مفعل لإضافة النتائج
        const gameSetup = localStorage.getItem('gameSetupProgress');
        if (!gameSetup) {
            console.log('لا توجد بيانات إعدادات - لن يتم احتساب المباراة في لوحة المتصدرين');
            return;
        }
        
        const setup = JSON.parse(gameSetup);
        if (!setup.advancedMode) {
            console.log('التحدي غير مفعل - لن يتم احتساب المباراة في لوحة المتصدرين');
            return;
        }
        
        const leaderboardData = localStorage.getItem('leaderboard');
        let players = leaderboardData ? JSON.parse(leaderboardData) : [];
        
        // إضافة أو تحديث الفائز
        let winner = players.find(p => p.name === winnerName);
        if (!winner) {
            winner = { name: winnerName, wins: 0, losses: 0, games: 0, points: 0, winRate: 0 };
            players.push(winner);
            console.log(`تم إضافة لاعب جديد للوحة المتصدرين: ${winnerName}`);
        }
        winner.wins++;
        winner.games++;
        winner.winRate = Math.round((winner.wins / winner.games) * 100);
        
        // إضافة أو تحديث الخاسر
        let loser = players.find(p => p.name === loserName);
        if (!loser) {
            loser = { name: loserName, wins: 0, losses: 0, games: 0, points: 0, winRate: 0 };
            players.push(loser);
            console.log(`تم إضافة لاعب جديد للوحة المتصدرين: ${loserName}`);
        }
        loser.losses++;
        loser.games++;
        loser.winRate = Math.round((loser.wins / loser.games) * 100);
        
        saveLeaderboardData(players);
        
        // إظهار رسالة تأكيد
        showToast(`تم احتساب نتيجة المباراة: ${winnerName} فاز على ${loserName}`, 'success');
        
        console.log(`تم إضافة نتيجة المباراة: ${winnerName} فاز على ${loserName}`);
        console.log(`إحصائيات ${winnerName}: ${winner.wins} فوز، ${winner.losses} خسارة، ${winner.games} مباراة`);
        console.log(`إحصائيات ${loserName}: ${loser.wins} فوز، ${loser.losses} خسارة، ${loser.games} مباراة`);
    } catch (error) {
        console.error('Error adding game result to leaderboard:', error);
        showToast("حدث خطأ أثناء احتساب نتيجة المباراة", 'error');
    }
}

// Display results
function displayResults() {
    try {
        // Update player scores
        const player1ScoreElement = document.getElementById('player1Score');
        const player2ScoreElement = document.getElementById('player2Score');
        const winnerTextElement = document.getElementById('winnerText');
        
        if (player1ScoreElement) {
            player1ScoreElement.textContent = `${player1}: ${scores[player1]} نقطة صحة`;
        }
        
        if (player2ScoreElement) {
            player2ScoreElement.textContent = `${player2}: ${scores[player2]} نقطة صحة`;
        }
        
        if (winnerTextElement) {
            if (winner === "تعادل") {
                winnerTextElement.textContent = "النتيجة: تعادل";
            } else {
                winnerTextElement.textContent = `الفائز هو: ${winner}`;
            }
        }
        
        console.log('Results displayed successfully');
        
    } catch (error) {
        console.error('Error displaying results:', error);
    }
}

// Create celebration particles
function createCelebration() {
    const celebration = document.getElementById('celebration');
    if (!celebration) return;
    
    // Clear existing particles
    celebration.innerHTML = '';
    
    // Create particles
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'celebration-particle';
        
        // Random position and delay
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 3 + 's';
        particle.style.animationDuration = (Math.random() * 2 + 2) + 's';
        
        // Random colors
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        celebration.appendChild(particle);
    }
}

// Add point to winner
function addPointToWinner() {
    try {
        if (winner && winner !== "تعادل") {
            scores[winner] += 1;
            
            // Save updated scores
            localStorage.setItem('scores', JSON.stringify(scores));
            
            // إضافة النقاط إلى لوحة المتصدرين
            addPointToLeaderboard(winner);
            
            // Update display
            displayResults();
            
            // إظهار رسالة تأكيد
            showToast(`تم إضافة نقطة للفائز ${winner} بنجاح! 🎉`, 'success');
            
            console.log(`Added point to ${winner}. New score: ${scores[winner]}`);
        } else {
            showToast("لا يمكن إضافة نقطة في حالة التعادل", 'warning');
            console.log("لا يمكن إضافة نقطة في حالة التعادل");
        }
    } catch (error) {
        console.error('Error adding point to winner:', error);
        showToast("حدث خطأ أثناء إضافة النقطة", 'error');
    }
}

// Add point to leaderboard
function addPointToLeaderboard(playerName) {
    try {
        const leaderboardData = localStorage.getItem('leaderboard');
        let players = leaderboardData ? JSON.parse(leaderboardData) : [];
        
        // البحث عن اللاعب أو إنشاؤه
        let player = players.find(p => p.name === playerName);
        if (!player) {
            player = { name: playerName, wins: 0, losses: 0, games: 0, points: 0, winRate: 0 };
            players.push(player);
        }
        
        // إضافة نقطة
        player.points = (player.points || 0) + 1;
        
        // إضافة فوز (لأنه فاز في المباراة)
        player.wins = (player.wins || 0) + 1;
        player.games = (player.games || 0) + 1;
        
        // حساب معدل الفوز
        player.winRate = Math.round((player.wins / player.games) * 100);
        
        // إضافة خسارة للاعب الآخر (إذا كان موجود)
        const otherPlayerName = playerName === player1 ? player2 : player1;
        let otherPlayer = players.find(p => p.name === otherPlayerName);
        if (!otherPlayer) {
            otherPlayer = { name: otherPlayerName, wins: 0, losses: 0, games: 0, points: 0, winRate: 0 };
            players.push(otherPlayer);
        }
        otherPlayer.losses = (otherPlayer.losses || 0) + 1;
        otherPlayer.games = (otherPlayer.games || 0) + 1;
        otherPlayer.winRate = Math.round((otherPlayer.wins / otherPlayer.games) * 100);
        
        // حفظ البيانات مع النسخ الاحتياطية
        saveLeaderboardData(players);
        
        console.log(`تم إضافة نقطة للاعب ${playerName} في لوحة المتصدرين`);
        console.log(`إحصائيات ${playerName}: ${player.wins} فوز، ${player.losses} خسارة، ${player.games} مباراة، ${player.points} نقطة، ${player.winRate}% معدل فوز`);
        console.log(`إحصائيات ${otherPlayerName}: ${otherPlayer.wins} فوز، ${otherPlayer.losses} خسارة، ${otherPlayer.games} مباراة، ${otherPlayer.points} نقطة، ${otherPlayer.winRate}% معدل فوز`);
    } catch (error) {
        console.error('Error adding point to leaderboard:', error);
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'warning' ? '#F59E0B' : type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        font-family: 'Cairo', sans-serif;
        font-weight: 600;
        font-size: 16px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
        word-wrap: break-word;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Save leaderboard data with backup (same as in names-setup.js)
function saveLeaderboardData(players) {
    try {
        // حفظ البيانات الأساسية
        localStorage.setItem('leaderboard', JSON.stringify(players));
        
        // إنشاء نسخة احتياطية
        localStorage.setItem('leaderboard_backup', JSON.stringify(players));
        
        // إنشاء نسخة احتياطية إضافية مع timestamp
        const timestamp = new Date().toISOString();
        localStorage.setItem(`leaderboard_backup_${timestamp}`, JSON.stringify(players));
        
        console.log('تم حفظ بيانات لوحة المتصدرين مع النسخ الاحتياطية');
    } catch (error) {
        console.error('Error saving leaderboard data:', error);
    }
}

// Start new game
function startNewGame() {
    try {
        console.log('🔄 Starting new game - clearing game data (keeping saved abilities)...');
        
        // Clear all game data for complete restart
        localStorage.removeItem('scores');
        localStorage.removeItem('currentRound');
        localStorage.removeItem('usedAbilities');
        localStorage.removeItem('abilityRequests');
        localStorage.removeItem('gameSetupProgress');
        localStorage.removeItem('gameStatus');
        localStorage.removeItem('gameUpdate');
        localStorage.removeItem('player1Abilities');
        localStorage.removeItem('player2Abilities');
        localStorage.removeItem('player1StrategicPicks');
        localStorage.removeItem('player2StrategicPicks');
        localStorage.removeItem('player1StrategicOrdered');
        localStorage.removeItem('player2StrategicOrdered');
        // ✅ لا نمسح savedAbilities - القدرات تبقى محفوظة دائماً
        
        // ✅ Clear swap deck related data
        localStorage.removeItem('swapDeckUsageData');
        localStorage.removeItem('swapDeckData');
        localStorage.removeItem('player1SwapDeckCards');
        localStorage.removeItem('player2SwapDeckCards');
        localStorage.removeItem('generatedCards');
        
        // Clear swap deck round keys
        for (let i = 0; i < 20; i++) {
            localStorage.removeItem(`player1SwapRound${i}`);
            localStorage.removeItem(`player2SwapRound${i}`);
        }
        
        // Clear game card selection data
        localStorage.removeItem('gameCardSelection');
        localStorage.removeItem('gameCardsGenerated');
        localStorage.removeItem('gameCardsData');
        
        // Clear player used abilities
        localStorage.removeItem('player1UsedAbilities');
        localStorage.removeItem('player2UsedAbilities');
        
        // Clear card arrangement data
        localStorage.removeItem('player1ArrangementCompleted');
        localStorage.removeItem('player2ArrangementCompleted');
        localStorage.removeItem('player1CardArrangement');
        localStorage.removeItem('player2CardArrangement');
        
        // Clear notes
        const player1Notes = localStorage.getItem('notes:' + player1);
        const player2Notes = localStorage.getItem('notes:' + player2);
        if (player1Notes) localStorage.removeItem('notes:' + player1);
        if (player2Notes) localStorage.removeItem('notes:' + player2);
        
        // Clear all notes keys
        for (let i = 0; i < 20; i++) {
            localStorage.removeItem(`notes:${player1}:round${i}`);
            localStorage.removeItem(`notes:${player2}:round${i}`);
        }
        
        // Reset global variables if they exist
        if (window.swapDeckUsageData) {
            window.swapDeckUsageData = { player1: false, player2: false };
        }
        if (window.swapDeckCardsGenerated) {
            window.swapDeckCardsGenerated = false;
        }
        if (window.swapDeckCardsData) {
            window.swapDeckCardsData = {
                player1: { cards: [], used: false },
                player2: { cards: [], used: false }
            };
        }
        if (window.gameCardsGenerated) {
            window.gameCardsGenerated = false;
        }
        if (window.gameCardsData) {
            window.gameCardsData = null;
        }
        
        console.log('✅ Game data cleared successfully (saved abilities preserved)');
        
        // Redirect to main page
        window.location.href = 'index.html';
        
        console.log('🎮 Starting new game...');
        
    } catch (error) {
        console.error('❌ Error starting new game:', error);
        alert('حدث خطأ في بدء لعبة جديدة: ' + error.message);
    }
}


// Initialize page
function initializePage() {
    try {
        console.log('Initializing final result page...');
        
        // Load game data
        loadGameData();
        
        // Determine winner
        determineWinner();
        
        // Display results
        displayResults();
        
        // Create celebration if there's a winner
        if (winner && winner !== "تعادل") {
            createCelebration();
        }
        
        console.log('Final result page initialized successfully');
        
    } catch (error) {
        console.error('Error initializing page:', error);
    }
}

// Make functions globally available
window.addPointToWinner = addPointToWinner;
window.startNewGame = startNewGame;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializePage);

// Also initialize immediately in case DOMContentLoaded already fired
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}
