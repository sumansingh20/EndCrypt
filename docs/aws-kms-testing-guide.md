# AWS KMS Integration Testing Guide

## Overview

This document provides comprehensive testing procedures for the AWS KMS integration in the EndCrypt financial cloud system. The testing covers encryption/decryption operations, key management, and compliance validation.

## Test Environment Setup

### Prerequisites

1. **AWS Account Configuration**
   ```bash
   export AWS_ACCESS_KEY_ID=your-access-key
   export AWS_SECRET_ACCESS_KEY=your-secret-key
   export AWS_REGION=us-east-1
   export AWS_KMS_KEY_ID=your-kms-key-id
   ```

2. **Development Environment**
   ```bash
   npm install aws-sdk @types/aws-sdk
   npm install --save-dev jest @types/jest
   ```

3. **Test Data Classification**
   - Public: Marketing materials, public announcements
   - Internal: Employee directories, internal policies
   - Confidential: Financial reports, customer data
   - Restricted: Payment card data, authentication credentials

## Unit Tests

### 1. Basic Encryption/Decryption Tests

```typescript
import { AWSKMSService, DataClassification } from '../src/services/awsKmsService';

describe('AWS KMS Basic Operations', () => {
  let kmsService: AWSKMSService;
  
  beforeEach(() => {
    kmsService = new AWSKMSService('test-key-id');
  });

  test('should encrypt and decrypt public data', async () => {
    const testData = { message: 'Public announcement' };
    
    const encrypted = await kmsService.encrypt(testData, DataClassification.PUBLIC);
    expect(encrypted.classification).toBe(DataClassification.PUBLIC);
    expect(encrypted.algorithm).toBe('base64');
    
    const decrypted = await kmsService.decrypt(encrypted);
    expect(decrypted).toEqual(testData);
  });

  test('should encrypt and decrypt confidential data', async () => {
    const testData = { 
      customerId: '12345',
      accountNumber: '9876543210',
      balance: 50000 
    };
    
    const encrypted = await kmsService.encrypt(testData, DataClassification.CONFIDENTIAL);
    expect(encrypted.classification).toBe(DataClassification.CONFIDENTIAL);
    expect(encrypted.algorithm).toBe('aes-256-cbc');
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.authTag).toBeDefined();
    
    const decrypted = await kmsService.decrypt(encrypted);
    expect(decrypted).toEqual(testData);
  });
});
```

### 2. Key Management Tests

```typescript
describe('Key Management Operations', () => {
  test('should generate data encryption key', async () => {
    const dataKey = await kmsService.generateDataKey();
    
    expect(dataKey.keyId).toBeDefined();
    expect(dataKey.plaintextKey).toBeInstanceOf(Buffer);
    expect(dataKey.encryptedKey).toBeDefined();
    expect(dataKey.createdAt).toBeInstanceOf(Date);
    expect(dataKey.expiresAt).toBeInstanceOf(Date);
  });

  test('should rotate encryption keys', async () => {
    await expect(kmsService.rotateKeys()).resolves.not.toThrow();
  });

  test('should retrieve key metadata', async () => {
    const metadata = await kmsService.getKeyMetadata('test-key-id');
    
    expect(metadata.keyId).toBe('test-key-id');
    expect(metadata.state).toBeDefined();
    expect(metadata.creationDate).toBeInstanceOf(Date);
  });
});
```

### 3. Data Classification Tests

