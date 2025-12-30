import "dotenv/config";
import express, { Request, Response } from "express";

// REDIS
import "./lib/redis.js"; // INITIALIZE REDIS CONNECTION
import "./utlis/email-queue/email.worker.js"; // IMPORT EMAIL WORKER TO START PROCESSING JOBS


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


app.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT http://localhost:${PORT}`);
});