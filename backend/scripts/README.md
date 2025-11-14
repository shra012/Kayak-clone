# Backend Scripts

## MSK Tunnel Script

### `msk-tunnel.sh`

Establishes a simple SSH tunnel to access MSK Kafka brokers from your local machine.

**Prerequisites:**
- AWS CLI configured with appropriate credentials
- Terraform applied in `infra/aws/` directory
- Bastion instance must be running
- SSH key pair configured on bastion (or use default SSH key)

**Usage:**

```bash
# From backend directory
./scripts/msk-tunnel.sh

# With custom SSH key
SSH_KEY=/path/to/key.pem ./scripts/msk-tunnel.sh
```

**What it does:**
1. Gets bastion instance ID and IP from Terraform output
2. Gets MSK broker endpoint automatically
3. Establishes SSH port forwarding tunnel
4. Forwards `localhost:9098` to MSK broker through bastion

**After connecting:**
Update your `.env` file:
```env
KAFKA_BROKERS=localhost:9098
```

**Note:** The tunnel must remain active while using Kafka. Run this in a separate terminal.

**To add SSH key to bastion:**
1. Create/import key pair in AWS EC2 console
2. Add to `infra/aws/terraform.tfvars`: `bastion_key_name = "your-key-name"`
3. Run `terraform apply` in `infra/aws/`

## Kafka Access Check Script

### `check-kafka-access.sh`

Verifies that Kafka brokers are accessible through the SSH tunnel.

**Usage:**

```bash
# From project root
./backend/scripts/check-kafka-access.sh
```

**What it checks:**
1. SSH tunnel is running on port 9098
2. Port 9098 is accessible locally
3. AWS credentials are configured
4. MSK cluster information is available

**Output:**
- Shows tunnel status, port accessibility, AWS identity, and MSK broker endpoints
- Provides configuration instructions for backend `.env`

## Generate Secrets Script

### `generate-secrets.js`

Generates cryptographically secure random secrets for JWT and session management.

**Usage:**

```bash
cd backend
node scripts/generate-secrets.js
```

**Output:**
- Generates `JWT_SECRET` and `SESSION_SECRET` using Node.js `crypto.randomBytes()`
- Copy the output to your `.env` file

See [docs/SECRETS.md](../docs/SECRETS.md) for more details.

