// Variable Globales
let allGenres = [];
const main = document.querySelector("main");

// Récupère les données via l'API
async function fetchDatas(baseUrl, maxPages, datas, genre = null) {
    let results = [];
    for (let page = 1; page <= maxPages; page++) {
        try {
            const url =
                datas === "best_movies" ? `${baseUrl}?page=${page}&sort_by=-imdb_score` :
                datas === "best_movies_by_genre" ? `${baseUrl}?page=${page}&sort_by=-imdb_score&genre_contains=${genre}` :
                `${baseUrl}?page=${page}`;

            const response = await fetch(url);
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

// Mélange la liste des genres et retour deux genres au hasard
function randomizeGenres(genres) {
    const shuffled_genres_list = [...genres].sort(() => Math.random() - 0.5);
    return shuffled_genres_list.slice(0, 2); 
}


// Récupère les films et les genres puis les affiches
Promise.all([
    fetchDatas('http://localhost:8000/api/v1/titles/', 2, "best_movies"),
    fetchDatas('http://localhost:8000/api/v1/genres', 5, "genres")
]).then(async ([movies, genres]) => {
    allGenres = genres.sort((a, b) => a.name.localeCompare(b.name));
    if (movies.length === 0 || genres.length === 0) {
        main.innerHTML = '<p>Erreur lors de la récupération des films ou des genres.</p>';
        return;
    }

    movies.forEach(movie => console.log(movie.title));
    displayBestMovies(movies);

    // Sélectionner deux genres au hasard
    const [randomGenre1, randomGenre2] = randomizeGenres(allGenres);
    // Afficher les films des deux genres choisis au hasard
    await displayBestMoviesByGenre(randomGenre1);
    await displayBestMoviesByGenre(randomGenre2);

    // Afficher les autres films
    await displayGenresList();
    await displayBestMoviesByGenre(allGenres[0], selected=true);
}).catch(error => {
    console.error('Erreur lors de la récupération des données:', error);
    main.innerHTML = '<p>Impossible de récupérer les données. Veuillez réessayer plus tard.</p>';
});


// Crée un élément HTML pour un film
function createMovieElement(movie, className = 'best-movies__movie') {
    const movieElement = document.createElement('div');
    movieElement.className = className;

    let description = movie.description ? `<p>${movie.description}</p>` : '<p>Pas de description</p>';

    const defaultImageUrl = '../img/image_not_found.png';

    movieElement.innerHTML = `
        <img 
            src="${movie.image_url}" 
            alt="Image du film ${movie.title}" 
            title="${movie.title}"
            onerror="this.src='${defaultImageUrl}'"
        >
        <div>
            <h3>${movie.title}</h3>
            ${className === 'best-movie__movie' ? description : ''}
            <button>Détails</button>
        </div>
    `;

    return movieElement;
}

// Affiche les meilleurs films toutes catégories
function displayBestMovies(movies) {
    const bestMovieContainer = document.getElementById('best-movie');
    const otherMoviesContainer = document.getElementById('best-movies');

    if (movies.length === 0) {
        console.warn("Aucun film à afficher");
        return;
    }

    const sortedMovies = movies.sort((a, b) => b.imdb_score - a.imdb_score);
    const bestMovie = sortedMovies[0];
    const otherMovies = sortedMovies.slice(1, 7); // Prend uniquement les 6 films suivants

    bestMovieContainer.innerHTML = '';
    otherMoviesContainer.innerHTML = '';

    const bestMovieElement = createMovieElement(bestMovie, 'best-movie__movie');
    bestMovieContainer.appendChild(bestMovieElement);

    otherMovies.forEach(movie => {
        const movieElement = createMovieElement(movie);
        otherMoviesContainer.appendChild(movieElement);
    });
}


// Affiche les meilleurs films par genre
async function displayBestMoviesByGenre(genre, selected=false) {
    try {
        const movies = await fetchDatas('http://localhost:8000/api/v1/titles/', 2, "best_movies_by_genre", genre.name);

        if (!movies || movies.length === 0) {
            console.warn(`Aucun film trouvé pour le genre : ${genre.name}`);
            return;
        }

        const sortedMoviesByGenre = movies
            .sort((a, b) => b.imdb_score - a.imdb_score)
            .slice(0, 6);

            
        let genreSection;

        if (!selected) {
            genreSection = document.createElement('section');
            genreSection.className = 'best-movies';
            const genreTitle = document.createElement('h2');
            genreTitle.textContent = genre.name;

            genreSection.appendChild(genreTitle);
        } else {
            genreSection = document.querySelector('.other');
            genreSection.innerHTML = '';
        }
        
        sortedMoviesByGenre.forEach(movie => {
            genreSection.appendChild(createMovieElement(movie));
        });

        main.appendChild(genreSection);
        
    } catch (error) {
        console.error(`Erreur lors de l'affichage des films pour le genre ${genre.name}:`, error);
    }
}

// Affiche la liste déroulante des genres
async function displayGenresList() {
    const label = document.createElement('label');
    const dropdown = document.createElement('div');
    const button = document.createElement('button');
    const ul = document.createElement('ul');
    const arrow = document.createElement('span')
    const otherSection = document.createElement('section');

    // Style et structure
    label.setAttribute('for', 'genres');
    label.textContent = 'Autres : ';
    dropdown.classList.add('dropdown');
    button.classList.add('dropdown-button');
    ul.classList.add('dropdown-menu');
    arrow.classList.add('arrow');
    otherSection.classList.add('best-movies', 'other');

    // Contenu du bouton
    button.textContent = allGenres[0].name;
    button.appendChild(arrow);

    // Générer la liste des genres
    allGenres.forEach(genre => {
        const li = document.createElement('li');
        li.textContent = genre.name;
        li.classList.add('dropdown-item');
        ul.appendChild(li);

        // Ajouter un gestionnaire d'événement pour afficher le genre sélectionné
        li.addEventListener('click', () => {
            button.textContent = genre.name;
            button.appendChild(arrow);
            ul.style.display = 'none'; // Cacher le menu après sélection
            displayBestMoviesByGenre(genre, selected=true);
        });
    });

    // Ajouter les événements pour afficher/cacher la liste
    button.addEventListener('click', () => {
        ul.style.display = ul.style.display === 'block' ? 'none' : 'block';
    });

    // Assembler les éléments
    dropdown.appendChild(button);
    dropdown.appendChild(ul);
    main.appendChild(label);
    main.appendChild(dropdown);
    main.appendChild(otherSection);
}
