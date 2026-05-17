import Image from "next/image";
import Link from "next/link";

type Props = {
  href?: string;
  /** Display height in px; width scales automatically */
  height?: number;
  className?: string;
  priority?: boolean;
};

export function MaatiiLinkLogo({
  href,
  height = 40,
  className = "",
  priority = false,
}: Props) {
  const width = Math.round(height * 4.2);

  const img = (
    <Image
      src="/maatiilink-logo.png"
      alt="MaatiiLink"
      width={width}
      height={height}
      priority={priority}
      className={`h-auto w-auto object-contain object-left ${className}`}
      style={{ maxHeight: height, width: "auto" }}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center">
        {img}
      </Link>
    );
  }

  return <span className="inline-flex shrink-0 items-center">{img}</span>;
}
