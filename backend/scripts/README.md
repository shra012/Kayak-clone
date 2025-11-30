# Backend Scripts (current status)

We no longer create MSK via Terraform; Kafka is now an Aiven-managed cluster. The scripts below are marked as **deprecated** if they target the old MSK setup, and **active** if still useful.

## Kafka / Infra

- **(deprecated) `msk-tunnel.sh`**
  - Purpose: SSH tunnel to AWS MSK via bastion/terraform outputs.
  - Status: Unused with Aiven Kafka. Safe to delete if you don’t plan to access MSK.

- **(deprecated) `check-kafka-access.sh`**
  - Purpose: Verifies tunnel/port/AWS/MSK broker access.
  - Status: Unused with Aiven Kafka. Safe to delete if you don’t plan to access MSK.

> If you need Kafka locally with Aiven: set `KAFKA_ENABLED=true` and point env to Aiven brokers; no tunnel required.

## Utilities

- **(active) `generate-secrets.js`**
  - Purpose: Generate secure `JWT_SECRET` and `SESSION_SECRET` values.
  - Usage:
    ```bash
    cd backend
    node scripts/generate-secrets.js
    ```
  - Copy outputs into `backend/.env`.

## Next steps
- Delete the deprecated MSK scripts if you won’t use AWS MSK anymore.
- Keep `generate-secrets.js` for env secret generation.
