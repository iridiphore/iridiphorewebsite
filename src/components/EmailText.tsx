import { Fragment } from "react";

/** Shows editable text that may contain {email}, turning each {email} into a mailto link. */
export default function EmailText({ text, email, className }: { text: string; email: string; className?: string }) {
  const parts = text.split("{email}");
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 && (
            <a className={className} href={`mailto:${email}`}>
              {email}
            </a>
          )}
        </Fragment>
      ))}
    </>
  );
}
