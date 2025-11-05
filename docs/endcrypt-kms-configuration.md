# EndCrypt AWS KMS Configuration

## Overview
This document provides the specific AWS KMS configuration for the EndCrypt financial encryption platform.

## KMS Key Details

### General Configuration
- **Alias**: EndCrypt
- **Key ID**: `5e239a00-de10-43f1-b1df-8104ab293fbe`
- **ARN**: `arn:aws:kms:eu-north-1:728301184781:key/5e239a00-de10-43f1-b1df-8104ab293fbe`
- **Region**: `eu-north-1` (Europe - Stockholm)
- **Account ID**: `728301184781`

### Key Material
- **Current Key Material ID**: `d782038d0045ef0f07bfa34c29ae8235bbb29ea4af00886c44b5298ce20c19e0`
- **Key Usage**: ENCRYPT_DECRYPT
- **Key Spec**: SYMMETRIC_DEFAULT
- **Key Origin**: AWS_KMS

## Environment Configuration

### Required Environment Variables
```bash
# AWS Configuration for EndCrypt
AWS_REGION=eu-north-1
AWS_ACCOUNT_ID=728301184781
AWS_KMS_KEY_ID=5e239a00-de10-43f1-b1df-8104ab293fbe
AWS_KMS_KEY_ARN=arn:aws:kms:eu-north-1:728301184781:key/5e239a00-de10-43f1-b1df-8104ab293fbe
AWS_KMS_ALIAS=EndCrypt

# AWS Credentials (set these securely)
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

## Security Configuration

### Key Policy
The EndCrypt KMS key should have appropriate IAM policies configured for:

1. **Key Administration**
   - Key rotation management
   - Key policy updates
   - Key deletion permissions

2. **Key Usage**
   - Encrypt operations
   - Decrypt operations
   - Generate data keys
   - Re-encrypt operations

### Recommended IAM Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EndCryptKeyUsage",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::728301184781:user/endcrypt-service"
      },
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:DescribeKey"
      ],
      "Resource": "arn:aws:kms:eu-north-1:728301184781:key/5e239a00-de10-43f1-b1df-8104ab293fbe",
      "Condition": {
        "StringEquals": {
          "kms:EncryptionContext:application": "endcrypt-financial"
        }
      }
    }
  ]
}
```

## Encryption Context

### Standard Context
All encryption operations use the following context:
```javascript
{
  application: "endcrypt-financial",
  environment: "production|development|staging",
  version: "1.0.0",
  keyAlias: "EndCrypt",
  region: "eu-north-1"
}
```

### Data Classification Context
Additional context based on data sensitivity:
```javascript
// Public Data
{
  ...standardContext,
  classification: "public",
  dataType: "marketing"
}

// Internal Data
{
  ...standardContext,
  classification: "internal",
  dataType: "business"
}

// Confidential Data
{
  ...standardContext,
  classification: "confidential",
  dataType: "financial"
}

// Restricted Data
{
  ...standardContext,
  classification: "restricted",
  dataType: "payment"
}
```

## Operational Procedures

### Key Rotation
- **Automatic Rotation**: Enabled annually
- **Manual Rotation**: Available for emergency scenarios
- **Rotation Notification**: CloudWatch alerts configured

### Monitoring
- **CloudTrail**: All KMS operations logged
- **CloudWatch Metrics**: Key usage and performance monitoring
- **Alarms**: Failed operations and unusual patterns

### Backup and Recovery
- **Key Backup**: AWS-managed automatic backup
- **Cross-Region**: Consider multi-region key for disaster recovery
- **Recovery Testing**: Quarterly validation of key accessibility

## Cost Optimization

### Usage Estimates
- **Customer Master Key**: $1/month
- **API Requests**: $0.03 per 10,000 requests
- **Data Key Generation**: $0.03 per 10,000 requests

### Expected Monthly Costs
- **Development**: $10-50
- **Staging**: $50-200
- **Production**: $200-1,000 (based on transaction volume)

## Compliance

### Standards Alignment
- **PCI DSS**: Level 1 compliance ready
- **SOX**: Financial reporting data protection
- **GDPR**: EU data protection requirements
- **ISO 27001**: Information security management

### Audit Requirements
- **Key Access Logs**: Complete audit trail
- **Encryption Evidence**: Proof of data protection
- **Compliance Reports**: Automated generation
- **Regular Reviews**: Quarterly security assessments

## Testing Configuration

### Development Environment
```bash
# Development KMS Configuration
AWS_REGION=eu-north-1
AWS_KMS_KEY_ID=5e239a00-de10-43f1-b1df-8104ab293fbe
ENCRYPTION_CONTEXT_ENV=development
```

### Testing Procedures
1. **Key Accessibility**: Verify key is reachable
2. **Encryption Test**: Basic encrypt/decrypt operations
3. **Performance Test**: Latency and throughput validation
4. **Error Handling**: Invalid key and permission testing

## Implementation Checklist

### Pre-Production
- [ ] AWS credentials configured
- [ ] KMS key accessible from application
- [ ] IAM policies validated
- [ ] Encryption context tested
- [ ] Performance benchmarks met

### Production Deployment
- [ ] CloudTrail logging enabled
- [ ] CloudWatch monitoring configured
- [ ] Alarm thresholds set
- [ ] Backup procedures verified
- [ ] Disaster recovery tested

### Post-Deployment
- [ ] Security assessment completed
- [ ] Compliance validation passed
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Monitoring dashboards active

## Support and Troubleshooting

### Common Issues
1. **Access Denied**: Check IAM permissions and key policy
2. **Key Not Found**: Verify key ID and region configuration
3. **Encryption Context Mismatch**: Validate context parameters
4. **Performance Issues**: Check key caching and connection pooling

### Contact Information
- **AWS Support**: Premium support plan recommended
- **Security Team**: security@endcrypt.com
- **DevOps Team**: devops@endcrypt.com
- **Compliance Team**: compliance@endcrypt.com

---

**Last Updated**: November 5, 2025  
**Configuration Version**: 1.0.0  
**Review Schedule**: Quarterly