import Image from "next/image";

/** Local assets under /public/animal-icons/ (from user-provided PNGs). */
export const ANIMAL_ICON_SRC: Record<string, string> = {
  poultry: "/animal-icons/chicken.PNG",
  goat: "/animal-icons/goat.PNG",
  pig: "/animal-icons/pig.PNG",
  dog: "/animal-icons/dog.PNG",
};

/** Map stored case animal_type to icon key; null if no asset. */
export function animalTypeToIconKey(animal: string): keyof typeof ANIMAL_ICON_SRC | null {
  const a = animal.trim().toLowerCase();
  if (a === "poultry" || a === "chicken") return "poultry";
  if (a === "goat") return "goat";
  if (a === "pig") return "pig";
  if (a === "dog") return "dog";
  return null;
}

type AnimalIconProps = {
  animal: keyof typeof ANIMAL_ICON_SRC;
  size?: number;
  className?: string;
  label: string;
  priority?: boolean;
};

export function AnimalIcon({ animal, size = 36, className = "", label, priority }: AnimalIconProps) {
  const src = ANIMAL_ICON_SRC[animal];
  if (!src) return null;
  return (
    <Image
      src={src}
      alt={label}
      width={size}
      height={size}
      className={`object-contain pointer-events-none max-w-full h-auto w-full ${className}`}
      priority={priority}
    />
  );
}
