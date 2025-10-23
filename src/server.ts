import express from "express"
import type { Express, Request, Response } from "express"
import "dotenv/config"
//import cors from "cors"

const app: Express = express();

// app.use(cors( origin: "" ))

const port = process.env.PORT

app.get("/", (req: Request, res: Response) => {
	res.send("Express with TypeScript!")
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
