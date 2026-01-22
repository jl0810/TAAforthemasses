import fs from 'fs';
import path from 'path';

const DOCS_DIR = 'docs';
const REQUIRED_ROOT_DOCS = [
    'USER_STORIES.md',
    'BUSINESS_RULES.md',
    'API_SPEC.md', // Optional but encouraged
];

const CATEGORIES = {
    progress: /^(\d{4}-\d{2}-\d{2})_sprint-(\d+)\.md$/,
    investigations: /^(\d{4}-\d{2}-\d{2})_[a-z0-9-]+\.md$/,
    decisions: /^(\d{3})-[a-z0-9-]+\.md$/,
    meetings: /^(\d{4}-\d{2}-\d{2})_[a-z0-9-]+\.md$/
};

function main() {
    console.log("🔍 Validating Documentation Structure...");
    let errors = 0;

    if (!fs.existsSync(DOCS_DIR)) {
        console.error("❌ 'docs' directory missing completely.");
        process.exit(1);
    }

    // 1. Check Root Docs
    REQUIRED_ROOT_DOCS.forEach(doc => {
        if (!fs.existsSync(path.join(DOCS_DIR, doc))) {
            // Warn only, don't fail, as some might be starting out
            console.warn(`⚠️  Missing core doc: docs/${doc}`);
        }
    });

    // 2. Check Categories
    Object.keys(CATEGORIES).forEach(category => {
        const dir = path.join(DOCS_DIR, category);
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
            files.forEach(file => {
                if (!CATEGORIES[category].test(file) && file !== 'README.md') {
                    console.error(`❌ Invalid name in docs/${category}: ${file}`);
                    console.error(`   Expected format: ${CATEGORIES[category]}`);
                    errors++;
                }
            });
        }
    });

    if (errors > 0) {
        console.error(`\n❌ Validation Failed: ${errors} documentation naming errors found.`);
        process.exit(1);
    }

    console.log("✅ Documentation structure is valid.");
}

main();
