import axios from 'axios';
import { PIIType, PIIMatch, TokenMapping, PIIDetectionError } from '@aiproxy/shared';
import { logger } from '../utils/logger';

interface PresidioAnalyzeRequest {
  text: string;
  language: string;
  score_threshold?: number;
  entities?: string[];
  return_decision_process?: boolean;
  ad_hoc_recognizers?: any[];
}

interface PresidioAnalyzeResponse {
  entity_type: string;
  start: number;
  end: number;
  score: number;
  analysis_explanation?: any;
}

interface PresidioAnonymizeRequest {
  text: string;
  anonymizers: Record<string, any>;
  analyzer_results: PresidioAnalyzeResponse[];
}

interface PresidioAnonymizeResponse {
  text: string;
  items: Array<{
    start: number;
    end: number;
    entity_type: string;
    text: string;
    operator: string;
  }>;
}

export class PresidioDetector {
  private analyzerUrl: string;
  private anonymizerUrl: string;

  constructor(
    analyzerUrl: string = process.env.PRESIDIO_ANALYZER_URL || 'http://localhost:5001',
    anonymizerUrl: string = process.env.PRESIDIO_ANONYMIZER_URL || 'http://localhost:5002'
  ) {
    this.analyzerUrl = analyzerUrl;
    this.anonymizerUrl = anonymizerUrl;
  }

  async detect(text: string): Promise<PIIMatch[]> {
    try {
      const request: PresidioAnalyzeRequest = {
        text,
        language: 'en',
        score_threshold: 0.8, // Augmenté de 0.35 à 0.8 pour réduire les faux positifs
        entities: [
          'CREDIT_CARD',
          'EMAIL_ADDRESS',
          'IP_ADDRESS',
          'PHONE_NUMBER',
          'US_SSN',
          'US_BANK_NUMBER',
          'US_DRIVER_LICENSE',
          'US_ITIN',
          'US_PASSPORT',
          'URL'
          // Supprimé: DATE_TIME, PERSON, LOCATION, CRYPTO, IBAN_CODE, NRP, MEDICAL_LICENSE
          // car ils causent trop de faux positifs sur du texte normal
        ]
      };

      logger.debug('Sending request to Presidio analyzer', {
        textLength: text.length,
        analyzerUrl: this.analyzerUrl
      });

      const response = await axios.post<PresidioAnalyzeResponse[]>(
        `${this.analyzerUrl}/analyze`,
        request,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );

      return response.data.map(result => ({
        entityType: this.mapPresidioEntityToPIIType(result.entity_type),
        start: result.start,
        end: result.end,
        score: result.score,
        text: text.substring(result.start, result.end)
      }));

    } catch (error: any) {
      logger.error('Presidio detection error:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new PIIDetectionError('Presidio service is not available. Please ensure Presidio is running.');
      }

      throw new PIIDetectionError(`PII detection failed: ${error.message}`);
    }
  }

  async anonymize(text: string, matches: PIIMatch[]): Promise<{ anonymizedText: string; tokenMap: TokenMapping[] }> {
    try {
      if (matches.length === 0) {
        return { anonymizedText: text, tokenMap: [] };
      }

      const analyzerResults: PresidioAnalyzeResponse[] = matches.map(match => ({
        entity_type: this.mapPIITypeToPresidioEntity(match.entityType),
        start: match.start,
        end: match.end,
        score: match.score
      }));

      const anonymizers: Record<string, any> = {};
      
      // Configure anonymizers based on entity types
      matches.forEach(match => {
        const entityType = this.mapPIITypeToPresidioEntity(match.entityType);
        if (!anonymizers[entityType]) {
          anonymizers[entityType] = this.getAnonymizerConfig(match.entityType);
        }
      });

      const request: PresidioAnonymizeRequest = {
        text,
        anonymizers,
        analyzer_results: analyzerResults
      };

      logger.debug('Sending request to Presidio anonymizer', {
        textLength: text.length,
        matchCount: matches.length,
        anonymizerUrl: this.anonymizerUrl
      });

      const response = await axios.post<PresidioAnonymizeResponse>(
        `${this.anonymizerUrl}/anonymize`,
        request,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );

      const tokenMap: TokenMapping[] = response.data.items.map((item, index) => ({
        original: text.substring(item.start, item.end),
        anonymized: item.text,
        entityType: this.mapPresidioEntityToPIIType(item.entity_type),
        id: `token_${index}_${Date.now()}`
      }));

      return {
        anonymizedText: response.data.text,
        tokenMap
      };

    } catch (error: any) {
      logger.error('Presidio anonymization error:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new PIIDetectionError('Presidio service is not available. Please ensure Presidio is running.');
      }

      throw new PIIDetectionError(`PII anonymization failed: ${error.message}`);
    }
  }

