// Data Management
let goals = JSON.parse(localStorage.getItem('goals')) || [];
const progressCharts = {};
let newlyCreatedGoalId = null;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    migrateAllGoals();
    populateCategorySelect();
    loadGoals();
    setupEventListeners();
    setupAdminPanel();
    updateDashboard();
});

function migrateAllGoals() {
    let changed = false;
    goals = goals.map((goal) => {
        const migrated = migrateGoalCategory(goal);
        if (!goal.category) changed = true;
        return migrated;
    });
    if (changed) saveGoals();
}

// Event Listeners
function setupEventListeners() {
    document.getElementById('goalForm').addEventListener('submit', createGoal);

    const categorySelect = document.getElementById('goalCategory');
    categorySelect.addEventListener('change', updateCategoryHint);
}

function populateCategorySelect() {
    const select = document.getElementById('goalCategory');
    const options = getCategoryOptions();
    select.innerHTML = options
        .map((cat) => `<option value="${cat.id}">${cat.icon} ${escapeHtml(cat.name)}</option>`)
        .join('');
    updateCategoryHint();
}

function updateCategoryHint() {
    const select = document.getElementById('goalCategory');
    const hint = document.getElementById('categoryHint');
    const unitInput = document.getElementById('goalUnit');
    const category = getCategoryById(select.value);
    hint.textContent = category.description || 'Questions adapt to your goal type';

    if (!unitInput.value) {
        unitInput.placeholder = `e.g., ${getDefaultUnitForCategory(select.value)}`;
    }
}

// Admin Panel
function setupAdminPanel() {
    const toggle = document.getElementById('adminToggle');
    const panel = document.getElementById('adminPanel');

    toggle.addEventListener('click', () => {
        const isHidden = panel.hidden;
        panel.hidden = !isHidden;
        toggle.setAttribute('aria-expanded', String(isHidden));
        toggle.classList.toggle('admin-toggle-open', isHidden);
        if (isHidden) renderAdminCategoryList();
    });

    document.getElementById('addCategoryForm').addEventListener('submit', addCustomCategory);
}

function renderAdminCategoryList() {
    const container = document.getElementById('adminCategoryList');
    const categories = loadGoalCategories();

    container.innerHTML = Object.values(categories)
        .map((cat) => `
            <div class="admin-category-item ${cat.isDefault ? 'admin-category-default' : ''}">
                <div class="admin-category-info">
                    <span class="admin-category-icon">${cat.icon || '🎯'}</span>
                    <div>
                        <div class="admin-category-name">${escapeHtml(cat.name)}</div>
                        <div class="admin-category-meta">${cat.questions.length} questions${cat.isDefault ? ' · Built-in' : ' · Custom'}</div>
                    </div>
                </div>
                ${cat.isDefault ? '' : `<button type="button" class="btn btn-danger btn-sm" onclick="removeCustomCategory('${cat.id}')">Remove</button>`}
            </div>
        `)
        .join('');
}

function addCustomCategory(e) {
    e.preventDefault();

    const name = document.getElementById('newCategoryName').value.trim();
    const icon = document.getElementById('newCategoryIcon').value.trim() || '🎯';
    const description = document.getElementById('newCategoryDescription').value.trim();
    const lines = document.getElementById('newCategoryQuestions').value
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

    if (lines.length < 2) {
        alert('Add at least 2 journal questions.');
        return;
    }

    const questions = lines.map((line, index) => {
        const isProgress = line.endsWith('*');
        const label = isProgress ? line.slice(0, -1).trim() : line;
        const id = `q_${index}_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30)}`;
        const isNumber = /how many|hours|minutes|words|count|\$|amount/i.test(label);

        return {
            id,
            type: isNumber ? 'number' : 'textarea',
            label,
            required: true,
            isProgress,
            min: isNumber ? 0 : undefined,
            step: isNumber ? (label.includes('hour') ? 0.5 : 1) : undefined,
            placeholder: '',
        };
    });

    if (!questions.some((q) => q.isProgress)) {
        alert('Mark one question as the progress tracker by adding * at the end (e.g. "How many hours did you practice?*").');
        return;
    }

    const id = `custom_${Date.now()}`;
    saveCustomCategory({ id, name, icon, description, questions });
    populateCategorySelect();
    renderAdminCategoryList();
    document.getElementById('addCategoryForm').reset();
    document.getElementById('goalCategory').value = id;
    updateCategoryHint();
}

