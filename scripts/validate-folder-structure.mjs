import fs from 'fs';
import path from 'path';

const APP_DIR = 'src/app';
const COMPONENTS_DIR = 'src/components';

function main() {
    console.log("🔍 Validating Project Structure...");
    let errors = 0;

    // 1. Check for Route Groups
    if (fs.existsSync(APP_DIR)) {
        const topLevel = fs.readdirSync(APP_DIR, { withFileTypes: true });
        // Identify directories that are NOT route groups (excluding api, special files)
        topLevel.forEach(dirent => {
            if (dirent.isDirectory() &&
                !dirent.name.startsWith('(') &&
                !dirent.name.startsWith('_') &&
                dirent.name !== 'api' &&
                dirent.name !== 'fonts' &&
                dirent.name !== 'favicon.ico'
            ) {
                // It's a directory that looks like a raw route (e.g. 'dashboard' vs '(dashboard)')
                // We generally want to encourage route groups for layout isolation
                // But strict failure might be too much for existing apps. Warn for now.
                // console.warn(`⚠️  Top-level route '${dirent.name}' should likely be in a Route Group like '(${dirent.name})'`);
            }
        });
    }

    // 2. Component Organization
    // Enforce no "components" folder inside app routes
    if (fs.existsSync(APP_DIR)) {
        const checkRecursively = (dir) => {
            const items = fs.readdirSync(dir, { withFileTypes: true });
            items.forEach(item => {
                if (item.isDirectory()) {
                    if (item.name === 'components') {
                        console.error(`❌ Invalid Structure: Found 'components' folder in ${dir}`);
                        console.error(`   Move components to src/components/[domain] instead.`);
                        errors++;
                    } else {
                        checkRecursively(path.join(dir, item.name));
                    }
                }
            });
        };
        checkRecursively(APP_DIR);
    }

    if (errors > 0) {
        console.error(`\n❌ Validation Failed: ${errors} structure errors found.`);
        process.exit(1);
    }

    console.log("✅ Folder structure is valid.");
}

main();
