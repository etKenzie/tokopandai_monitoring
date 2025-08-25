import { createAssetUrl, createUrl } from '@/utils/basePath';

// Notifications dropdown

interface notificationType {
  avatar: string;
  title: string;
  subtitle: string;
}

const notifications: notificationType[] = [
  {
    avatar: createAssetUrl("/images/profile/user-10.jpg"),
    title: "Roman Joined the Team!",
    subtitle: "Congratulate him",
  },
  {
    avatar: createAssetUrl("/images/profile/user-2.jpg"),
    title: "New message received",
    subtitle: "Salma sent you new message",
  },
  {
    avatar: createAssetUrl("/images/profile/user-3.jpg"),
    title: "New Payment received",
    subtitle: "Check your earnings",
  },
  {
    avatar: createAssetUrl("/images/profile/user-4.jpg"),
    title: "Jolly completed tasks",
    subtitle: "Assign her new tasks",
  },
  {
    avatar: createAssetUrl("/images/profile/user-5.jpg"),
    title: "Roman Joined the Team!",
    subtitle: "Congratulate him",
  },
  {
    avatar: createAssetUrl("/images/profile/user-6.jpg"),
    title: "New message received",
    subtitle: "Salma sent you new message",
  },
  {
    avatar: createAssetUrl("/images/profile/user-7.jpg"),
    title: "New Payment received",
    subtitle: "Check your earnings",
  },
  {
    avatar: createAssetUrl("/images/profile/user-8.jpg"),
    title: "Jolly completed tasks",
    subtitle: "Assign her new tasks",
  },
];

//
// Profile dropdown
//
interface ProfileType {
  href: string;
  title: string;
  subtitle: string;
  icon: any;
}
const profile: ProfileType[] = [
  {
    href: createUrl("/"),
    title: "My Profile",
    subtitle: "Account Settings",
    icon: createAssetUrl("/images/svgs/icon-account.svg"),
  },
  {
    href: createUrl("/"),
    title: "My Inbox",
    subtitle: "Messages & Emails",
    icon: createAssetUrl("/images/svgs/icon-inbox.svg"),
  },
  {
    href: createUrl("/"),
    title: "My Tasks",
    subtitle: "To-do and Daily Tasks",
    icon: createAssetUrl("/images/svgs/icon-tasks.svg"),
  },
];

// apps dropdown

interface appsLinkType {
  href: string;
  title: string;
  subtext: string;
  avatar: string;
}

const appsLink: appsLinkType[] = [
  {
    href: createUrl("/"),
    title: "Chat Application",
    subtext: "New messages arrived",
    avatar: createAssetUrl("/images/svgs/icon-dd-chat.svg"),
  },
  {
    href: createUrl("/"),
    title: "eCommerce App",
    subtext: "New stock available",
    avatar: createAssetUrl("/images/svgs/icon-dd-cart.svg"),
  },
  {
    href: createUrl("/"),
    title: "Notes App",
    subtext: "To-do and Daily tasks",
    avatar: createAssetUrl("/images/svgs/icon-dd-invoice.svg"),
  },
  {
    href: createUrl("/"),
    title: "Calendar App",
    subtext: "Get dates",
    avatar: createAssetUrl("/images/svgs/icon-dd-date.svg"),
  },
  {
    href: createUrl("/"),
    title: "Contact Application",
    subtext: "2 Unsaved Contacts",
    avatar: createAssetUrl("/images/svgs/icon-dd-mobile.svg"),
  },
  {
    href: createUrl("/"),
    title: "Tickets App",
    subtext: "Submit tickets",
    avatar: createAssetUrl("/images/svgs/icon-dd-lifebuoy.svg"),
  },
  {
    href: createUrl("/"),
    title: "Email App",
    subtext: "Get new emails",
    avatar: createAssetUrl("/images/svgs/icon-dd-message-box.svg"),
  },
  {
    href: createUrl("/"),
    title: "Blog App",
    subtext: "added new blog",
    avatar: createAssetUrl("/images/svgs/icon-dd-application.svg"),
  },
];

interface LinkType {
  href: string;
  title: string;
}

const pageLinks: LinkType[] = [
  {
    href: createUrl("/"),
    title: "Pricing Page",
  },
  {
    href: createUrl("/auth/auth1/login"),
    title: "Authentication Design",
  },
  {
    href: createUrl("/auth/auth1/register"),
    title: "Register Now",
  },
  {
    href: createUrl("/404"),
    title: "404 Error Page",
  },
  {
    href: createUrl("/"),
    title: "Notes App",
  },
  {
    href: createUrl("/"),
    title: "User Application",
  },
  {
    href: createUrl("/"),
    title: "Blog Design",
  },
  {
    href: createUrl("/"),
    title: "Shopping Cart",
  },
];

export { appsLink, notifications, pageLinks, profile };