function removeCustomCategory(categoryId) {
    if (!confirm('Remove this custom category? Existing goals using it will fall back to Software Development.')) return;

    deleteCustomCategory(categoryId);
    goals.forEach((g) => {
        if (g.category === categoryId) g.category = 'software';
    });
    saveGoals();
    populateCategorySelect();
    renderAdminCategoryList();
    loadGoals();
}

// Create Goal
function createGoal(e) {
    e.preventDefault();

    const title = document.getElementById('goalTitle').value;
    const description = document.getElementById('goalDescription').value;
    const target = parseFloat(document.getElementById('goalTarget').value);
    const unit = document.getElementById('goalUnit').value;
    const deadline = parseInt(document.getElementById('goalDeadline').value);
    const category = document.getElementById('goalCategory').value;

    const goal = {
        id: Date.now(),
        title,
        description,
        target,
        unit,
        deadline,
        category,
        currentProgress: 0,
        createdAt: new Date().toISOString(),
        progressLogs: [],
        milestones: { 25: null, 50: null, 75: null, 100: null },
        streakData: { currentStreak: 0, longestStreak: 0, lastLogDate: null },
        estimatedCompletionDate: null,
    };

    goals.push(goal);
    newlyCreatedGoalId = goal.id;
    saveGoals();
    loadGoals();
    document.getElementById('goalForm').reset();
    populateCategorySelect();
    updateDashboard();
}

