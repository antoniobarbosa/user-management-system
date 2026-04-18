import "dotenv/config";
import Fastify from "fastify";

const port = Number(process.env.PORT) || 3001;
const app = Fastify({ logger: false });

app.get("/health", async () => ({ status: "ok" }));

try {
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`Server listening on port ${port}`);
} catch (err) {
  console.error(err);
  process.exit(1);
}
