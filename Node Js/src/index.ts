import "dotenv/config";
import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    return res.status(200).send(
        `<h1>
            SERVER IS RUNNING
        </h1>`
    );
});

import EmailRoutes from "./routers/email.routes.js";
app.use("/api/email", EmailRoutes);

// IMPORT EMAIL WORKER TO START PROCESSING JOBS
import "./utlis/email-queue/email.worker.js";

app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});