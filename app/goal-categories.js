// Default goal category templates — admins can add custom categories via localStorage
const DEFAULT_GOAL_CATEGORIES = {
    software: {
        id: 'software',
        name: 'Software Development / Programming',
        icon: '💻',
        description: 'Track builds, features, learning, and coding hours',
        isDefault: true,
        questions: [
            { id: 'built', type: 'textarea', label: 'What did you build today?', required: true, placeholder: 'Describe what you shipped or prototyped...' },
            { id: 'feature', type: 'text', label: 'What feature did you work on?', required: true, placeholder: 'e.g., User authentication flow' },
            { id: 'concept', type: 'text', label: 'What new concept did you learn?', required: false, placeholder: 'e.g., Async iterators, design patterns...' },
            { id: 'technology', type: 'text', label: 'What new code, framework, or technology did you use?', required: false, placeholder: 'e.g., React hooks, PostgreSQL...' },
            { id: 'hours_coded', type: 'number', label: 'How many hours did you code today?', required: true, isProgress: true, min: 0, step: 0.5, placeholder: '0' },
            { id: 'challenge', type: 'textarea', label: 'What challenge or bug did you solve?', required: false, placeholder: 'Describe the problem and your solution...' },
            { id: 'next_milestone', type: 'text', label: 'What is your next development milestone?', required: true, placeholder: 'e.g., Deploy MVP to staging' },
        ],
    },
    content: {
        id: 'content',
        name: 'Content Creation',
        icon: '🎬',
        description: 'Track content output, platforms, and audience insights',
        isDefault: true,
        questions: [
            { id: 'created', type: 'textarea', label: 'What content did you create today?', required: true, placeholder: 'Describe your content...' },
            { id: 'published_count', type: 'number', label: 'How many posts, videos, articles, or pieces of content did you publish?', required: true, isProgress: true, min: 0, step: 1, placeholder: '0' },
            { id: 'platform', type: 'text', label: 'What platform did you post on?', required: true, placeholder: 'e.g., YouTube, Instagram, Blog' },
            { id: 'hours_spent', type: 'number', label: 'How many hours did you spend creating?', required: true, min: 0, step: 0.5, placeholder: '0' },
            { id: 'best_performer', type: 'text', label: 'What content performed best today?', required: false, placeholder: 'Title or metrics...' },
            { id: 'audience_insight', type: 'textarea', label: 'What did you learn about your audience?', required: false, placeholder: 'Engagement patterns, feedback...' },
            { id: 'next_content_goal', type: 'text', label: 'What is your next content goal?', required: true, placeholder: 'e.g., Publish 3 reels this week' },
        ],
    },
    video_editing: {
        id: 'video_editing',
        name: 'Video Editing',
        icon: '🎞️',
        description: 'Track edits, techniques, and creative growth',
        isDefault: true,
        questions: [
            { id: 'project', type: 'text', label: 'What project did you edit today?', required: true, placeholder: 'e.g., Client promo reel' },
            { id: 'minutes_edited', type: 'number', label: 'How many minutes of footage did you edit?', required: true, isProgress: true, min: 0, step: 1, placeholder: '0' },
            { id: 'technique', type: 'text', label: 'What editing technique did you learn?', required: false, placeholder: 'e.g., Color grading, J-cuts...' },
            { id: 'software', type: 'text', label: 'What software did you use?', required: true, placeholder: 'e.g., Premiere Pro, DaVinci Resolve' },
            { id: 'challenge', type: 'textarea', label: 'What editing challenge did you overcome?', required: false, placeholder: 'Describe the obstacle and fix...' },
            { id: 'improve_tomorrow', type: 'text', label: 'What will you improve tomorrow?', required: true, placeholder: 'e.g., Faster rough cuts' },
        ],
    },
    study: {
        id: 'study',
        name: 'Student / Study',
        icon: '📚',
        description: 'Track subjects, study hours, and learning progress',
        isDefault: true,
        questions: [
            { id: 'subject', type: 'text', label: 'What subject did you study today?', required: true, placeholder: 'e.g., Calculus, History' },
            { id: 'hours_studied', type: 'number', label: 'How many hours did you study?', required: true, isProgress: true, min: 0, step: 0.5, placeholder: '0' },
            { id: 'new_topic', type: 'text', label: 'What new topic did you learn?', required: true, placeholder: 'e.g., Integration by parts' },
            { id: 'assignment', type: 'text', label: 'What assignment did you complete?', required: false, placeholder: 'e.g., Chapter 5 exercises' },
            { id: 'difficult_concepts', type: 'textarea', label: 'What concepts were difficult?', required: false, placeholder: 'Topics that need more review...' },
            { id: 'revise_tomorrow', type: 'text', label: 'What will you revise tomorrow?', required: true, placeholder: 'e.g., Trigonometry formulas' },
        ],
    },
    fitness: {
        id: 'fitness',
        name: 'Fitness',
        icon: '💪',
        description: 'Track workouts, training time, and physical progress',
        isDefault: true,
        questions: [
            { id: 'workout', type: 'text', label: 'What workout did you complete?', required: true, placeholder: 'e.g., Upper body strength, 5K run' },
            { id: 'training_duration', type: 'number', label: 'How long did you train? (minutes)', required: true, isProgress: true, min: 0, step: 5, placeholder: '0' },
            { id: 'exercises', type: 'textarea', label: 'What exercises did you perform?', required: true, placeholder: 'List key exercises and sets...' },
            { id: 'reached_target', type: 'select', label: 'Did you reach your target today?', required: true, options: ['Yes', 'Partially', 'No'] },
            { id: 'improvement', type: 'text', label: 'What improvement did you notice?', required: false, placeholder: 'e.g., Increased bench press weight' },
            { id: 'next_milestone', type: 'text', label: 'What is your next fitness milestone?', required: true, placeholder: 'e.g., Run 10K under 50 min' },
        ],
    },
    copywriting: {
        id: 'copywriting',
        name: 'Copywriting',
        icon: '✍️',
        description: 'Track writing output, techniques, and copy results',
        isDefault: true,
        questions: [
            { id: 'copy_written', type: 'textarea', label: 'What copy did you write today?', required: true, placeholder: 'Describe the copy you produced...' },
            { id: 'word_count', type: 'number', label: 'How many words did you write?', required: true, isProgress: true, min: 0, step: 1, placeholder: '0' },
            { id: 'project', type: 'text', label: 'What project did you work on?', required: true, placeholder: 'e.g., Landing page, email sequence' },
            { id: 'technique', type: 'text', label: 'What new persuasion technique did you learn?', required: false, placeholder: 'e.g., PAS framework, social proof' },
            { id: 'result', type: 'text', label: 'What result did your copy achieve?', required: false, placeholder: 'e.g., 12% CTR improvement' },
            { id: 'improve_next', type: 'text', label: 'What will you improve next?', required: true, placeholder: 'e.g., Stronger headlines' },
        ],
    },
    business: {
        id: 'business',
        name: 'Business',
        icon: '📈',
        description: 'Track business tasks, revenue progress, and opportunities',
        isDefault: true,
        questions: [
            { id: 'task_completed', type: 'textarea', label: 'What business task did you complete today?', required: true, placeholder: 'Describe your accomplishments...' },
            { id: 'revenue_progress', type: 'number', label: 'What progress did you make toward revenue targets? ($)', required: true, isProgress: true, min: 0, step: 1, placeholder: '0' },
            { id: 'opportunity', type: 'text', label: 'What new opportunity did you discover?', required: false, placeholder: 'e.g., Partnership lead, new market' },
            { id: 'challenge_solved', type: 'textarea', label: 'What challenge did you solve?', required: false, placeholder: 'Business problems you addressed...' },
            { id: 'next_milestone', type: 'text', label: 'What is your next business milestone?', required: true, placeholder: 'e.g., Close 3 new clients' },
        ],
    },
};

