let portraits = [];
let history = [];
let currentIndex = -1;
let startX = 0;
let startY = 0;
let scale = 1;
let initialDistance = 0;

// Function to fetch the portrait data from the CSV file

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

async function displayPortrait(portrait) {
    const extract = await fetchWikipediaExtract(portrait.wikipediaLink);
    const container = document.getElementById('portrait-container');
    container.innerHTML = `
        <div class="facetok-card">
            <div class="logo-banner">
                <i>Portraits from heritage collections, powered by Wikimedia</i>
                <img src="media/wikimedia-logos.png" alt="Wikimedia Logos">
            </div>
            <div class="facetoklogo">
               <img src="media/facetok-logo.png" alt="Facetok Logo">
            </div>
            <img class="portrait" src="${portrait.imageUrl}" alt="Portrait of ${portrait.title}">
            <div class="wplink">
                <h2>
                    <a href="${portrait.wikipediaLink}" target="_blank">${portrait.title}</a>
                </h2>
                <p id="extract-container" class="wplink">${extract}</p>
                <div id="heart-icon">❤️</div>
            </div>
        </div>`;

    document.getElementById('heart-icon').addEventListener('click', (event) => {
        createHeart(event.clientX, event.clientY);
    });
}

function createHeart(x, y) {
    const heart = document.createElement('div');
    heart.className = 'flying-heart';
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    document.getElementById('heart-container').appendChild(heart);

    setTimeout(() => {
        heart.remove();
    }, 2000);
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

// Function to fetch the Wikipedia extract based on the provided Wikipedia link
async function fetchWikipediaExtract(wikipediaLink) {
    try {
        const title = wikipediaLink.split('/').pop();
        const apiUrl = `https://nl.wikipedia.org/api/rest_v1/page/summary/${title}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Failed to fetch data for ${title}`);
        }

        const data = await response.json();
        let extract = data.extract || 'No summary available.';

        const words = extract.split(' ');
        if (words.length > 30) {
            extract = words.slice(0, 30).join(' ') + '...';
        }

        return extract;
    } catch (error) {
        console.error(error);
        return 'Failed to load summary.';
    }
}

fetchPortraits();
