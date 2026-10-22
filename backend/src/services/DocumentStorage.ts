// Stores application documents (CV, ID copy, academic record).
//
// 1. Supabase Storage, when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set (bucket: SUPABASE_STORAGE_BUCKET, default "documents").
// 2. Otherwise (or if the upload fails, e.g. the bucket does not exist yet) the file is saved on the backend
//    in backend/uploads/ so the application is never lost.
//
// The value saved in Document.fileUrl says where the file lives:
//   "supabase:<bucket>/<path>"  or  "local:<path inside backend/uploads>"
import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const LOCAL_ROOT = path.resolve(process.cwd(), "uploads");
const bucket = () => process.env.SUPABASE_STORAGE_BUCKET?.trim() || "documents";

let client: SupabaseClient | null | undefined;
function supabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.SUPABASE_URL?.trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY)?.trim();
  client = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return client;
}

const safeName = (name: string) => name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(-120) || "document.pdf";

export interface StoredFile { fileUrl: string; fileName: string; mimeType: string; sizeBytes: number }

export async function storeDocument(folder: string, file: Express.Multer.File): Promise<StoredFile> {
  const relative = `applications/${folder}/${Date.now()}-${file.fieldname}-${safeName(file.originalname)}`;
  const meta = { fileName: file.originalname, mimeType: file.mimetype || "application/pdf", sizeBytes: file.size };

  const sb = supabase();
  if (sb) {
    const { error } = await sb.storage.from(bucket()).upload(relative, file.buffer, { contentType: meta.mimeType, upsert: false });
    if (!error) return { ...meta, fileUrl: `supabase:${bucket()}/${relative}` };
    console.warn(`Supabase upload failed (${error.message}); saving ${relative} locally instead.`);
  }

  const target = path.join(LOCAL_ROOT, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, file.buffer);
  return { ...meta, fileUrl: `local:${relative}` };
}

/** Reads a stored document back (for the "Download CV" / view document buttons). */
export async function readDocument(fileUrl: string): Promise<Buffer> {
  if (fileUrl.startsWith("supabase:")) {
    const sb = supabase();
    if (!sb) throw Object.assign(new Error("Supabase Storage is not configured"), { statusCode: 500 });
    const rest = fileUrl.slice("supabase:".length);
    const slash = rest.indexOf("/");
    const { data, error } = await sb.storage.from(rest.slice(0, slash)).download(rest.slice(slash + 1));
    if (error || !data) throw Object.assign(new Error("Document could not be downloaded"), { statusCode: 404 });
    return Buffer.from(await data.arrayBuffer());
  }
  if (fileUrl.startsWith("local:")) {
    const target = path.resolve(LOCAL_ROOT, fileUrl.slice("local:".length));
    if (!target.startsWith(LOCAL_ROOT + path.sep)) throw Object.assign(new Error("Invalid document path"), { statusCode: 400 });
    return fs.readFile(target).catch(() => {
      throw Object.assign(new Error("Document file is missing"), { statusCode: 404 });
    });
  }
  throw Object.assign(new Error("Unknown document location"), { statusCode: 404 });
}

/** Best-effort cleanup when saving the application fails after the files were uploaded. */
export async function removeDocument(fileUrl: string): Promise<void> {
  try {
    if (fileUrl.startsWith("supabase:")) {
      const rest = fileUrl.slice("supabase:".length);
      const slash = rest.indexOf("/");
      await supabase()?.storage.from(rest.slice(0, slash)).remove([rest.slice(slash + 1)]);
    } else if (fileUrl.startsWith("local:")) {
      await fs.rm(path.resolve(LOCAL_ROOT, fileUrl.slice("local:".length)), { force: true });
    }
  } catch { /* ignore */ }
}