function loadGoalCategories() {
    const custom = JSON.parse(localStorage.getItem('customGoalCategories')) || {};
    return { ...DEFAULT_GOAL_CATEGORIES, ...custom };
}

function saveCustomCategory(category) {
    const custom = JSON.parse(localStorage.getItem('customGoalCategories')) || {};
    custom[category.id] = { ...category, isDefault: false };
    localStorage.setItem('customGoalCategories', JSON.stringify(custom));
}

function deleteCustomCategory(categoryId) {
    const custom = JSON.parse(localStorage.getItem('customGoalCategories')) || {};
    if (custom[categoryId]) {
        delete custom[categoryId];
        localStorage.setItem('customGoalCategories', JSON.stringify(custom));
        return true;
    }
    return false;
}

function getCategoryById(categoryId) {
    const categories = loadGoalCategories();
    return categories[categoryId] || categories.software;
}

function getCategoryOptions() {
    return Object.values(loadGoalCategories()).map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon || '🎯',
        description: cat.description || '',
    }));
}

function getProgressQuestion(category) {
    return category.questions.find((q) => q.isProgress) || null;
}

function migrateGoalCategory(goal) {
    if (!goal.category) {
        goal.category = 'software';
    }
    return goal;
}

const CATEGORY_DEFAULT_UNITS = {
    software: 'hours',
    content: 'pieces',
    video_editing: 'minutes',
    study: 'hours',
    fitness: 'minutes',
    copywriting: 'words',
    business: 'dollars',
};

function getDefaultUnitForCategory(categoryId) {
    return CATEGORY_DEFAULT_UNITS[categoryId] || 'units';
}
