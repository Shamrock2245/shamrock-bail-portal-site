const fs = require('fs');
const path = require('path');
const https = require('https');

// Requires MONGO_PROXY_URL and PROXY_API_KEY as environment variables
const PROXY_URL = process.env.MONGO_PROXY_URL;
const API_KEY = process.env.PROXY_API_KEY;

const CURRICULUM_DIR = path.join(require('os').homedir(), 'Desktop', 'bail-school-material');

async function callProxy(action, collection, payload) {
    return new Promise((resolve, reject) => {
        const url = new URL(PROXY_URL);
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Proxy Error ${res.statusCode}: ${data}`));
                }
            });
        });
        
        req.on('error', reject);
        req.write(JSON.stringify({
            action,
            database: 'ShamrockBailDB',
            collection,
            ...payload
        }));
        req.end();
    });
}

async function migrate() {
    console.log(`Migrating curriculum from ${CURRICULUM_DIR}...`);
    
    if (!fs.existsSync(CURRICULUM_DIR)) {
        console.error("Directory not found!");
        return;
    }

    const files = fs.readdirSync(CURRICULUM_DIR);
    
    // Create the Course
    const courseId = "120-HR-PRELICENSING";
    const courseDoc = {
        _id: courseId,
        title: "120-Hour Pre-Licensing Course",
        type: "ON_DEMAND",
        price: 1500,
        description: "Official FLDFS 120-Hour Bail Bonds Pre-Licensing Course."
    };
    
    try {
        await callProxy('updateOne', 'Courses', { 
            filter: { _id: courseId },
            update: { $set: courseDoc },
            upsert: true
        });
        console.log("Upserted Course record.");
    } catch(e) {
        console.error("Failed to upsert course:", e.message);
    }

    // Create CourseLessons
    const modules = files.filter(f => f.startsWith('Shamrock_Module'));
    
    let order = 0;
    for (const mod of modules) {
        order++;
        const lesson = {
            _id: `lesson_${order}`,
            courseId: courseId,
            title: mod.replace('.pptx', '').replace('.pdf', '').replace(/_/g, ' '),
            filename: mod,
            order: order,
            videoUrl: "https://example.com/placeholder-video.mp4" // Placeholder until actual videos are hosted
        };
        
        try {
            await callProxy('updateOne', 'CourseLessons', {
                filter: { _id: lesson._id },
                update: { $set: lesson },
                upsert: true
            });
            console.log(`Upserted Lesson: ${lesson.title}`);
        } catch(e) {
            console.error(`Failed to upsert lesson ${lesson.title}:`, e.message);
        }
    }
    
    console.log("Migration complete.");
    console.log("Note: Actual media files (PPTX, PDF) must be uploaded to Wix Media Manager or Google Drive manually, and the videoUrls updated in MongoDB.");
}

if (!PROXY_URL || !API_KEY) {
    console.error("Please set MONGO_PROXY_URL and PROXY_API_KEY environment variables.");
    process.exit(1);
}

migrate();
