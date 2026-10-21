import assistantPreview from "../../assets/onboarding-assistant-preview.svg";

/** Vector preview using the shared mnemo mark and coral palette. */
export default function AssistantHotkeyPreview() {
  return (
    <div className="mx-auto mt-3 h-56 w-full max-w-[30rem] shrink-0 overflow-hidden rounded-2xl">
      <img
        src={assistantPreview}
        alt=""
        aria-hidden="true"
        width={561}
        height={318}
        decoding="async"
        draggable={false}
        className="h-full w-full scale-105 select-none object-cover object-[50%_35%]"
      />
    </div>
  );
}
