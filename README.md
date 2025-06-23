### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL database

### Installation

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd identity-reconciliation
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Configure environment variables:**
   - Create a `.env` file in the root:
     ```
     DATABASE_URL="postgresql://username:password@localhost:5432/yourdbname"
     ```
   - Replace with your actual Postgres credentials and database name.

4. **Set up the database:**
   ```sh
   npx prisma db push
   ```

5. **Start the server:**
   ```sh
   npm run dev
   ```
   The service will be available at `http://localhost:3000/api/identify`.

---

## API Usage

### POST `/api/identify`

**Request Body:**
```json
{
  "email": "user@example.com",
  "phoneNumber": "1234567890"
}
```
- At least one of `email` or `phoneNumber` is required.

**Response:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["user@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": [2, 3]
  }
}
```

---

## Error Handling

- If both `email` and `phoneNumber` are missing:
  ```json
  { "error": "Email or phoneNumber required" }
  ```
- For unexpected errors, a misleading error message is returned for security.

---

## Development

- Code is organized using MVC principles.
- Prisma ORM is used for database access.
- All business logic is in `src/controllers/identifyController.js`.

---

## Testing

You can use Postman or curl to test the `/api/identify` endpoint.  
See the assignment or ask for example test cases.

---
