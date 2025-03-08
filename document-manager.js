// Fichier: document-manager.js

// Classe pour gérer les documents de voyage
class DocumentManager {
  constructor(driveService) {
    this.driveService = driveService;
    this.rootFolderId = null;
    this.tripFolders = {};
    this.isInitialized = false;
  }

  // Initialiser le gestionnaire de documents
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('Tentative d\'initialisation du Document Manager...');
      
      // Vérifier que le service Drive est prêt
      if (!this.driveService.isInitialized) {
        await this.driveService.initialize();
      }

      // Créer ou récupérer le dossier racine pour l'application
      await this.getOrCreateRootFolder();
      
      this.isInitialized = true;
      console.log('Document Manager initialisé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du Document Manager:', error);
      throw error;
    }
  }

  // Obtenir ou créer le dossier racine
  async getOrCreateRootFolder() {
    try {
      // Rechercher d'abord si le dossier existe déjà
      const query = "name = 'BCP Travels' and mimeType = 'application/vnd.google-apps.folder' and trashed = false";
      const files = await this.driveService.listFiles(null, query);
      
      if (files.length > 0) {
        this.rootFolderId = files[0].id;
        console.log('Dossier racine existant récupéré:', this.rootFolderId);
        return this.rootFolderId;
      }
      
      // Créer le dossier s'il n'existe pas
      const folderMetadata = await this.driveService.createFolder('BCP Travels');
      this.rootFolderId = folderMetadata.id;
      console.log('Nouveau dossier racine créé:', this.rootFolderId);
      return this.rootFolderId;
    } catch (error) {
      console.error('Erreur lors de la récupération/création du dossier racine:', error);
      throw error;
    }
  }

  // Obtenir ou créer un dossier pour un voyage spécifique
  async getOrCreateTripFolder(tripName) {
    // Vérifier si nous avons déjà l'ID du dossier en cache
    if (this.tripFolders[tripName]) {
      return this.tripFolders[tripName];
    }
    
    try {
      // S'assurer que le dossier racine existe
      if (!this.rootFolderId) {
        await this.getOrCreateRootFolder();
      }
      
      // Rechercher le dossier du voyage
      const query = `name = '${tripName}' and mimeType = 'application/vnd.google-apps.folder' and '${this.rootFolderId}' in parents and trashed = false`;
      const files = await this.driveService.listFiles(this.rootFolderId, query);
      
      if (files.length > 0) {
        this.tripFolders[tripName] = files[0].id;
        return files[0].id;
      }
      
      // Créer le dossier du voyage s'il n'existe pas
      const folderMetadata = await this.driveService.createFolder(tripName, this.rootFolderId);
      this.tripFolders[tripName] = folderMetadata.id;
      return folderMetadata.id;
    } catch (error) {
      console.error(`Erreur lors de la récupération/création du dossier pour ${tripName}:`, error);
      throw error;
    }
  }

  // Télécharger un document et l'associer à un voyage
  async uploadTripDocument(tripName, file, metadata = {}) {
    try {
      // S'assurer que le Document Manager est initialisé
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // Obtenir l'ID du dossier du voyage
      const tripFolderId = await this.getOrCreateTripFolder(tripName);
      
      // Télécharger le fichier vers Google Drive
      const fileData = await this.driveService.uploadFile(file, tripFolderId);
      
      // Ajouter des propriétés personnalisées au fichier (comme des métadonnées)
      // (Note: Cette fonctionnalité n'est pas directement disponible via l'API Drive v3 standard,
      // mais nous pouvons stocker les métadonnées dans une description ou un commentaire)
      
      // Pour le moment, associons simplement le voyage au fichier de manière interne
      fileData.tripName = tripName;
      fileData.customMetadata = metadata;
      
      return fileData;
    } catch (error) {
      console.error('Erreur lors du téléchargement du document:', error);
      throw error;
    }
  }

  // Récupérer tous les documents de voyage
  async getAllDocuments() {
    try {
      // S'assurer que le Document Manager est initialisé
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // S'assurer que le dossier racine existe
      if (!this.rootFolderId) {
        await this.getOrCreateRootFolder();
      }
      
      // Rechercher tous les fichiers dans tous les sous-dossiers de voyage
      const query = `'${this.rootFolderId}' in parents or '${this.rootFolderId}' in ancestors and trashed = false`;
      const files = await this.driveService.listFiles(null, query);
      
      // Enrichir les fichiers avec des informations sur le voyage
      const enrichedFiles = await Promise.all(files.map(async (file) => {
        // Si c'est un dossier, on ignore
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          return null;
        }
        
        // Déterminer à quel voyage ce document appartient en vérifiant le dossier parent
        const tripName = await this.getTripNameForFile(file.id);
        file.tripName = tripName;
        
        // Ici, on pourrait également récupérer des métadonnées personnalisées si elles sont stockées
        
        return file;
      }));
      
      // Filtrer les dossiers et les éléments nuls
      return enrichedFiles.filter(file => file !== null);
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      throw error;
    }
  }

  // Récupérer le nom du voyage pour un fichier donné
  async getTripNameForFile(fileId) {
    try {
      // Récupérer tous les dossiers de voyage
      const query = `mimeType = 'application/vnd.google-apps.folder' and '${this.rootFolderId}' in parents and trashed = false`;
      const folders = await this.driveService.listFiles(null, query);
      
      // Pour chaque dossier de voyage, vérifier si le fichier s'y trouve
      for (const folder of folders) {
        const fileQuery = `'${folder.id}' in parents and id = '${fileId}' and trashed = false`;
        const files = await this.driveService.listFiles(null, fileQuery);
        
        if (files.length > 0) {
          return folder.name;
        }
      }
      
      // Si le fichier n'est pas dans un dossier de voyage spécifique
      return 'General';
    } catch (error) {
      console.error(`Erreur lors de la récupération du voyage pour le fichier ${fileId}:`, error);
      return 'Unknown';
    }
  }

  // Récupérer les documents pour un voyage spécifique
  async getTripDocuments(tripName) {
    try {
      // S'assurer que le Document Manager est initialisé
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      // Obtenir l'ID du dossier du voyage
      const tripFolderId = await this.getOrCreateTripFolder(tripName);
      
      // Récupérer tous les fichiers dans ce dossier
      const files = await this.driveService.listFiles(tripFolderId);
      
      // Ajouter le nom du voyage à chaque fichier
      files.forEach(file => {
        file.tripName = tripName;
      });
      
      return files;
    } catch (error) {
      console.error(`Erreur lors de la récupération des documents pour ${tripName}:`, error);
      throw error;
    }
  }

  // Supprimer un document
  async deleteDocument(fileId) {
    try {
      await this.driveService.deleteFile(fileId);
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression du document ${fileId}:`, error);
      throw error;
    }
  }
}

// Créer et exporter une instance du Document Manager
const documentManager = new DocumentManager(driveService);

console.log('Module Document Manager chargé');
