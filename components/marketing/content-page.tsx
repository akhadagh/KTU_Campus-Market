import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";

export interface ContentSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface ContentPageProps {
  title: string;
  description: string;
  updated?: string;
  draftNotice?: string;
  sections: ContentSection[];
}

export function ContentPage({
  title,
  description,
  updated,
  draftNotice,
  sections,
}: ContentPageProps) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title={title} description={description} />
      {updated ? <p className="mt-3 text-xs text-neutral-500">Last updated: {updated}</p> : null}
      {draftNotice ? (
        <Alert variant="warning" title="Draft document" className="mt-6">
          {draftNotice}
        </Alert>
      ) : null}

      <div className="mt-8 space-y-8">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-semibold text-neutral-900">{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-3 text-sm leading-7 text-neutral-700">
                {paragraph}
              </p>
            ))}
            {section.bullets ? (
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-neutral-700">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
