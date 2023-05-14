import axios from 'axios';
import type { Model } from './Interfaces/Models';

const apiUrl = "https://api.elevenlabs.io/";

export async function getVoices(xi_api_key: string) {
    const header = {"Content-Type": 'application/json','xi-api-key': xi_api_key}
    try {
        const response = await axios.get(apiUrl+'v1/voices', {headers: header});
        return { return: "response", axios: response };
    } catch (error) {
        return { return: "error", axios: error };
    }
}

export async function getUserInfo(xi_api_key: string) {
    const header = {"Content-Type": 'application/json','xi-api-key': xi_api_key}
    try {
        const response = await axios.get(apiUrl+'v1/user', {headers: header});
        return { return: "response", axios: response };
    } catch (error) {
        return { return: "error", axios: error };
    }
}

export async function postTextToSpeech(xi_api_key: string, model: Model, voice_id: string, text: string, stability: number, similarity_boost: number) {
    const normalizedStability = stability / 100.0;
    const normalizedSimilarityBoost = similarity_boost / 100.0;
    const data = {
      model_id: model.model_id,
      text,
      voice_settings: { stability: normalizedStability, similarity_boost: normalizedSimilarityBoost },
    };
    const headers = {
      'xi-api-key': xi_api_key,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    };
    try {
      const response = await axios.post(`${apiUrl}v1/text-to-speech/${voice_id}`, data, { headers, responseType: 'arraybuffer' });
      return { return: 'response', axios: response };
    } catch (error) {
      return { return: 'error', axios: error };
    }
}

export async function getModels(xi_api_key: string) {
  const header = {"Content-Type": 'application/json','xi-api-key': xi_api_key}
  try {
      const response = await axios.get(apiUrl+'v1/models', {headers: header});
      return { return: "response", axios: response };
  } catch (error) {
      return { return: "error", axios: error };
  }
}