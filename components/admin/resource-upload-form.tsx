"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function ResourceUploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a file to upload.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/v1/admin/resources", { method: "POST", body: data });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        setError(json.error?.message ?? "The upload failed.");
        return;
      }
      toast.success("Material published", {
        description: "Students can download it from the free learning materials page.",
      });
      form.reset();
      router.refresh();
    } catch {
      setError("Could not reach the server.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="resource-title"
            className="mb-1 block text-xs font-medium text-neutral-700"
          >
            Title
          </label>
          <Input
            id="resource-title"
            name="title"
            placeholder="e.g. WASSCE Mathematics 2019 – 2024 Past Questions"
            required
          />
        </div>
        <div>
          <label
            htmlFor="resource-course"
            className="mb-1 block text-xs font-medium text-neutral-700"
          >
            Course
          </label>
          <Input id="resource-course" name="course" placeholder="e.g. Mathematics" />
        </div>
        <div>
          <label
            htmlFor="resource-level"
            className="mb-1 block text-xs font-medium text-neutral-700"
          >
            Level
          </label>
          <Input id="resource-level" name="level" placeholder="e.g. SHS 3 / Year 1" />
        </div>
        <div>
          <label
            htmlFor="resource-category"
            className="mb-1 block text-xs font-medium text-neutral-700"
          >
            Type
          </label>
          <Select id="resource-category" name="category" defaultValue="PAST_QUESTIONS">
            <option value="PAST_QUESTIONS">Past questions</option>
            <option value="NOTES">Lecture notes</option>
            <option value="SOLUTIONS">Solutions</option>
            <option value="SYLLABUS">Syllabus</option>
            <option value="TUTORIAL">Tutorial</option>
          </Select>
        </div>
      </div>

      <div>
        <label
          htmlFor="resource-description"
          className="mb-1 block text-xs font-medium text-neutral-700"
        >
          Description
        </label>
        <Textarea
          id="resource-description"
          name="description"
          className="min-h-20"
          placeholder="What is covered, and which years are included?"
        />
      </div>

      <div>
        <label htmlFor="resource-file" className="mb-1 block text-xs font-medium text-neutral-700">
          File (PDF, Word, Excel or image, up to 25MB)
        </label>
        <input
          id="resource-file"
          name="file"
          type="file"
          required
          className="focus-visible:ring-brand-500/30 file:bg-brand-50 file:text-brand-700 w-full rounded-lg border border-neutral-300 bg-white p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm file:font-semibold focus-visible:ring-2 focus-visible:outline-none"
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Upload className="h-4 w-4" aria-hidden="true" />
        )}
        Publish to students
      </Button>
    </form>
  );
}
