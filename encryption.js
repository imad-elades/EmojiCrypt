/**
 * EmojiCrypt Encryption Module
 * Copyright (c) 2025 IMAD ELADES - Tous droits réservés
 * 
 * Handles AES-256 encryption/decryption and key management
 * Gère le chiffrement/déchiffrement AES-256 et la gestion des clés
 */

class EmojiCryptEncryption {
    constructor() {
        this.algorithm = 'AES';
        this.keySize = 256;
        this.ivSize = 128;
        this.iterations = 10000;
    }

    /**
     * Generate a random encryption key
     * @returns {string} Base64 encoded key
     */
    generateKey() {
        const array = new Uint8Array(32); // 256 bits
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode.apply(null, array));
    }

    /**
     * Derive key from password using PBKDF2
     * @param {string} password - User password
     * @param {string} salt - Salt for key derivation
     * @returns {Promise<CryptoKey>} Derived key
     */
    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveBits', 'deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: encoder.encode(salt),
                iterations: this.iterations,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: this.keySize },
            true,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypt a message using AES-GCM
     * @param {string} message - Plain text message
     * @param {string} password - Encryption password
     * @returns {Promise<string>} Encrypted message as base64
     */
    async encrypt(message, password) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(message);
            
            // Generate random salt and IV
            const salt = crypto.getRandomValues(new Uint8Array(16));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            
            // Derive key from password
            const key = await this.deriveKey(password, salt);
            
            // Encrypt the data
            const encrypted = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                data
            );
            
            // Combine salt, iv, and encrypted data
            const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
            combined.set(salt, 0);
            combined.set(iv, salt.length);
            combined.set(new Uint8Array(encrypted), salt.length + iv.length);
            
            // Return as base64
            return btoa(String.fromCharCode.apply(null, combined));
        } catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Échec du chiffrement: ' + error.message);
        }
    }

    /**
     * Decrypt a message using AES-GCM
     * @param {string} encryptedData - Base64 encrypted data
     * @param {string} password - Decryption password
     * @returns {Promise<string>} Decrypted message
     */
    async decrypt(encryptedData, password) {
        try {
            // Decode from base64
            const combined = new Uint8Array(
                atob(encryptedData).split('').map(char => char.charCodeAt(0))
            );
            
            // Extract salt, iv, and encrypted data
            const salt = combined.slice(0, 16);
            const iv = combined.slice(16, 28);
            const encrypted = combined.slice(28);
            
            // Derive key from password
            const key = await this.deriveKey(password, salt);
            
            // Decrypt the data
            const decrypted = await crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                key,
                encrypted
            );
            
            // Return as string
            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Échec du déchiffrement: Clé incorrecte ou données corrompues');
        }
    }

    /**
     * Generate a secure random password
     * @param {number} length - Password length
     * @returns {string} Random password
     */
    generateSecurePassword(length = 32) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        let password = '';
        
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }
        
        return password;
    }

    /**
     * Hash a string using SHA-256
     * @param {string} input - Input string
     * @returns {Promise<string>} Hex encoded hash
     */
    async hash(input) {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Validate encryption key strength
     * @param {string} key - Encryption key
     * @returns {object} Validation result
     */
    validateKey(key) {
        const result = {
            isValid: false,
            strength: 'weak',
            issues: []
        };

        if (!key || key.length < 8) {
            result.issues.push('La clé doit contenir au moins 8 caractères');
            return result;
        }

        if (key.length < 12) {
            result.issues.push('Clé courte - recommandé: 12+ caractères');
        }

        const hasUpperCase = /[A-Z]/.test(key);
        const hasLowerCase = /[a-z]/.test(key);
        const hasNumbers = /\d/.test(key);
        const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(key);

        let strengthScore = 0;
        if (hasUpperCase) strengthScore++;
        if (hasLowerCase) strengthScore++;
        if (hasNumbers) strengthScore++;
        if (hasSpecialChars) strengthScore++;

        if (strengthScore < 2) {
            result.issues.push('La clé devrait contenir des majuscules, minuscules, chiffres et caractères spéciaux');
        }

        if (key.length >= 12 && strengthScore >= 3) {
            result.strength = 'strong';
            result.isValid = true;
        } else if (key.length >= 8 && strengthScore >= 2) {
            result.strength = 'medium';
            result.isValid = true;
        }

        return result;
    }

    /**
     * Generate QR code data for key sharing
     * @param {string} key - Encryption key
     * @returns {Promise<string>} QR code data
     */
    async generateQRData(key) {
        const timestamp = Date.now();
        const hash = await this.hash(key + timestamp);
        
        return JSON.stringify({
            type: 'emojicrypt_key',
            key: key,
            timestamp: timestamp,
            hash: hash.substring(0, 16) // First 16 chars for verification
        });
    }

    /**
     * Parse QR code data for key import
     * @param {string} qrData - QR code data
     * @returns {Promise<object>} Parsed key data
     */
    async parseQRData(qrData) {
        try {
            const data = JSON.parse(qrData);
            
            if (data.type !== 'emojicrypt_key') {
                throw new Error('QR code invalide');
            }

            // Verify hash
            const expectedHash = await this.hash(data.key + data.timestamp);
            if (expectedHash.substring(0, 16) !== data.hash) {
                throw new Error('QR code corrompu');
            }

            // Check if not too old (24 hours)
            const age = Date.now() - data.timestamp;
            if (age > 24 * 60 * 60 * 1000) {
                console.warn('QR code ancien (plus de 24h)');
            }

            return {
                key: data.key,
                timestamp: data.timestamp,
                isValid: true
            };
        } catch (error) {
            throw new Error('Impossible de lire le QR code: ' + error.message);
        }
    }
}

// Export for use in other modules
window.EmojiCryptEncryption = EmojiCryptEncryption;

