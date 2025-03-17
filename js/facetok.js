let portraits = [];
let history = [];
let currentIndex = -1;
let startX = 0;
let startY = 0;
let scale = 1;
let initialDistance = 0;

document.addEventListener('DOMContentLoaded', () => {
    const heartContainer = document.createElement('div');
    heartContainer.id = 'heart-container';
    document.body.appendChild(heartContainer);
    fetchPortraits();
});

function initializeShareFeature() {
    const shareIcon = document.getElementById('share-icon');
    if (!shareIcon) return;

    shareIcon.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: "Are you into Wikipedia?",
                text: 'Check out WikiFaces: Faces from the archives of Wikimedia: ',
                url: 'https://www.wikifaces.org',
            })
            .then(() => console.log('Successful share'))
            .catch((error) => console.error('Error sharing', error));
        } else {
            alert('Your browser does not support the sharing feature.');
        }
    });
}

// Robust function to fetch portraits from CSV
async function fetchPortraits() {
    try {
        const response = await fetch('data/wikifaces-datacache.csv');

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const text = await response.text();
        const lines = text.split('\n').slice(1);

        portraits = lines.map((line, index) => {
            const parts = line.split(';');
            if (parts.length !== 4) {
                console.warn(`Skipping malformed line ${index + 1}: ${line}`);
                return null;
            }

            const [imageUrl, title, description, wikipediaLink] = parts.map(part => part.trim());

            if (!imageUrl || !title || !wikipediaLink) {
                console.warn(`Incomplete data in line ${index + 1}: ${line}`);
                return null;
            }

            return { imageUrl, title, description, wikipediaLink };
        }).filter(portrait => portrait !== null);

        if (portraits.length === 0) {
            throw new Error('No valid portrait data found in the CSV.');
        }

        document.getElementById('portrait-container').style.display = 'block';
        nextRandomPortrait();

    } catch (error) {
        console.error('Error loading CSV data:', error);
    }
}

async function fetchWikipediaExtract(wikipediaLink) {
    try {
        const MAX_WORDS = 50;
        const MAX_CHARACTERS = 200;

        const title = wikipediaLink.split('/').pop();
        const commonsUrl = `https://commons.m.wikimedia.org/wiki/File:${title}`;
        const apiUrl = `https://nl.wikipedia.org/api/rest_v1/page/summary/${title}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch data for ${title}`);
        }

        const data = await response.json();
        let extract = data.extract || 'Geen beschrijving uit Wikipedia beschikbaar.';

        const words = extract.split(' ');
        if (words.length > MAX_WORDS || extract.length > MAX_CHARACTERS) {
            extract = words.slice(0, MAX_WORDS).join(' ');
            if (extract.length > MAX_CHARACTERS) {
                extract = extract.substring(0, MAX_CHARACTERS);
            }
            extract += '...';
        }

        extract += `<div class="fixed-commons-link-container">
                        <a href="${commonsUrl}" target="_blank" id="open-lightbox" class="fixed-commons-link">Bekijk afbeelding &rarr;</a>
                    </div>`;

        extract += `<div class="read-more-container">
                        <a href="${wikipediaLink}" target="_blank" class="read-more-link">Lees verder &rarr;</a>
                    </div>`;

        return extract;
    } catch (error) {
        console.error(error);
        return 'Geen beschrijving uit Wikipedia beschikbaar.';
    }
}


async function displayPortrait(portrait) {
    const extract = await fetchWikipediaExtract(portrait.wikipediaLink);
    const filename = portrait.imageUrl.split('/').pop();
    const commonsUrl = `https://commons.m.wikimedia.org/wiki/File:${filename}`;

    const container = document.getElementById('portrait-container');
    container.innerHTML = `
        <div class="facetok-card">
            <div class="wikifaceslogo">
                <img src="media/wikifaces-logo.png" alt="WikiFaces Logo" loading="lazy">
            </div>
            <img class="portrait" src="${portrait.imageUrl}" alt="Portrait of ${portrait.title}" loading="lazy">
            <div class="wplink">
                <h2>
                    <a href="${portrait.wikipediaLink}" target="_blank">${portrait.title}</a>
                </h2>
                <p id="extract-container">${extract}</p>
            </div>
            <div class="icon-container">
                <div id="heart-icon" class="icon-button">
                    <img src="media/heart-icon.png" alt="Heart Icon" loading="lazy">
                </div>
                <div id="share-icon" class="icon-button">
                    <img src="media/share-icon.png" alt="Share Icon" loading="lazy">
                </div>
            </div>
            <div class="bottom-banner">
                <b>WikiFaces</b><br/>Faces from the archives of Wikimedia
                <img src="media/wikimedia-logos.png" alt="Wikimedia Logos" loading="lazy">
            </div>
        </div>

        <div id="lightbox" class="lightbox">
            <span class="close-lightbox" id="close-lightbox">&times;</span>
            <a href="${commonsUrl}" target="_blank"><img class="lightbox-content" src="${portrait.imageUrl}" alt="Original Image"></a>
            <br clear="all"/>
            <a href="${commonsUrl}" target="_blank">Bekijk op Wikimedia Commons &rarr;</a>
        </div>`;

    // Initialize share feature
    initializeShareFeature();

    // Heart icon click event
    document.getElementById('heart-icon').addEventListener('click', (event) => {
        createHeart(event.clientX, event.clientY);
    });

    // Open Lightbox
    document.getElementById('open-lightbox').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('lightbox').style.display = 'flex';
    });

    // Close Lightbox
    document.getElementById('close-lightbox').addEventListener('click', () => {
        document.getElementById('lightbox').style.display = 'none';
    });

    // Close on Outside Click
    document.getElementById('lightbox').addEventListener('click', (e) => {
        if (e.target.id === 'lightbox') {
            document.getElementById('lightbox').style.display = 'none';
        }
    });
}

function createHeart(x, y) {
    const heart = document.createElement('div');
    heart.className = 'flying-heart';
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    document.getElementById('heart-container').appendChild(heart);

    setTimeout(() => heart.remove(), 2000);
}

function nextRandomPortrait() {
    const randomIndex = Math.floor(Math.random() * portraits.length);
    history.push(randomIndex);
    currentIndex = history.length - 1;
    displayPortrait(portraits[randomIndex]);
}

function previousPortrait() {
    if (currentIndex > 0) {
        currentIndex--;
        displayPortrait(portraits[history[currentIndex]]);
    }
}

function handleTouchStart(event) {
    if (event.touches.length === 2) {
        initialDistance = getDistance(event.touches[0], event.touches[1]);
    }
}

function handleTouchMove(event) {
    if (event.touches.length === 2) {
        event.preventDefault();
        const currentDistance = getDistance(event.touches[0], event.touches[1]);
        scale = currentDistance / initialDistance;
        event.target.style.transform = `scale(${scale})`;
    }
}

function getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

window.addEventListener('touchstart', (event) => {
    startX = event.touches[0].clientX;
    startY = event.touches[0].clientY;
});

window.addEventListener('touchend', (event) => {
    const endX = event.changedTouches[0].clientX;
    const endY = event.changedTouches[0].clientY;
    const diffY = startY - endY;

    if (diffY > 50) {
        nextRandomPortrait();
    } else if (diffY < -50) {
        previousPortrait();
    }
});

window.addEventListener('wheel', (event) => {
    if (event.deltaY < 0) {
        previousPortrait();
    } else if (event.deltaY > 0) {
        nextRandomPortrait();
    }
});

window.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') {
        previousPortrait();
    } else if (event.key === 'ArrowDown' || event.key === ' ') {
        nextRandomPortrait();
    }
});









