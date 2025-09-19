/*
HOW TO USE:
node download-images.js [count]

   ex. node download-images.js 20
*/

const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const imagesDir = path.join(__dirname, 'random-images');
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir);
}

function downloadImage(imageUrl, filename) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(imagesDir, filename);
        const file = fs.createWriteStream(filePath);
        
        console.log(`Downloading ${filename} from ${imageUrl}...`);
        
        const download = (url) => {
            const parsedUrl = new URL(url);
            const options = {
                hostname: parsedUrl.hostname,
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            };
            
            const request = https.request(options, (response) => {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    console.log(`Redirecting to: ${response.headers.location}`);
                    download(response.headers.location);
                } else if (response.statusCode === 200) {
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log(`Downloaded ${filename}`);
                        resolve(filePath);
                    });
                } else {
                    file.close();
                    fs.unlink(filePath, () => {}); 
                    reject(new Error(`Failed to download image: ${response.statusCode}`));
                }
            });
            
            request.on('error', (err) => {
                file.close();
                fs.unlink(filePath, () => {}); 
                reject(err);
            });
            
            request.end();
        };
        
        download(imageUrl);
    });
}

function getHighestImageNumber() {
    if (!fs.existsSync(imagesDir)) return 0;
    
    const files = fs.readdirSync(imagesDir);
    let highest = 0;
    
    files.forEach(file => {
        const match = file.match(/^(\d+)\.jpg$/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > highest) highest = num;
        }
    });
    
    return highest;
}

async function downloadRandomImages(count) {
    let startNumber = getHighestImageNumber() + 1;
    const downloadPromises = [];
    
    for (let i = startNumber; i < startNumber + count; i++) {
        const seed = Math.floor(Math.random() * 10000);
        const imageUrl = `https://picsum.photos/200/200?random=${seed}`;
        const filename = `${i}.jpg`; 
        
        downloadPromises.push(downloadImage(imageUrl, filename));
    }
    
    try {
        const results = await Promise.all(downloadPromises);
        console.log(`Successfully downloaded ${results.length} images to ${imagesDir}`);
        return results;
    } catch (error) {
        console.error('Error downloading images:', error);
        throw error;
    }
}
const imageCount = process.argv[2] ? parseInt(process.argv[2]) : 10;

console.log(`Downloading ${imageCount} random 200x200 images from picsum...`);

downloadRandomImages(imageCount)
    .then(() => {
        console.log('All images downloaded successfully!');
    })
    .catch((error) => {
        console.error('Failed to download images:', error);
        process.exit(1);
    });
