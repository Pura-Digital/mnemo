import { MnemoMonoMark } from "./MnemoMonoMark";

interface BrandMarkIconProps {
  size?: number;
  className?: string;
}

export function BrandMarkIcon(props: BrandMarkIconProps) {
  return <MnemoMonoMark {...props} />;
}
