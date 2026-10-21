import { useEffect, useState } from "react";

function readNativeGlassFlag(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return document.documentElement.dataset.nativeGlass === "true";
}

export function useNativeGlass(): boolean {
  const [nativeGlass, setNativeGlass] = useState(readNativeGlassFlag);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setNativeGlass(readNativeGlassFlag());
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["data-native-glass"] });
    return () => observer.disconnect();
  }, []);

  return nativeGlass;
}
