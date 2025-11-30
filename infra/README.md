# Infrastructure (Old/Reference)

⚠️ **This directory contains OLD/REFERENCE infrastructure code.**

## 📌 For Production Use

**Use `infra2/` instead!**

The production-ready Terraform infrastructure is in:
```
../infra2/aws/eks/
```

## 📁 What's Here

This directory contains:
- Old MSK (Kafka) setup
- Reference configurations
- Test/dummy infrastructure

## ⚠️ Do Not Use for Production

This infrastructure is kept for:
- Reference
- Comparison
- Historical purposes

## 🚀 Production Deployment

Go to the new infrastructure:

```bash
cd ../infra2/aws/eks
source ../../../scripts/load-env.sh
make full-deploy
```

---

**For all production work, use `infra2/`**

