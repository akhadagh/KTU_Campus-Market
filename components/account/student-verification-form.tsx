"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function StudentVerificationForm({
  universities,
  campuses,
  defaultUniversityId,
  defaultCampusId,
}: {
  universities: { id: string; name: string; code: string }[];
  campuses: { id: string; name: string; universityId: string }[];
  defaultUniversityId: string;
  defaultCampusId: string;
}) {
  const router = useRouter();
  const [universityId, setUniversityId] = useState(defaultUniversityId);
  const [campusId, setCampusId] = useState(defaultCampusId);
  const [institutionEmail, setInstitutionEmail] = useState("");
  const [pending, setPending] = useState(false);

  const visibleCampuses = campuses.filter((campus) => campus.universityId === universityId);

  async function submit() {
    if (!universityId) {
      toast.error("Choose your university");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/v1/student-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityId,
          campusId: campusId || undefined,
          institutionEmail: institutionEmail.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not submit your request");
        return;
      }
      toast.success("Verification requested", {
        description: "Our team will review it and you will be notified here.",
      });
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="verification-university"
            className="mb-1 block text-xs font-medium text-neutral-700"
          >
            University
          </label>
          <Select
            id="verification-university"
            value={universityId}
            onChange={(event) => {
              setUniversityId(event.target.value);
              setCampusId("");
            }}
          >
            <option value="">Choose your university</option>
            {universities.map((university) => (
              <option key={university.id} value={university.id}>
                {university.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label
            htmlFor="verification-campus"
            className="mb-1 block text-xs font-medium text-neutral-700"
          >
            Campus (optional)
          </label>
          <Select
            id="verification-campus"
            value={campusId}
            onChange={(event) => setCampusId(event.target.value)}
            disabled={visibleCampuses.length === 0}
          >
            <option value="">Choose your campus</option>
            {visibleCampuses.map((campus) => (
              <option key={campus.id} value={campus.id}>
                {campus.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <label
          htmlFor="verification-email"
          className="mb-1 block text-xs font-medium text-neutral-700"
        >
          Institutional email (optional)
        </label>
        <Input
          id="verification-email"
          type="email"
          value={institutionEmail}
          onChange={(event) => setInstitutionEmail(event.target.value)}
          placeholder="name@university.edu.gh"
        />
        <p className="mt-1 text-xs text-neutral-500">
          If you do not have one, submit the request anyway — an administrator will verify you
          manually.
        </p>
      </div>

      <Button onClick={submit} disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        Submit request
      </Button>
    </div>
  );
}
