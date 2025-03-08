// Fichier: google-drive-service.js

// Paramètres pour l'API Google Drive
const DRIVE_API_CONFIG = {
  apiKey: 'AIzaSyAJq9jlXHmJvJnDtsILU1p6ShJXz62g36g',
  clientId: '182976407425-5cbitjlrgvbm5l7iteop4tv1danppi7r.apps.googleusercontent.com',
  discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
  scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.appdata'
};

// Classe de service pour Google Drive
class GoogleDriveService {
  constructor() {
    this.isAuthenticated = false;
    this.isInitialized = false;
    this.authInstance = null;
  }

  // Initialiser le service Google Drive
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('Tentative d\'initialisation de Google Drive...');
      
      // Vérification que gapi est chargé
      if (typeof gapi === 'undefined') {
        console.error('Erreur: La bibliothèque gapi n\'est pas chargée');
        throw new Error('La bibliothèque gapi n\'est pas chargée');
      }
      
      await this.loadGapiClient();
      this.isInitialized = true;
      console.log('Service Google Drive initialisé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du service Google Drive:', error);
      throw error;
    }
  }

  // Charger le client GAPI
  loadGapiClient() {
    return new Promise((resolve, reject) => {
      console.log('Chargement du client GAPI...');
      
      gapi.load('client:auth2', () => {
        console.log('GAPI client:auth2 chargé, initialisation...');
        
        gapi.client.init({
          apiKey: DRIVE_API_CONFIG.apiKey,
          clientId: DRIVE_API_CONFIG.clientId,
          discoveryDocs: DRIVE_API_CONFIG.discoveryDocs,
          scope: DRIVE_API_CONFIG.scope
        }).then(() => {
          console.log('GAPI client initialisé avec succès');
          
          this.authInstance = gapi.auth2.getAuthInstance();
          this.isAuthenticated = this.authInstance.isSignedIn.get();
          
          console.log('État d\'authentification initial:', this.isAuthenticated);
          
          // Écouter les changements d'état de connexion
          this.authInstance.isSignedIn.listen(isSignedIn => {
            this.isAuthenticated = isSignedIn;
            console.log('État d\'authentification modifié:', isSignedIn);
            
            // Déclencher un événement personnalisé
            const event = new CustomEvent('driveAuthChanged', { detail: { isSignedIn } });
            document.dispatchEvent(event);
          });
          
          resolve();
        }).catch(error => {
          console.error('Erreur lors de l\'initialisation du client GAPI:', error);
          reject(error);
        });
      });
    });
  }

  // Se connecter à Google Drive
  async signIn() {
    if (!this.isInitialized) await this.initialize();
    
    if (!this.isAuthenticated) {
      try {
        console.log('Tentative de connexion à Google Drive...');
        const result = await this.authInstance.signIn();
        console.log('Connexion réussie:', result);
        return true;
      } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        throw error;
      }
    }
    
    return this.isAuthenticated;
  }

  // Se déconnecter de Google Drive
  async signOut() {
    if (!this.isInitialized) await this.initialize();
    
    if (this.isAuthenticated) {
      try {
        await this.authInstance.signOut();
        return true;
      } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        throw error;
      }
    }
    
    return !this.isAuthenticated;
  }

  // Créer un dossier
  async createFolder(folderName, parentFolderId = null) {
    if (!this.isAuthenticated) await this.signIn();
    
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };
    
    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }
    
    try {
      const response = await gapi.client.drive.files.create({
        resource: fileMetadata,
        fields: 'id, name, webViewLink'
      });
      
      return response.result;
    } catch (error) {
      console.error('Erreur lors de la création du dossier:', error);
      throw error;
    }
  }

  // Télécharger un fichier vers Google Drive
  async uploadFile(file, folderId = null, onProgress = null) {
    if (!this.isAuthenticated) await this.signIn();
    
    const metadata = {
      name: file.name,
      mimeType: file.type
    };
    
    if (folderId) {
      metadata.parents = [folderId];
    }
    
    try {
      console.log('Téléchargement du fichier vers Google Drive...', file.name);
      
      // Initialiser le téléchargement
      const initResponse = await gapi.client.drive.files.create({
        resource: metadata,
        fields: 'id'
      });
      
      const fileId = initResponse.result.id;
      console.log('ID du fichier créé:', fileId);
      
      // Lire le contenu du fichier
      const content = await this.readFileContent(file);
      
      // Télécharger le contenu du fichier
      const accessToken = gapi.auth.getToken().access_token;
      console.log('Token d\'accès obtenu, téléchargement du contenu...');
      
      const uploadResponse = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': file.type
          },
          body: content
        }
      );
      
      if (!uploadResponse.ok) {
        throw new Error(`Erreur lors du téléchargement: ${uploadResponse.statusText}`);
      }
      
      console.log('Contenu téléchargé avec succès, récupération des informations complètes...');
      
      // Récupérer les informations complètes du fichier
      const fileResponse = await gapi.client.drive.files.get({
        fileId: fileId,
        fields: 'id, name, webViewLink, webContentLink, mimeType, size'
      });
      
      console.log('Fichier téléchargé avec succès:', fileResponse.result);
      return fileResponse.result;
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      throw error;
    }
  }

  // Lire le contenu d'un fichier
  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(e.target.error);
      
      reader.readAsArrayBuffer(file);
    });
  }

  // Lister les fichiers dans un dossier
  async listFiles(folderId = null, query = null) {
    if (!this.isAuthenticated) await this.signIn();
    
    let queryString = '';
    
    if (folderId) {
      queryString = `'${folderId}' in parents`;
    }
    
    if (query) {
      queryString = queryString ? `${queryString} and ${query}` : query;
    }
    
    // Ajouter la condition pour exclure les fichiers dans la corbeille
    queryString = queryString ? `${queryString} and trashed = false` : 'trashed = false';
    
    try {
      console.log('Récupération des fichiers avec la requête:', queryString);
      
      const response = await gapi.client.drive.files.list({
        q: queryString,
        fields: 'files(id, name, mimeType, webViewLink, webContentLink, createdTime, modifiedTime, size, thumbnailLink)',
        orderBy: 'modifiedTime desc'
      });
      
      console.log('Fichiers récupérés:', response.result.files.length);
      return response.result.files;
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers:', error);
      throw error;
    }
  }

  // Télécharger un fichier depuis Google Drive
  async downloadFile(fileId) {
    if (!this.isAuthenticated) await this.signIn();
    
    try {
      const response = await gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });
      
      return response.body;
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      throw error;
    }
  }

  // Supprimer un fichier ou un dossier
  async deleteFile(fileId) {
    if (!this.isAuthenticated) await this.signIn();
    
    try {
      await gapi.client.drive.files.delete({
        fileId: fileId
      });
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
      throw error;
    }
  }
}

// Créer et exporter une instance du service
const driveService = new GoogleDriveService();

// Débogage - vérifier que le service est créé
console.log('Service Google Drive créé');
