import { useEffect, useRef, useState, type FormEvent } from "react";
import { TeamMemberPicker } from "@/features/projects/components/TeamMemberPicker";
import { teamError, type TeamMemberInput } from "@/features/projects/data/projectsApi";

export type Id = number | string;
export type Group = { id: Id; name: string; members: number };
/** The group is the project's team: a group name plus interns from the database, each with a role. */
export type NewProject = { name: string; problemStatement: string; groupName: string; members: TeamMemberInput[] };
type Props = { onCreate?: (project: NewProject) => Promise<unknown> | void };

export default function CreateProjectButton({ onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [statement, setStatement] = useState("");
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState<TeamMemberInput[]>([]);
  const [showErrors, setShowErrors] = useState(false);
  const [showTeamErrors, setShowTeamErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [createdProjectName, setCreatedProjectName] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const nameError = name.trim().length < 3 ? "Enter a project name (at least 3 characters)." : "";
  const statementError =
    statement.trim().length < 20 ? "Describe the problem in at least 20 characters." : "";

  const close = () => {
    setOpen(false);
    setStep(1);
    setName("");
    setStatement("");
    setGroupName("");
    setMembers([]);
    setShowErrors(false);
    setShowTeamErrors(false);
    setSaving(false);
    setSaveError("");
  };

  useEffect(() => {
    if (!open) return;
    nameRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const next = (e: FormEvent) => {
    e.preventDefault();
    setShowErrors(true);
    if (!nameError && !statementError) setStep(2);
  };

  const groupError = members.length > 0 && !groupName.trim() ? "Give the group a name." : "";
  const submit = async () => {
    setShowTeamErrors(true);
    if (groupError || teamError(members)) return;
    setSaving(true);
    setSaveError("");
    try {
      await onCreate?.({
        name: name.trim(),
        problemStatement: statement.trim(),
        groupName: groupName.trim(),
        members, // empty = no group yet
      });
      const savedName = name.trim();
      close();
      setCreatedProjectName(savedName);
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string; message?: string } } })?.response?.data;
      setSaveError(message?.error ?? message?.message ?? "The project could not be saved. Please try again.");
      setSaving(false);
    }
  };
  const input =
    "w-full rounded-2xl border border-transparent bg-[#f1f4fa] px-4 py-3 text-sm text-[#0f1b33] placeholder:text-[#55627a] focus:border-[#0b2a5b] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0b2a5b]/20";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-[#0b2a5b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#13397d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b2a5b] focus-visible:ring-offset-2"
      >
        Create project
      </button>

      {createdProjectName && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && setCreatedProjectName("")}>
          <div role="dialog" aria-modal="true" aria-labelledby="project-created-title" className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl font-bold text-emerald-700" aria-hidden="true">✓</div>
            <h2 id="project-created-title" className="mt-5 text-2xl font-bold text-[#0f1b33]">Project created successfully</h2>
            <p className="mt-2 text-sm text-[#55627a]">
              <span className="font-semibold text-[#0f1b33]">{createdProjectName}</span> has been saved and is now in your projects list.
            </p>
            <button type="button" onClick={() => setCreatedProjectName("")} className="mt-6 rounded-full bg-[#0b2a5b] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#13397d] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b2a5b] focus-visible:ring-offset-2">
              Done
            </button>
          </div>
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onMouseDown={(e) => e.target === e.currentTarget && close()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-project-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="create-project-title" className="text-xl font-bold text-[#0f1b33]">
                  {step === 1 ? "Create a project" : "Assign to a group"}
                </h2>
                <p className="mt-1 text-sm text-[#55627a]">
                  {step === 1
                    ? "Give the project a name and describe the problem it solves."
                    : "Name the group, pick interns and give each one a role."}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-full p-2 text-[#55627a] hover:bg-[#f1f4fa]"
              >
                ✕
              </button>
            </div>

            {/* Step indicator */}
            <div className="mt-5 flex gap-2 text-xs font-semibold">
              {["Details", "Assign group"].map((label, i) => (
                <span
                  key={label}
                  className={`rounded-full px-3 py-1 ${
                    step === i + 1 ? "bg-[#0b2a5b] text-white" : "bg-[#e9eef7] text-[#0b2a5b]"
                  }`}
                >
                  {i + 1}. {label}
                </span>
              ))}
            </div>

            {step === 1 ? (
              <form onSubmit={next} className="mt-5 space-y-4" noValidate>
                <div>
                  <label htmlFor="project-name" className="mb-1.5 block text-sm font-medium text-[#0f1b33]">
                    Project name
                  </label>
                  <input
                    id="project-name"
                    ref={nameRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Municipality Services App"
                    className={input}
                  />
                  {showErrors && nameError && <p className="mt-1 text-xs text-red-700">{nameError}</p>}
                </div>
                <div>
                  <label htmlFor="problem-statement" className="mb-1.5 block text-sm font-medium text-[#0f1b33]">
                    Problem statement
                  </label>
                  <textarea
                    id="problem-statement"
                    rows={5}
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                    placeholder="What problem should the group solve, and for whom?"
                    className={`${input} resize-none`}
                  />
                  <div className="mt-1 flex justify-between text-xs">
                    <span className="text-red-700">{showErrors && statementError}</span>
                    <span className="text-[#55627a]">{statement.length} characters</span>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={close} className="rounded-full bg-[#f1f4fa] px-5 py-2.5 text-sm font-medium text-[#0f1b33] hover:bg-[#e4ebf7]">
                    Cancel
                  </button>
                  <button type="submit" className="rounded-full bg-[#0b2a5b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#13397d]">
                    Next
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-5">
                <div className="rounded-2xl bg-[#f1f4fa] p-4">
                  <p className="text-sm font-bold text-[#0f1b33]">{name.trim()}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-[#55627a]">{statement.trim()}</p>
                </div>

                <div className="mt-4">
                  <label htmlFor="group-name" className="mb-1.5 block text-sm font-medium text-[#0f1b33]">
                    Group name
                  </label>
                  <input
                    id="group-name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g. Group 7"
                    className={input}
                  />
                  {showTeamErrors && groupError && <p className="mt-1 text-xs text-red-700">{groupError}</p>}
                </div>

                <div className="mt-4">
                  <TeamMemberPicker value={members} onChange={setMembers} showErrors={showTeamErrors} />
                </div>

                {saveError && <p role="alert" className="mt-3 text-sm text-red-700">{saveError}</p>}

                <div className="mt-6 flex items-center justify-between gap-3">
                  <button type="button" onClick={() => setStep(1)} className="rounded-full bg-[#f1f4fa] px-5 py-2.5 text-sm font-medium text-[#0f1b33] hover:bg-[#e4ebf7]">
                    Back
                  </button>
                  <button type="button" onClick={() => void submit()} disabled={saving} className="rounded-full bg-[#0b2a5b] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#13397d] disabled:opacity-60">
                    {saving
                      ? "Saving…"
                      : members.length
                        ? `Create and assign ${members.length} member${members.length === 1 ? "" : "s"}`
                        : "Create without a group"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
