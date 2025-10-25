import express from "express";
import type { Request, Response } from "express"
import { createClient } from "./supabase.js"
import type { Provider } from "@supabase/supabase-js";

const router = express.Router()

router.get("/login/:provider", async (req: Request, res: Response) => {
	const supabase = createClient({ req, res })

	const { provider } = req.params

	if (!provider) {
		return res.status(400).json({ message: "Requires a provider." })
	}

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: provider as Provider,
		options: {
			redirectTo: `https://adoante.com/auth/callback`,
		},
	})

	if (error) return res.status(400).send(error.message)

	if (data.url) {
		res.redirect(data.url)
	}
})

router.get("/callback", async (req: Request, res: Response) => {
	const supabase = createClient({ req, res })

	// Exchange the code for a session
	const code = req.query.code as string
	const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)

	if (error) return res.status(400).send(error.message)
	if (!sessionData.session) return res.status(400).send("No session returned")

	const accessToken = sessionData.session.access_token

	// Redirect to your frontend with token
	//const frontendUrl = `http://localhost:3000/auth?token=${accessToken}`
	res.redirect("/")
})

router.get("/logout", async (req: Request, res: Response) => {
	const supabase = createClient({ req, res })

	const { data: { session } } = await supabase.auth.getSession()

	if (!session) {
		return res.status(401).json({ error: "No active session" })
	}

	const { error } = await supabase.auth.signOut()

	if (error) {
		return res.status(400).send(error.message)
	}

	res.status(200).json({ message: "Logged out." })
})

router.get("/me", async (req: Request, res: Response) => {
	const supabase = createClient({ req, res })

	const { data: { user }, error } = await supabase.auth.getUser()

	if (error) {
		return res.status(400).send(error.message)
	}

	res.status(200).json(user)
})

export default router
