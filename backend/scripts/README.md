# Backend Scripts

## Utilities

**`generate-secrets.js`** - Generate JWT_SECRET and SESSION_SECRET
```bash
node scripts/generate-secrets.js
```

**`seed-test-users.js`** - Create test users for E2E tests
```bash
npm run seed:test-users
```

**`seed-us-data.js`** - Seed MongoDB with flights, hotels, cars
```bash
npm run seed:us-data
```

**`check-env.js`** - Verify environment variables
```bash
node scripts/check-env.js
```

## Image Scripts

**`download-images-simple.js`** - Download and upload images to Firebase
```bash
node scripts/download-images-simple.js
```
