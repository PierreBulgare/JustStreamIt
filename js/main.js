// Variables pour stocker les films et les genres
let allMovies = [];
let allGenres = [];
const main = document.querySelector("main");

// Fonction pour récupérer les données via l'API
async function fetchDataByBatch(baseUrl, maxPages) {
    let results = [];
    for (let page = 1; page <= maxPages; page++) {
        try {
            const response = await fetch(`${baseUrl}?page=${page}`);
            if (!response.ok) {
                console.error(`Erreur dans la requête pour la page ${page}`);
                break;
            }

            const data = await response.json();
            if (data.results && data.results.length > 0) {
                results = results.concat(data.results);
            } else {
                console.warn(`Aucune donnée trouvée à la page ${page}`);
                break;
            }
        } catch (error) {
            console.error('Erreur réseau ou de récupération des données:', error);
            break;
        }
    }
    return results;
}

// Récupérer et stocker les films et les genres
Promise.all([
    fetchDataByBatch('http://localhost:8000/api/v1/titles', 5),
    fetchDataByBatch('http://localhost:8000/api/v1/genres', 5)
]).then(([movies, genres]) => {
    allMovies = movies;
    allGenres = genres;
    displayBestMovies(allMovies);
    displayBestMoviesByGenre(allMovies, allGenres);
}).catch(error => {
    console.error('Erreur lors de la récupération des données:', error);
});

// Fonction utilitaire pour créer un élément HTML d'un film
function createMovieElement(movie, className = 'best-movies__movie') {
    const movieElement = document.createElement('div');
    movieElement.className = className;

    // Ajouter la description ou le texte par défaut
    let description = movie.description ? `<p>${movie.description}</p>` : '<p>Pas de description</p>';

    movieElement.innerHTML = `
        <img src="${movie.image_url}" alt="Image du film ${movie.title}" title="${movie.title}">
        <div>
            <h3>${movie.title}</h3>
            ${className === 'best-movie__movie' ? description : ''}
            <button>Détails</button>
        </div>
    `;

    return movieElement;
}


// Fonction pour afficher les meilleurs films
function displayBestMovies(movies) {
    const bestMovieContainer = document.getElementById('best-movie');
    const otherMoviesContainer = document.getElementById('best-movies');

    if (movies.length === 0) {
        console.warn("Aucun film à afficher");
        return;
    }

    const sortedMovies = movies.sort((a, b) => b.votes - a.votes);
    const bestMovie = sortedMovies[0];
    const otherMovies = sortedMovies.slice(1, 7);

    bestMovieContainer.innerHTML = '';
    otherMoviesContainer.innerHTML = '';

    // Afficher le meilleur film
    const bestMovieElement = createMovieElement(bestMovie, 'best-movie__movie');
    bestMovieContainer.appendChild(bestMovieElement);

    // Afficher les 6 autres meilleurs films
    otherMovies.forEach(movie => {
        otherMoviesContainer.appendChild(createMovieElement(movie));
    });
}

// Test Association Genre-Film
function checkGenreMovieAssociation(movie, genre) {
    console.log(genre)
    console.log(movie)
}

// Fonction pour afficher les meilleurs films par genre (Les deux premiers genres triés par ordre alphabétique)
function displayBestMoviesByGenre(movies, genres) {
    const topGenres = genres
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 2);
    
        topGenres.forEach(genre => {
            const moviesByGenre = movies.filter(movie => {
                return movie.genres.map(g => g.toLowerCase()).includes(genre.name.toLowerCase());
            });
        
            const sortedMoviesByGenre = moviesByGenre.sort((a, b) => b.votes - a.votes).slice(0, 6);
        
            const genreTitle = document.createElement('h2');
            genreTitle.textContent = genre.name;
            const genreSection = document.createElement('section');
            genreSection.className = 'best-movies';
        
            sortedMoviesByGenre.forEach(movie => {
                genreSection.appendChild(createMovieElement(movie));
            });
        
            main.appendChild(genreTitle);
            main.appendChild(genreSection);
        });
        
}
