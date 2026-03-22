export type BoardCategory =
  | "General"
  | "Professional"
  | "Business"
  | "Academic"
  | "Marketing";

export interface InkBoard {
  id: number;
  title: string;
  category: BoardCategory;
  editedAt: string;
}

export interface SocialLink {
  label: string;
  href: string;
  color: string;
  icon: React.ReactNode;
}
