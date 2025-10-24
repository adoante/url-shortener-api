import { createClient } from "../supabase.js"
import type { Request, Response, NextFunction } from "express"

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
	const supabase = createClient({ req, res })
	const { data: { user }, error } = await supabase.auth.getUser()

	if (error || !user) {
		return res.status(401).json({ error: "Unauthorized" })
	}

	next()
}
