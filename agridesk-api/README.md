# agridesk-api

Spring Boot 3.3.5 + Java 17 REST backend for AgriDesk. Multi-tenant SaaS
serving Indian agri-input dealers.

> See [the root README](../README.md) for product context and
> [`docs/HLD.md`](../docs/HLD.md) for the full system design.

## Stack

- **Spring Boot 3.3.5**, **Java 17**
- Spring Web, Data JPA, Security, Validation
- **jjwt 0.12** for JWT
- **Springdoc OpenAPI 2.6** → Swagger UI at `/api/docs`
- **H2** (file DB) for local dev, **PostgreSQL 16** for prod
- **JUnit 5 + MockMvc + JaCoCo** for tests
- **Lombok**

## Quickstart

```bash
mvn spring-boot:run
```

The API boots on `http://127.0.0.1:8080`. On first run, it creates an H2
file DB at `./data/agridesk`.

- **Swagger UI:** http://127.0.0.1:8080/api/docs
- **OpenAPI JSON:** http://127.0.0.1:8080/v3/api-docs
- **H2 console:** http://127.0.0.1:8080/h2-console (JDBC URL:
  `jdbc:h2:file:./data/agridesk`, user `sa`, no password)

## Environment variables

Defaults work for local dev. Override these in production.

| Variable | Default (dev) | Purpose |
|---|---|---|
| `JWT_SECRET` | (long hard-coded dev string) | HMAC secret for JWT signing. **Must be ≥ 512 bits in prod.** |
| `CORS_ORIGINS` | localhost + 127.0.0.1 ports 3000/3001/5500/5501 | Comma-separated list of allowed origins |
| `RAZORPAY_KEY_ID` | empty | Razorpay live or test key id |
| `RAZORPAY_KEY_SECRET` | empty | Razorpay key secret (used for HMAC verification) |
| `SPRING_DATASOURCE_URL` | H2 file DB | e.g. `jdbc:postgresql://host:5432/agridesk` in prod |
| `SPRING_DATASOURCE_USERNAME` | `sa` | |
| `SPRING_DATASOURCE_PASSWORD` | empty | |

When Razorpay keys are empty (default), `POST /api/payment/create-order` and
`POST /api/payment/verify` both return **503 Service Unavailable** —
intentional, so dev environments don't accidentally call live Razorpay.

## Tests

```bash
# Run all tests + generate JaCoCo coverage report
mvn -B verify
```

After `verify` succeeds:
- Surefire reports: `target/surefire-reports/`
- JaCoCo HTML: open `target/site/jacoco/index.html`
- JaCoCo XML (for CI): `target/site/jacoco/jacoco.xml`

Latest coverage on `main`: **~88.9%** line coverage (see the live JaCoCo badge in the root README).

### Test layout

```
src/test/java/com/agridesk/
├── controller/
│   ├── AuthControllerTest.java         signup/login/me happy + sad paths
│   ├── FarmerControllerTest.java       CRUD + multi-tenancy
│   ├── LedgerControllerTest.java       credit/payment + balance reversal
│   ├── InventoryControllerTest.java    product + stock batch + expiring query
│   ├── BillControllerTest.java         GST math, atomic stock + balance, sequential bill nos
│   ├── DashboardControllerTest.java    aggregations and limits
│   ├── SettingsControllerTest.java     dealer update, staff add/remove, owner immortality
│   ├── PaymentControllerTest.java      503 when Razorpay unconfigured
│   ├── PaymentVerifyTest.java          HMAC signature happy + invalid path
│   └── MultiTenantIsolationTest.java   dealer A cannot read/write/delete dealer B's data
├── security/
│   └── SecurityTest.java               401 vs 403, tampered/malformed JWTs, CORS preflight
└── support/
    ├── AbstractIntegrationTest.java    @SpringBootTest + @Transactional rollback
    └── TestHelpers.java                createDealer() returns DealerToken (User + JWT)
```

## API endpoints

Full interactive list lives at `/api/docs`. High-level:

| Tag | Endpoints |
|---|---|
| **Auth** | `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me` |
| **Dashboard** | `GET /api/dashboard` |
| **Farmers** | `GET/POST /api/farmers`, `PUT/DELETE /api/farmers/{id}` |
| **Inventory** | `GET/POST /api/products`, `DELETE /api/products/{id}`, `POST /api/stock`, `GET /api/stock/expiring` |
| **Bills** | `GET/POST /api/bills`, `DELETE /api/bills/{id}` |
| **Ledger** | `GET /api/ledger`, `POST /api/ledger/credit`, `POST /api/ledger/payment`, `DELETE /api/ledger/{id}` |
| **Settings** | `GET/PUT /api/settings/dealer`, `GET/POST /api/settings/staff`, `DELETE /api/settings/staff/{id}` |
| **Payment** | `POST /api/payment/create-order`, `POST /api/payment/verify` |

All routes except `/api/auth/signup`, `/api/auth/login`, `/api/payment/webhook`,
and the Swagger paths require a **Bearer JWT**.

## Multi-tenancy guarantee

- Every authenticated request resolves the dealer ID from the JWT (`CurrentUser.dealerId()`).
- Every repository query and service method takes that dealer ID as a parameter — there
  is no "global find by id" anywhere in the codebase.
- The `MultiTenantIsolationTest` proves that dealer A's token can never read, modify,
  or delete dealer B's farmers, products, bills, ledger entries, or staff.

## Build a production JAR

```bash
mvn -B -DskipTests package
java -jar target/agridesk-api-0.0.1-SNAPSHOT.jar
```

Recommended JVM flags for a 256MB Render free-tier instance:
```bash
java -Xmx200m -XX:+UseSerialGC -jar target/agridesk-api-0.0.1-SNAPSHOT.jar
```
