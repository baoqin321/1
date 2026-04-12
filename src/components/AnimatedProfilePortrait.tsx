import Image from "next/image";

export default function AnimatedProfilePortrait() {
  return (
    <div className="profile-portrait-shell">
      <Image
        src="/profile.png"
        alt="Profile"
        fill
        priority
        sizes="(max-width: 640px) 18rem, 20rem"
        className="profile-portrait-image"
      />
    </div>
  );
}
