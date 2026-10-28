/** Stops "T-shirt(s)" splitting across lines at the hyphen in big headlines. */
export function KeepTogether({ text }: { text: string }) {
  return (
    <>
      {text.split(/(T-shirts?)/i).map((part, i) =>
        i % 2 ? (
          <span key={i} className="whitespace-nowrap">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}
