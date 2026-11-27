/** Cover every numeric field, including dynamically mounted calculators and dialogs. */
export function installTypingOnlyNumberInputs(document: Document) {
  const numericInput = (target: EventTarget | null): target is HTMLInputElement =>
    target instanceof HTMLInputElement && target.type === "number";
  const wheel = () => {
    // Remove focus before the browser's native number-step action, while allowing page scrolling.
    if (numericInput(document.activeElement)) document.activeElement.blur();
  };
  const keydown = (event: KeyboardEvent) => {
    if (numericInput(event.target) && ["ArrowUp", "ArrowDown"].includes(event.key)) event.preventDefault();
  };
  document.addEventListener("wheel", wheel, { capture: true, passive: true });
  document.addEventListener("keydown", keydown, true);
  return () => {
    document.removeEventListener("wheel", wheel, true);
    document.removeEventListener("keydown", keydown, true);
  };
}
