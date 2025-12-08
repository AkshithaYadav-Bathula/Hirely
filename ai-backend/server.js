import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/* =========================================================
   FETCH USER FROM STRAPI USING ROOT email
========================================================= */
const fetchUserByEmail = async (email) => {
  const url = `${process.env.STRAPI_URL}/test1s?filters[email][$eq]=${email}&populate=*`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.STRAPI_TOKEN}`,
    },
  });

  const json = await res.json();

  if (!json.data || json.data.length === 0) {
    console.log("❌ No user found in Strapi for email:", email);
    return null;
  }

  return json.data[0].attributes.userInfo;
};

/* =========================================================
   FETCH JOB FROM JSON SERVER
========================================================= */
const fetchJob = async (id) => {
  const res = await fetch(`${process.env.JSON_SERVER_URL}/jobs/${id}`);
  return res.json();
};

/* =========================================================
   AI COVER LETTER GENERATOR (OpenAI proxy – no key needed)
========================================================= */
app.post("/generate-cover-letter", async (req, res) => {
  try {
    const { userEmail, jobId } = req.body;

    // 1️⃣ Fetch user from Strapi
    const user = await fetchUserByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ error: "Strapi user not found" });
    }

    // 2️⃣ Fetch job from JSON Server
    const job = await fetchJob(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found in JSON server" });
    }

    // 3️⃣ Build prompt
    const name = user.name || "Applicant";
    const skills = Array.isArray(user.skills) ? user.skills.join(", ") : "Not provided";
    const about = user.about || "Not provided";

    const prompt = `
Write a clean, professional 150-200 word cover letter.

JOB DETAILS:
- Title: ${job.title}
- Description: ${job.description}

CANDIDATE DETAILS:
- Name: ${name}
- Skills: ${skills}
- About: ${about}

Make the tone confident, friendly, and recruiter-appealing.
Write in paragraph format only.
`;

    // 4️⃣ Call the OpenAI-compatible FREE proxy
    const aiRes = await fetch("https://api.opennn.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await aiRes.json();

    if (!data?.choices?.[0]?.message?.content) {
      console.log("❌ AI error:", data);
      return res.status(500).json({ error: "AI failed to generate text" });
    }

    const text = data.choices[0].message.content;

    res.json({ text });

  } catch (err) {
    console.error("🔥 AI ERROR:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* =========================================================
   START SERVER
========================================================= */
app.listen(5001, () =>
  console.log("✨ AI backend running at http://localhost:5001")
);
