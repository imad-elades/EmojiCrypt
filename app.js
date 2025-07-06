/**
 * EmojiCrypt Main Application
 * Copyright (c) 2025 IMAD ELADES - Tous droits réservés
 * 
 * Handles UI interactions and coordinates encryption/emoji conversion
 * Gère les interactions UI et coordonne le chiffrement/conversion emoji
 */

class EmojiCryptApp {
    constructor() {
        this.encryption = new EmojiCryptEncryption();
        this.emojiMapping = new EmojiMapping();
        this.currentKey = '';
        this.messageHistory = [];
        this.isDarkMode = false;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.loadHistory();
        this.checkBrowserSupport();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Settings modal
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openModal('settingsModal');
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            this.closeModal('settingsModal');
        });

        // Key management
        document.getElementById('generateKeyBtn').addEventListener('click', () => {
            this.generateKey();
        });

        document.getElementById('saveKeyBtn').addEventListener('click', () => {
            this.saveKey();
        });

        document.getElementById('qrBtn').addEventListener('click', () => {
            this.showQRCode();
        });

        document.getElementById('closeQR').addEventListener('click', () => {
            this.closeModal('qrModal');
        });

        // Encryption/Decryption
        document.getElementById('encryptBtn').addEventListener('click', () => {
            this.encryptMessage();
        });

        document.getElementById('decryptBtn').addEventListener('click', () => {
            this.decryptMessage();
        });

        // Sharing
        document.getElementById('shareWhatsApp').addEventListener('click', () => {
            this.shareToWhatsApp();
        });

        document.getElementById('copyBtn').addEventListener('click', () => {
            this.copyToClipboard();
        });

        document.getElementById('pasteBtn').addEventListener('click', () => {
            this.pasteFromClipboard();
        });

        // History
        document.getElementById('clearHistoryBtn').addEventListener('click', () => {
            this.clearHistory();
        });

        // Key input validation
        document.getElementById('encryptionKey').addEventListener('input', (e) => {
            this.validateKeyInput(e.target.value);
        });

        // Message input
        document.getElementById('messageInput').addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.encryptMessage();
            }
        });

        // Modal close on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Settings changes
        document.getElementById('saveHistory').addEventListener('change', (e) => {
            this.updateSetting('saveHistory', e.target.checked);
        });

        document.getElementById('biometricAuth').addEventListener('change', (e) => {
            this.updateSetting('biometricAuth', e.target.checked);
        });

        document.getElementById('encryptionAlgorithm').addEventListener('change', (e) => {
            this.updateSetting('encryptionAlgorithm', e.target.value);
        });
    }

    /**
     * Check browser support for required features
     */
    checkBrowserSupport() {
        const features = {
            crypto: !!window.crypto?.subtle,
            clipboard: !!navigator.clipboard,
            intl: !!window.Intl?.Segmenter
        };

        const unsupported = Object.entries(features)
            .filter(([, supported]) => !supported)
            .map(([feature]) => feature);

        if (unsupported.length > 0) {
            this.showToast(
                `Fonctionnalités non supportées: ${unsupported.join(', ')}. L'application pourrait ne pas fonctionner correctement.`,
                'error'
            );
        }
    }

    /**
     * Toggle between light and dark theme
     */
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        document.documentElement.setAttribute('data-theme', this.isDarkMode ? 'dark' : 'light');
        
        const icon = document.querySelector('#themeToggle i');
        icon.className = this.isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        
        this.saveSetting('theme', this.isDarkMode ? 'dark' : 'light');
        this.showToast(`Mode ${this.isDarkMode ? 'sombre' : 'clair'} activé`, 'info');
    }

    /**
     * Generate a new encryption key
     */
    generateKey() {
        const key = this.encryption.generateSecurePassword(32);
        document.getElementById('encryptionKey').value = key;
        this.currentKey = key;
        this.validateKeyInput(key);
        this.showToast('Nouvelle clé générée', 'success');
    }

    /**
     * Save the current key
     */
    saveKey() {
        const key = document.getElementById('encryptionKey').value;
        if (!key) {
            this.showToast('Aucune clé à sauvegarder', 'error');
            return;
        }

        this.currentKey = key;
        this.saveSetting('encryptionKey', key);
        this.showToast('Clé sauvegardée', 'success');
    }

    /**
     * Validate key input and show strength indicator
     */
    validateKeyInput(key) {
        const validation = this.encryption.validateKey(key);
        const keyInput = document.getElementById('encryptionKey');
        
        // Remove existing validation classes
        keyInput.classList.remove('key-weak', 'key-medium', 'key-strong');
        
        // Add appropriate class
        keyInput.classList.add(`key-${validation.strength}`);
        
        // Show validation message if needed
        if (validation.issues.length > 0) {
            // Could add a tooltip or validation message here
            console.log('Key validation issues:', validation.issues);
        }
    }

    /**
     * Show QR code for key sharing
     */
    async showQRCode() {
        const key = document.getElementById('encryptionKey').value;
        if (!key) {
            this.showToast('Aucune clé à partager', 'error');
            return;
        }

        try {
            const qrData = await this.encryption.generateQRData(key);
            const qrContainer = document.getElementById('qrContainer');
            
            // Clear previous QR code
            qrContainer.innerHTML = '';
            
            // Generate QR code
            const canvas = document.createElement('canvas');
            await QRCode.toCanvas(canvas, qrData, {
                width: 256,
                margin: 2,
                color: {
                    dark: this.isDarkMode ? '#ffffff' : '#000000',
                    light: this.isDarkMode ? '#0f172a' : '#ffffff'
                }
            });
            
            qrContainer.appendChild(canvas);
            this.openModal('qrModal');
        } catch (error) {
            this.showToast('Erreur lors de la génération du QR code: ' + error.message, 'error');
        }
    }

    /**
     * Encrypt the current message
     */
    async encryptMessage() {
        const message = document.getElementById('messageInput').value.trim();
        const key = document.getElementById('encryptionKey').value;

        if (!message) {
            this.showToast('Veuillez entrer un message', 'error');
            return;
        }

        if (!key) {
            this.showToast('Veuillez entrer une clé de chiffrement', 'error');
            return;
        }

        try {
            this.showLoading('Chiffrement en cours...');
            
            // Encrypt the message
            const encryptedData = await this.encryption.encrypt(message, key);
            
            // Convert to emojis
            const emojiSequence = this.emojiMapping.encodeToEmojis(encryptedData);
            
            // Display the result
            this.addMessage(message, emojiSequence, 'sent');
            
            // Clear input
            document.getElementById('messageInput').value = '';
            
            // Save to history if enabled
            if (this.getSetting('saveHistory', true)) {
                this.addToHistory(message, emojiSequence, 'encrypted');
            }
            
            this.hideLoading();
            this.showToast('Message chiffré avec succès', 'success');
        } catch (error) {
            this.hideLoading();
            this.showToast('Erreur de chiffrement: ' + error.message, 'error');
        }
    }

    /**
     * Decrypt the current message
     */
    async decryptMessage() {
        const emojiMessage = document.getElementById('messageInput').value.trim();
        const key = document.getElementById('encryptionKey').value;

        if (!emojiMessage) {
            this.showToast('Veuillez entrer un message emoji', 'error');
            return;
        }

        if (!key) {
            this.showToast('Veuillez entrer une clé de déchiffrement', 'error');
            return;
        }

        try {
            this.showLoading('Déchiffrement en cours...');
            
            // Validate emoji sequence
            const validation = this.emojiMapping.validateEmojiSequence(emojiMessage);
            if (!validation.isValid) {
                throw new Error('Format emoji invalide: ' + validation.errors.join(', '));
            }
            
            // Convert emojis back to encrypted data
            const encryptedData = this.emojiMapping.decodeFromEmojis(emojiMessage);
            
            // Decrypt the message
            const decryptedMessage = await this.encryption.decrypt(encryptedData, key);
            
            // Display the result
            this.addMessage(decryptedMessage, emojiMessage, 'received');
            
            // Clear input
            document.getElementById('messageInput').value = '';
            
            // Save to history if enabled
            if (this.getSetting('saveHistory', true)) {
                this.addToHistory(decryptedMessage, emojiMessage, 'decrypted');
            }
            
            this.hideLoading();
            this.showToast('Message déchiffré avec succès', 'success');
        } catch (error) {
            this.hideLoading();
            this.showToast('Erreur de déchiffrement: ' + error.message, 'error');
        }
    }

    /**
     * Add a message to the chat display
     */
    addMessage(text, emoji, type) {
        const messagesArea = document.getElementById('messagesArea');
        
        // Remove welcome message if it exists
        const welcomeMessage = messagesArea.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        
        messageDiv.innerHTML = `
            <div class="message-text">${this.escapeHtml(text)}</div>
            <div class="message-emoji emoji">${emoji}</div>
            <div class="message-meta">${timestamp}</div>
        `;
        
        messagesArea.appendChild(messageDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    /**
     * Share message to WhatsApp
     */
    shareToWhatsApp() {
        const lastMessage = this.getLastEmojiMessage();
        if (!lastMessage) {
            this.showToast('Aucun message emoji à partager', 'error');
            return;
        }

        const text = encodeURIComponent(`Message EmojiCrypt:\n${lastMessage}`);
        const url = `https://wa.me/?text=${text}`;
        
        window.open(url, '_blank');
        this.showToast('Ouverture de WhatsApp...', 'info');
    }

    /**
     * Copy last emoji message to clipboard
     */
    async copyToClipboard() {
        const lastMessage = this.getLastEmojiMessage();
        if (!lastMessage) {
            this.showToast('Aucun message emoji à copier', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(lastMessage);
            this.showToast('Message copié dans le presse-papiers', 'success');
        } catch (error) {
            // Fallback for older browsers
            this.fallbackCopyToClipboard(lastMessage);
        }
    }

    /**
     * Paste from clipboard to message input
     */
    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            document.getElementById('messageInput').value = text;
            this.showToast('Message collé depuis le presse-papiers', 'success');
        } catch (error) {
            this.showToast('Impossible de lire le presse-papiers', 'error');
        }
    }

    /**
     * Get the last emoji message from chat
     */
    getLastEmojiMessage() {
        const messages = document.querySelectorAll('.message-emoji');
        if (messages.length === 0) return null;
        
        return messages[messages.length - 1].textContent;
    }

    /**
     * Fallback copy to clipboard for older browsers
     */
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showToast('Message copié dans le presse-papiers', 'success');
        } catch (error) {
            this.showToast('Impossible de copier le message', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    /**
     * Add message to history
     */
    addToHistory(text, emoji, type) {
        const historyItem = {
            id: Date.now(),
            text: text,
            emoji: emoji,
            type: type,
            timestamp: new Date().toISOString()
        };
        
        this.messageHistory.unshift(historyItem);
        
        // Limit history to 50 items
        if (this.messageHistory.length > 50) {
            this.messageHistory = this.messageHistory.slice(0, 50);
        }
        
        this.updateHistoryDisplay();
        this.saveHistory();
    }

    /**
     * Update history display
     */
    updateHistoryDisplay() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';
        
        this.messageHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.onclick = () => this.loadFromHistory(item);
            
            historyItem.innerHTML = `
                <div class="history-item-text">${this.escapeHtml(item.text.substring(0, 50))}${item.text.length > 50 ? '...' : ''}</div>
                <div class="history-item-emoji">${item.emoji.substring(0, 20)}${item.emoji.length > 20 ? '...' : ''}</div>
                <div class="history-item-meta">${new Date(item.timestamp).toLocaleString()}</div>
            `;
            
            historyList.appendChild(historyItem);
        });
    }

    /**
     * Load message from history
     */
    loadFromHistory(item) {
        document.getElementById('messageInput').value = item.type === 'encrypted' ? item.emoji : item.text;
        this.showToast('Message chargé depuis l\'historique', 'info');
    }

    /**
     * Clear message history
     */
    clearHistory() {
        if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
            this.messageHistory = [];
            this.updateHistoryDisplay();
            this.saveHistory();
            this.showToast('Historique effacé', 'info');
        }
    }

    /**
     * Show loading overlay
     */
    showLoading(message = 'Chargement...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = overlay.querySelector('p');
        text.textContent = message;
        overlay.classList.add('active');
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('active');
    }

    /**
     * Show modal
     */
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    /**
     * Close modal
     */
    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Save setting to localStorage
     */
    saveSetting(key, value) {
        localStorage.setItem(`emojicrypt_${key}`, JSON.stringify(value));
    }

    /**
     * Get setting from localStorage
     */
    getSetting(key, defaultValue = null) {
        const stored = localStorage.getItem(`emojicrypt_${key}`);
        return stored ? JSON.parse(stored) : defaultValue;
    }

    /**
     * Update setting and save
     */
    updateSetting(key, value) {
        this.saveSetting(key, value);
        this.showToast(`Paramètre ${key} mis à jour`, 'info');
    }

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        // Load theme
        const theme = this.getSetting('theme', 'light');
        this.isDarkMode = theme === 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = this.isDarkMode ? 'fas fa-sun' : 'fas fa-moon';
        
        // Load encryption key
        const savedKey = this.getSetting('encryptionKey', '');
        if (savedKey) {
            document.getElementById('encryptionKey').value = savedKey;
            this.currentKey = savedKey;
        }
        
        // Load other settings
        document.getElementById('saveHistory').checked = this.getSetting('saveHistory', true);
        document.getElementById('biometricAuth').checked = this.getSetting('biometricAuth', false);
        document.getElementById('encryptionAlgorithm').value = this.getSetting('encryptionAlgorithm', 'aes');
    }

    /**
     * Save history to localStorage
     */
    saveHistory() {
        if (this.getSetting('saveHistory', true)) {
            this.saveSetting('messageHistory', this.messageHistory);
        }
    }

    /**
     * Load history from localStorage
     */
    loadHistory() {
        if (this.getSetting('saveHistory', true)) {
            this.messageHistory = this.getSetting('messageHistory', []);
            this.updateHistoryDisplay();
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.emojiCryptApp = new EmojiCryptApp();
});

