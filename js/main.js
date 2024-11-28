// Variable Globales
let allGenres = [];
const main = document.querySelector("main");
const modalWindow = document.querySelector('.modal-window');

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
                if (page === 1) {
                    console.error(`Erreur dans la requête pour la page ${page}`);
                }
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

// Mélange la liste des genres et retourne deux genres au hasard
function randomizeGenres(genres) {
    const shuffled_genres_list = [...genres].sort(() => Math.random() - 0.5);
    return shuffled_genres_list.slice(0, 2); 
}

// Récupère les films et les genres puis les affiche
Promise.all([
    fetchDatas('http://localhost:8000/api/v1/titles/', 2, "best_movies"),
    fetchDatas('http://localhost:8000/api/v1/genres', 5, "genres")
]).then(async ([movies, genres]) => {
    allGenres = genres.sort((a, b) => a.name.localeCompare(b.name));
    if (movies.length === 0 || genres.length === 0) {
        main.innerHTML = '<p>Erreur lors de la récupération des films ou des genres.</p>';
        return;
    }

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

    const detailButton = document.createElement('button');
    detailButton.id = movie.id;
    detailButton.textContent = 'Détails';

    const description = movie.description ? `<p>${movie.description}</p>` : '<p>Pas de description</p>';
    const defaultImageUrl = '../img/image_not_found.png';

    detailButton.addEventListener('click', () => {
        displayModalWindow(movie);
        modalWindow.style.display = 'block';
    });

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
        </div>
    `;

    // Ajoute le bouton dans la div après l'insertion du HTML
    movieElement.querySelector('div').appendChild(detailButton);

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
    const otherMovies = sortedMovies.slice(1, 7);

    bestMovieContainer.innerHTML = '';
    otherMoviesContainer.innerHTML = '';

    const bestMovieElement = createMovieElement(bestMovie, 'best-movie__movie');
    bestMovieContainer.appendChild(bestMovieElement);

    otherMovies.forEach(movie => {
        const movieElement = createMovieElement(movie);
        otherMoviesContainer.appendChild(movieElement);
    });

    const showMoreButton = document.createElement('button');
    const showLessButton = document.createElement('button');
    showLessButton.className = 'show-less'
    showLessButton.textContent = "Voir moins"
    showLessButton.style.display = 'none';
    showMoreButton.className = 'show-more';
    showMoreButton.textContent = 'Voir plus';
    otherMoviesContainer.appendChild(showMoreButton);
    otherMoviesContainer.appendChild(showLessButton);

    toggleMoviesVisibility(otherMoviesContainer.id);
}


// Affiche les meilleurs films par genre
async function displayBestMoviesByGenre(genre, selected = false) {
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

        const formattedGenreName = genre.name.replace(/\s+/g, '-').toLowerCase();

        if (!selected) {
            genreSection = document.createElement('section');
            genreSection.className = 'best-movies';
            genreSection.id = formattedGenreName;
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

        const showMoreButton = document.createElement('button');
        const showLessButton = document.createElement('button');
        showLessButton.className = 'show-less';
        showLessButton.textContent = "Voir moins";
        showLessButton.style.display = 'none';
        showMoreButton.className = 'show-more';
        showMoreButton.textContent = 'Voir plus';
        genreSection.appendChild(showMoreButton);
        genreSection.appendChild(showLessButton);

        toggleMoviesVisibility(genreSection.id); // Use sanitized ID

    } catch (error) {
        console.error(`Erreur lors de l'affichage des films pour le genre ${genre.name}:`, error);
    }
}


// Affiche la liste déroulante des genres
async function displayGenresList() {
    const dropdown_container = document.createElement('div');
    const label = document.createElement('label');
    const dropdown = document.createElement('div');
    const button = document.createElement('button');
    const ul = document.createElement('ul');
    const arrow = document.createElement('span')
    const otherSection = document.createElement('section');

    // Style et structure
    label.setAttribute('for', 'genres');
    label.textContent = 'Autres : ';
    dropdown_container.classList.add('dropdown-container');
    dropdown.classList.add('dropdown');
    button.classList.add('dropdown-button');
    ul.classList.add('dropdown-menu');
    arrow.classList.add('arrow');
    otherSection.classList.add('best-movies', 'other');
    otherSection.id = 'other';

    // Contenu du bouton
    button.textContent = allGenres[0].name;
    button.appendChild(arrow);

    // Générer la liste des genres
    allGenres.forEach(genre => {
        const li = document.createElement('li');
        li.textContent = genre.name;
        li.classList.add('dropdown-item');
        ul.appendChild(li);

        // Gestionnaire d'évènement pour le choix d'un genre
        li.addEventListener('click', () => {
            button.textContent = genre.name;
            button.appendChild(arrow);
            ul.style.display = 'none';
            displayBestMoviesByGenre(genre, selected=true);
        });
    });

    button.addEventListener('click', () => {
        ul.style.display = ul.style.display === 'block' ? 'none' : 'block';
    });

    dropdown.appendChild(button);
    dropdown.appendChild(ul);
    dropdown_container.appendChild(label);
    dropdown_container.appendChild(dropdown);
    main.appendChild(dropdown_container);
    main.appendChild(otherSection);
}

