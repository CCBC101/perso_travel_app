// app.js - Fichier JavaScript principal simplifié
document.addEventListener('DOMContentLoaded', function() {
    console.log("Application initialisée");
    
    // Initialiser l'affichage de base
    setupBasicUI();
});

// Fonction d'initialisation de l'interface utilisateur de base
function setupBasicUI() {
    // Configurer l'interface de base sans dépendances Google
    document.querySelectorAll('.card').forEach(function(card) {
        card.addEventListener('click', function() {
            const tripId = this.dataset.trip;
            if (tripId) {
                showView(`${tripId}-view`);
            }
        });
    });
    
    // Fonction pour afficher une vue
    function showView(viewId) {
        // Cacher toutes les vues
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Afficher la vue demandée
        const view = document.getElementById(viewId);
        if (view) {
            view.classList.add('active');
        }
    }
}

// Fonction initMap pour Google Maps
window.initMap = function() {
    console.log("Google Maps API initialisée");
    // Initialisation simplifiée des cartes
};