// Load and Display Goals
function loadGoals() {
    const goalsList = document.getElementById('goalsList');
    destroyAllCharts();

    if (goals.length === 0) {
        goalsList.innerHTML = '<p class="empty-state">No goals yet. Create one to get started.</p>';
        return;
    }

    goalsList.innerHTML = '';
    goals.forEach((goal) => {
        const block = createGoalBlock(goal);
        goalsList.appendChild(block);
        populateGoalDashboard(goal);
    });

    if (newlyCreatedGoalId) {
        const newBlock = document.querySelector(`[data-goal-id="${newlyCreatedGoalId}"]`);
        if (newBlock) {
            newBlock.classList.add('goal-block-new');
            requestAnimationFrame(() => {
                newBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            setTimeout(() => newBlock.classList.remove('goal-block-new'), 800);
        }
        newlyCreatedGoalId = null;
    }
}

// Create integrated goal block (card + inline dashboard)
function createGoalBlock(goal) {
    const block = document.createElement('div');
    block.className = 'goal-block';
    block.dataset.goalId = goal.id;

    const startDate = new Date(goal.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    const category = getCategoryById(goal.category);

    block.innerHTML = `
        <div class="goal-card">
            <div class="card-header">
                <div>
                    <div class="goal-category-badge">${category.icon} ${escapeHtml(category.name)}</div>
                    <div class="card-title">${escapeHtml(goal.title)}</div>
                    ${goal.description ? `<div class="card-description">${escapeHtml(goal.description)}</div>` : ''}
                    <div class="card-start-date">Started ${startDate}</div>
                </div>
            </div>
        </div>

        <div class="goal-dashboard">
            <div class="goal-stats-grid" id="stats-${goal.id}"></div>

            <div class="status-section">
                <div id="status-${goal.id}" class="status-badge"></div>
            </div>

            <div class="progress-bar-section">
                <div class="progress-bar-container">
                    <div id="progressBar-${goal.id}" class="progress-bar-fill"></div>
                </div>
                <p id="progressText-${goal.id}" class="progress-bar-text"></p>
            </div>

            <div class="milestones-section">
                <h3>Milestones</h3>
                <div id="milestones-${goal.id}" class="milestones-grid"></div>
            </div>

            <div class="chart-section">
                <h3>Progress Over Time</h3>
                <div class="chart-wrapper">
                    <canvas id="chart-${goal.id}"></canvas>
                </div>
            </div>

            <div class="journal-section" id="journal-${goal.id}"></div>

            <div class="insights-section" id="insights-${goal.id}"></div>

            <div class="history-section">
                <h3>Progress Journal</h3>
                <p class="section-subtitle">Your coaching session history</p>
                <div id="history-${goal.id}" class="history-list journal-timeline"></div>
            </div>

            <button class="btn btn-danger" onclick="deleteGoal(${goal.id})">Delete Goal</button>
        </div>
    `;

    return block;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Render goal-specific journal form
function renderJournalForm(goal) {
    const container = document.getElementById(`journal-${goal.id}`);
    if (!container) return;

    const category = getCategoryById(goal.category);
    const progressQ = getProgressQuestion(category);

    const questionsHtml = category.questions
        .map((q) => {
            const fieldId = `journal-${goal.id}-${q.id}`;
            const required = q.required ? 'required' : '';
            let input = '';

            if (q.type === 'textarea') {
                input = `<textarea id="${fieldId}" name="${q.id}" placeholder="${escapeHtml(q.placeholder || '')}" ${required}></textarea>`;
            } else if (q.type === 'select') {
                const opts = (q.options || []).map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join('');
                input = `<select id="${fieldId}" name="${q.id}" ${required}><option value="">Select...</option>${opts}</select>`;
            } else if (q.type === 'number') {
                input = `<input type="number" id="${fieldId}" name="${q.id}" min="${q.min ?? 0}" step="${q.step ?? 1}" placeholder="${escapeHtml(q.placeholder || '0')}" ${required}>`;
            } else {
                input = `<input type="text" id="${fieldId}" name="${q.id}" placeholder="${escapeHtml(q.placeholder || '')}" ${required}>`;
            }

            const progressBadge = q.isProgress ? '<span class="progress-field-badge">Tracks progress</span>' : '';

            return `
                <div class="journal-question ${q.isProgress ? 'journal-question-progress' : ''}">
                    <label for="${fieldId}">
                        ${escapeHtml(q.label)}
                        ${progressBadge}
                    </label>
                    ${input}
                </div>
            `;
        })
        .join('');

    container.innerHTML = `
        <div class="journal-header">
            <div class="journal-coach-avatar">🎯</div>
            <div>
                <h3>Today's Coaching Session</h3>
                <p class="journal-subtitle">Your personal coach for <strong>${escapeHtml(category.name)}</strong> — answer honestly to build momentum.</p>
            </div>
        </div>
        <form class="journal-form" data-goal-id="${goal.id}" onsubmit="submitJournalLog(event, ${goal.id})">
            <div class="journal-questions">
                ${questionsHtml}
            </div>
            <button type="submit" class="btn btn-success journal-submit">
                <span>Complete Today's Session</span>
            </button>
        </form>
    `;
}

// Submit journal log
function submitJournalLog(e, goalId) {
    e.preventDefault();

    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const category = getCategoryById(goal.category);
    const form = e.target;
    const answers = [];
    let progressAmount = 0;

    for (const question of category.questions) {
        const field = form.elements[question.id];
        if (!field) continue;

        const value = field.value.trim();
        if (question.required && !value) {
            alert(`Please answer: ${question.label}`);
            field.focus();
            return;
        }

        if (value) {
            answers.push({
                questionId: question.id,
                question: question.label,
                answer: value,
                type: question.type,
            });

            if (question.isProgress) {
                progressAmount = parseFloat(value) || 0;
            }
        }
    }

    if (progressAmount <= 0) {
        const progressQ = getProgressQuestion(category);
        alert(`Please enter a valid amount for: ${progressQ?.label || 'progress'}`);
        return;
    }

    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    goal.progressLogs.push({
        date: today,
        timestamp: new Date().toISOString(),
        type: 'journal',
        categoryId: goal.category,
        answers,
        amount: progressAmount,
    });

    goal.currentProgress += progressAmount;
    if (goal.currentProgress > goal.target) {
        goal.currentProgress = goal.target;
    }

    updateStreaks(goal);
    checkMilestones(goal);
    saveGoals();

    const block = document.querySelector(`[data-goal-id="${goalId}"]`);
    if (block) {
        block.classList.add('goal-block-updated');
        setTimeout(() => block.classList.remove('goal-block-updated'), 600);
    }

    populateGoalDashboard(goal);
    form.reset();
    updateDashboard();
}

// Populate all dashboard sections for a goal
function populateGoalDashboard(goal) {
    const percentage = (goal.currentProgress / goal.target) * 100;
    const daysRemaining = getDaysRemaining(goal);
    const { currentPace, requiredPace } = calculatePaces(goal);
    const status = getGoalStatus(goal);
    const estimatedCompletion = calculateEstimatedCompletion(goal);

    const statsGrid = document.getElementById(`stats-${goal.id}`);
    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Progress</div>
                <div class="stat-value">${percentage.toFixed(1)}%</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Days Remaining</div>
                <div class="stat-value">${daysRemaining}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Current Pace</div>
                <div class="stat-value">${currentPace.toFixed(2)}</div>
                <div class="stat-subtext">/day</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Required Pace</div>
                <div class="stat-value">${requiredPace.toFixed(2)}</div>
                <div class="stat-subtext">/day</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Current Streak</div>
                <div class="stat-value">${goal.streakData.currentStreak}</div>
                <div class="stat-subtext">days</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Est. Completion</div>
                <div class="stat-value">${estimatedCompletion}</div>
                <div class="stat-subtext">date</div>
            </div>
        `;
    }

    const statusBadge = document.getElementById(`status-${goal.id}`);
    if (statusBadge) {
        statusBadge.className = `status-badge ${status.class}`;
        statusBadge.textContent = status.text;
    }

    const progressBar = document.getElementById(`progressBar-${goal.id}`);
    if (progressBar) {
        progressBar.style.width = `${Math.min(percentage, 100)}%`;
    }

    const progressText = document.getElementById(`progressText-${goal.id}`);
    if (progressText) {
        progressText.textContent = `${goal.currentProgress.toFixed(1)} / ${goal.target} ${goal.unit}`;
    }

    renderJournalForm(goal);
    updateMilestones(goal);
    updateProgressChart(goal);
    updateProgressHistory(goal);
    renderWeeklyInsights(goal);
}

// Generate weekly coaching insights from journal data
function generateWeeklyInsights(goal) {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weekLogs = goal.progressLogs.filter((log) => new Date(log.timestamp) >= weekAgo);
    const category = getCategoryById(goal.category);

    if (weekLogs.length === 0) {
        return {
            hasData: false,
            message: 'Log your first coaching session to unlock weekly insights, pattern detection, and personalized feedback.',
        };
    }

    const totalAmount = weekLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
    const avgPerSession = totalAmount / weekLogs.length;
    const consistency = weekLogs.length;
    const consistencyRating = consistency >= 6 ? 'excellent' : consistency >= 4 ? 'good' : consistency >= 2 ? 'moderate' : 'low';

    const allAnswers = weekLogs.flatMap((log) => log.answers || []);
    const wordFrequency = {};
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'i', 'my', 'me', 'we', 'our', 'you', 'your', 'it', 'its', 'this', 'that', 'today', 'tomorrow', 'yesterday']);

    allAnswers.forEach(({ answer }) => {
        if (!answer || typeof answer !== 'string') return;
        answer.toLowerCase().split(/\W+/).forEach((word) => {
            if (word.length > 3 && !stopWords.has(word)) {
                wordFrequency[word] = (wordFrequency[word] || 0) + 1;
            }
        });
    });

    const topThemes = Object.entries(wordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);

    const nextMilestoneAnswers = allAnswers
        .filter((a) => /next|milestone|tomorrow|improve|revise|goal/i.test(a.question))
        .map((a) => a.answer)
        .slice(-3);

    const challengeAnswers = allAnswers
        .filter((a) => /challenge|difficult|bug|overcome/i.test(a.question))
        .map((a) => a.answer)
        .filter(Boolean);

    const insights = [];
    const recommendations = [];

    insights.push(`You logged <strong>${consistency}</strong> coaching session${consistency !== 1 ? 's' : ''} this week, totaling <strong>${totalAmount.toFixed(1)} ${goal.unit}</strong>.`);

    if (consistencyRating === 'excellent') {
        insights.push('Your consistency is <strong>excellent</strong> — you\'re building powerful habits.');
    } else if (consistencyRating === 'good') {
        insights.push('Good consistency this week. Push for one more session to maximize momentum.');
    } else if (consistencyRating === 'moderate') {
        insights.push('Moderate activity detected. Increasing session frequency will accelerate your progress.');
        recommendations.push('Try scheduling a fixed daily coaching session at the same time.');
    } else {
        insights.push('Low activity this week. Small daily sessions compound into major results.');
        recommendations.push('Start with just 15 minutes — consistency beats intensity.');
    }

    if (topThemes.length > 0) {
        insights.push(`Recurring focus areas: <strong>${topThemes.join(', ')}</strong>.`);
    }

    if (challengeAnswers.length > 0) {
        insights.push(`You've tackled <strong>${challengeAnswers.length}</strong> challenge${challengeAnswers.length !== 1 ? 's' : ''} this week — great problem-solving mindset.`);
    }

    if (avgPerSession < goal.target / goal.deadline) {
        recommendations.push(`Your average session (${avgPerSession.toFixed(1)} ${goal.unit}) is below your required daily pace. Consider longer or more focused sessions.`);
    } else {
        recommendations.push('Your session output is on pace. Maintain this rhythm to hit your deadline.');
    }

    if (nextMilestoneAnswers.length > 0) {
        recommendations.push(`Upcoming focus: "${nextMilestoneAnswers[nextMilestoneAnswers.length - 1]}"`);
    }

    const weeklySummary = buildAISummaryText(goal, weekLogs, category, {
        consistency,
        totalAmount,
        topThemes,
        consistencyRating,
    });

    return {
        hasData: true,
        consistency,
        totalAmount,
        avgPerSession,
        consistencyRating,
        topThemes,
        insights,
        recommendations,
        weeklySummary,
    };
}

function buildAISummaryText(goal, weekLogs, category, stats) {
    const categoryName = category.name;
    const highlights = weekLogs
        .flatMap((log) => (log.answers || []).filter((a) => a.type === 'textarea' || a.type === 'text').slice(0, 2))
        .map((a) => a.answer)
        .slice(0, 3);

    let summary = `Weekly Review — ${goal.title} (${categoryName})\n\n`;
    summary += `This week you completed ${stats.consistency} coaching sessions, advancing ${stats.totalAmount.toFixed(1)} ${goal.unit} toward your ${goal.target} ${goal.unit} target. `;

    if (stats.consistencyRating === 'excellent') {
        summary += 'Your consistency demonstrates strong commitment to your goal. ';
    } else if (stats.consistencyRating === 'low') {
        summary += 'Increasing your logging frequency would significantly boost your progress trajectory. ';
    }

    if (stats.topThemes.length > 0) {
        summary += `Key themes in your journal: ${stats.topThemes.join(', ')}. `;
    }

    if (highlights.length > 0) {
        summary += `Notable accomplishments include work on: ${highlights.map((h) => `"${h.slice(0, 60)}${h.length > 60 ? '...' : ''}"`).join(', ')}. `;
    }

    summary += 'Keep showing up — your coach is tracking every session.';
    return summary;
}

function renderWeeklyInsights(goal) {
    const container = document.getElementById(`insights-${goal.id}`);
    if (!container) return;

    const data = generateWeeklyInsights(goal);

    if (!data.hasData) {
        container.innerHTML = `
            <div class="insights-card insights-empty">
                <div class="insights-header">
                    <span class="insights-icon">🧠</span>
                    <h3>Weekly Coaching Insights</h3>
                </div>
                <p class="insights-placeholder">${data.message}</p>
            </div>
        `;
        return;
    }

    const ratingClass = `insights-rating-${data.consistencyRating}`;

    container.innerHTML = `
        <div class="insights-card">
            <div class="insights-header">
                <span class="insights-icon">🧠</span>
                <div>
                    <h3>Weekly Coaching Insights</h3>
                    <span class="insights-rating ${ratingClass}">${data.consistencyRating} consistency</span>
                </div>
            </div>

            <div class="insights-stats">
                <div class="insight-stat">
                    <span class="insight-stat-value">${data.consistency}</span>
                    <span class="insight-stat-label">Sessions</span>
                </div>
                <div class="insight-stat">
                    <span class="insight-stat-value">${data.totalAmount.toFixed(1)}</span>
                    <span class="insight-stat-label">${escapeHtml(goal.unit)} logged</span>
                </div>
                <div class="insight-stat">
                    <span class="insight-stat-value">${data.avgPerSession.toFixed(1)}</span>
                    <span class="insight-stat-label">Avg / session</span>
                </div>
            </div>

            <div class="insights-body">
                <h4>Patterns & Progress</h4>
                <ul class="insights-list">
                    ${data.insights.map((i) => `<li>${i}</li>`).join('')}
                </ul>

                <h4>Coach Recommendations</h4>
                <ul class="insights-list insights-recommendations">
                    ${data.recommendations.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}
                </ul>

                <div class="ai-summary">
                    <h4>AI Weekly Summary</h4>
                    <p>${escapeHtml(data.weeklySummary)}</p>
                </div>
            </div>
        </div>
    `;
}

// Calculate Current and Required Pace
function calculatePaces(goal) {
    const daysElapsed = getDaysElapsed(goal.createdAt);
    const daysRemaining = getDaysRemaining(goal);

    const currentPace = daysElapsed > 0 ? goal.currentProgress / daysElapsed : 0;
    const remainingAmount = Math.max(0, goal.target - goal.currentProgress);
    const requiredPace = daysRemaining > 0 ? remainingAmount / daysRemaining : 0;

    return { currentPace, requiredPace };
}

// Get Goal Status
function getGoalStatus(goal) {
    const { currentPace, requiredPace } = calculatePaces(goal);

    if (currentPace >= requiredPace * 1.1) {
        return { text: 'Ahead of Schedule', class: 'ahead' };
    } else if (currentPace >= requiredPace * 0.9) {
        return { text: 'On Track', class: 'on-track' };
    } else {
        return { text: 'Behind Schedule', class: 'behind' };
    }
}

function getDaysRemaining(goal) {
    const created = new Date(goal.createdAt);
    const today = new Date();
    const elapsedDays = Math.floor((today - created) / (1000 * 60 * 60 * 24));
    return Math.max(0, goal.deadline - elapsedDays);
}

function getDaysElapsed(createdAt) {
    const created = new Date(createdAt);
    const today = new Date();
    return Math.max(1, Math.floor((today - created) / (1000 * 60 * 60 * 24)) + 1);
}

function calculateEstimatedCompletion(goal) {
    const { currentPace } = calculatePaces(goal);
    if (currentPace === 0) return '-';

    const remainingAmount = Math.max(0, goal.target - goal.currentProgress);
    const daysToComplete = Math.ceil(remainingAmount / currentPace);
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + daysToComplete);

    return completionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function updateStreaks(goal) {
    const today = new Date().toLocaleDateString();
    const lastLog = goal.progressLogs[goal.progressLogs.length - 2];
    const lastLogDate = lastLog ? new Date(lastLog.timestamp).toLocaleDateString() : null;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastLogDate === yesterday.toLocaleDateString()) {
        goal.streakData.currentStreak += 1;
    } else if (lastLogDate !== today) {
        goal.streakData.currentStreak = 1;
    }

    if (goal.streakData.currentStreak > goal.streakData.longestStreak) {
        goal.streakData.longestStreak = goal.streakData.currentStreak;
    }

    goal.streakData.lastLogDate = today;
}

function checkMilestones(goal) {
    const percentage = (goal.currentProgress / goal.target) * 100;
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    [25, 50, 75, 100].forEach((milestone) => {
        if (percentage >= milestone && !goal.milestones[milestone]) {
            goal.milestones[milestone] = today;
        }
    });
}

function updateMilestones(goal) {
    const container = document.getElementById(`milestones-${goal.id}`);
    if (!container) return;

    container.innerHTML = '';
    [25, 50, 75, 100].forEach((milestone) => {
        const card = document.createElement('div');
        card.className = `milestone-card ${goal.milestones[milestone] ? 'completed' : ''}`;
        card.innerHTML = `
            <div class="milestone-percent">${milestone}%</div>
            <div class="milestone-status">${goal.milestones[milestone] ? '✓' : '—'}</div>
            <div class="milestone-date">${goal.milestones[milestone] || 'Not reached'}</div>
        `;
        container.appendChild(card);
    });
}

function updateProgressChart(goal) {
    const canvas = document.getElementById(`chart-${goal.id}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const logs = goal.progressLogs.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    const labels = logs.map((log) => log.date);
    const data = [];
    let cumulative = 0;

    logs.forEach((log) => {
        cumulative += log.amount || 0;
        data.push(cumulative);
    });

    if (progressCharts[goal.id]) {
        progressCharts[goal.id].destroy();
    }

    progressCharts[goal.id] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length > 0 ? labels : ['No data'],
            datasets: [{
                label: `Progress (${goal.unit})`,
                data: data.length > 0 ? data : [0],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#cbd5e1' } } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: goal.target,
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' },
                },
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: '#334155' },
                },
            },
        },
    });
}

function updateProgressHistory(goal) {
    const container = document.getElementById(`history-${goal.id}`);
    if (!container) return;

    const logs = goal.progressLogs.slice().reverse();

    if (logs.length === 0) {
        container.innerHTML = '<p class="empty-state history-empty">No journal entries yet. Complete your first coaching session above.</p>';
        return;
    }

    container.innerHTML = '';
    logs.forEach((log, index) => {
        const item = document.createElement('div');
        item.className = 'journal-entry';

        if (log.type === 'journal' && log.answers) {
            const answersHtml = log.answers
                .map((a) => `
                    <div class="journal-answer">
                        <div class="journal-answer-q">${escapeHtml(a.question)}</div>
                        <div class="journal-answer-a">${escapeHtml(a.answer)}</div>
                    </div>
                `)
                .join('');

            item.innerHTML = `
                <div class="journal-entry-header" onclick="toggleJournalEntry(this)">
                    <div class="journal-entry-date">
                        <span class="journal-entry-icon">📝</span>
                        ${log.date}
                    </div>
                    <div class="journal-entry-summary">
                        <span class="history-amount">+${log.amount} ${escapeHtml(goal.unit)}</span>
                        <span class="journal-entry-toggle">${index === 0 ? '▼' : '▶'}</span>
                    </div>
                </div>
                <div class="journal-entry-body ${index === 0 ? 'journal-entry-expanded' : ''}">
                    ${answersHtml}
                </div>
            `;
        } else {
            item.innerHTML = `
                <div class="journal-entry-header">
                    <div class="journal-entry-date">${log.date}</div>
                    <div class="journal-entry-summary">
                        <span class="history-amount">+${log.amount || 0} ${escapeHtml(goal.unit)}</span>
                    </div>
                </div>
                <div class="journal-entry-body journal-entry-expanded">
                    ${log.notes ? `<div class="journal-answer"><div class="journal-answer-a">${escapeHtml(log.notes)}</div></div>` : '<div class="journal-answer"><div class="journal-answer-a">Legacy entry</div></div>'}
                </div>
            `;
        }

        container.appendChild(item);
    });
}

function toggleJournalEntry(header) {
    const body = header.nextElementSibling;
    const toggle = header.querySelector('.journal-entry-toggle');
    const isExpanded = body.classList.contains('journal-entry-expanded');

    body.classList.toggle('journal-entry-expanded', !isExpanded);
    if (toggle) toggle.textContent = isExpanded ? '▶' : '▼';
}

function deleteGoal(goalId) {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    if (progressCharts[goalId]) {
        progressCharts[goalId].destroy();
        delete progressCharts[goalId];
    }

    goals = goals.filter((g) => g.id !== goalId);
    saveGoals();
    loadGoals();
    updateDashboard();
}

function destroyAllCharts() {
    Object.keys(progressCharts).forEach((id) => {
        progressCharts[id].destroy();
        delete progressCharts[id];
    });
}

function updateDashboard() {
    const totalGoals = goals.length;
    const completedGoals = goals.filter((g) => (g.currentProgress / g.target) * 100 >= 100).length;
    const totalProgress = goals.reduce((sum, g) => sum + g.currentProgress, 0);

    const currentStreaks = goals.map((g) => g.streakData.currentStreak);
    const longestStreaks = goals.map((g) => g.streakData.longestStreak);
    const maxCurrentStreak = currentStreaks.length > 0 ? Math.max(...currentStreaks) : 0;
    const maxLongestStreak = longestStreaks.length > 0 ? Math.max(...longestStreaks) : 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const activeDays = new Set();

    goals.forEach((goal) => {
        goal.progressLogs.forEach((log) => {
            const logDate = new Date(log.timestamp);
            if (logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear) {
                activeDays.add(logDate.toLocaleDateString());
            }
        });
    });

    document.getElementById('totalGoals').textContent = totalGoals;
    document.getElementById('completedGoals').textContent = completedGoals;
    document.getElementById('currentStreak').textContent = maxCurrentStreak;
    document.getElementById('longestStreak').textContent = maxLongestStreak;
    document.getElementById('activeDays').textContent = activeDays.size;
    document.getElementById('totalProgress').textContent = totalProgress.toFixed(1);
}

function saveGoals() {
    localStorage.setItem('goals', JSON.stringify(goals));
}