function toggleMoviesVisibility(elementId) {
    const section = document.getElementById(elementId);
    if (!section) return;
    const movies = section.querySelectorAll('.best-movies__movie');
    const showMoreButton = section.querySelector('.show-more');
    const showLessButton = section.querySelector('.show-less');

    if (showMoreButton && showLessButton) {
        // Afficher tous les films lorsque "Voir plus" est cliqué
        showMoreButton.addEventListener('click', () => {
            console.log(elementId)
            movies.forEach(movie => {
                movie.style.display = 'flex';
            });
            showMoreButton.style.display = 'none';
            showLessButton.style.display = 'flex';
        });

        // Réinitialiser l'affichage lorsque "Voir moins" est cliqué
        showLessButton.addEventListener('click', () => {
            movies.forEach((movie, index) => {
                // Affiche uniquement les deux premiers films comme défini dans le CSS
                movie.style.display = index < 2 ? 'flex' : 'none';
            });
            showLessButton.style.display = 'none';
            showMoreButton.style.display = 'flex';
        });
    }
}

// Mise à jour dynamique des films visibles
function updateMoviesVisibility(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const movies = section.querySelectorAll('.best-movies__movie');
    let maxVisible;

    // Détermine le nombre de films visibles selon la largeur de la fenêtre
    if (window.innerWidth <= 768) {
        maxVisible = 2; // Mobile
    } else if (window.innerWidth <= 1279) {
        maxVisible = 4; // Tablette
    } else {
        maxVisible = movies.length; // Desktop (affiche tout)
    }

    movies.forEach((movie, index) => {
        if (index < maxVisible) {
            movie.style.display = 'flex'; // Affiche le film
        } else {
            movie.style.display = 'none'; // Cache le film
        }
    });

    const showMoreButton = section.querySelector('.show-more');
    const showLessButton = section.querySelector('.show-less');

    if (showMoreButton && showLessButton) {
        // Gère la visibilité des boutons
        showMoreButton.style.display = movies.length > maxVisible ? 'flex' : 'none';
        showLessButton.style.display = 'none';

        showMoreButton.addEventListener('click', () => {
            movies.forEach(movie => (movie.style.display = 'flex'));
            showMoreButton.style.display = 'none';
            showLessButton.style.display = 'flex';
        });

        showLessButton.addEventListener('click', () => {
            updateMoviesVisibility(sectionId);
            showLessButton.style.display = 'none';
            showMoreButton.style.display = 'flex';
        });
    }
}


// Appliquer la visibilité dynamique après ajout des films
function applyDynamicVisibility(sectionId) {
    updateMoviesVisibility(sectionId);
    window.addEventListener('resize', () => updateMoviesVisibility(sectionId));
}

// Affiche la fenêtre modale avec les informations d'un film
function displayModalWindow(movie) {
    const closeButton = document.createElement('button');
    const title = document.createElement('h2');
    const otherdatas = document.createElement('div');
    const image = document.createElement('img');
    const directors = document.createElement('div');
    const actors = document.createElement('div');

    // Gérer les genres comme une liste
    const genres = Array.isArray(movie.genres) ? movie.genres.join(', ') : movie.genres;

    title.textContent = movie.title;
    otherdatas.innerHTML = `
        <p>${movie.year} - ${genres}</p>
        <p>IMDB score: ${movie.imdb_score}/10</p>
    `;
    image.setAttribute('src', movie.image_url);
    directors.innerHTML = `<p>Réalisé par :</p><p>${movie.directors}</p>`;
    actors.innerHTML = `<p>Avec :</p><p>${movie.actors}</p>`;

    closeButton.className = 'close';
    closeButton.textContent = 'Fermer';

    closeButton.addEventListener('click', () => {
        modalWindow.style.display = 'none';
        modalWindow.innerHTML = ''; // Vide la modale
        document.body.style.overflow = 'auto'; // Réactive le défilement
    });

    modalWindow.appendChild(title);
    modalWindow.appendChild(otherdatas);
    modalWindow.appendChild(image);
    modalWindow.appendChild(directors);
    modalWindow.appendChild(actors);
    modalWindow.appendChild(closeButton);

    modalWindow.style.display = 'flex'; // Affiche la modale

    // Empêche le scroll de la page
    document.body.style.overflow = 'hidden';
}
