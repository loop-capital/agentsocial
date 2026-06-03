import { execFile, exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { db } from "../db/index.js";
import { clips, videoSources } from "../db/schema.js";
import { eq } from "drizzle-orm";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

const WORK_DIR = process.env.CLIPIFY_WORK_DIR || "/tmp/clipify";
const SCRIPTS_DIR = new URL("../scripts/clipify", import.meta.url).pathname;

export interface ClipCandidate {
  start: number;
  end: number;
  duration: number;
  title: string;
  whyFunny: string;
  transcript: string;
}

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
  words?: Array<{ word: string; start: number; end: number }>;
}

/**
 * Ensure work directory exists
 */
export async function ensureWorkDir(brandId: string, sourceId: string): Promise<string> {
  const dir = path.join(WORK_DIR, brandId, sourceId);
  await fs.promises.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Download video from URL (YouTube, podcast, etc.)
 */
export async function downloadVideo(url: string, outputPath: string): Promise<void> {
  // If it's already a local file path, just copy it
  if (url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) {
    await fs.promises.copyFile(url, outputPath);
    return;
  }
  
  // Try yt-dlp first, then fall back to curl for direct URLs
  try {
    await execFileAsync("yt-dlp", [
      "-f", "best[ext=mp4]/best",
      "--merge-output-format", "mp4",
      "-o", outputPath,
      url,
    ]);
  } catch {
    // Fallback: try curl for direct video URLs
    await execFileAsync("curl", ["-L", "-o", outputPath, url]);
  }
}

/**
 * Extract audio from video for Whisper
 */
export async function extractAudio(videoPath: string, audioPath: string): Promise<void> {
  const hwaccel = process.platform === "darwin" ? ["-hwaccel", "videotoolbox"] : [];
  const args = [
    "-y",
    ...hwaccel,
    "-i", videoPath,
    "-vn", "-ac", "1", "-ar", "16000",
    audioPath,
  ].filter(Boolean) as string[];
  await execFileAsync("ffmpeg", args);
}

/**
 * Transcribe audio with Whisper
 */
export async function transcribe(audioPath: string, outputDir: string, language = "en"): Promise<string> {
  const isEnglish = language === "en" || language === "english";
  const model = isEnglish ? "tiny.en" : "base";
  const langArg = isEnglish ? ["--language", "en"] : [];

  await execFileAsync("whisper", [
    audioPath,
    "--model", model,
    "--word_timestamps", "True",
    "--output_format", "json",
    "--output_dir", outputDir,
    ...langArg,
  ]);

  const baseName = path.basename(audioPath, path.extname(audioPath));
  return path.join(outputDir, `${baseName}.json`);
}

/**
 * Parse Whisper JSON output
 */
export async function parseTranscript(jsonPath: string): Promise<TranscriptSegment[]> {
  const data = JSON.parse(await fs.promises.readFile(jsonPath, "utf-8"));
  return data.segments || data;
}

/**
 * Find funny/clip-worthy moments from transcript
 */
export function findClipCandidates(
  segments: TranscriptSegment[],
  options: { minDuration?: number; maxDuration?: number; maxCandidates?: number } = {}
): ClipCandidate[] {
  const { minDuration = 10, maxDuration = 25, maxCandidates = 5 } = options;

  const funnySignals = [
    "what", "wait", "no way", "haha", "lol", "omg", "wow",
    "seriously", "actually", "truth", "secret", "never", "always",
    "problem", "mistake", "fail", "worst", "best", "crazy", "insane",
  ];

  const candidates: Array<{
    start: number;
    end: number;
    score: number;
    signals: string[];
    transcript: string;
  }> = [];

  // Sliding window to find clip-worthy segments
  for (let i = 0; i < segments.length; i++) {
    let windowText = "";
    let windowStart = segments[i].start;
    let windowEnd = windowStart;

    for (let j = i; j < segments.length; j++) {
      windowText += " " + segments[j].text;
      windowEnd = segments[j].end;
      const duration = windowEnd - windowStart;

      if (duration > maxDuration) break;
      if (duration < minDuration) continue;

      const lowerText = windowText.toLowerCase();
      const signals = funnySignals.filter((s) => lowerText.includes(s));

      // Score based on signals, duration sweet spot (15-20s), and sentence count
      const sentences = windowText.split(/[.!?]+/).filter(Boolean).length;
      const durationScore = 1 - Math.abs(duration - 18) / 18; // peak at 18s
      const signalScore = signals.length * 2;
      const sentenceScore = Math.min(sentences, 4);

      const score = durationScore + signalScore + sentenceScore;

      if (score >= 2) {
        candidates.push({
          start: windowStart,
          end: windowEnd,
          score,
          signals,
          transcript: windowText.trim(),
        });
      }
    }
  }

  // Sort by score and deduplicate overlapping clips
  candidates.sort((a, b) => b.score - a.score);

  const selected: typeof candidates = [];
  for (const c of candidates) {
    const overlaps = selected.some(
      (s) => Math.abs(s.start - c.start) < 5 || Math.abs(s.end - c.end) < 5
    );
    if (!overlaps) selected.push(c);
    if (selected.length >= maxCandidates) break;
  }

  return selected.map((c) => ({
    start: Math.floor(c.start),
    end: Math.ceil(c.end),
    duration: Math.ceil(c.end - c.start),
    title: generateTitle(c.transcript, c.signals),
    whyFunny: describeWhyFunny(c.signals, c.transcript),
    transcript: c.transcript,
  }));
}

function generateTitle(transcript: string, signals: string[]): string {
  if (signals.length > 0) {
    return `${signals[0].charAt(0).toUpperCase() + signals[0].slice(1)} moment`;
  }
  const words = transcript.split(" ").slice(0, 6).join(" ");
  return words + (transcript.split(" ").length > 6 ? "..." : "");
}

function describeWhyFunny(signals: string[], transcript: string): string {
  if (signals.length === 0) return "Strong standalone moment";
  const reasons: string[] = [];
  if (signals.includes("what") || signals.includes("wait") || signals.includes("seriously")) {
    reasons.push("Surprise or revelation");
  }
  if (signals.includes("haha") || signals.includes("lol")) {
    reasons.push("Contains laughter/reaction");
  }
  if (signals.includes("problem") || signals.includes("mistake") || signals.includes("fail")) {
    reasons.push("Problem/solution arc");
  }
  if (signals.includes("secret") || signals.includes("truth")) {
    reasons.push("Insider knowledge shared");
  }
  if (reasons.length === 0) {
    reasons.push("High engagement keywords detected");
  }
  return reasons.join(". ");
}

/**
 * Extract a sub-clip from video
 */
export async function trimClip(
  sourcePath: string,
  outputPath: string,
  start: number,
  duration: number
): Promise<void> {
  await execFileAsync("ffmpeg", [
    "-y",
    "-ss", String(start),
    "-t", String(duration),
    "-i", sourcePath,
    "-c", "copy",
    outputPath,
  ]);
}

/**
 * Detect video dimensions
 */
export async function getVideoInfo(videoPath: string): Promise<{ width: number; height: number; duration: number }> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width,height,duration",
    "-of", "json",
    videoPath,
  ]);
  const data = JSON.parse(stdout);
  const stream = data.streams?.[0] || {};
  return {
    width: stream.width || 1920,
    height: stream.height || 1080,
    duration: parseFloat(stream.duration) || 0,
  };
}

