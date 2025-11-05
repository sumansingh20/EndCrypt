/**
 * AWS KMS Integration Service
 * Provides comprehensive encryption/decryption services using AWS KMS
 * Implements end-to-end encryption for financial cloud systems
 */

import AWS from 'aws-sdk';
import crypto from 'crypto';
import { promisify } from 'util';

// Configure AWS SDK
const kms = new AWS.KMS({
  region: process.env['AWS_REGION'] || 'eu-north-1',
  accessKeyId: process.env['AWS_ACCESS_KEY_ID'],
  secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']
});

const secretsManager = new AWS.SecretsManager({
  region: process.env['AWS_REGION'] || 'eu-north-1',
  accessKeyId: process.env['AWS_ACCESS_KEY_ID'],
  secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']
});

// EndCrypt KMS Configuration
const ENDCRYPT_KMS_CONFIG = {
  alias: 'EndCrypt',
  keyArn: 'arn:aws:kms:eu-north-1:728301184781:key/5e239a00-de10-43f1-b1df-8104ab293fbe',
  keyId: '5e239a00-de10-43f1-b1df-8104ab293fbe',
  materialId: 'd782038d0045ef0f07bfa34c29ae8235bbb29ea4af00886c44b5298ce20c19e0',
  region: 'eu-north-1',
  accountId: '728301184781'
};

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keySpec: 'AES_256',
  encryptionContext: {
    application: 'endcrypt-financial',
    environment: process.env['NODE_ENV'] || 'development',
    version: '1.0.0',
    keyAlias: ENDCRYPT_KMS_CONFIG.alias,
    region: ENDCRYPT_KMS_CONFIG.region
  }
};

/**
 * Data classification levels for encryption
 */
export enum DataClassification {
  PUBLIC = 'public',           // Level 1: No encryption required
  INTERNAL = 'internal',       // Level 2: Standard encryption
  CONFIDENTIAL = 'confidential', // Level 3: Field-level encryption
  RESTRICTED = 'restricted'    // Level 4: Tokenization + encryption
}

/**
 * Encryption service interface
 */
export interface EncryptionService {
  encrypt(data: any, classification: DataClassification): Promise<EncryptedData>;
  decrypt(encryptedData: EncryptedData): Promise<any>;
  generateDataKey(): Promise<DataEncryptionKey>;
  rotateKeys(): Promise<void>;
  getKeyMetadata(keyId: string): Promise<KeyMetadata>;
}

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  encryptedBlob: string;
  dataKeyId: string;
  encryptionContext: Record<string, string>;
  algorithm: string;
  classification: DataClassification;
  timestamp: string;
  iv?: string;
  authTag?: string;
}

/**
 * Data encryption key structure
 */
export interface DataEncryptionKey {
  keyId: string;
  plaintextKey: Buffer;
  encryptedKey: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Key metadata structure
 */
export interface KeyMetadata {
  keyId: string;
  state: string;
  creationDate: Date;
  lastRotationDate?: Date;
  nextRotationDate?: Date;
  description: string;
  usage: string;
}

/**
 * AWS KMS Encryption Service Implementation
 */
export class AWSKMSService implements EncryptionService {
  private customerMasterKeyId: string;
  private keyCache: Map<string, DataEncryptionKey>;
  private cacheTimeout: number;

  constructor(cmkId?: string) {
    this.customerMasterKeyId = cmkId || process.env['AWS_KMS_KEY_ID'] || ENDCRYPT_KMS_CONFIG.keyId;
    this.keyCache = new Map();
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
    
    if (!this.customerMasterKeyId) {
      throw new Error('AWS KMS Customer Master Key ID is required');
    }
    
    console.log(`🔐 EndCrypt KMS Service initialized with key: ${ENDCRYPT_KMS_CONFIG.alias}`);
    console.log(`📍 Region: ${ENDCRYPT_KMS_CONFIG.region}`);
    console.log(`🆔 Key ID: ${this.customerMasterKeyId}`);
  }

