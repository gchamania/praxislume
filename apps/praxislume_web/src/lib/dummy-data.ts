import {
  Activity,
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileText,
  ImageIcon,
  LayoutDashboard,
  Library,
  Palette,
  PenLine,
  Settings,
  Sparkles,
  Video,
} from "lucide-react";

export const doctor = {
  name: "Dr. Rohan Verma",
  specialty: "ENT Surgeon",
  clinic: "Dhwani ENT Clinics",
  city: "Pune",
  tagline: "Clinic content. Patient growth.",
  avatarInitials: "RV",
};

export const productPositioning = {
  name: "PraxisLume",
  category: "Doctor Growth OS",
  promise: "30 days of branded medical content in 30 minutes",
};

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns/new", label: "Campaigns", icon: PenLine },
  { href: "/content", label: "Content Library", icon: Library },
  { href: "/media-studio", label: "Media Studio", icon: Video },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/brand-kit", label: "Brand Kit", icon: Palette },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/templates", label: "Templates", icon: ImageIcon },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const stats = [
  { label: "Posts This Month", value: "18", change: "20%", tone: "indigo", icon: Video },
  { label: "Total Views", value: "45.8K", change: "32%", tone: "emerald", icon: Activity },
  { label: "Patient Messages", value: "89", change: "28%", tone: "orange", icon: ClipboardList },
  { label: "Appointments", value: "12", change: "33%", tone: "blue", icon: CalendarDays },
] as const;

export const tasks = [
  { title: "Review grommet carousel", meta: "Today 10:30 AM", status: "Ready" },
  { title: "Approve monsoon ear-care caption", meta: "Today 1:00 PM", status: "Draft" },
  { title: "Export clinic poster PNG", meta: "Today 4:00 PM", status: "Pending" },
];

export const contentItems = [
  {
    title: "What are ear grommets?",
    type: "Carousel",
    status: "Ready",
    category: "Procedure explainer",
    date: "Jun 29",
    cta: "Book an ENT consultation",
  },
  {
    title: "Monsoon ear infection warning signs",
    type: "Post",
    status: "Draft",
    category: "Symptoms",
    date: "Jun 30",
    cta: "Call Dhwani ENT Clinics",
  },
  {
    title: "When should children get a hearing test?",
    type: "Reel",
    status: "Scheduled",
    category: "FAQ",
    date: "Jul 1",
    cta: "Schedule a hearing check",
  },
  {
    title: "Safe ear cleaning myths",
    type: "Poster",
    status: "Published",
    category: "Myth-buster",
    date: "Jul 2",
    cta: "Ask an ENT specialist",
  },
];

export const carouselSlides = [
  {
    title: "What are ear grommets?",
    body: "Tiny tubes placed in the eardrum can help air enter the middle ear and fluid drain.",
  },
  {
    title: "Why might a child need them?",
    body: "They may be advised when fluid behind the eardrum keeps coming back or affects hearing.",
  },
  {
    title: "Common signs doctors check",
    body: "Repeated ear infections, hearing concerns, speech delay, or persistent ear blockage may need an ENT review.",
  },
  {
    title: "How the decision is made",
    body: "An ENT specialist may use ear examination, hearing tests, and the child's history before advising treatment.",
  },
  {
    title: "Talk to an ENT specialist",
    body: "Your doctor can explain whether monitoring, medicines, or grommets are appropriate for your child.",
  },
];

export const calendarDays = Array.from({ length: 30 }, (_, index) => ({
  day: index + 1,
  title: contentItems[index % contentItems.length].title,
  status: ["Ready", "Draft", "Scheduled", "Review"][index % 4],
}));

export const templateCards = [
  { title: "ENT Awareness Carousel", format: "5 slides", icon: Sparkles },
  { title: "Clinic Service Poster", format: "Square PNG", icon: FileText },
  { title: "Doctor Reel Script", format: "45 seconds", icon: Video },
  { title: "WhatsApp Education Note", format: "Short copy", icon: ClipboardList },
];

export const chartBars = [72, 48, 86, 62, 95, 54, 78, 66, 88, 74, 58, 92];
