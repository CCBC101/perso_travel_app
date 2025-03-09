/**
 * BCP Travels - Application principale
 * Ce fichier contient toutes les fonctionnalités JavaScript pour l'application de voyage
 */

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', function() {
    console.log('Application BCP Travels initialisée');
    
    // Mettre à jour le compte à rebours
    updateCountdown();
    
    // Mettre à jour le compte à rebours quotidiennement
    setInterval(updateCountdown, 86400000); // 24 heures
    
    // Initialiser tous les écouteurs d'événements
    setupEventListeners();
    
    // Afficher la vue initiale
    showView('home-view');
});

/**
 * Fonction pour calculer et afficher le compte à rebours jusqu'au prochain voyage
 */
function updateCountdown() {
    // Date actuelle
    const now = new Date();
    
    // Liste des voyages (à remplacer par des données réelles)
    const trips = [
        { name: "Tokyo", date: new Date("2024-01-15") },
        { name: "Paris", date: new Date("2023-08-10") },
        { name: "Rome", date: new Date("2023-10-15") },
        { name: "Bali", date: new Date("2023-12-11") }
    ];
    
    // Trier les voyages par date
    trips.sort((a, b) => a.date - b.date);
    
    // Trouver le prochain voyage
    const upcomingTrips = trips.filter(trip => trip.date > now);
    
    if (upcomingTrips.length > 0) {
        const nextTrip = upcomingTrips[0];
        
        // Calculer la différence en jours
        const timeDiff = nextTrip.date.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        // Mettre à jour l'affichage
        const countdownDays = document.querySelector('.countdown-days');
        const countdownDest = document.querySelector('.countdown-dest');
        
        if (countdownDays && countdownDest) {
            countdownDays.textContent = `J-${daysDiff}`;
            countdownDest.textContent = nextTrip.name;
        }
    }
}

/**
 * Fonction pour afficher une vue spécifique
 * @param {string} viewId - L'ID de la vue à afficher
 */
function showView(viewId) {
    // Cacher toutes les vues
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Afficher la vue demandée
    const view = document.getElementById(viewId);
    if (view) {
        view.classList.add('active');
        
        // Mettre à jour l'état actif de la navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.view === viewId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Charger les documents si on va à la vue documents
        if (viewId === 'documents-view') {
            showEmptyDocumentsList();
        }
    }
}

/**
 * Fonction pour configurer tous les écouteurs d'événements
 */
