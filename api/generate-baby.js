import OpenAI from "openai";
import { toFile } from "openai/uploads";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

function clean(value, fallback = "") {
  return String(value || fallback).replace(/[^\w\s%/'.,:;?!()&+-]/g, "").slice(0, 800);
}

function sample(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function parentLabel(value) {
  if (value === "mother") return "mother";
  if (value === "father") return "father";
  if (value === "both") return "balanced blend of both parents";
  return clean(value, "balanced blend of both parents");
}

function featureInstruction(feature, value) {
  const parent = parentLabel(value);
  if (parent === "mother") return `${feature} should clearly echo the mother reference photo`;
  if (parent === "father") return `${feature} should clearly echo the father reference photo`;
  return `${feature} should be ${parent}`;
}

function resemblanceInstruction(momPercent) {
  const dadPercent = 100 - momPercent;
  if (momPercent >= 75) {
    return `Overall face should read mostly like the mother reference photo: about ${momPercent}% mother and ${dadPercent}% father. Use the mother as the stronger source for face shape, eyes, expression, and proportions while keeping subtle father traits.`;
  }
  if (momPercent >= 58) {
    return `Overall face should lean mother: about ${momPercent}% mother and ${dadPercent}% father. Keep the father visible in a few secondary details.`;
  }
  if (momPercent <= 25) {
    return `Overall face should read mostly like the father reference photo: about ${dadPercent}% father and ${momPercent}% mother. Use the father as the stronger source for face shape, expression, and proportions while keeping subtle mother traits.`;
  }
  if (momPercent <= 42) {
    return `Overall face should lean father: about ${dadPercent}% father and ${momPercent}% mother. Keep the mother visible in a few secondary details.`;
  }
  return `Overall face should feel like an even biological blend: about ${momPercent}% mother and ${dadPercent}% father, with neither parent dominating.`;
}

function buildSceneProfile(body) {
  const clientVariation = clean(body.variation, "");
  return {
    framing: sample([
      "tight face-forward portrait with big expressive eyes",
      "three-quarter angle baby portrait",
      "waist-up baby portrait with tiny hands visible",
      "close candid crop with the baby looking slightly off-camera",
      "soft editorial portrait with asymmetrical composition",
      "playful high-angle portrait from just above eye level"
    ]),
    lighting: sample([
      "soft morning window light",
      "warm late-afternoon nursery light",
      "clean studio light with gentle catchlights",
      "bright airy natural light",
      "soft side light with subtle cheek shadows",
      "cozy indoor lamp glow balanced with daylight"
    ]),
    background: sample([
      "pastel nursery with soft toys blurred in the background",
      "warm cream blanket backdrop",
      "subtle floral baby shower backdrop",
      "minimal modern nursery background",
      "cozy home sofa with soft pillows",
      "festive but tasteful baby shower background",
      "light wood crib and neutral bedding background",
      "soft outdoor garden bokeh background"
    ]),
    detail: sample([
      "one tiny hand near the cheek",
      "slight head tilt",
      "bright curious eyes",
      "one eyebrow slightly raised",
      "gentle open-mouth smile",
      "sleepy squishy-cheek expression",
      "tiny wisps of hair visible on the forehead",
      "playful wrinkled-nose expression"
    ]),
    palette: sample([
      "warm peach, cream, and sage accents",
      "soft blue, ivory, and honey accents",
      "rose, white, and pale gold accents",
      "mint, cream, and warm wood accents",
      "lavender, ivory, and soft gray accents",
      "coral, cream, and light teal accents"
    ]),
    clientVariation
  };
}

function buildPrompt(body) {
  const momPercent = Math.max(0, Math.min(100, Number(body.momPercent ?? 50)));
  const dadPercent = 100 - momPercent;

  const gender = clean(body.gender, "baby");
  const eyes = clean(body.eyes, "both");
  const smile = clean(body.smile, "both");
  const nose = clean(body.nose, "balanced blend of both parents");
  const hairType = clean(body.hairType, "natural dark baby hair");
  const cheeks = clean(body.cheeks, "soft baby cheeks");
  const expression = clean(body.expression, "sweet natural expression");
  const outfit = clean(body.outfit, "simple cute baby outfit");
  const babyDescription = clean(body.babyDescription, "");
  const customPrompt = clean(body.customPrompt, "");
  const scene = buildSceneProfile(body);

  return `
Create one hyper-realistic, adorable baby ${gender} portrait for a baby shower prediction game.

IMPORTANT REFERENCE INSTRUCTIONS:
- Two parent photos are provided as image inputs: the first image is the mother, the second image is the father.
- Use both parent images as strong visual references.
- The baby should plausibly appear to be their biological child, not like a random stock baby.
- Preserve skin tone tendencies, facial proportions, eye shape, smile characteristics, hair characteristics, and overall family resemblance.
- Translate adult features into an age-appropriate baby face.
- Follow the resemblance weighting exactly. Do not accidentally swap mother and father influence.

Structured baby profile:
- Resemblance: ${resemblanceInstruction(momPercent)}
- Exact weighting label: ${momPercent}% mother and ${dadPercent}% father.
- ${featureInstruction("Eyes", eyes)}.
- ${featureInstruction("Smile and lips", smile)}.
- Nose: ${nose}.
- Hair: ${hairType}.
- Cheeks: ${cheeks}.
- Expression: ${expression}.
- Outfit / vibe: ${outfit}.

Guest visual idea:
${babyDescription || "No detailed visual description provided."}

Guest note. Use only if it affects visual personality or styling:
${customPrompt || "No extra request."}

Unique composition for this guest:
- Framing: ${scene.framing}.
- Lighting: ${scene.lighting}.
- Background: ${scene.background}.
- Distinctive detail: ${scene.detail}.
- Color palette: ${scene.palette}.
${scene.clientVariation ? `- Additional variation: ${scene.clientVariation}.` : ""}

Diversity requirement:
- Make this image visibly different from other baby shower predictions.
- Do not default to the same centered studio baby with the same round face, pose, outfit, or background.
- Let the selected traits and guest description noticeably affect the final face and scene.

Visual style:
- hyper-realistic baby portrait
- premium photography look, not an illustration
- cute, warm, polished, high-detail
- natural baby skin texture, soft cheeks, expressive eyes
- realistic family resemblance
- single baby only
- no text, no watermark, no extra people
- avoid sketch, drawing, cartoon, comic, flat illustration, painterly style, AI-looking skin, distorted features, uncanny face
`.trim();
}

async function uploadGeneratedImage(b64) {
  if (!supabase || !b64) return null;
  const buffer = Buffer.from(b64, "base64");
  const filePath = `${Date.now()}-${crypto.randomUUID()}.png`;
  const upload = await supabase.storage.from("baby-images").upload(filePath, buffer, {
    contentType: "image/png",
    upsert: false
  });
  if (upload.error) {
    console.error("Supabase image upload failed", upload.error);
    return null;
  }
  return supabase.storage.from("baby-images").getPublicUrl(filePath).data.publicUrl;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: "OPENAI_API_KEY is not configured." });

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const momFile = await toFile(fs.createReadStream(path.join(process.cwd(), "assets", "mom.jpg")), "mother-reference.jpg", { type: "image/jpeg" });
    const dadFile = await toFile(fs.createReadStream(path.join(process.cwd(), "assets", "dad.jpg")), "father-reference.jpg", { type: "image/jpeg" });

    const result = await client.images.edit({
      model: "gpt-image-1",
      image: [momFile, dadFile],
      prompt: buildPrompt(req.body || {}),
      size: "1024x1024",
      quality: "high"
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) return res.status(500).json({ error: "Image generation returned no image." });

    const imageUrl = await uploadGeneratedImage(b64);
    return res.status(200).json({ imageDataUrl: `data:image/png;base64,${b64}`, imageUrl });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error?.message || "Failed to generate AI baby image." });
  }
}
