import express from "express"
import "dotenv/config"
import base62 from "@sindresorhus/base62"
import cors from "cors"
import path from "path"
import {fileURLToPath} from "url"

import auth from "./auth.js"
import { requireAuth } from "./middleware/requireAuth.js"
import { createClient as createServerClient } from "./supabase.js"
import { createClient } from "@supabase/supabase-js"

import type { Express, Request, Response } from "express"
import type { TablesInsert } from "./types/database.types.js"

const app: Express = express();

const port = process.env.PORT

const rootDir = path.resolve()

app.use(
	cors({
		origin: (origin, callback) => {
			const allowed = ["https://adoante.com"]
			if (!origin || allowed.includes(origin)) {
				callback(null, true)
			} else {
				callback(new Error("Not allowed by CORS"))
			}
		},
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
)

app.use(express.json())

app.use("/auth", auth)

app.post("/shorten", requireAuth, async (req: Request, res: Response) => {
	const supabase = createServerClient({ req, res })

	const { full } = req.body

	const { data: { user }, error: getUserError } = await supabase.auth.getUser()

	if (getUserError) {
		return res.status(500).send(getUserError.message)
	}

	if (!user) {
		return res.status(401).json({ error: "No user found." })
	}

	const insert: TablesInsert<"URL"> = {
		full,
		created_by: user.id
	}

	const { data, error } = await supabase
		.from('URL')
		.insert(insert)
		.select("id")
		.single()

	console.log(data)

	if (error) {
		return res.status(500).send(error.message)
	}

	const short = base62.encodeInteger(data.id)
	console.log(short)

	const { data: updateData, error: updateError } = await supabase
		.from('URL')
		.update({ short: short })
		.eq("id", data.id)
		.select()

	if (updateError) {
		return res.status(500).send(updateError.message)
	}

	return res.status(201).json(updateData)
})

app.get("/:short", async (req: Request, res: Response,) => {
	const supabaseAdmin = createClient(
		process.env.SUPABASE_URL as string,
		process.env.SUPABASE_SERVICE_ROLE_KEY as string  // Full admin key
	)
	const { short } = req.params

	const { data: readData, error: readError } = await supabaseAdmin
		.from("URL")
		.select("id, full, clicks")
		.eq("short", short)
		.single()

	if (readError) {
		return res.status(500).send(readError.message)
	}

	const { error: updateError } = await supabaseAdmin
		.from('URL')
		.update({ clicks: readData.clicks + 1 })
		.eq("id", readData.id)

	if (updateError) {
		return res.status(500).send(updateError.message)
	}

	res.redirect(readData.full)
})

app.get("/user/urls", async (req: Request, res: Response) => {
	const supabase = createServerClient({ req, res })

	const { data: { user }, error } = await supabase.auth.getUser()

	if (error) {
		return res.status(400).send(error.message)
	}

	if (!user) {
		return res.status(401).json({ error: "No user found." })
	}

	const { data: readData, error: readError } = await supabase
		.from("URL")
		.select("full, created_at, short, clicks")
		.eq("created_by", user.id)

	if (readError) {
		return res.status(500).send(readError.message)
	}

	res.status(200).json(readData)
})


app.use(express.static(path.join(rootDir, 'out')));

app.use((req: Request, res: Response) => {
	res.sendFile(path.join(rootDir, "out", "index.html"));
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
