import path from 'path';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import axios from 'axios';

dotenv.config();
const OLLAMA_API_URL = process.env.OLLAMA_API_URL;
const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL;

/**
 * Service de génération de vecteur d'embedding avec un modèle via Ollama.
 * @param {string} text - Le texte à transformer en vecteur.
 * @returns {Promise<number[]>} - Le vecteur d'embedding (liste de float).
 */
export async function generateEmbedding(text) {
    logger.info('Appel à Ollama pour générer un embedding.');
    try {
        const response = await axios.post(
            `${OLLAMA_API_URL}/api/embeddings`,
            {
            model: OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
            prompt: text,
            embedding_only: true
            },
            { timeout: 60_000 }
        );
        if (response.data && response.data.embedding) {
            logger.info('Embedding généré avec succès.');
            return response.data.embedding;
        } else {
            logger.error('Réponse Ollama inattendue :', response.data);
            throw new Error('Embedding non trouvé dans la réponse Ollama.');
        }
    } catch (error) {
        logger.error('Erreur lors de la génération de l\'embedding avec Ollama:', error);
        throw error;
    }
}

export default {
    generateEmbedding,
};