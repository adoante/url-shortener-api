export const safeBrowsing = async (url: string) => {
	const apiKey = process.env.GOOGLE_SAFE_BROWSING_KEY
	const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`

	const body = {
		client: {
			clientId: "adoante-url-shortener",
			clientVersion: "1.0.0"
		},
		threatInfo: {
			threatTypes: [
				"MALWARE",
				"SOCIAL_ENGINEERING",
				"UNWANTED_SOFTWARE",
				"POTENTIALLY_HARMFUL_APPLICATION"
			],
			platformTypes: ["ANY_PLATFORM"],
			threatEntryTypes: ["URL"],
			threatEntries: [{ url }]
		}
	}

	try {
		const res = await fetch(endpoint, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body)
		})

		if (!res.ok) {
			console.error("Safe Browsing API request failed:", res.status)
			return false
		}

		const data = await res.json()

		return !data.matches

	} catch (err) {
		console.error("Safe Browsing API error:", err);
		return false
	}

}
