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
        // Check if this is a tournament match
        const currentMatchId = localStorage.getItem('currentMatchId');
        const currentMatchPlayers = localStorage.getItem('currentMatchPlayers');
        
        if (currentMatchId && currentMatchPlayers) {
            // Tournament mode - use tournament player names
            const players = JSON.parse(currentMatchPlayers);
            player1 = players[0];
            player2 = players[1];
            console.log('Tournament mode - Player names:', { player1, player2 });
        } else {
            // Regular challenge mode
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
            console.log('Challenge mode - Player names loaded:', { player1, player2 });
        }
        
        // Load scores - إصلاح شامل للمشكلة
        const scoresData = localStorage.getItem('scores');
        if (scoresData) {
            const rawScores = JSON.parse(scoresData);
            console.log('Raw scores from localStorage:', rawScores);
            
            // إصلاح شامل: نأخذ النتائج بالطريقة الصحيحة تماماً
            scores = {};
            
            // البحث عن النتائج باستخدام أسماء اللاعبين المحفوظة في localStorage
            const scoreKeys = Object.keys(rawScores);
            console.log('Available score keys:', scoreKeys);
            
            // إصلاح شامل: نأخذ النتائج بالترتيب الصحيح تماماً كما حفظها النظام الأساسي
            if (scoreKeys.length === 2) {
                const [key1, key2] = scoreKeys;
                const [value1, value2] = Object.values(rawScores);
                
                console.log(`Found two scores: ${key1}=${value1}, ${key2}=${value2}`);
                
                // إصلاح شامل: نأخذ النتائج بالترتيب الصحيح تماماً كما حفظها النظام الأساسي
                // النتيجة الأولى للاعب الأول، الثانية للاعب الثاني
                // لكن نعكسها للعرض الصحيح
                scores[player1] = value2;
                scores[player2] = value1;
                
                console.log('Assigned scores by order:', { 
                    [player1]: scores[player1], 
                    [player2]: scores[player2] 
                });
                
            } else {
                // إذا كان هناك أكثر من مفتاحين أو أقل، نبحث بالأسماء
                let player1Score = null;
                let player2Score = null;
                
                // البحث المباشر بالأسماء الحالية
                if (rawScores[player1] !== undefined) {
                    player1Score = rawScores[player1];
                    console.log(`Found ${player1} score: ${player1Score}`);
                }
                if (rawScores[player2] !== undefined) {
                    player2Score = rawScores[player2];
                    console.log(`Found ${player2} score: ${player2Score}`);
                }
                
                // إذا لم نجد النتائج بالأسماء الحالية، نبحث بالأسماء الافتراضية
                if (player1Score === null && rawScores["لاعب 1"] !== undefined) {
                    player1Score = rawScores["لاعب 1"];
                    console.log(`Found "لاعب 1" score: ${player1Score}`);
                }
                if (player2Score === null && rawScores["لاعب 2"] !== undefined) {
                    player2Score = rawScores["لاعب 2"];
                    console.log(`Found "لاعب 2" score: ${player2Score}`);
                }
                
                // تعيين النتائج النهائية
                scores[player1] = player1Score !== null ? player1Score : 0;
                scores[player2] = player2Score !== null ? player2Score : 0;
            }
            
            console.log('Final loaded scores:', { 
                [player1]: scores[player1], 
                [player2]: scores[player2] 
            });
            
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
        
        console.log('Final loaded game data:', { player1, player2, scores });
        
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
    console.log('Determining winner with scores:', scores);
    console.log(`${player1} score: ${scores[player1]}, ${player2} score: ${scores[player2]}`);
    
    // إصلاح دقيق: نأخذ النتائج بالترتيب الصحيح تماماً كما حفظها النظام الأساسي
    const player1Score = scores[player1];
    const player2Score = scores[player2];
    
    console.log(`Comparing scores: ${player1Score} vs ${player2Score}`);
    
    // Check if this is a tournament match
    const isTournamentMatch = localStorage.getItem('currentMatchId') !== null;
    
    if (player1Score > player2Score) {
        winner = player1;
        winnerName = player1;
        console.log(`Winner: ${player1} (${player1Score} > ${player2Score})`);
        // إضافة نتيجة المباراة إلى لوحة المتصدرين
        addGameResultToLeaderboard(player1, player2);
    } else if (player2Score > player1Score) {
        winner = player2;
        winnerName = player2;
        console.log(`Winner: ${player2} (${player2Score} > ${player1Score})`);
        // إضافة نتيجة المباراة إلى لوحة المتصدرين
        addGameResultToLeaderboard(player2, player1);
    } else {
        // Draw/Tie
        if (isTournamentMatch) {
            winner = "تعادل";
            winnerName = "تعادل";
            console.log("⚠️ تعادل في طور البطولة - يجب إعادة المباراة");
        } else {
            winner = "تعادل";
            winnerName = "تعادل";
            console.log("تعادل - لن يتم إضافة نتيجة إلى لوحة المتصدرين");
        }
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
        console.log('Displaying results with data:', { player1, player2, scores });
        
        // Update player scores
        const player1ScoreElement = document.getElementById('player1Score');
        const player2ScoreElement = document.getElementById('player2Score');
        const winnerTextElement = document.getElementById('winnerText');
        
        if (player1ScoreElement) {
            player1ScoreElement.textContent = `${player1}: ${scores[player1]} نقطة صحة`;
            console.log(`Displaying ${player1} score: ${scores[player1]} in player1 position`);
        }
        
        if (player2ScoreElement) {
            player2ScoreElement.textContent = `${player2}: ${scores[player2]} نقطة صحة`;
            console.log(`Displaying ${player2} score: ${scores[player2]} in player2 position`);
        }
        
        if (winnerTextElement) {
            const isTournamentMatch = localStorage.getItem('currentMatchId') !== null;
            if (winner === "تعادل") {
                if (isTournamentMatch) {
                    winnerTextElement.textContent = "⚠️ تعادل - يجب إعادة المباراة!";
                    winnerTextElement.style.color = '#FFA500';
                } else {
                    winnerTextElement.textContent = "النتيجة: تعادل";
                }
            } else {
                winnerTextElement.textContent = `الفائز هو: ${winner}`;
            }
            console.log(`Winner displayed: ${winner}`);
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
            
            // إضافة النقاط إلى لوحة المتصدرين (فقط إذا كان التحدي مفعل)
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
        // التحقق من تفعيل التحدي - يجب أن يكون مفعل لإضافة النقاط
        const gameSetup = localStorage.getItem('gameSetupProgress');
        if (!gameSetup) {
            console.log('لا توجد بيانات إعدادات - لن يتم إضافة النقاط للوحة المتصدرين');
            return;
        }
        
        const setup = JSON.parse(gameSetup);
        if (!setup.advancedMode) {
            console.log('التحدي غير مفعل - لن يتم إضافة النقاط للوحة المتصدرين');
            return;
        }
        
        const leaderboardData = localStorage.getItem('leaderboard');
        let players = leaderboardData ? JSON.parse(leaderboardData) : [];
        
        // البحث عن اللاعب أو إنشاؤه
        let player = players.find(p => p.name === playerName);
        if (!player) {
            player = { name: playerName, wins: 0, losses: 0, games: 0, points: 0, winRate: 0 };
            players.push(player);
        }
        
        // إضافة نقطة فقط (بدون إضافة فوز أو خسارة لأنها تمت بالفعل)
        player.points = (player.points || 0) + 1;
        
        // حساب معدل الفوز
        player.winRate = Math.round((player.wins / player.games) * 100);
        
        // حفظ البيانات مع النسخ الاحتياطية
        saveLeaderboardData(players);
        
        console.log(`تم إضافة نقطة للاعب ${playerName} في لوحة المتصدرين`);
        console.log(`إحصائيات ${playerName}: ${player.wins} فوز، ${player.losses} خسارة، ${player.games} مباراة، ${player.points} نقطة، ${player.winRate}% معدل فوز`);
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
        console.log('🔄 Starting new game - comprehensive data clearing...');
        
        // استخدام الدالة المركزية من card.js
        if (window.clearGameData) {
            window.clearGameData();
        } else {
            console.warn('⚠️ clearGameData function not found');
        }
        
        console.log('✅ Game data cleared successfully');
        
        // Redirect to main page
        window.location.href = 'index.html';
        
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
        
        // إضافة تحقق إضافي لضمان صحة البيانات
        console.log('Verifying loaded data:', { player1, player2, scores });
        
        // التأكد من أن النتائج موجودة وصحيحة
        if (typeof scores[player1] === 'undefined' || typeof scores[player2] === 'undefined') {
            console.warn('Scores are undefined, setting defaults');
            scores[player1] = scores[player1] || 0;
            scores[player2] = scores[player2] || 0;
        }
        
        // Determine winner
        determineWinner();
        
        // Display results
        displayResults();
        
        // Create celebration if there's a winner
        if (winner && winner !== "تعادل") {
            createCelebration();
        }
        
        console.log('Final result page initialized successfully');
        
        // Handle tournament mode if applicable
        handleTournamentResult();
        
    } catch (error) {
        console.error('Error initializing page:', error);
    }
}

// Tournament mode handling
function handleTournamentResult() {
    const currentMatchId = localStorage.getItem('currentMatchId');
    
    if (currentMatchId) {
        // This is a tournament match
        console.log('Tournament match detected, winner:', winnerName);
        
        // Check if it's a draw - must replay the match
        if (winnerName === "تعادل") {
            console.log('⚠️ Draw detected in tournament - match must be replayed');
            
            // Save draw status
            localStorage.setItem('matchWinner', 'DRAW_REPLAY');
            
            // Add tournament-specific UI elements
            addTournamentUI();
            
            // Override the "New Game" button to replay the match
            const newGameBtn = document.getElementById('newGameBtn');
            if (newGameBtn) {
                newGameBtn.textContent = '🔄 إعادة المباراة';
                newGameBtn.style.background = 'linear-gradient(135deg, #FFA500, #FF8C00)';
                newGameBtn.onclick = function() {
                    // Return to bracket which will handle the replay
                    window.location.href = 'tournament-bracket.html';
                };
            }
        } else {
            // There is a winner
            // Save winner for tournament bracket
            localStorage.setItem('matchWinner', winnerName);
            
            // Update leaderboard
            updateTournamentLeaderboard();
            
            // Add tournament-specific UI elements
            addTournamentUI();
            
            // Override the "New Game" button to return to tournament
            const newGameBtn = document.getElementById('newGameBtn');
            if (newGameBtn) {
                newGameBtn.textContent = 'العودة للجدول';
                newGameBtn.onclick = function() {
                    window.location.href = 'tournament-bracket.html';
                };
            }
        }
    }
}

function updateTournamentLeaderboard() {
    const currentMatchPlayers = JSON.parse(localStorage.getItem('currentMatchPlayers'));
    const loser = currentMatchPlayers.find(player => player !== winnerName);
    
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || {};
    
    if (!leaderboard[winnerName]) leaderboard[winnerName] = {wins: 0, losses: 0};
    if (!leaderboard[loser]) leaderboard[loser] = {wins: 0, losses: 0};
    
    leaderboard[winnerName].wins++;
    leaderboard[loser].losses++;
    
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    console.log('Tournament leaderboard updated:', leaderboard);
}

function addTournamentUI() {
    const winnerSection = document.querySelector('.winner-section');
    if (winnerSection) {
        const tournamentBadge = document.createElement('div');
        tournamentBadge.style.cssText = `
            font-size: 48px;
            text-align: center;
            margin: 15px 0;
            filter: drop-shadow(0 2px 8px rgba(255, 152, 0, 0.3));
        `;
        tournamentBadge.innerHTML = '🏆';
        winnerSection.appendChild(tournamentBadge);
    }
}

// Make functions globally available
window.addPointToWinner = addPointToWinner;
window.startNewGame = startNewGame;
window.handleTournamentResult = handleTournamentResult;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializePage);

// Also initialize immediately in case DOMContentLoaded already fired
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}
