/**
 * EmojiCrypt Emoji Mapping Module
 * Copyright (c) 2025 IMAD ELADES - Tous droits réservés
 * 
 * Handles conversion between encrypted data and emoji sequences
 * Gère la conversion entre données chiffrées et séquences d'emojis
 */

class EmojiMapping {
    constructor() {
        // Comprehensive emoji set for encoding (256 unique emojis for byte mapping)
        this.emojiSet = [
            // Faces and emotions (0-31)
            '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
            '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
            '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
            '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
            
            // More faces (32-63)
            '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
            '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
            '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
            '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
            
            // Animals (64-95)
            '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
            '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵',
            '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤',
            '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗',
            
            // More animals (96-127)
            '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜',
            '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎',
            '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡',
            '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅',
            
            // Nature (128-159)
            '🌱', '🌿', '🍀', '🍃', '🍂', '🍁', '🌾', '🌵',
            '🌲', '🌳', '🌴', '🌸', '🌺', '🌻', '🌷', '🌹',
            '🥀', '🌼', '🌵', '🌿', '☘️', '🍀', '🍃', '🍂',
            '🍁', '🌾', '🌱', '🌿', '🌵', '🌲', '🌳', '🌴',
            
            // Food (160-191)
            '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓',
            '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝',
            '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑',
            '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐',
            
            // More food (192-223)
            '🥖', '🍞', '🥨', '🥯', '🧀', '🥚', '🍳', '🧈',
            '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭',
            '🍔', '🍟', '🍕', '🥪', '🥙', '🧆', '🌮', '🌯',
            '🫔', '🥗', '🥘', '🫕', '🍝', '🍜', '🍲', '🍛',
            
            // Objects (224-255)
            '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
            '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
            '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿',
            '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿'
        ];
        
        // Verify we have exactly 256 emojis
        if (this.emojiSet.length !== 256) {
            console.warn(`Emoji set has ${this.emojiSet.length} emojis, expected 256`);
            // Pad or trim to exactly 256
            while (this.emojiSet.length < 256) {
                this.emojiSet.push('🔸'); // Default padding emoji
            }
            this.emojiSet = this.emojiSet.slice(0, 256);
        }
        
        // Create reverse mapping for decoding
        this.emojiToByteMap = new Map();
        this.emojiSet.forEach((emoji, index) => {
            this.emojiToByteMap.set(emoji, index);
        });
        
        // Special markers for message structure
        this.markers = {
            start: '🔐', // Message start marker
            end: '🔒',   // Message end marker
            separator: '✨' // Chunk separator
        };
    }

    /**
     * Convert base64 encrypted data to emoji sequence
     * @param {string} base64Data - Base64 encoded encrypted data
     * @returns {string} Emoji sequence
     */
    encodeToEmojis(base64Data) {
        try {
            // Convert base64 to binary string
            const binaryString = atob(base64Data);
            
            // Convert to byte array
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            // Convert bytes to emojis
            let emojiSequence = this.markers.start;
            
            // Process in chunks for better readability
            const chunkSize = 32; // 32 bytes per chunk
            for (let i = 0; i < bytes.length; i += chunkSize) {
                if (i > 0) {
                    emojiSequence += this.markers.separator;
                }
                
                const chunk = bytes.slice(i, i + chunkSize);
                for (const byte of chunk) {
                    emojiSequence += this.emojiSet[byte];
                }
            }
            
            emojiSequence += this.markers.end;
            
            return emojiSequence;
        } catch (error) {
            console.error('Emoji encoding error:', error);
            throw new Error('Erreur lors de l\'encodage en emojis: ' + error.message);
        }
    }

    /**
     * Convert emoji sequence back to base64 encrypted data
     * @param {string} emojiSequence - Emoji sequence
     * @returns {string} Base64 encoded data
     */
    decodeFromEmojis(emojiSequence) {
        try {
            // Remove start and end markers
            if (!emojiSequence.startsWith(this.markers.start) || 
                !emojiSequence.endsWith(this.markers.end)) {
                throw new Error('Format de message emoji invalide');
            }
            
            let cleanSequence = emojiSequence.slice(
                this.markers.start.length, 
                -this.markers.end.length
            );
            
            // Remove separators
            cleanSequence = cleanSequence.replace(new RegExp(this.markers.separator, 'g'), '');
            
            // Convert emojis back to bytes
            const bytes = [];
            
            // Split into individual emojis (handle multi-byte Unicode)
            const emojis = this.splitEmojis(cleanSequence);
            
            for (const emoji of emojis) {
                if (this.emojiToByteMap.has(emoji)) {
                    bytes.push(this.emojiToByteMap.get(emoji));
                } else {
                    console.warn(`Unknown emoji in sequence: ${emoji}`);
                    // Skip unknown emojis or throw error
                    throw new Error(`Emoji non reconnu dans la séquence: ${emoji}`);
                }
            }
            
            // Convert bytes back to binary string
            const binaryString = String.fromCharCode.apply(null, bytes);
            
            // Convert to base64
            return btoa(binaryString);
        } catch (error) {
            console.error('Emoji decoding error:', error);
            throw new Error('Erreur lors du décodage des emojis: ' + error.message);
        }
    }