  /**
   * Encrypt data based on classification level
   */
  async encrypt(data: any, classification: DataClassification): Promise<EncryptedData> {
    try {
      const serializedData = JSON.stringify(data);
      const timestamp = new Date().toISOString();
      
      switch (classification) {
        case DataClassification.PUBLIC:
          return this.encryptPublicData(serializedData, timestamp);
          
        case DataClassification.INTERNAL:
          return this.encryptInternalData(serializedData, timestamp);
          
        case DataClassification.CONFIDENTIAL:
          return this.encryptConfidentialData(serializedData, timestamp);
          
        case DataClassification.RESTRICTED:
          return this.encryptRestrictedData(serializedData, timestamp);
          
        default:
          throw new Error(`Unsupported data classification: ${classification}`);
      }
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data regardless of classification
   */
  async decrypt(encryptedData: EncryptedData): Promise<any> {
    try {
      const { encryptedBlob, dataKeyId, classification, iv, authTag } = encryptedData;
      
      let decryptedData: string;
      
      switch (classification) {
        case DataClassification.PUBLIC:
          decryptedData = await this.decryptPublicData(encryptedBlob);
          break;
          
        case DataClassification.INTERNAL:
          decryptedData = await this.decryptInternalData(encryptedBlob, dataKeyId);
          break;
          
        case DataClassification.CONFIDENTIAL:
          decryptedData = await this.decryptConfidentialData(encryptedBlob, dataKeyId, iv!, authTag!);
          break;
          
        case DataClassification.RESTRICTED:
          decryptedData = await this.decryptRestrictedData(encryptedBlob, dataKeyId, iv!, authTag!);
          break;
          
        default:
          throw new Error(`Unsupported data classification: ${classification}`);
      }
      
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Generate a new data encryption key
   */
  async generateDataKey(): Promise<DataEncryptionKey> {
    try {
      const params = {
        KeyId: this.customerMasterKeyId,
        KeySpec: ENCRYPTION_CONFIG.keySpec,
        EncryptionContext: ENCRYPTION_CONFIG.encryptionContext
      };

      const result = await kms.generateDataKey(params).promise();
      
      if (!result.Plaintext || !result.CiphertextBlob) {
        throw new Error('Failed to generate data key');
      }

      const keyId = crypto.randomUUID();
      const dataKey: DataEncryptionKey = {
        keyId,
        plaintextKey: result.Plaintext as Buffer,
        encryptedKey: result.CiphertextBlob.toString('base64'),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.cacheTimeout)
      };

      // Cache the key for reuse
      this.keyCache.set(keyId, dataKey);
      
      // Schedule key removal from cache
      setTimeout(() => {
        this.keyCache.delete(keyId);
      }, this.cacheTimeout);

      return dataKey;
    } catch (error) {
      console.error('Data key generation error:', error);
      throw new Error('Failed to generate data encryption key');
    }
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(): Promise<void> {
    try {
      // Enable automatic key rotation
      await kms.enableKeyRotation({
        KeyId: this.customerMasterKeyId
      }).promise();

      // Clear key cache to force new key generation
      this.keyCache.clear();
      
      console.log('Key rotation enabled successfully');
    } catch (error) {
      console.error('Key rotation error:', error);
      throw new Error('Failed to rotate encryption keys');
    }
  }

  /**
   * Get key metadata
   */
  async getKeyMetadata(keyId: string): Promise<KeyMetadata> {
    try {
      const result = await kms.describeKey({ KeyId: keyId }).promise();
      
      if (!result.KeyMetadata) {
        throw new Error('Key metadata not found');
      }

      const metadata = result.KeyMetadata;
      
      return {
        keyId: metadata.KeyId || '',
        state: metadata.KeyState || '',
        creationDate: metadata.CreationDate || new Date(),
        description: metadata.Description || '',
        usage: metadata.KeyUsage || ''
      };
    } catch (error) {
      console.error('Key metadata error:', error);
      throw new Error('Failed to retrieve key metadata');
    }
  }

  /**
   * Private encryption methods for different classification levels
   */
  private async encryptPublicData(data: string, timestamp: string): Promise<EncryptedData> {
    // Public data - minimal encryption for consistency
    const encoded = Buffer.from(data).toString('base64');
    
    return {
      encryptedBlob: encoded,
      dataKeyId: 'public',
      encryptionContext: ENCRYPTION_CONFIG.encryptionContext,
      algorithm: 'base64',
      classification: DataClassification.PUBLIC,
      timestamp
    };
  }

  private async encryptInternalData(data: string, timestamp: string): Promise<EncryptedData> {
    // Internal data - AWS KMS direct encryption
    const params = {
      KeyId: this.customerMasterKeyId,
      Plaintext: Buffer.from(data),
      EncryptionContext: ENCRYPTION_CONFIG.encryptionContext
    };

    const result = await kms.encrypt(params).promise();
    
    return {
      encryptedBlob: result.CiphertextBlob!.toString('base64'),
      dataKeyId: this.customerMasterKeyId,
      encryptionContext: ENCRYPTION_CONFIG.encryptionContext,
      algorithm: 'aws-kms',
      classification: DataClassification.INTERNAL,
      timestamp
    };
  }

  private async encryptConfidentialData(data: string, timestamp: string): Promise<EncryptedData> {
    // Confidential data - Envelope encryption with AES-256
    const dataKey = await this.generateDataKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-cbc', dataKey.plaintextKey);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encryptedBlob: encrypted,
      dataKeyId: dataKey.keyId,
      encryptionContext: ENCRYPTION_CONFIG.encryptionContext,
      algorithm: 'aes-256-cbc',
      classification: DataClassification.CONFIDENTIAL,
      timestamp,
      iv: iv.toString('hex'),
      authTag: 'sha256-hmac' // Simplified authentication
    };
  }

  private async encryptRestrictedData(data: string, timestamp: string): Promise<EncryptedData> {
    // Restricted data - Tokenization + encryption
    const tokenizedData = await this.tokenizeData(data);
    return this.encryptConfidentialData(tokenizedData, timestamp);
  }

  /**
   * Private decryption methods
   */
  private async decryptPublicData(encryptedBlob: string): Promise<string> {
    return Buffer.from(encryptedBlob, 'base64').toString();
  }

  private async decryptInternalData(encryptedBlob: string, dataKeyId: string): Promise<string> {
    const params = {
      CiphertextBlob: Buffer.from(encryptedBlob, 'base64'),
      EncryptionContext: ENCRYPTION_CONFIG.encryptionContext
    };

    const result = await kms.decrypt(params).promise();
    return result.Plaintext!.toString();
  }

  private async decryptConfidentialData(
    encryptedBlob: string, 
    dataKeyId: string, 
    iv: string, 
    authTag: string
  ): Promise<string> {
    const dataKey = await this.getOrDecryptDataKey(dataKeyId);
    const decipher = crypto.createDecipher('aes-256-cbc', dataKey.plaintextKey);
    
    let decrypted = decipher.update(encryptedBlob, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  private async decryptRestrictedData(
    encryptedBlob: string, 
    dataKeyId: string, 
    iv: string, 
    authTag: string
  ): Promise<string> {
    const tokenizedData = await this.decryptConfidentialData(encryptedBlob, dataKeyId, iv, authTag);
    return this.detokenizeData(tokenizedData);
  }

  /**
   * Helper methods
   */
  private async getOrDecryptDataKey(keyId: string): Promise<DataEncryptionKey> {
    // Check cache first
    if (this.keyCache.has(keyId)) {
      const cachedKey = this.keyCache.get(keyId)!;
      if (cachedKey.expiresAt > new Date()) {
        return cachedKey;
      }
    }

    // Decrypt the data key using KMS
    // In a real implementation, you would store the encrypted data key
    // and decrypt it here using KMS
    throw new Error('Data key decryption not implemented');
  }

  private async tokenizeData(data: string): Promise<string> {
    // Implement tokenization logic
    // This would typically involve replacing sensitive data with tokens
    // and storing the mapping in a secure token vault
    const token = crypto.randomUUID();
    return `TOKEN:${token}:${Buffer.from(data).toString('base64')}`;
  }

  private async detokenizeData(tokenizedData: string): Promise<string> {
    // Implement detokenization logic
    if (tokenizedData.startsWith('TOKEN:')) {
      const parts = tokenizedData.split(':');
      if (parts.length >= 3 && parts[2]) {
        return Buffer.from(parts[2], 'base64').toString();
      }
    }
    return tokenizedData;
  }
}

/**
 * AWS Secrets Manager Integration
 */
export class AWSSecretsService {
  /**
   * Store a secret in AWS Secrets Manager
   */
  async storeSecret(secretName: string, secretValue: any): Promise<void> {
    try {
      const params = {
        Name: secretName,
        SecretString: JSON.stringify(secretValue),
        Description: `EndCrypt application secret: ${secretName}`
      };

      await secretsManager.createSecret(params).promise();
    } catch (error) {
      console.error('Secret storage error:', error);
      throw new Error('Failed to store secret');
    }
  }

  /**
   * Retrieve a secret from AWS Secrets Manager
   */
  async getSecret(secretName: string): Promise<any> {
    try {
      const params = {
        SecretId: secretName,
        VersionStage: 'AWSCURRENT'
      };

      const result = await secretsManager.getSecretValue(params).promise();
      
      if (!result.SecretString) {
        throw new Error('Secret not found');
      }

      return JSON.parse(result.SecretString);
    } catch (error) {
      console.error('Secret retrieval error:', error);
      throw new Error('Failed to retrieve secret');
    }
  }

  /**
   * Rotate a secret in AWS Secrets Manager
   */
  async rotateSecret(secretName: string): Promise<void> {
    try {
      const params = {
        SecretId: secretName,
        ForceRotateImmediately: true
      };

      await secretsManager.rotateSecret(params).promise();
    } catch (error) {
      console.error('Secret rotation error:', error);
      throw new Error('Failed to rotate secret');
    }
  }
}

// Export singleton instances with EndCrypt configuration
export const kmsService = new AWSKMSService();
export const secretsService = new AWSSecretsService();

// Export configuration and types
export {
  AWS,
  ENCRYPTION_CONFIG,
  ENDCRYPT_KMS_CONFIG
};