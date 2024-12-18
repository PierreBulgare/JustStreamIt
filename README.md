# JustStreamIt

## Description
JustStreamIt est une application web qui permet de consulter des informations sur des films via une application qui utilise une API REST locale (OCMovies-API).

## Fonctionnalités

- Affichage du film le mieux notés (IMDB Score)
- Affichage des films les mieux notés (6)
- Affichage des films les mieux notés par catagéorie choisie au hasard
- Affichage des films les mieux notés d'une catégorie choisie
- Site responsive visible et adapté pour tout type d'écran

## Installation

### Prérequis
- Python 3.7 minimum
- Node.js et npm

### Installation

## Installation du back-end

**Clonage du dépôt**

    git clone https://github.com/OpenClassrooms-Student-Center/OCMovies-API-EN-FR.git
    cd OCMovies-API-EN-FR

**Création d'un environnement virtuel**

WINDOWS

    python -m venv env

    env\Scripts\activate
    
MAC OS/Linux

    python3 -m venv env

    source env/bin/activate
   

**Installation des dépendances**

    
    pip install -r requirements.txt
   

**Démarrage du serveur**

    python manage.py runserver
    

  Une fois le serveur lancé, L'API est accessible à l'adresse suivante : `http://localhost:8000/api/v1/`.