  async restore(anonymizedText: string, tokenMap: TokenMapping[]): Promise<string> {
    let restoredText = anonymizedText;
    
    // Sort by position in descending order to avoid offset issues
    const sortedTokens = [...tokenMap].sort((a, b) => 
      anonymizedText.lastIndexOf(b.anonymized) - anonymizedText.lastIndexOf(a.anonymized)
    );

    for (const token of sortedTokens) {
      restoredText = restoredText.replace(token.anonymized, token.original);
    }

    return restoredText;
  }

  private mapPresidioEntityToPIIType(presidioEntity: string): PIIType {
    const mapping: Record<string, PIIType> = {
      'EMAIL_ADDRESS': PIIType.EMAIL,
      'PHONE_NUMBER': PIIType.PHONE,
      'CREDIT_CARD': PIIType.CREDIT_CARD,
      'US_SSN': PIIType.SSN,
      'IP_ADDRESS': PIIType.IP_ADDRESS,
      'PERSON': PIIType.PERSON,
      'LOCATION': PIIType.LOCATION,
      'ORGANIZATION': PIIType.ORGANIZATION,
      'DATE_TIME': PIIType.DATE_TIME,
      'URL': PIIType.URL
    };

    return mapping[presidioEntity] || PIIType.CUSTOM;
  }

  private mapPIITypeToPresidioEntity(piiType: PIIType): string {
    const mapping: Record<PIIType, string> = {
      [PIIType.EMAIL]: 'EMAIL_ADDRESS',
      [PIIType.PHONE]: 'PHONE_NUMBER',
      [PIIType.CREDIT_CARD]: 'CREDIT_CARD',
      [PIIType.SSN]: 'US_SSN',
      [PIIType.IP_ADDRESS]: 'IP_ADDRESS',
      [PIIType.PERSON]: 'PERSON',
      [PIIType.LOCATION]: 'LOCATION',
      [PIIType.ORGANIZATION]: 'ORGANIZATION',
      [PIIType.DATE_TIME]: 'DATE_TIME',
      [PIIType.URL]: 'URL',
      [PIIType.CUSTOM]: 'CUSTOM'
    };

    return mapping[piiType] || 'CUSTOM';
  }

  private getAnonymizerConfig(piiType: PIIType): any {
    switch (piiType) {
      case PIIType.EMAIL:
        return { type: 'replace', new_value: '[EMAIL]' };
      case PIIType.PHONE:
        return { type: 'replace', new_value: '[PHONE]' };
      case PIIType.CREDIT_CARD:
        return { type: 'replace', new_value: '[CREDIT_CARD]' };
      case PIIType.SSN:
        return { type: 'replace', new_value: '[SSN]' };
      case PIIType.IP_ADDRESS:
        return { type: 'replace', new_value: '[IP_ADDRESS]' };
      case PIIType.PERSON:
        return { type: 'replace', new_value: '[PERSON]' };
      case PIIType.LOCATION:
        return { type: 'replace', new_value: '[LOCATION]' };
      case PIIType.ORGANIZATION:
        return { type: 'replace', new_value: '[ORGANIZATION]' };
      case PIIType.DATE_TIME:
        return { type: 'replace', new_value: '[DATE]' };
      case PIIType.URL:
        return { type: 'replace', new_value: '[URL]' };
      default:
        return { type: 'replace', new_value: '[REDACTED]' };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const [analyzerHealth, anonymizerHealth] = await Promise.all([
        axios.get(`${this.analyzerUrl}/health`, { timeout: 5000 }),
        axios.get(`${this.anonymizerUrl}/health`, { timeout: 5000 })
      ]);

      return analyzerHealth.status === 200 && anonymizerHealth.status === 200;
    } catch (error) {
      logger.warn('Presidio health check failed:', error);
      return false;
    }
  }
}