```typescript
describe('Data Classification Handling', () => {
  const testCases = [
    {
      classification: DataClassification.PUBLIC,
      data: { announcement: 'New product launch' },
      expectedAlgorithm: 'base64'
    },
    {
      classification: DataClassification.INTERNAL,
      data: { policy: 'Internal security guidelines' },
      expectedAlgorithm: 'aws-kms'
    },
    {
      classification: DataClassification.CONFIDENTIAL,
      data: { financialReport: 'Q4 earnings confidential' },
      expectedAlgorithm: 'aes-256-cbc'
    },
    {
      classification: DataClassification.RESTRICTED,
      data: { cardNumber: '4111-1111-1111-1111' },
      expectedAlgorithm: 'aes-256-cbc'
    }
  ];

  testCases.forEach(({ classification, data, expectedAlgorithm }) => {
    test(`should handle ${classification} data classification`, async () => {
      const encrypted = await kmsService.encrypt(data, classification);
      expect(encrypted.algorithm).toBe(expectedAlgorithm);
      expect(encrypted.classification).toBe(classification);
      
      const decrypted = await kmsService.decrypt(encrypted);
      expect(decrypted).toEqual(data);
    });
  });
});
```

## Integration Tests

### 1. End-to-End Workflow Tests

```typescript
describe('End-to-End Encryption Workflow', () => {
  test('should handle complete financial transaction encryption', async () => {
    const transaction = {
      transactionId: 'TXN-001',
      amount: 1500.00,
      currency: 'USD',
      payer: {
        name: 'John Doe',
        accountNumber: '1234567890',
        routingNumber: '987654321'
      },
      payee: {
        name: 'Jane Smith',
        accountNumber: '0987654321',
        routingNumber: '123456789'
      },
      timestamp: new Date().toISOString()
    };

    // Encrypt transaction data
    const encryptedTransaction = await kmsService.encrypt(
      transaction, 
      DataClassification.RESTRICTED
    );

    // Verify encryption properties
    expect(encryptedTransaction.encryptedBlob).toBeDefined();
    expect(encryptedTransaction.dataKeyId).toBeDefined();
    expect(encryptedTransaction.classification).toBe(DataClassification.RESTRICTED);

    // Decrypt and verify data integrity
    const decryptedTransaction = await kmsService.decrypt(encryptedTransaction);
    expect(decryptedTransaction).toEqual(transaction);
  });
});
```

### 2. Performance Tests

```typescript
describe('Performance Benchmarks', () => {
  test('should encrypt large datasets within performance thresholds', async () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      data: `Large data record ${i}`.repeat(100)
    }));

    const startTime = performance.now();
    
    const encrypted = await kmsService.encrypt(
      largeDataset, 
      DataClassification.CONFIDENTIAL
    );
    
    const encryptionTime = performance.now() - startTime;
    
    // Should complete within 5 seconds for 1000 records
    expect(encryptionTime).toBeLessThan(5000);
    
    const decryptStartTime = performance.now();
    const decrypted = await kmsService.decrypt(encrypted);
    const decryptionTime = performance.now() - decryptStartTime;
    
    expect(decryptionTime).toBeLessThan(5000);
    expect(decrypted).toEqual(largeDataset);
  });

  test('should handle concurrent encryption operations', async () => {
    const concurrentOps = Array.from({ length: 10 }, (_, i) => 
      kmsService.encrypt(
        { data: `Concurrent test ${i}` }, 
        DataClassification.INTERNAL
      )
    );

    const results = await Promise.all(concurrentOps);
    
    expect(results).toHaveLength(10);
    results.forEach(result => {
      expect(result.encryptedBlob).toBeDefined();
      expect(result.classification).toBe(DataClassification.INTERNAL);
    });
  });
});
```

## Security Tests

### 1. Key Security Tests

```typescript
describe('Security Validations', () => {
  test('should not expose plaintext keys in logs', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const errorSpy = jest.spyOn(console, 'error');
    
    const dataKey = await kmsService.generateDataKey();
    
    // Check that plaintext key is not logged
    const allLogs = consoleSpy.mock.calls.concat(errorSpy.mock.calls);
    const logString = JSON.stringify(allLogs);
    
    expect(logString).not.toContain(dataKey.plaintextKey.toString());
    
    consoleSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test('should validate encryption context', async () => {
    const testData = { sensitive: 'information' };
    
    const encrypted = await kmsService.encrypt(testData, DataClassification.CONFIDENTIAL);
    
    expect(encrypted.encryptionContext).toEqual({
      application: 'endcrypt-financial',
      environment: expect.any(String),
      version: '1.0.0'
    });
  });
});
```

