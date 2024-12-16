// Variable Globales
let allGenres = [];
const main = document.querySelector("main");
const modalWindow = document.querySelector('.modal-window');
const defaultImageUrl = '../img/image_not_found.png';

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
            if (datas === "genres") {
                if (data.results && data.results.length > 0) {
                    results = results.concat(data.results);
                }
            } else {
                if (data.results && data.results.length > 0) {
                    // Récupérer les détails de chaque film
                    for (const movie of data.results) {
                        try {
                            movieUrl = `http://localhost:8000/api/v1/titles/${movie.id}`;
                            const movieResponse = await fetch(movieUrl);
                            if (!movieResponse.ok) {
                                console.warn(`Impossible de récupérer les détails du film avec ID: ${movie.id}`);
                                continue;
                            }
                            const movieDetails = await movieResponse.json();
                            results.push(movieDetails);
                        } catch (movieError) {
                            console.error(`Erreur lors de la récupération des détails pour le film ID ${movie.id}:`, movieError);
                        }
                    }
                } else {
                    console.warn(`Aucune donnée trouvée à la page ${page}`);
                    break;
                }
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

// Vérifie si une image de film existe
async function checkImageExists(url) {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Crée un élément HTML pour un film
async function createMovieElement(movie, className = 'best-movies__movie') {
    const movieElement = document.createElement('div');
    movieElement.className = className;

    const detailButton = document.createElement('button');
    detailButton.id = movie.id;
    detailButton.textContent = 'Détails';

    const description = movie.description ? `<p>${movie.description}</p>` : '<p>Pas de description</p>';

    let imageUrl = movie.image_url;

    // Vérifier si l'image existe
    if (!(await checkImageExists(imageUrl))) {
        imageUrl = defaultImageUrl;
    }

    detailButton.addEventListener('click', async () => {
        await displayModalWindow(movie);
        modalWindow.style.display = 'block';
    });

    movieElement.innerHTML = `
        <img 
            src="${imageUrl}" 
            alt="Image du film ${movie.original_title}" 
            title="${movie.original_title}"
        >
        <div>
            <h3>${movie.original_title}</h3>
            ${className === 'best-movie__movie' ? description : ''}
        </div>
    `;

    movieElement.querySelector('div').appendChild(detailButton);

    return movieElement;
}

// Affiche les meilleurs films toutes catégories
async function displayBestMovies(movies) {
    const bestMovieContainer = document.getElementById('best-movie');
    const otherMoviesContainer = document.getElementById('best-movies');

    if (movies.length === 0) {
        console.warn("Aucun film à afficher");
        return;
    }

    // Trier les films par score IMDb
    const sortedMovies = movies.sort((a, b) => b.imdb_score - a.imdb_score);

    // Extraire le meilleur film
    const bestMovie = sortedMovies[0];

    // Extraire uniquement les 5 films suivants
    const otherMovies = sortedMovies.slice(1, 7);

    // Réinitialiser les conteneurs
    bestMovieContainer.innerHTML = '';
    otherMoviesContainer.innerHTML = '';

    // Ajouter le meilleur film
    const bestMovieElement = await createMovieElement(bestMovie, 'best-movie__movie');
    bestMovieContainer.appendChild(bestMovieElement);

    // Ajouter les autres films (maximum 5)
    for (const movie of otherMovies) {
        const movieElement = await createMovieElement(movie);
        otherMoviesContainer.appendChild(movieElement);
    }

    // Appliquer la visibilité dynamique
    applyDynamicVisibility(otherMoviesContainer.id);
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

        sortedMoviesByGenre.forEach(async (movie) => {
            genreSection.appendChild(await createMovieElement(movie));
        });

        main.appendChild(genreSection);

        // Appliquer la visibilité dynamique après ajout
        applyDynamicVisibility(genreSection.id);

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

function toggleMoviesVisibility(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const movies = section.querySelectorAll('.best-movies__movie');
    const showMoreButton = section.querySelector('.show-more');
    const showLessButton = section.querySelector('.show-less');

    if (showMoreButton && showLessButton) {
        // Affiche tous les films lorsque "Voir plus" est cliqué
        showMoreButton.addEventListener('click', () => {
            movies.forEach(movie => {
                movie.style.display = 'flex';
            });
            showMoreButton.style.display = 'none';
            showLessButton.style.display = 'inline-block';
        });

        // Réinitialise l'affichage lorsque "Voir moins" est cliqué
        showLessButton.addEventListener('click', () => {
            movies.forEach((movie, index) => {
                movie.style.display = index < 4 ? 'flex' : 'none'; // Limite à 4 films
            });
            showLessButton.style.display = 'none';
            showMoreButton.style.display = 'inline-block';
        });

        // Initialiser l'état des films et des boutons
        movies.forEach((movie, index) => {
            movie.style.display = index < 4 ? 'flex' : 'none';
        });
        showMoreButton.style.display = movies.length > 4 ? 'inline-block' : 'none';
        showLessButton.style.display = 'none';
    }
}

// Mise à jour dynamique des films visibles
function updateMoviesVisibility(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const movies = section.querySelectorAll('.best-movies__movie');
    let maxVisible;

    // Détermine le nombre de films visibles selon la largeur de la fenêtre
    if (window.innerWidth < 768) {
        maxVisible = 2; // Mobile
    } else if (window.innerWidth < 1024) {
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
async function displayModalWindow(movie) {
    const overlay = document.querySelector('.modal-overlay');
    modalWindow.innerHTML = ''; // Réinitialise le contenu précédent

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const image = document.createElement('img');
    let imageUrl = movie.image_url;

    // Vérifier si l'image existe
    if (!(await checkImageExists(imageUrl))) {
        imageUrl = defaultImageUrl;
    }

    image.setAttribute('src', imageUrl || '../img/image_not_found.png');
    image.setAttribute('alt', `Affiche du film ${movie.original_title}`);

    const details = document.createElement('div');
    details.className = 'modal-details';
    details.innerHTML = `
        <h2>${movie.original_title}</h2>
        <p><strong>${movie.year} - ${movie.genres.join(', ')}</strong><br>
        <strong>${movie.rated} - ${movie.duration} minutes (${movie.countries.join(', ')})</strong><br>
        <strong>IMDB score: ${movie.imdb_score}/10</strong></p>
        <p><strong>Réalisé par :</strong><br>${movie.directors.join(', ')}</p>
    `;

    const bottomDetails = document.createElement('div');
    bottomDetails.className = 'modal-bottom';
    bottomDetails.innerHTML = `
        <p class="description">${movie.description || 'Pas de description disponible.'}</p>
        <p><strong>Avec :</strong><br>${movie.actors.join(', ')}</p>
    `;

    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.textContent = 'Fermer';
    closeButton.addEventListener('click', () => {
        modalWindow.style.display = 'none';
        overlay.classList.remove('active'); // Masque l'overlay
        document.body.style.overflow = 'auto';
    });

    modalContent.appendChild(details);
    modalContent.appendChild(image);
    modalWindow.appendChild(modalContent);
    bottomDetails.appendChild(closeButton);
    modalWindow.appendChild(bottomDetails);

    overlay.classList.add('active'); // Affiche l'overlay
    modalWindow.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}