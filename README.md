# Flyantrip Backend

This backend is structured for future scalability, currently serving as an architectural placeholder for the Flyantrip project. No unnecessary files or code exist here.

## Architecture & Folders Explanation

The directory structure is strictly prepared for enterprise-level API creation. Each folder has a highly specific responsibility:

- `config/`
  **Purpose:** Stores configuration files. This is where you will define your environment variables loader, database connection logic (e.g., MongoDB/Mongoose), and third-party API keys setup.

- `controllers/`
  **Purpose:** Stores the Request/Response handlers. These files receive HTTP requests from the frontend, call the appropriate `services` for business logic, and send back formatted HTTP responses (JSON).

- `models/`
  **Purpose:** Stores Database schemas. For example, `User.js`, `Booking.js`, or `Flight.js`. This is strictly for the data layer.

- `services/`
  **Purpose:** Stores core business logic. Controllers should be "thin" and pass data to services. Services handle complex operations, data formatting, and interfacing with external APIs.

- `middlewares/`
  **Purpose:** Stores Express middleware functions. Examples include `authMiddleware` (to verify JWT tokens), `errorHandler` (to catch global exceptions), and request loggers.

- `validations/`
  **Purpose:** Stores request validation schemas (e.g., using Joi, Zod, or express-validator) to ensure incoming data from the frontend is strictly correct before it hits the controllers.

- `utils/`
  **Purpose:** Stores reusable helper functions that do not belong to a specific business domain. Examples include date formatters, encryption helpers, or math utilities.

- `integrations/`
  **Purpose:** Stores third-party services integration logic. 
  - `integrations/adivaha/`: This specific sub-folder is reserved for wrapping the Adivaha API for Flights and Hotels. It isolates the third-party logic so the rest of your app doesn't tightly couple to it.

- `docs/`
  **Purpose:** Stores API documentation (like Swagger YAML files or Postman collections) so frontend developers know how to interact with the backend.

## Future Integration Plan (Adivaha)

1. The `integrations/adivaha` module will wrap the Adivaha API requests securely using your server-side API keys.
2. The `services/` directory will consume the `adivaha` integration to provide abstracted, clean data to `controllers/`.
3. Routes (to be added) will expose these specific endpoints to the frontend.