### 2. Error Handling Tests

```typescript
describe('Error Handling', () => {
  test('should handle invalid data classification', async () => {
    const testData = { test: 'data' };
    
    await expect(
      kmsService.encrypt(testData, 'invalid' as DataClassification)
    ).rejects.toThrow('Unsupported data classification');
  });

  test('should handle missing KMS key', async () => {
    const invalidService = new AWSKMSService('invalid-key-id');
    
    await expect(
      invalidService.encrypt({ test: 'data' }, DataClassification.INTERNAL)
    ).rejects.toThrow();
  });

  test('should handle corrupted encrypted data', async () => {
    const corruptedData = {
      encryptedBlob: 'corrupted-data',
      dataKeyId: 'test-key',
      classification: DataClassification.INTERNAL,
      algorithm: 'aws-kms',
      encryptionContext: {},
      timestamp: new Date().toISOString()
    };

    await expect(
      kmsService.decrypt(corruptedData)
    ).rejects.toThrow();
  });
});
```

## Compliance Tests

### 1. PCI DSS Compliance Tests

```typescript
describe('PCI DSS Compliance', () => {
  test('should encrypt cardholder data with strong encryption', async () => {
    const cardData = {
      cardNumber: '4111-1111-1111-1111',
      expiryDate: '12/25',
      cvv: '123',
      cardholderName: 'John Doe'
    };

    const encrypted = await kmsService.encrypt(cardData, DataClassification.RESTRICTED);
    
    // Verify strong encryption is used
    expect(encrypted.algorithm).toBe('aes-256-cbc');
    expect(encrypted.classification).toBe(DataClassification.RESTRICTED);
    
    // Verify encrypted data doesn't contain plaintext card numbers
    expect(encrypted.encryptedBlob).not.toContain('4111');
  });
});
```

### 2. GDPR Compliance Tests

```typescript
describe('GDPR Compliance', () => {
  test('should support data pseudonymization', async () => {
    const personalData = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      address: '123 Main St, City, Country'
    };

    const encrypted = await kmsService.encrypt(personalData, DataClassification.RESTRICTED);
    
    // Verify data is pseudonymized (encrypted with tokens)
    expect(encrypted.encryptedBlob).not.toContain('John Doe');
    expect(encrypted.encryptedBlob).not.toContain('john.doe@example.com');
  });
});
```

## Load Tests

### 1. Throughput Tests

```typescript
describe('Load Testing', () => {
  test('should handle 1000 operations per second', async () => {
    const operations = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      timestamp: Date.now(),
      data: `Load test data ${i}`
    }));

    const startTime = Date.now();
    
    const encryptPromises = operations.map(op => 
      kmsService.encrypt(op, DataClassification.INTERNAL)
    );
    
    const results = await Promise.all(encryptPromises);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete 1000 operations within 1 second
    expect(duration).toBeLessThan(1000);
    expect(results).toHaveLength(1000);
  });
});
```

## Test Execution

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --grep "AWS KMS Basic Operations"
npm test -- --grep "Performance Benchmarks"
npm test -- --grep "Security Validations"

# Run with coverage
npm test -- --coverage

# Run load tests
npm test -- --grep "Load Testing"
```

### Test Reports

```bash
# Generate HTML coverage report
npm run test:coverage

# Generate security test report
npm run test:security

# Generate performance benchmarks
npm run test:performance
```

## Monitoring and Alerting

### CloudWatch Metrics

- KMS API call latency
- Encryption/decryption success rates
- Data key generation frequency
- Error rates by operation type

### Security Alerts

- Failed encryption attempts
- Unusual key access patterns
- Performance degradation alerts
- Compliance violation notifications

## Conclusion

This comprehensive testing strategy ensures that the AWS KMS integration meets security, performance, and compliance requirements for financial cloud systems. Regular execution of these tests validates the encryption implementation and maintains system integrity.