function setupEventListeners() {
    console.log('Configuration des écouteurs d\'événements');
    
    // Clic sur les cartes - navigation vers la vue détaillée
    document.querySelectorAll('.card').forEach(function(card) {
        card.addEventListener('click', function() {
            const tripId = this.dataset.trip;
            if (tripId) {
                showView(`${tripId}-view`);
            }
        });
    });
    
    // Clic sur le bouton de retour
    document.querySelectorAll('.back-button').forEach(function(button) {
        button.addEventListener('click', function() {
            showView('home-view');
        });
    });
    
    // Basculer les favoris
    document.querySelectorAll('.card-favorite').forEach(function(favorite) {
        favorite.addEventListener('click', function(e) {
            e.stopPropagation(); // Empêcher le clic sur la carte
            this.classList.toggle('active');
            const icon = this.querySelector('i');
            if (this.classList.contains('active')) {
                icon.classList.remove('far');
                icon.classList.add('fas');
            } else {
                icon.classList.remove('fas');
                icon.classList.add('far');
            }
        });
    });
    
    // Changement d'onglet
    document.querySelectorAll('.tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            // Récupérer tous les onglets dans le même conteneur
            const tabs = this.closest('.tabs').querySelectorAll('.tab');
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Navigation inférieure
    document.querySelectorAll('.nav-item[data-view]').forEach(function(navItem) {
        navItem.addEventListener('click', function(e) {
            e.preventDefault();
            const viewId = this.dataset.view;
            if (viewId) {
                showView(viewId);
            }
        });
    });
    
    // Ouvrir les modales
    document.querySelectorAll('[data-modal]').forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const modalId = this.dataset.modal;
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'block';
            }
        });
    });
    
    // Fermer les modales (X)
    document.querySelectorAll('.modal-close').forEach(function(close) {
        close.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Fermer les modales (bouton Annuler)
    document.querySelectorAll('#cancel-btn, #cancel-document-btn, #cancel-trip-btn').forEach(function(button) {
        button.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Fermer les modales (clic à l'extérieur)
    window.addEventListener('click', function(event) {
        document.querySelectorAll('.modal').forEach(function(modal) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Soumission du formulaire d'ajout de document
    const addDocumentForm = document.getElementById('add-document-form');
    if (addDocumentForm) {
        addDocumentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simuler l'ajout d'un document
            showNotification('Document ajouté avec succès', 'success');
            
            // Fermer la modale
            document.getElementById('add-document-modal').style.display = 'none';
            
            // Réinitialiser le formulaire
            this.reset();
        });
    }
    
    // Soumission du formulaire d'ajout d'élément
    const addItemForm = document.getElementById('add-item-form');
    if (addItemForm) {
        addItemForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simuler l'ajout d'un élément
            showNotification('Élément ajouté avec succès', 'success');
            
            // Fermer la modale
            document.getElementById('add-item-modal').style.display = 'none';
            
            // Réinitialiser le formulaire
            this.reset();
        });
    }
    
    // Soumission du formulaire d'ajout de voyage
    const addTripForm = document.getElementById('add-trip-form');
    if (addTripForm) {
        addTripForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simuler l'ajout d'un voyage
            const destination = document.getElementById('trip-title').value;
            showNotification(`Voyage à ${destination} ajouté avec succès`, 'success');
            
            // Fermer la modale
            document.getElementById('add-trip-modal').style.display = 'none';
            
            // Réinitialiser le formulaire
            this.reset();
        });
    }
    
    // Prévisualisation des fichiers
    document.querySelectorAll('input[type="file"]').forEach(input => {
        input.addEventListener('change', function() {
            const previewContainer = this.parentElement.querySelector('.file-preview-container');
            if (previewContainer && this.files.length > 0) {
                previewContainer.innerHTML = '';
                
                const filePreview = document.createElement('div');
                filePreview.classList.add('file-preview');
                
                for (const file of this.files) {
                    const fileItem = document.createElement('div');
                    fileItem.classList.add('file-item');
                    
                    let iconClass = 'fa-file';
                    if (file.type.includes('pdf')) iconClass = 'fa-file-pdf';
                    else if (file.type.includes('image')) iconClass = 'fa-file-image';
                    
                    fileItem.innerHTML = `
                        <i class="fas ${iconClass}"></i>
                        <span>${file.name}</span>
                        <small>(${formatFileSize(file.size)})</small>
                    `;
                    filePreview.appendChild(fileItem);
                }
                
                previewContainer.appendChild(filePreview);
            }
        });
    });
    
    // Galerie de vignettes
    document.querySelectorAll('.thumbnail').forEach(function(thumbnail) {
        thumbnail.addEventListener('click', function() {
            document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Mettre à jour l'image principale
            const mainImg = this.closest('.detail-header').querySelector('.detail-img');
            if (mainImg) mainImg.src = this.src;
        });
    });
}

/**
 * Fonction pour afficher un message de notification
 * @param {string} message - Le message à afficher
 * @param {string} type - Le type de notification ('success', 'error', 'info')
 */
function showNotification(message, type = 'info') {
    // Supprimer toute notification existante
    document.querySelectorAll('.notification').forEach(notification => {
        notification.remove();
    });
    
    // Créer une nouvelle notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => {
        notification.classList.add('visible');
    }, 10);
    
    // Auto-fermeture après 5 secondes
    const timeout = setTimeout(() => {
        closeNotification(notification);
    }, 5000);
    
    // Fermeture manuelle
    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(timeout);
        closeNotification(notification);
    });
}

/**
 * Fonction pour fermer une notification
 * @param {HTMLElement} notification - L'élément de notification à fermer
 */
function closeNotification(notification) {
    notification.classList.remove('visible');
    setTimeout(() => {
        notification.remove();
    }, 300);
}

/**
 * Fonction pour formater la taille des fichiers
 * @param {number} bytes - La taille en octets
 * @returns {string} - La taille formatée
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' octets';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
}

/**
 * Fonction pour afficher un état vide pour la liste des documents
 */
function showEmptyDocumentsList() {
    const documentsList = document.querySelector('.documents-list');
    if (documentsList) {
        documentsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt empty-icon"></i>
                <p>Aucun document disponible</p>
                <button class="btn btn-primary" data-modal="add-document-modal">
                    <i class="fas fa-plus"></i> Ajouter un document
                </button>
            </div>
        `;
        
        // Ajouter l'écouteur pour le bouton d'ajout
        const addButton = documentsList.querySelector('button[data-modal]');
        if (addButton) {
            addButton.addEventListener('click', function() {
                const modalId = this.dataset.modal;
                const modal = document.getElementById(modalId);
                if (modal) modal.style.display = 'block';
            });
        }
    }
}

/**
 * Fonction pour obtenir le voyage en cours
 * @returns {string} - L'ID du voyage en cours
 */
function getCurrentTrip() {
    const activeDetailView = document.querySelector('.detail-view.active');
    if (activeDetailView) {
        return activeDetailView.id.replace('-view', '');
    }
    return 'General';
}
