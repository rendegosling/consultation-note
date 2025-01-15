import Image from 'next/image';

export default function MockImage({ src, alt }: { src: string; alt: string }) {
  return <Image src={src} alt={alt} />;
} 