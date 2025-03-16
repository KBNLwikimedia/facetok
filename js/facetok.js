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

// Function to show the default CSS spinner
function showSpinner() {
    const spinner = document.createElement('div');
    spinner.id = 'loading-spinner';
    spinner.innerHTML = `<div class="default-spinner"></div>`;
    document.body.appendChild(spinner);
}

// Function to hide the loading spinner
function hideSpinner() {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}

// Show spinner on initial page load
document.addEventListener('DOMContentLoaded', () => {
    showSpinner();
});

// Hide spinner after initial content is loaded
window.onload = () => {
    hideSpinner();
};


async function fetchPortraits() {
    try {
        const response = await fetch('data/facetok-datacache.csv');
        const text = await response.text();
        const lines = text.split('\n').slice(1);

        portraits = lines.map(line => {
            const [imageUrl, title, description, wikipediaLink] = line.split(';');
            return { imageUrl, title, description, wikipediaLink };
        });

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
        const apiUrl = `https://nl.wikipedia.org/api/rest_v1/page/summary/${title}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch data for ${title}`);
        }

        const data = await response.json();
        let extract = data.extract || 'No summary available.';

        let truncated = false;

        const words = extract.split(' ');
        if (words.length > MAX_WORDS || extract.length > MAX_CHARACTERS) {
            extract = words.slice(0, MAX_WORDS).join(' ');
            if (extract.length > MAX_CHARACTERS) {
                extract = extract.substring(0, MAX_CHARACTERS);
            }
            extract += '...';
            truncated = true;
        }

        // Always show Read More at fixed position
        extract += `<div class="read-more-container"><a href="${wikipediaLink}" target="_blank" class="read-more-link">Read more &rarr;</a></div>`;

        return extract;
    } catch (error) {
        console.error(error);
        return 'Failed to load summary.';
    }
}

async function displayPortrait(portrait) {
    const extract = await fetchWikipediaExtract(portrait.wikipediaLink);
    const container = document.getElementById('portrait-container');
    container.innerHTML = `
        <div class="facetok-card">
            <div class="logo-banner">
                <i>Portraits from heritage collections, powered by Wikimedia</i>
                <img src="media/wikimedia-logos.png" alt="Wikimedia Logos" loading="lazy">
            </div>
            <div class="facetoklogo">
                <img src="media/facetok-logo.png" alt="Facetok Logo" loading="lazy">
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
        </div>`;

    initializeShareFeature();
    document.getElementById('heart-icon').addEventListener('click', (event) => {
        createHeart(event.clientX, event.clientY);
    });
}

function initializeShareFeature() {
    const shareIcon = document.getElementById('share-icon');
    if (!shareIcon) return;

    shareIcon.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: 'Check out this cool app!',
                text: 'I found this awesome app, check it out!',
                url: 'https://www.facetok.eu',
            })
            .then(() => console.log('Successful share'))
            .catch((error) => console.error('Error sharing', error));
        } else {
            alert('Your browser does not support the sharing feature.');
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
    } else if (event.key === 'ArrowDown') {
        nextRandomPortrait();
    }
});