/**
 * Reframe clip to target aspect ratio
 */
export async function reframeClip(
  inputPath: string,
  outputPath: string,
  options: {
    targetFormat: "9:16" | "16:9" | "1:1";
    reframeMode?: "pan" | "split-screen" | "center-crop";
    width?: number;
    height?: number;
  }
): Promise<void> {
  const { targetFormat, reframeMode = "center-crop", width = 1080, height = 1920 } = options;

  if (targetFormat === "16:9") {
    // Just re-encode if already 16:9, or letterbox
    await execFileAsync("ffmpeg", [
      "-y", "-i", inputPath,
      "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
      "-c:v", "libx264", "-preset", "fast", "-crf", "20",
      "-c:a", "aac", "-b:a", "192k",
      outputPath,
    ]);
    return;
  }

  if (targetFormat === "1:1") {
    await execFileAsync("ffmpeg", [
      "-y", "-i", inputPath,
      "-vf", "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2",
      "-c:v", "libx264", "-preset", "fast", "-crf", "20",
      "-c:a", "aac", "-b:a", "192k",
      outputPath,
    ]);
    return;
  }

  // 9:16 from 16:9
  const info = await getVideoInfo(inputPath);
  const sourceAspect = info.width / info.height;

  if (sourceAspect > 1.5) {
    // Wide source - need to crop or pan
    if (reframeMode === "center-crop") {
      const cropWidth = Math.round(info.height * 9 / 16);
      const x = Math.round((info.width - cropWidth) / 2);
      await execFileAsync("ffmpeg", [
        "-y", "-i", inputPath,
        "-vf", `crop=${cropWidth}:${info.height}:${x}:0,scale=${width}:${height}:flags=lanczos`,
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k",
        outputPath,
      ]);
    } else if (reframeMode === "pan") {
      // For pan mode, we center-crop as a simple default
      // Full pan logic would require motion analysis
      const cropWidth = Math.round(info.height * 9 / 16);
      const x = Math.round((info.width - cropWidth) / 2);
      await execFileAsync("ffmpeg", [
        "-y", "-i", inputPath,
        "-vf", `crop=${cropWidth}:${info.height}:${x}:0,scale=${width}:${height}:flags=lanczos`,
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k",
        outputPath,
      ]);
    } else {
      // split-screen: stack multiple crops
      const tileHeight = Math.round(height / 2);
      await execFileAsync("ffmpeg", [
        "-y", "-i", inputPath,
        "-vf",
        `[0:v]split=2[a][b];[a]crop=${info.width / 2}:${info.height}:0:0,scale=${width}:${tileHeight}[top];[b]crop=${info.width / 2}:${info.height}:${info.width / 2}:0,scale=${width}:${tileHeight}[bottom];[top][bottom]vstack=inputs=2,scale=${width}:${height}`,
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k",
        outputPath,
      ]);
    }
  } else {
    // Already portrait or square-ish, just scale
    await execFileAsync("ffmpeg", [
      "-y", "-i", inputPath,
      "-vf", `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
      "-c:v", "libx264", "-preset", "fast", "-crf", "20",
      "-c:a", "aac", "-b:a", "192k",
      outputPath,
    ]);
  }
}

/**
 * Burn subtitles onto video
 */
export async function burnCaptions(
  videoPath: string,
  assPath: string,
  outputPath: string
): Promise<void> {
  await execFileAsync("ffmpeg", [
    "-y", "-i", videoPath,
    "-vf", `subtitles=${assPath}`,
    "-c:v", "libx264", "-preset", "fast", "-crf", "20",
    "-c:a", "copy",
    outputPath,
  ]);
}

/**
 * Full pipeline: video URL → clips
 */
export async function processVideoSource(
  sourceId: string,
  brandId: string,
  url: string,
  options: {
    title?: string;
    description?: string;
    formats?: Array<"9:16" | "16:9" | "1:1">;
    style?: "opus" | "karaoke" | "minimal";
    reframeMode?: "pan" | "split-screen" | "center-crop";
    language?: string;
    maxClips?: number;
  } = {}
): Promise<void> {
  const {
    title,
    description,
    formats = ["9:16"],
    style = "opus",
    reframeMode = "center-crop",
    language = "en",
    maxClips = 5,
  } = options;

  const workDir = await ensureWorkDir(brandId, sourceId);
  const videoPath = path.join(workDir, "source.mp4");
  const audioPath = path.join(workDir, "audio.wav");

  try {
    // Update status: downloading
    await db.update(videoSources)
      .set({ status: "transcribing" })
      .where(eq(videoSources.id, sourceId));

    // Download
    await downloadVideo(url, videoPath);

    // Extract audio
    await extractAudio(videoPath, audioPath);

    // Transcribe
    const transcriptPath = await transcribe(audioPath, workDir, language);
    const segments = await parseTranscript(transcriptPath);

    // Update with transcript
    await db.update(videoSources)
      .set({ transcript: segments, status: "finding_moments" })
      .where(eq(videoSources.id, sourceId));

    // Find candidates
    const candidates = findClipCandidates(segments, { maxCandidates: maxClips });

    // Generate clips
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const clipId = crypto.randomUUID();
      const clipDir = path.join(workDir, `clip_${i}`);
      await fs.promises.mkdir(clipDir, { recursive: true });

      const rawClipPath = path.join(clipDir, "raw.mp4");
      const reframedPath = path.join(clipDir, "reframed.mp4");
      const finalPath = path.join(clipDir, "final.mp4");

      // Trim
      await trimClip(videoPath, rawClipPath, candidate.start, candidate.duration);

      // Reframe
      await reframeClip(rawClipPath, reframedPath, {
        targetFormat: formats[0],
        reframeMode,
      });

      // Transcribe clip for captions
      const clipAudioPath = path.join(clipDir, "clip_audio.wav");
      await extractAudio(reframedPath, clipAudioPath);
      const clipTranscriptPath = await transcribe(clipAudioPath, clipDir, language);

      // Build ASS
      const assPath = path.join(clipDir, "captions.ass");
      await execFileAsync("python3", [
        path.join(SCRIPTS_DIR, "build_ass.py"),
        clipTranscriptPath,
        assPath,
        style,
      ]);

      // Burn captions
      await burnCaptions(reframedPath, assPath, finalPath);

      // Save to DB
      await db.insert(clips).values({
        id: clipId,
        videoSourceId: sourceId,
        brandId,
        title: candidate.title,
        description: candidate.transcript.slice(0, 200),
        startSeconds: candidate.start,
        endSeconds: candidate.end,
        durationSeconds: candidate.duration,
        format: formats[0],
        style,
        reframeMode,
        outputPath: finalPath,
        whyFunny: candidate.whyFunny,
        status: "complete",
      });
    }

    // Mark source complete
    await db.update(videoSources)
      .set({ status: "complete" })
      .where(eq(videoSources.id, sourceId));

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    await db.update(videoSources)
      .set({ status: "failed" })
      .where(eq(videoSources.id, sourceId));
    throw error;
  }
}

/**
 * Render a single clip from a video source with specific settings
 */
export async function renderClip(
  clipId: string,
  options: {
    format?: "9:16" | "16:9" | "1:1";
    style?: "opus" | "karaoke" | "minimal";
    reframeMode?: "pan" | "split-screen" | "center-crop";
    language?: string;
  } = {}
): Promise<void> {
  const clip = await db.select().from(clips).where(eq(clips.id, clipId)).then((r) => r[0]);
  if (!clip) throw new Error("Clip not found");

  const source = await db.select().from(videoSources).where(eq(videoSources.id, clip.videoSourceId)).then((r) => r[0]);
  if (!source) throw new Error("Source not found");

  const workDir = path.dirname(clip.outputPath || "/tmp/clipify/tmp");
  const videoPath = source.localPath || path.join(workDir, "..", "source.mp4");

  await db.update(clips).set({ status: "rendering" }).where(eq(clips.id, clipId));

  try {
    const rawClipPath = path.join(workDir, "raw.mp4");
    const reframedPath = path.join(workDir, "reframed.mp4");
    const finalPath = path.join(workDir, "final.mp4");

    await trimClip(videoPath, rawClipPath, clip.startSeconds, clip.durationSeconds);
    await reframeClip(rawClipPath, reframedPath, {
      targetFormat: options.format || (clip.format as "9:16"),
      reframeMode: options.reframeMode || (clip.reframeMode as "center-crop"),
    });

    // Transcribe clip for captions
    const clipAudioPath = path.join(workDir, "clip_audio.wav");
    await extractAudio(reframedPath, clipAudioPath);
    const clipTranscriptPath = await transcribe(clipAudioPath, workDir, options.language || "en");

    // Build ASS
    const assPath = path.join(workDir, "captions.ass");
    await execFileAsync("python3", [
      path.join(SCRIPTS_DIR, "build_ass.py"),
      clipTranscriptPath,
      assPath,
      options.style || clip.style || "opus",
    ]);

    // Burn captions
    await burnCaptions(reframedPath, assPath, finalPath);

    await db.update(clips)
      .set({
        outputPath: finalPath,
        format: options.format || clip.format,
        style: options.style || clip.style,
        reframeMode: options.reframeMode || clip.reframeMode,
        status: "complete",
      })
      .where(eq(clips.id, clipId));
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    await db.update(clips)
      .set({ status: "failed", errorMessage: errMsg })
      .where(eq(clips.id, clipId));
    throw error;
  }
}
