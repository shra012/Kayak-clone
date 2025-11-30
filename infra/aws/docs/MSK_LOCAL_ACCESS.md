# Accessing MSK from Local Machine

## Current Configuration

**Security Group:** `sg-0977923925a890390`
- Port 9092 (Plaintext) - Allowed from `0.0.0.0/0`
- Port 9094 (SASL/IAM) - Allowed from `0.0.0.0/0`
- Port 9096 (TLS) - Allowed from `0.0.0.0/0`

**Subnets:** Private subnets (no direct internet access)

## Important Note

MSK clusters are deployed in **private subnets** by default for security. Even though the security group allows all IPs (`0.0.0.0/0`), you **cannot directly connect** from your local machine because:

1. Private subnets don't have internet gateways
2. MSK brokers don't have public IPs
3. Network routing prevents direct access

## Options to Access MSK from Local Machine

### Option 1: AWS Client VPN (Recommended for Development)

**Setup:**
1. Create AWS Client VPN endpoint
2. Associate with your VPC
3. Download VPN client configuration
4. Connect from your local machine

**Pros:** Secure, managed, easy to use
**Cons:** Costs ~$0.10/hour + data transfer

### Option 2: SSH Tunnel via Bastion Host

**Setup:**
1. Launch EC2 instance in public subnet
2. Configure security group to allow SSH from your IP
3. Create SSH tunnel:
   ```bash
   ssh -L 9092:MSK_BROKER_IP:9092 ec2-user@BASTION_IP
   ```
4. Connect Kafka client to `localhost:9092`

**Pros:** Free (if using free tier EC2)
**Cons:** Requires managing EC2 instance

### Option 3: AWS Systems Manager Session Manager Tunnel

**Setup:**
1. Launch EC2 instance in private subnet
2. Install SSM agent (pre-installed on Amazon Linux)
3. Use SSM port forwarding:
   ```bash
   aws ssm start-session \
     --target i-1234567890abcdef0 \
     --document-name AWS-StartPortForwardingSession \
     --parameters '{"portNumber":["9092"],"localPortNumber":["9092"]}'
   ```

**Pros:** No SSH keys needed, secure
**Cons:** Requires EC2 instance

### Option 4: VPC Peering / VPN (For Production)

**Setup:**
1. Set up site-to-site VPN or VPC peering
2. Route traffic through VPN

**Pros:** Production-ready, secure
**Cons:** Complex setup, requires network infrastructure

### Option 5: Use AWS CloudShell / EC2 Instance

**Setup:**
1. Access MSK from within AWS (CloudShell or EC2)
2. Use Kafka tools from AWS environment

**Pros:** No network configuration needed
**Cons:** Not truly "local" access

## Current Security Group Status

[OK] **Security group allows all IPs** (`0.0.0.0/0`) for:
- Port 9092 (Plaintext)
- Port 9094 (SASL/IAM) 
- Port 9096 (TLS)

[WARN] **However**, direct access from internet is blocked by subnet configuration (private subnets).

## Recommended Approach for Development

For local development, use **Option 2 (SSH Tunnel)**:

1. Launch small EC2 instance (t2.micro - free tier eligible)
2. Place in public subnet
3. Configure security group to allow SSH from your IP
4. Create SSH tunnel to MSK brokers
5. Connect Kafka clients to localhost

## Testing Connection

Once you have network access configured:

```bash
# Get bootstrap brokers
cd infra/aws
terraform output msk_bootstrap_brokers_sasl_iam

# Test connection (requires AWS credentials)
kafka-console-producer.sh \
  --bootstrap-server <bootstrap-brokers> \
  --producer-property security.protocol=SASL_SSL \
  --producer-property sasl.mechanism=AWS_MSK_IAM \
  --producer-property sasl.jaas.config=software.amazon.msk.auth.iam.IAMLoginModule required; \
  --producer-property sasl.client.callback.handler.class=software.amazon.msk.auth.iam.IAMClientCallbackHandler \
  --topic test-topic
```

## Security Recommendations

For production:
1. **Remove `0.0.0.0/0`** from security group
2. Allow only specific IPs or VPC CIDR blocks
3. Use IAM authentication (already configured)
4. Enable TLS encryption (already configured)
5. Use private subnets (already configured)

## Next Steps

1. Choose access method (recommend SSH tunnel for dev)
2. Set up network access
3. Test connection to MSK
4. Update backend `.env` with bootstrap brokers