    /**
     * Split emoji sequence into individual emojis
     * Handles complex Unicode emojis with modifiers
     * @param {string} emojiString - String containing emojis
     * @returns {Array<string>} Array of individual emojis
     */
    splitEmojis(emojiString) {
        // Use Unicode segmentation to properly split emojis
        const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
        const segments = segmenter.segment(emojiString);
        return Array.from(segments, segment => segment.segment);
    }

    /**
     * Validate emoji sequence format
     * @param {string} emojiSequence - Emoji sequence to validate
     * @returns {object} Validation result
     */
    validateEmojiSequence(emojiSequence) {
        const result = {
            isValid: false,
            errors: []
        };

        if (!emojiSequence) {
            result.errors.push('Séquence d\'emojis vide');
            return result;
        }

        if (!emojiSequence.startsWith(this.markers.start)) {
            result.errors.push('Marqueur de début manquant');
        }

        if (!emojiSequence.endsWith(this.markers.end)) {
            result.errors.push('Marqueur de fin manquant');
        }

        // Check for valid emojis
        let cleanSequence = emojiSequence.slice(
            this.markers.start.length, 
            -this.markers.end.length
        );
        cleanSequence = cleanSequence.replace(new RegExp(this.markers.separator, 'g'), '');

        const emojis = this.splitEmojis(cleanSequence);
        const unknownEmojis = emojis.filter(emoji => !this.emojiToByteMap.has(emoji));

        if (unknownEmojis.length > 0) {
            result.errors.push(`Emojis non reconnus: ${unknownEmojis.slice(0, 5).join(', ')}`);
        }

        result.isValid = result.errors.length === 0;
        return result;
    }

    /**
     * Get statistics about emoji sequence
     * @param {string} emojiSequence - Emoji sequence
     * @returns {object} Statistics
     */
    getSequenceStats(emojiSequence) {
        const emojis = this.splitEmojis(emojiSequence);
        const dataEmojis = emojis.filter(emoji => 
            emoji !== this.markers.start && 
            emoji !== this.markers.end && 
            emoji !== this.markers.separator
        );

        return {
            totalEmojis: emojis.length,
            dataEmojis: dataEmojis.length,
            estimatedBytes: dataEmojis.length,
            chunks: emojiSequence.split(this.markers.separator).length - 1,
            hasValidMarkers: emojiSequence.startsWith(this.markers.start) && 
                           emojiSequence.endsWith(this.markers.end)
        };
    }

    /**
     * Format emoji sequence for better readability
     * @param {string} emojiSequence - Raw emoji sequence
     * @returns {string} Formatted emoji sequence
     */
    formatForDisplay(emojiSequence) {
        // Add line breaks after separators for better readability
        return emojiSequence.replace(
            new RegExp(this.markers.separator, 'g'), 
            this.markers.separator + '\n'
        );
    }

    /**
     * Remove formatting from emoji sequence
     * @param {string} formattedSequence - Formatted emoji sequence
     * @returns {string} Clean emoji sequence
     */
    removeFormatting(formattedSequence) {
        return formattedSequence.replace(/\s+/g, '');
    }

    /**
     * Generate a test emoji sequence for validation
     * @param {number} length - Number of data bytes
     * @returns {string} Test emoji sequence
     */
    generateTestSequence(length = 32) {
        let sequence = this.markers.start;
        
        for (let i = 0; i < length; i++) {
            if (i > 0 && i % 32 === 0) {
                sequence += this.markers.separator;
            }
            sequence += this.emojiSet[Math.floor(Math.random() * 256)];
        }
        
        sequence += this.markers.end;
        return sequence;
    }
}

// Export for use in other modules
window.EmojiMapping = EmojiMapping;

