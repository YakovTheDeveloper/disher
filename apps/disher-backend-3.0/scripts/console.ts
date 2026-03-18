import { createServer } from "../node_modules/@triplit/console/dist/index.js";

const SERVICE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ4LXRyaXBsaXQtdG9rZW4tdHlwZSI6InNlY3JldCIsIngtdHJpcGxpdC1wcm9qZWN0LWlkIjoibG9jYWwtcHJvamVjdC1pZCJ9.8Z76XXPc9esdlZb2b7NDC7IVajNXKc4eVcPsO7Ve0ug";

const server = createServer(null, {
  server: "http://localhost:6543",
  token: SERVICE_TOKEN,
  projName: "Disher",
});

const PORT = 6544;
server.listen(PORT, () => {
  console.log(`Triplit Console: http://localhost:${PORT}`);
});
